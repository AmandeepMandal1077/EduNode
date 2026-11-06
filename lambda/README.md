# EduNode — AWS / LocalStack Trigger

This directory contains the AWS Lambda function used for event-driven media
uploads. The same function runs inside LocalStack during local development.

The function is an internal microservice and is not exposed to the public client.

---

## Functions

### storage-upload-trigger

An event-driven Node.js function triggered by object storage events
(`s3:ObjectCreated:*` on AWS, the equivalent notification inside LocalStack).

### Flow

1. **Trigger**: An instructor uploads a raw lecture video (`.mp4`) to
   `root/courses/{courseId}/lectures/{lectureId}/{filename}.mp4`.
2. **Backend Notification**: The function calls
   `POST /api/v1/internal/media/confirm-upload` (secured with `x-internal-secret`)
   to move the lecture from `PENDING_UPLOAD` to `UPLOADED`.
3. **Queue Dispatch**: It publishes a media job with:
   - `storageKey`: path to the raw video
   - `container`: bucket/container name
   - `courseId`
   - `lectureId`
4. **HLS Ignore**: Keys containing an `hls` path segment are skipped to prevent
   the worker's HLS output from re-triggering the pipeline.

---

## Directory Structure

```text
lambda/
└── storage-upload-trigger/
    ├── index.mjs                # Lambda entrypoint
    ├── package.json             # `npm run package` builds package.zip
    ├── Dockerfile.localstack    # Builds the zip for LocalStack
    ├── .env.example
    └── package.zip              # generated, not committed
```

---

## Environment Variables

| Variable | Description |
| --- | --- |
| `BACKEND_URL` | Backend base URL, reachable from the trigger |
| `INTERNAL_API_SECRET` | Must match the backend |
| `QUEUE_URL` | Media queue URL (legacy `SQS_QUEUE_URL` also accepted) |
| `QUEUE_REGION` | Queue region (falls back to `AWS_REGION`) |
| `QUEUE_ENDPOINT` | Set for LocalStack/SQS-compatible endpoints |
| `QUEUE_ACCESS_KEY` / `QUEUE_SECRET_KEY` | Optional queue credentials |

---

## Packaging

```bash
cd lambda/storage-upload-trigger
npm ci
npm run package
```

`package.zip` contains `index.mjs`, `package.json` and `node_modules`.

Do **not** commit `package.zip`; rebuild it for every deployment. The LocalStack
Compose stack builds it automatically with `Dockerfile.localstack`.

---

## Local Development

LocalStack runs this function automatically. The `localstack/init/01-provision.sh`
script creates the bucket, queue, IAM role, function and S3 notification — the
same actions you would perform in the AWS console.

See [DEPLOY_STEPS.md](../DEPLOY_STEPS.md#localstack) for the local flow and
[DEPLOY_STEPS.md](../DEPLOY_STEPS.md#aws) for AWS deployment.
