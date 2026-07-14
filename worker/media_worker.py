import os
import time
import json
import subprocess
import requests
import boto3
from concurrent.futures import ThreadPoolExecutor
from dotenv import load_dotenv

load_dotenv()

# Silence all print() output in production
if os.getenv("PYTHON_ENV") == "production":
    import builtins
    builtins.print = lambda *args, **kwargs: None

AWS_REGION = os.getenv("AWS_REGION", "ap-south-1")
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME")
SQS_QUEUE_URL = os.getenv("SQS_QUEUE_URL")
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:3000")
INTERNAL_API_SECRET = os.getenv("INTERNAL_API_SECRET")
RAG_SERVER_URL = os.getenv("RAG_SERVER_URL", "http://localhost:8000")
S3_PUBLIC_BASE_URL = os.getenv("S3_PUBLIC_BASE_URL", f"https://{S3_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com")
AWS_ENDPOINT_URL = os.getenv("AWS_ENDPOINT_URL")

s3_client = boto3.client('s3', region_name=AWS_REGION, endpoint_url=AWS_ENDPOINT_URL)
sqs_client = boto3.client('sqs', region_name=AWS_REGION, endpoint_url=AWS_ENDPOINT_URL)

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
        print(f"Backend updated to {status} for {s3_key}")
    except requests.exceptions.RequestException as e:
        print(f"Failed to update backend status: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Backend response: {e.response.text}")
        raise

def get_video_duration(filepath):
    try:
        result = subprocess.run(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", filepath],
            capture_output=True, text=True, check=True
        )
        return int(round(float(result.stdout.strip())))
    except Exception as e:
        print(f"Error getting duration: {e}")
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
        
        # 1. Video Scaling (Split input into two streams)
        "-filter_complex", 
        "[0:v]split=2[v1][v2];[v1]scale=w=256:h=144[v1out];[v2]scale=w=426:h=240[v2out]",
        
        # 2. Map Streams (CRITICAL FIX: Map audio twice)
        "-map", "[v1out]", # 144p Video (v:0)
        "-map", "0:a",     # Audio for 144p (a:0)
        "-map", "[v2out]", # 240p Video (v:1)
        "-map", "0:a",     # Audio for 240p (a:1)
        
        # 3. Video Codec and Bitrates
        "-c:v", "libx264",
        "-b:v:0", "200k",  # 144p bitrate
        "-b:v:1", "400k",  # 240p bitrate
        
        # 4. Audio Codec and Bitrate
        "-c:a", "aac",
        "-b:a", "96k",     # Applies to all mapped audio streams
        
        # 5. HLS Configuration
        "-f", "hls",
        "-hls_time", "6",
        "-hls_playlist_type", "vod",
        "-master_pl_name", "master.m3u8",
        "-hls_segment_filename", segment_filename,
        
        # 6. Group streams: Match video 0 with audio 0, and video 1 with audio 1
        "-var_stream_map", "v:0,a:0 v:1,a:1",
        
        # 7. Output template
        output_playlist
    ]

    try:
        print("Starting FFmpeg HLS conversion...\n")
        subprocess.run(command, check=True, capture_output=True)
        print("HLS generation successful")
        return True
    except subprocess.CalledProcessError as e:
        print(f"FFmpeg error: {e.stderr.decode('utf-8') if e.stderr else 'Unknown Error'}")
        return False

def upload_hls_to_s3(hls_dir, base_s3_key):
    for root, _, files in os.walk(hls_dir):
        for file in files:
            local_path = os.path.join(root, file)
            s3_key = f"{base_s3_key}{file}"
            content_type = "application/x-mpegURL" if file.endswith(".m3u8") else "video/MP2T"
            print(f"Uploading {file} to {s3_key}")
            s3_client.upload_file(local_path, S3_BUCKET_NAME, s3_key, ExtraArgs={'ContentType': content_type})

def trigger_rag_ingestion(s3_url, course_id, lecture_id):
    internal_s3_url = s3_url
    if "localhost:4566" in s3_url:
        internal_s3_url = s3_url.replace("localhost:4566", "localstack:4566")

    payload = {
        "resource_url": internal_s3_url,
        "course_id": course_id,
        "lecture_id": lecture_id
    }
    try:
        response = requests.post(f"{RAG_SERVER_URL}/ingest", json=payload)
        response.raise_for_status()
        print(f"RAG ingestion triggered successfully for lecture {lecture_id}")
        return True
    except requests.exceptions.RequestException as e:
        print(f"Failed to trigger RAG ingestion: {e}")
        return False

def process_message(message):
    try:
        body = json.loads(message['Body'])
        s3_key = body['s3Key']
        course_id = body['courseId']
        lecture_id = body['lectureId']
        bucket = body['bucket']
        
        print(f"Starting processing for {s3_key}")
        update_backend_status(s3_key, "PROCESSING")

        # Download raw video
        temp_dir = f"/tmp/{lecture_id}"
        os.makedirs(temp_dir, exist_ok=True)
        raw_video_path = os.path.join(temp_dir, "raw.mp4")
        
        print(f"Downloading {s3_key} from {bucket}...")
        s3_client.download_file(bucket, s3_key, raw_video_path)
        
        duration = get_video_duration(raw_video_path)
        
        hls_dir = os.path.join(temp_dir, "hls")
        hls_s3_base_key = f"root/courses/{course_id}/lectures/{lecture_id}/hls/"
        s3_public_url = f"{S3_PUBLIC_BASE_URL}/{s3_key}"

        # Run HLS and RAG in parallel
        with ThreadPoolExecutor(max_workers=2) as executor:
            future_hls = executor.submit(process_hls, raw_video_path, hls_dir)
            future_rag = executor.submit(trigger_rag_ingestion, s3_public_url, course_id, lecture_id)

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
            
        print("Uploading HLS segments to S3...")
        upload_hls_to_s3(hls_dir, hls_s3_base_key)
        
        full_hls_url = f"{S3_PUBLIC_BASE_URL}/{hls_s3_base_key}master.m3u8"
        
        update_backend_status(s3_key, "READY", video_url=full_hls_url, duration=duration)
        print(f"Processing complete for {s3_key}")
        
    except Exception as e:
        print(f"Error processing message: {e}")
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
    print(f"Polling SQS queue: {SQS_QUEUE_URL}...")
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
                        print(f"Message processing failed, returning to queue. Error: {e}")
            else:
                time.sleep(1)
        except Exception as e:
            print(f"Error receiving messages: {e}")
            time.sleep(5)

if __name__ == "__main__":
    if not all([AWS_REGION, S3_BUCKET_NAME, SQS_QUEUE_URL, INTERNAL_API_SECRET]):
        print("Missing required environment variables. Please check .env")
        exit(1)
    poll_queue()

