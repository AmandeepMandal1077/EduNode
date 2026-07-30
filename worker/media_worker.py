import os
import time
import json
import subprocess
import requests
import boto3
from concurrent.futures import ThreadPoolExecutor
from dotenv import load_dotenv

load_dotenv()

from debug import debug

AWS_REGION = os.getenv("AWS_REGION", "ap-south-1")
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME")
SQS_QUEUE_URL = os.getenv("SQS_QUEUE_URL")
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:3000")
INTERNAL_API_SECRET = os.getenv("INTERNAL_API_SECRET")
RAG_SERVER_URL = os.getenv("RAG_SERVER_URL", "http://localhost:8000")

s3_client = boto3.client('s3', region_name=AWS_REGION)
sqs_client = boto3.client('sqs', region_name=AWS_REGION)


def get_s3_public_url(key: str) -> str:
    return f"https://{S3_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com/{key}"

def update_backend_status(s3_key, status, video_url=None, duration=None, error=None):
    payload = {
        "s3Key": s3_key,
        "status": status
    }
    if video_url: payload["videoUrl"] = video_url
    if duration: payload["duration"] = duration
    if error: payload["error"] = error

    headers = {
        "Content-Type": "application/json",
        "x-internal-secret": INTERNAL_API_SECRET
    }
    try:
        response = requests.patch(f"{BACKEND_URL}/api/v1/internal/media/status", json=payload, headers=headers)
        response.raise_for_status()
        debug(f"Backend updated to {status} for {s3_key}")
    except requests.exceptions.RequestException as e:
        debug(f"Failed to update backend status: {e}")
        if hasattr(e, 'response') and e.response is not None:
            debug(f"Backend response: {e.response.text}")
        raise

def get_video_duration(filepath):
    try:
        result = subprocess.run(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", filepath],
            capture_output=True, text=True, check=True
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
        "-i", input_path,
        "-filter_complex",
        "[0:v]split=2[v1][v2];[v1]scale=w=256:h=144[v1out];[v2]scale=w=426:h=240[v2out]",
        "-map", "[v1out]",
        "-map", "0:a",
        "-map", "[v2out]",
        "-map", "0:a",
        "-c:v", "libx264",
        "-b:v:0", "200k",
        "-b:v:1", "400k",
        "-c:a", "aac",
        "-b:a", "96k",
        "-f", "hls",
        "-hls_time", "6",
        "-hls_playlist_type", "vod",
        "-master_pl_name", "master.m3u8",
        "-hls_segment_filename", segment_filename,
        "-var_stream_map", "v:0,a:0 v:1,a:1",
        output_playlist
    ]

    try:
        debug("Starting FFmpeg HLS conversion...\n")
        subprocess.run(command, check=True, capture_output=True)
        debug("HLS generation successful")
        return True
    except subprocess.CalledProcessError as e:
        debug(f"FFmpeg error: {e.stderr.decode('utf-8') if e.stderr else 'Unknown Error'}")
        return False

def upload_hls_to_s3(hls_dir, base_s3_key):
    for root, _, files in os.walk(hls_dir):
        for file in files:
            local_path = os.path.join(root, file)
            s3_key = f"{base_s3_key}{file}"
            content_type = "application/x-mpegURL" if file.endswith(".m3u8") else "video/MP2T"
            debug(f"Uploading {file} to {s3_key}")
            s3_client.upload_file(local_path, S3_BUCKET_NAME, s3_key, ExtraArgs={'ContentType': content_type})

def trigger_rag_ingestion(s3_key, course_id, lecture_id):
    payload = {
        "resource_url": s3_key,
        "course_id": course_id,
        "lecture_id": lecture_id
    }
    try:
        response = requests.post(f"{RAG_SERVER_URL}/ingest", json=payload)
        response.raise_for_status()
        debug(f"RAG ingestion triggered successfully for lecture {lecture_id}")
        return True
    except requests.exceptions.RequestException as e:
        debug(f"Failed to trigger RAG ingestion: {e}")
        return False

def process_message(message):
    try:
        body = json.loads(message['Body'])
        s3_key = body['s3Key']
        course_id = body['courseId']
        lecture_id = body['lectureId']
        bucket = body['bucket']
        
        debug(f"Starting processing for {s3_key}")
        update_backend_status(s3_key, "PROCESSING")

        # Download raw video
        temp_dir = f"/tmp/{lecture_id}"
        os.makedirs(temp_dir, exist_ok=True)
        raw_video_path = os.path.join(temp_dir, "raw.mp4")
        
        debug(f"Downloading {s3_key} from {bucket}...")
        s3_client.download_file(bucket, s3_key, raw_video_path)
        
        duration = get_video_duration(raw_video_path)
        
        hls_dir = os.path.join(temp_dir, "hls")
        hls_s3_base_key = f"root/courses/{course_id}/lectures/{lecture_id}/hls/"

        # Run HLS and RAG in parallel
        with ThreadPoolExecutor(max_workers=2) as executor:
            future_hls = executor.submit(process_hls, raw_video_path, hls_dir)
            future_rag = executor.submit(trigger_rag_ingestion, s3_key, course_id, lecture_id)

            while not (future_hls.done() and future_rag.done()):
                sqs_client.change_message_visibility(
                    QueueUrl=SQS_QUEUE_URL,
                    ReceiptHandle=message["ReceiptHandle"],
                    VisibilityTimeout=300
                )
                time.sleep(60)
            hls_success = future_hls.result()
            rag_success = future_rag.result()

        if not hls_success:
            raise Exception("HLS generation failed")
            
        debug("Uploading HLS segments to S3...")
        upload_hls_to_s3(hls_dir, hls_s3_base_key)

        debug("Removing raw source video from S3...")
        s3_client.delete_object(Bucket=S3_BUCKET_NAME, Key=s3_key)

        full_hls_url = get_s3_public_url(f"{hls_s3_base_key}master.m3u8")
        
        update_backend_status(s3_key, "READY", video_url=full_hls_url, duration=duration)
        debug(f"Processing complete for {s3_key}")
        
    except Exception as e:
        debug(f"Error processing message: {e}")
        try:
            body = json.loads(message['Body'])
            update_backend_status(body.get('s3Key'), "FAILED", error=str(e))
        except:
            pass
        raise
    finally:
        try:
            import shutil
            shutil.rmtree(temp_dir)
        except:
            pass

def poll_queue():
    debug(f"Polling SQS queue: {SQS_QUEUE_URL}...")
    while True:
        try:
            response = sqs_client.receive_message(
                QueueUrl=SQS_QUEUE_URL,
                MaxNumberOfMessages=1,
                WaitTimeSeconds=20,
                VisibilityTimeout=300
            )
            
            if 'Messages' in response:
                for message in response['Messages']:
                    try:
                        process_message(message)
                        sqs_client.delete_message(
                            QueueUrl=SQS_QUEUE_URL,
                            ReceiptHandle=message['ReceiptHandle']
                        )
                    except Exception as e:
                        debug(f"Message processing failed, returning to queue. Error: {e}")
            else:
                time.sleep(1)
        except Exception as e:
            debug(f"Error receiving messages: {e}")
            time.sleep(5)

if __name__ == "__main__":
    if not all([AWS_REGION, S3_BUCKET_NAME, SQS_QUEUE_URL, INTERNAL_API_SECRET]):
        debug("Missing required environment variables. Please check .env")
        exit(1)
    poll_queue()

