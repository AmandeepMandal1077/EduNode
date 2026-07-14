# EduNode — AWS Lambda Functions

This directory contains the serverless functions deployed to AWS (or simulated locally via LocalStack) that handle event-driven tasks for the EduNode platform.

These functions are internal microservices and are not directly exposed to the public client.

---

## Functions

### s3-upload-trigger

An event-driven Node.js function triggered by S3 bucket events (`s3:ObjectCreated:*`).

#### Flow
1. **Trigger**: An instructor uploads a raw lecture video (`.mp4`) to the S3 bucket path matching: `root/courses/{courseId}/lectures/{lectureId}/{filename}.mp4`.
2. **Backend Notification**: The Lambda makes an internal POST request to the backend's `/api/v1/internal/media/confirm-upload` endpoint (secured via `x-internal-secret`) to transition the lecture upload status from pending to uploaded.
3. **Queue Dispatch**: The Lambda publishes an SQS message to the video transcoding queue with a payload containing:
   - `s3Key`: Path to the raw video file
   - `bucket`: S3 bucket name
   - `courseId`: Associated course identifier
   - `lectureId`: Associated lecture identifier
4. **HLS Ignore**: The Lambda is configured to ignore uploads inside `hls/` subfolders to prevent infinite event loops when the media worker uploads transcoded streaming segments.

---

## Directory Structure

```
lambda/
├── .gitignore
└── s3-upload-trigger/
    ├── index.mjs         # Lambda entrypoint handler
    ├── package.json      # Node.js dependencies
    ├── .env.example      # Example environment variables for testing
    └── package.zip       # Zip archive prepared for AWS upload
```

---

## Environment Variables

The Lambda function expects the following environment variables:

| Variable | Description |
|---|---|
| `AWS_REGION` | Target AWS Region (e.g., `us-east-1` or `ap-south-1`) |
| `SQS_QUEUE_URL` | URL of the SQS queue where transcoding jobs are sent |
| `BACKEND_URL` | Base URL of the backend API (e.g., `http://backend:3000`) |
| `INTERNAL_API_SECRET` | Secret token used to authenticate calls to the internal backend endpoints |
| `AWS_ENDPOINT_URL` | (Optional) Endpoint URL for LocalStack mock services in development |

---

## Local Development and Packaging

### Packaging for AWS
AWS Lambda requires node dependencies to be bundled. To package the function:

```bash
cd s3-upload-trigger
npm install --production
# Create zip containing index.mjs and node_modules
zip -r package.zip index.mjs node_modules package.json
```

### Local Testing
In the local development environment, LocalStack mimics S3 and SQS. The container configuration automatically registers this Lambda using the `package.zip` and binds it to the local S3 bucket events. Refer to the root workspace setup for initializing LocalStack.
