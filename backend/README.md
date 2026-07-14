# EduNode — Backend API

> The production-grade REST API powering EduNode, a full-featured Learning Management System. Built for scale with async media processing, AI-powered lecture Q&A, Stripe payments, and a clean multi-role architecture.

---

## Key Features

- **Multi-Role Auth** — JWT-based authentication with `Student` and `Instructor` roles, cookie-managed sessions, and rate-limited auth endpoints.
- **Course & Lecture Management** — Full CRUD for courses and lectures. Instructors can publish/unpublish courses, manage curricula, and control lecture ordering.
- **Async Media Pipeline** — Presigned S3 PUT uploads trigger a Lambda → SQS → Python media worker flow that transcodes video and automatically updates lecture status.
- **AI Lecture Q&A (RAG)** — After a lecture is processed, a Python RAG service transcribes the video and indexes it into a vector store (ChromaDB / Qdrant). Students can ask natural-language questions about any lecture.
- **Stripe Payments** — Full purchase flow with webhook handling, enrollment gating, and real-time payment confirmation emails.
- **Redis Caching** — Published courses are cached in Redis to reduce database pressure on high-traffic listing endpoints. Cache is invalidated on mutations.
- **Background Cron Jobs** — Three cron jobs keep the system consistent: heatmap syncs, progress syncs, and expired presigned URL cleanup.
- **Transactional Emails** — Handlebars-templated emails for password resets, purchase confirmations, and platform notifications via SMTP.
- **Lecture Progress & Heatmaps** — Per-student playback tracking with watch-time heatmaps persisted in MongoDB and synced via cron.
- **Security Hardened** — Helmet, HPP, `express-mongo-sanitize`, CORS allowlist, and request-level rate limiting on sensitive routes.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Runtime** | [Bun](https://bun.sh) |
| **Framework** | [Express 5](https://expressjs.com) |
| **Language** | TypeScript 5 |
| **Database** | MongoDB via [Mongoose 9](https://mongoosejs.com) |
| **Cache / Broker** | Redis + [BullMQ](https://docs.bullmq.io) + [ioredis](https://github.com/redis/ioredis) |
| **Object Storage** | AWS S3 (or LocalStack for local dev) |
| **Event Queue** | AWS SQS (LocalStack) |
| **Serverless Trigger** | AWS Lambda — `s3-upload-trigger` |
| **Payments** | [Stripe](https://stripe.com) |

| **Email** | Nodemailer + Handlebars templates |
| **Validation** | [Zod 4](https://zod.dev) |
| **Security** | Helmet, HPP, express-mongo-sanitize, express-rate-limit |
| **Testing** | [Vitest](https://vitest.dev) + Supertest + mongodb-memory-server |
| **Containerisation** | Docker |

---

## Getting Started

### Prerequisites

| Tool | Minimum Version | Notes |
|---|---|---|
| [Bun](https://bun.sh) | `>= 1.1` | Primary runtime and package manager |
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | Latest | Required for full-stack Docker Compose setup |
| [Node.js](https://nodejs.org) | `>= 18` | Required only to build the Lambda package |

> **Tip:** The full stack (MongoDB, Redis, LocalStack, Lambda, media worker, RAG service) is orchestrated via Docker Compose from the repository root. Run the backend standalone only if you are connecting to external cloud services.

---

### 1. Clone the Repository

```bash
git clone https://github.com/<your-org>/edunode.git
cd edunode
```

---

### 2. Configure Environment Variables

Copy the example file and fill in your values:

```bash
cp backend/.env.example backend/.env
```

**`backend/.env` — complete reference:**

```env
PORT=3000
NODE_ENV=development

# MongoDB
MONGO_URI=your_mongodb_connection_string

# Auth
JWT_SECRET=your_jwt_secret_key
RESETPASSWORDTOKENEXPIRY=3600000        # 60 min in milliseconds

# AWS / S3
AWS_REGION=your_aws_region
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
S3_BUCKET_NAME=your_s3_bucket_name
INTERNAL_API_SECRET=your_internal_api_secret

# Local Development with LocalStack (uncomment to override)
# AWS_ENDPOINT_URL=http://localhost:4566
# S3_PUBLIC_BASE_URL=http://localhost:4566/your_s3_bucket_name

# Stripe
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret



# Redis
REDIS_HOST_NAME=redis
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# Cache
CACHE_CONTENT_EXPIRATION_DUR=600000     # 10 min in milliseconds

# Service URLs
FRONTEND_URL=http://localhost:5173
RAG_SERVER_URL=http://localhost:8000

# SMTP (Transactional Email)
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
```

Also configure the root `.env` for Docker Compose:

```bash
cp .env.example .env
```

```env
BACKEND_PORT=3000
NODE_ENV=development
REDIS_PASSWORD=your_redis_password
LOCALSTACK_AUTH_TOKEN=your_localstack_auth_token   # https://app.localstack.cloud
PYTHON_ENV=development
PYTHON_PORT=8000
```

---

### 3. Run the Full Stack (Recommended)

From the **repository root**, start all services with a single command:

```bash
docker compose up --build
```

This starts:

| Service | Port | Description |
|---|---|---|
| `backend` | `3000` | Express API (this service) |
| `frontend` | `5173` | Vite + React UI |
| `mongodb` | (internal) | MongoDB replica set |
| `redis` | (internal) | Cache + BullMQ message broker |
| `localstack` | `4566` | Emulated S3, SQS, Lambda (LocalStack Pro) |
| `media-worker` | — | Python video transcoder (FFmpeg + boto3) |
| `rag-service` | `8000` | FastAPI RAG / AI Q&A service |

> **First run only:** LocalStack will automatically create the S3 bucket (`edunode-local`), SQS queue (`edunode-media-queue`), and deploy the `s3-upload-trigger` Lambda via the `localstack/init-aws.sh` init script.

---

### 4. Run the Backend Standalone

If you prefer to run only the backend against your own MongoDB/Redis:

```bash
cd backend
bun install
bun run dev
```

The server starts with file-watch hot-reloading on the port defined in `PORT` (default: `3000`).

---

### 5. Seed the Database (Optional)

```bash
cd backend
bun run seed.ts
```

Populates the database with sample instructors, students, courses, lectures, and purchases using `@faker-js/faker`.

---

## Project Architecture

```
backend/
├── src/
│   ├── app.ts                  # Express setup: middleware, routes, error handling
│   ├── index.ts                # Server bootstrap and DB connection
│   ├── cache/
│   │   └── courses-cache.ts    # Redis get / set / invalidate for published courses
│   ├── controllers/            # Route handlers — thin, delegate to models & utils
│   │   ├── course.controller.ts
│   │   ├── lecture.controller.ts
│   │   ├── coursePurchase.controller.ts
│   │   ├── courseProgress.controller.ts
│   │   ├── comment.controller.ts
│   │   └── ...
│   ├── cron/
│   │   ├── expireUploads.ts    # Cleans up stale presigned upload sessions
│   │   ├── syncHeatmaps.ts     # Persists buffered heatmap events to MongoDB
│   │   └── syncProgress.ts     # Persists buffered progress events to MongoDB
│   ├── database/
│   │   └── connect.ts          # Mongoose connection + replica set initialisation
│   ├── middlewares/
│   │   ├── auth.middleware.ts  # JWT verification and role guards
│   │   └── ...
│   ├── models/                 # Mongoose schemas and TypeScript interfaces
│   │   ├── user.model.ts
│   │   ├── course.model.ts
│   │   ├── lecture.model.ts
│   │   ├── coursePurchase.model.ts
│   │   ├── courseProgress.model.ts
│   │   ├── mediaUpload.model.ts
│   │   ├── comment.model.ts
│   │   ├── lectureHeatmap.model.ts
│   │   └── announcement.model.ts
│   ├── queue/                  # BullMQ job definitions (email dispatch, etc.)
│   ├── routes/                 # Express routers — one file per resource
│   │   ├── course.route.ts
│   │   ├── lecture.route.ts
│   │   ├── media.route.ts
│   │   ├── purchaseCourse.route.ts
│   │   ├── courseProgress.route.ts
│   │   ├── playback.route.ts
│   │   ├── comment.route.ts
│   │   ├── rag.route.ts
│   │   ├── internal.route.ts   # Service-to-service callbacks (not browser-facing)
│   │   └── ...
│   ├── types/                  # Shared TypeScript types and interfaces
│   ├── utils/
│   │   ├── s3.ts               # Presigned URL generation helpers
│   │   ├── apiError.ts         # Typed HTTP error class
│   │   └── asynchandler.ts     # Express async wrapper (eliminates try/catch boilerplate)
│   └── validator/              # Zod schemas for request body validation
├── tests/                      # Vitest + Supertest integration tests
├── seed.ts                     # Database seeder script
├── Dockerfile
├── docker-compose.test.yml     # Isolated test environment (MongoDB + Redis)
├── vitest.config.ts
└── package.json
```

---

## API Overview

All routes are prefixed with `/api/v1`. `✓` means a valid JWT cookie is required.

| Method | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/health` | — | Liveness health check |
| `POST` | `/users/signup` | — | Register a new user |
| `POST` | `/users/signin` | — | Sign in, sets JWT cookie |
| `POST` | `/users/signout` | ✓ | Clear session cookie |
| `POST` | `/users/forgot-password` | — | Send password reset email |
| `POST` | `/users/reset-password` | — | Reset password via token |
| `GET` | `/courses` | — | List all published courses (Redis-cached) |
| `GET` | `/courses/:courseId` | — | Get single course detail |
| `POST` | `/courses` | Instructor | Create a new course |
| `PATCH` | `/courses/:courseId` | Instructor | Update course metadata |
| `POST` | `/courses/:courseId/publish` | Instructor | Publish / unpublish a course |
| `POST` | `/lecture` | Instructor | Add a lecture to a course |
| `PATCH` | `/lecture/:lectureId` | Instructor | Update lecture metadata |
| `DELETE` | `/lecture/:lectureId` | Instructor | Delete a lecture |
| `GET` | `/media/presigned-url` | Instructor | Get presigned S3 URL for video upload |
| `POST` | `/payments/checkout` | Student | Create Stripe checkout session |
| `POST` | `/payments/webhook` | — | Stripe webhook handler |
| `GET` | `/progress/:courseId` | Student | Get course completion progress |
| `POST` | `/progress/:courseId/:lectureId` | Student | Mark a lecture as watched |
| `POST` | `/playback/heatmap` | Student | Submit watch-time heatmap data |
| `GET` | `/comment/:lectureId` | ✓ | Fetch comments on a lecture |
| `POST` | `/comment/:lectureId` | Student | Post a comment on a lecture |
| `POST` | `/internal-rag/vectordb-processed` | Internal | RAG service callback: ingestion complete |
| `PATCH` | `/internal/media/status` | Internal | Media worker callback: transcode complete |

> **Internal routes** (`/internal*`) are protected by the `x-internal-secret` request header and are not intended to be called from the browser.

---

## Testing

The test suite uses **Vitest** and **Supertest** against an in-memory MongoDB instance — no live database required.

```bash
# Run all tests (standalone — uses mongodb-memory-server)
cd backend
bun run test

# Start isolated test containers first (if tests need a live Redis instance)
bun run test:docker:up
bun run test
bun run test:docker:down
```

See [`README_TESTS.md`](./README_TESTS.md) for a full breakdown of test coverage and conventions.

---

## Environment Variable Reference

| Variable | Required | Description |
|---|---|---|
| `PORT` | Yes | Server port (default: `3000`) |
| `NODE_ENV` | Yes | `development` or `production` |
| `MONGO_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret key for signing JWTs |
| `RESETPASSWORDTOKENEXPIRY` | Yes | Token expiry in ms (e.g. `3600000` = 60 min) |
| `AWS_REGION` | Yes | AWS region (e.g. `ap-south-1`) |
| `AWS_ACCESS_KEY_ID` | Yes | AWS / LocalStack access key |
| `AWS_SECRET_ACCESS_KEY` | Yes | AWS / LocalStack secret |
| `S3_BUCKET_NAME` | Yes | S3 bucket for media uploads |
| `INTERNAL_API_SECRET` | Yes | Shared secret for internal service-to-service calls |
| `AWS_ENDPOINT_URL` | Local only | LocalStack endpoint (e.g. `http://localhost:4566`) |
| `S3_PUBLIC_BASE_URL` | Local only | Public URL base for LocalStack-served S3 objects |
| `STRIPE_PUBLISHABLE_KEY` | Yes | Stripe publishable key |
| `STRIPE_SECRET_KEY` | Yes | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Yes | Stripe webhook signing secret |

| `REDIS_HOST_NAME` | Yes | Redis host (`redis` in Docker, `localhost` standalone) |
| `REDIS_PORT` | Yes | Redis port (default: `6379`) |
| `REDIS_PASSWORD` | Yes | Redis password |
| `CACHE_CONTENT_EXPIRATION_DUR` | Yes | Course cache TTL in ms (e.g. `600000` = 10 min) |
| `FRONTEND_URL` | Yes | Allowed CORS origin for the frontend |
| `RAG_SERVER_URL` | Yes | RAG service base URL (e.g. `http://localhost:8000`) |
| `SMTP_HOST` | Yes | SMTP server host |
| `SMTP_PORT` | Yes | SMTP server port (default: `587`) |
| `SMTP_USER` | Yes | SMTP username / email address |
| `SMTP_PASS` | Yes | SMTP password or app password |

---

## Usage Examples

### Upload a Lecture Video

```bash
# Step 1: Request a presigned S3 PUT URL from the backend
curl -X GET \
  "http://localhost:3000/api/v1/media/presigned-url?lectureId=<lectureId>&fileName=lecture.mp4" \
  -H "Cookie: token=<your_jwt>"

# Step 2: Upload the video file directly to S3 using the returned URL
curl -X PUT "<presigned_url_from_step_1>" \
  -H "Content-Type: video/mp4" \
  --data-binary @./lecture.mp4
```

Once the upload completes, S3 fires the `s3-upload-trigger` Lambda → Lambda sends a message to the SQS queue → the Python media worker picks it up, transcodes the video with FFmpeg, uploads the processed output back to S3, and calls `PATCH /api/v1/internal/media/status` to mark the lecture as `PROCESSED`.

---

### Query a Lecture with AI (RAG)

Once a lecture has been processed and its transcript indexed into the vector store:

```bash
curl -X POST \
  "http://localhost:3000/api/v1/internal-rag/chat/<courseId>/<lectureId>" \
  -H "Content-Type: application/json" \
  -H "Cookie: token=<your_jwt>" \
  -d '{ "query": "What is the difference between supervised and unsupervised learning?" }'
```

The backend proxies the request to the RAG service, which performs a similarity search over the lecture transcript embeddings and returns a grounded, context-aware answer.

---

### Purchase a Course

```bash
# Step 1: Create a Stripe checkout session
curl -X POST \
  "http://localhost:3000/api/v1/payments/checkout" \
  -H "Content-Type: application/json" \
  -H "Cookie: token=<your_jwt>" \
  -d '{ "courseId": "<courseId>" }'

# The response includes a Stripe-hosted checkout URL.
# After successful payment, Stripe calls the webhook at:
#   POST /api/v1/payments/webhook
# which enrolls the student in the course and dispatches a confirmation email.
```
