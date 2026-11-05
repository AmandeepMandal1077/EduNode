# EduNode — Media Transcoding Worker

An asynchronous Python-based worker responsible for video processing, adaptive HLS segment generation, and RAG ingestion triggering.

This service is internal and operates entirely in the background, consuming tasks from the configured media queue (SQS, Azure Storage Queue or LocalStack) and reading/writing through the configured storage provider (S3, Azure Blob or LocalStack).

---

## Core Responsibilities

The worker polls the configured media queue for incoming transcoding jobs. For each valid message received, it performs the following sequence of operations:

1. **Status Update**: Patches the backend API status for the lecture video to `PROCESSING`.
2. **Download**: Pulls the raw video from the configured storage provider to temporary storage.
3. **Metadata Extraction**: Runs `ffprobe` to inspect the video file and retrieve its exact duration.
4. **HLS Conversion (FFmpeg)**: Converts the raw `.mp4` into an HTTP Live Streaming (HLS) multi-bitrate structure:
   - Encodes two streams: 144p (200k video bitrate) and 240p (400k video bitrate).
   - Packages audio using the AAC codec.
   - Generates segment files (`.ts`) and a `master.m3u8` index file.
5. **RAG Ingestion**: Concurrently triggers the RAG AI service (`/ingest` endpoint) with the storage key to extract audio/transcribe content for the AI chat.
6. **Upload**: Transfers the resulting `.m3u8` and `.ts` files back to storage under the `hls/` subdirectory.
7. **Final Status**: Patches the backend API status to `READY` (sending the playlist URL and duration) or `FAILED` (sending the error message).

---

## Directory Structure

```
worker/
├── Dockerfile                  # Slim Python image including ffmpeg
├── media_worker.py             # Polls the queue and runs FFmpeg
├── storage/                    # Provider factory + aws/azure/localstack adapters
├── messaging/                  # Queue factory + aws/azure/localstack adapters
├── requirements.txt            # boto3, requests, python-dotenv, azure SDKs
├── .env.example                # Sample environment variables
└── .gitignore
```

---

## Configuration

Copy `.env.example` to `.env` and fill in the values:

```env
# Storage: aws | azure | localstack
STORAGE_PROVIDER=aws
STORAGE_CONTAINER=your_bucket_name
STORAGE_REGION=ap-south-1
STORAGE_ACCESS_KEY=your_access_key
STORAGE_SECRET_KEY=your_secret_key

# Queue: aws | azure | localstack
QUEUE_PROVIDER=aws
QUEUE_URL=your_queue_url
QUEUE_NAME=your_queue_name

BACKEND_URL=http://localhost:3000
INTERNAL_API_SECRET=your_secret
RAG_SERVER_URL=http://localhost:8000
```

For Azure use `STORAGE_CONNECTION_STRING`, `QUEUE_CONNECTION_STRING` and
`QUEUE_NAME`. For LocalStack set the provider values to `localstack` and point
`STORAGE_ENDPOINT` / `QUEUE_ENDPOINT` at `http://localstack:4566`.

The message contract is `{ storageKey, courseId, lectureId, container }`.

---

## Running the Worker

### Using Docker Compose

To run the worker service using Docker Compose:

```bash
# from the repository root
docker compose up -d --build media-worker
```
