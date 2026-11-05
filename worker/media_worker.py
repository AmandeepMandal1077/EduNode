import os
import shutil
import subprocess
import threading
import time
from concurrent.futures import ThreadPoolExecutor

import requests
from dotenv import load_dotenv

load_dotenv()

from debug import debug
from messaging.base import JobMessage, Queue
from messaging.factory import get_queue
from storage.config import get_storage_container
from storage.factory import get_storage

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:3000")
INTERNAL_API_SECRET = os.getenv("INTERNAL_API_SECRET")
RAG_SERVER_URL = os.getenv("RAG_SERVER_URL", "http://localhost:8000")

# Ingestion is asynchronous on the RAG side: poll up to 60 times, 10s apart.
RAG_POLL_INTERVAL = 10
RAG_MAX_POLLS = 60


class VisibilityHeartbeat:
    """Keeps a long-running job invisible while it downloads/transcodes/uploads."""

    def __init__(
        self,
        queue: Queue,
        message: JobMessage,
        interval: int = 60,
        visibility_timeout: int = 300,
    ) -> None:
        self._queue = queue
        self._message = message
        self._interval = interval
        self._visibility_timeout = visibility_timeout
        self._stop = threading.Event()
        self._thread = threading.Thread(target=self._run, daemon=True)

    def _run(self) -> None:
        while not self._stop.wait(self._interval):
            try:
                self._queue.extend_visibility(
                    self._message, self._visibility_timeout
                )
            except Exception as e:
                debug(f"Failed to extend queue visibility: {e}")

    def __enter__(self):
        self._thread.start()
        return self

    def __exit__(self, *_):
        self._stop.set()
        self._thread.join(timeout=5)


def update_backend_status(storage_key, status, video_url=None, duration=None, error=None):
    payload = {
        "storageKey": storage_key,
        "status": status,
    }
    if video_url:
        payload["videoUrl"] = video_url
    if duration:
        payload["duration"] = duration
    if error:
        payload["error"] = error

    headers = {
        "Content-Type": "application/json",
        "x-internal-secret": INTERNAL_API_SECRET,
    }
    try:
        response = requests.patch(
            f"{BACKEND_URL}/api/v1/internal/media/status",
            json=payload,
            headers=headers,
        )
        response.raise_for_status()
        debug(f"Backend updated to {status} for {storage_key}")
    except requests.exceptions.RequestException as e:
        debug(f"Failed to update backend status: {e}")
        if hasattr(e, "response") and e.response is not None:
            debug(f"Backend response: {e.response.text}")
        raise


def get_video_duration(filepath):
    try:
        result = subprocess.run(
            [
                "ffprobe",
                "-v",
                "error",
                "-show_entries",
                "format=duration",
                "-of",
                "default=noprint_wrappers=1:nokey=1",
                filepath,
            ],
            capture_output=True,
            text=True,
            check=True,
        )
        return int(round(float(result.stdout.strip())))
    except Exception as e:
        debug(f"Error getting duration: {e}")
        return 0


def process_hls(input_path, output_dir):
    os.makedirs(output_dir, exist_ok=True)
    output_playlist = os.path.join(output_dir, "stream_%v.m3u8")
    segment_filename = os.path.join(output_dir, "stream_%v_%03d.ts")

    command = [
        "ffmpeg",
        "-hide_banner",
        "-y",
        "-i",
        input_path,
        "-filter_complex",
        "[0:v]split=2[v1][v2];[v1]scale=w=256:h=144[v1out];[v2]scale=w=426:h=240[v2out]",
        "-map",
        "[v1out]",
        "-map",
        "0:a",
        "-map",
        "[v2out]",
        "-map",
        "0:a",
        "-c:v",
        "libx264",
        "-b:v:0",
        "200k",
        "-b:v:1",
        "400k",
        "-c:a",
        "aac",
        "-b:a",
        "96k",
        "-f",
        "hls",
        "-hls_time",
        "6",
        "-hls_playlist_type",
        "vod",
        "-master_pl_name",
        "master.m3u8",
        "-hls_segment_filename",
        segment_filename,
        "-var_stream_map",
        "v:0,a:0 v:1,a:1",
        output_playlist,
    ]

    try:
        debug("Starting FFmpeg HLS conversion...\n")
        subprocess.run(command, check=True, capture_output=True)
        debug("HLS generation successful")
        return True
    except subprocess.CalledProcessError as e:
        debug(
            f"FFmpeg error: {e.stderr.decode('utf-8') if e.stderr else 'Unknown Error'}"
        )
        return False


def upload_hls_to_storage(storage, hls_dir, base_storage_key):
    for root, _, files in os.walk(hls_dir):
        for file in files:
            local_path = os.path.join(root, file)
            storage_key = f"{base_storage_key}{file}"
            content_type = (
                "application/x-mpegURL" if file.endswith(".m3u8") else "video/MP2T"
            )
            debug(f"Uploading {file} to {storage_key}")
            storage.upload_file(local_path, storage_key, content_type)


def trigger_rag_ingestion(storage_key, course_id, lecture_id):
    payload = {
        "resource_url": storage_key,
        "course_id": course_id,
        "lecture_id": lecture_id,
    }
    try:
        response = requests.post(
            f"{RAG_SERVER_URL}/ingest", json=payload, timeout=120
        )
        response.raise_for_status()
        debug(f"RAG ingestion triggered successfully for lecture {lecture_id}")
        return True
    except requests.exceptions.RequestException as e:
        debug(f"Failed to trigger RAG ingestion: {e}")
        return False


def wait_for_rag(lecture_id):
    """Polls the RAG service until the job completes, fails, or disappears."""
    for _ in range(RAG_MAX_POLLS):
        try:
            response = requests.get(
                f"{RAG_SERVER_URL}/ingest/{lecture_id}", timeout=10
            )
        except requests.exceptions.RequestException as e:
            debug(f"RAG status check failed: {e}")
        else:
            # 404 means the job is gone (RAG container restarted): fail fast.
            if response.status_code == 404:
                return False

            status = response.json().get("status")
            if status == "completed":
                return True
            if status == "failed":
                return False

        time.sleep(RAG_POLL_INTERVAL)

    return False


def cleanup_rag_ingestion(lecture_id):
    try:
        requests.delete(f"{RAG_SERVER_URL}/ingest/{lecture_id}", timeout=10)
    except requests.exceptions.RequestException as e:
        debug(f"Failed to clean up RAG ingestion: {e}")


def rag_task(storage_key, course_id, lecture_id):
    if not trigger_rag_ingestion(storage_key, course_id, lecture_id):
        return False
    return wait_for_rag(lecture_id)


def process_message(message: JobMessage):
    storage = get_storage()
    storage_key = None
    temp_dir = None

    try:
        body = message.payload
        storage_key = body.get("storageKey") or body.get("s3Key")
        course_id = body["courseId"]
        lecture_id = body["lectureId"]

        configured_container = get_storage_container()
        container = body.get("container") or body.get("bucket")
        if container and container != configured_container:
            raise ValueError(
                f"Queue job targets container '{container}', but this worker "
                f"is configured for '{configured_container}'"
            )

        debug(f"Starting processing for {storage_key}")
        update_backend_status(storage_key, "PROCESSING")

        # Download raw video
        temp_dir = f"/tmp/{lecture_id}"
        os.makedirs(temp_dir, exist_ok=True)
        raw_video_path = os.path.join(temp_dir, "raw.mp4")

        debug(f"Downloading {storage_key}...")
        storage.download_file(storage_key, raw_video_path)

        duration = get_video_duration(raw_video_path)

        hls_dir = os.path.join(temp_dir, "hls")
        hls_storage_base_key = (
            f"root/courses/{course_id}/lectures/{lecture_id}/hls/"
        )

        # Run HLS and RAG in parallel
        with ThreadPoolExecutor(max_workers=2) as executor:
            future_hls = executor.submit(process_hls, raw_video_path, hls_dir)
            future_rag = executor.submit(
                rag_task, storage_key, course_id, lecture_id
            )
            hls_success = future_hls.result()
            rag_success = future_rag.result()

        if not hls_success:
            raise Exception("HLS generation failed")

        debug("Uploading HLS segments to storage...")
        upload_hls_to_storage(storage, hls_dir, hls_storage_base_key)

        debug("Removing raw source video from storage...")
        storage.delete_object(storage_key)

        full_hls_url = storage.get_public_url(f"{hls_storage_base_key}master.m3u8")

        update_backend_status(
            storage_key, "READY", video_url=full_hls_url, duration=duration
        )
        debug(f"Processing complete for {storage_key}")

        # RAG failure only degrades chat; the lecture stays READY.
        if not rag_success:
            cleanup_rag_ingestion(lecture_id)
            debug(
                f"RAG ingestion failed for lecture {lecture_id}, cleanup requested"
            )

    except Exception as e:
        debug(f"Error processing message: {e}")
        if storage_key:
            try:
                update_backend_status(storage_key, "FAILED", error=str(e))
            except Exception:
                pass
        raise
    finally:
        if temp_dir:
            try:
                shutil.rmtree(temp_dir)
            except Exception:
                pass


def poll_queue():
    queue = get_queue()
    debug("Polling media queue...")
    while True:
        try:
            messages = queue.receive(
                max_messages=1,
                visibility_timeout=300,
                wait_seconds=20,
            )

            if messages:
                for message in messages:
                    try:
                        with VisibilityHeartbeat(queue, message):
                            process_message(message)
                        queue.delete(message)
                    except Exception as e:
                        debug(
                            "Message processing failed, returning to queue. "
                            f"Error: {e}"
                        )
            else:
                time.sleep(1)
        except Exception as e:
            debug(f"Error receiving messages: {e}")
            time.sleep(5)


if __name__ == "__main__":
    if not INTERNAL_API_SECRET:
        debug("Missing required environment variable INTERNAL_API_SECRET")
        exit(1)

    try:
        get_storage()
        get_queue()
    except Exception as e:
        debug(f"Provider configuration error: {e}")
        exit(1)

    poll_queue()
