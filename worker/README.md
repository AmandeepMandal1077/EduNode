# EduNode — Media Transcoding Worker

An asynchronous Python-based worker responsible for video processing, adaptive HLS segment generation, and RAG ingestion triggering.

This service is internal and operates entirely in the background, consuming tasks from an SQS queue.

---

## Core Responsibilities

The worker polls an Amazon SQS queue for incoming media transcoding jobs. For each valid message received, it performs the following sequence of operations:

1. **Status Update**: Patches the backend API status for the lecture video to `PROCESSING`.
2. **Download**: Pulls the raw video file from S3 to temporary storage.
3. **Metadata Extraction**: Runs `ffprobe` to inspect the video file and retrieve its exact duration.
4. **HLS Conversion (FFmpeg)**: Converts the raw `.mp4` into an HTTP Live Streaming (HLS) multi-bitrate structure:
   - Encodes two streams: 144p (200k video bitrate) and 240p (400k video bitrate).
   - Packages audio using the AAC codec.
   - Generates segment files (`.ts`) and a `master.m3u8` index file.
5. **RAG Ingestion**: Concurrently triggers the RAG AI service (`/ingest` endpoint) with the video S3 URL to extract audio/transcribe content for the AI chat.
6. **Upload**: Transfers the resulting `.m3u8` and `.ts` files back to the S3 bucket under the `hls/` subdirectory.
7. **Final Status**: Patches the backend API status to `READY` (sending the playlist URL and duration) or `FAILED` (sending the error message).

---

## Directory Structure

```
worker/
├── docker-compose.worker.yml   # Standalone Docker Compose configuration
├── Dockerfile                  # Slim Python image including ffmpeg
├── media_worker.py             # Main Python daemon polling SQS and running FFmpeg
├── requirements.txt            # Python dependencies (boto3, requests, python-dotenv)
├── .env.example                # Sample environment variables
└── .gitignore
```

---

## Configuration

Copy `.env.example` to `.env` and fill in the values:

```env
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
S3_BUCKET_NAME=your_bucket_name
SQS_QUEUE_URL=your_sqs_url
BACKEND_URL=http://localhost:3000
INTERNAL_API_SECRET=your_secret
RAG_SERVER_URL=http://localhost:8000
```

For local testing with LocalStack, uncomment:
```env
AWS_ENDPOINT_URL=http://localstack:4566
S3_PUBLIC_BASE_URL=http://localstack:4566/edunode-local
```

---

## Running the Worker

### Using Docker Compose
To run the worker service using Docker Compose:

```bash
docker compose -f docker-compose.worker.yml up --build -d
```