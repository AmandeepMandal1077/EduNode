# EduNode — Backend API

> The production-grade REST API powering EduNode, a full-featured Learning Management System. Built for scale with async media processing, AI-powered lecture Q&A, Stripe payments, and a clean multi-role architecture.

---

## Key Features

- **Multi-Role Auth** — JWT-based authentication with `Student` and `Instructor` roles, cookie-managed sessions, and rate-limited auth endpoints.
- **Course & Lecture Management** — Full CRUD for courses and lectures. Instructors can publish/unpublish courses, manage curricula, and control lecture ordering.
- **Async Media Pipeline** — Presigned storage uploads trigger a provider-native event → media queue → Python worker flow that transcodes video and automatically updates lecture status.
- **AI Lecture Q&A (RAG)** — After a lecture is processed, a Python RAG service transcribes the video and indexes it into a vector store (ChromaDB / Qdrant). Students can ask natural-language questions about any lecture.
- **Stripe Payments** — Full purchase flow with webhook handling, enrollment gating, and real-time payment confirmation emails.
- **Redis Caching** — Published courses are cached in Redis to reduce database pressure on high-traffic listing endpoints. Cache is invalidated on mutations.
- **Background Cron Jobs** — Three cron jobs keep the system consistent: heatmap syncs, progress syncs, and expired presigned URL cleanup.
- **Transactional Emails** — Handlebars-templated emails for password resets, purchase confirmations, and platform notifications via SMTP.
- **Lecture Progress & Heatmaps** — Per-student playback tracking with watch-time heatmaps persisted in MongoDB and synced via cron.
- **Security Hardened** — Helmet, HPP, `express-mongo-sanitize`, CORS allowlist, and request-level rate limiting on sensitive routes.

---

## Tech Stack

| Layer                  | Technology                                                                             |
| ---------------------- | -------------------------------------------------------------------------------------- |
| **Runtime**            | [Bun](https://bun.sh)                                                                  |
| **Framework**          | [Express 5](https://expressjs.com)                                                     |
| **Language**           | TypeScript 5                                                                           |
| **Database**           | MongoDB via [Mongoose 9](https://mongoosejs.com)                                       |
| **Cache / Broker**     | Redis + [BullMQ](https://docs.bullmq.io) + [ioredis](https://github.com/redis/ioredis) |
| **Object Storage**     | S3 / Azure Blob / LocalStack (provider factory)                                        |
| **Event Queue**        | SQS / Azure Storage Queue / LocalStack (provider factory)                              |
| **Event Trigger**      | AWS Lambda — `storage-upload-trigger`, Azure Event Grid function                      |
| **Payments**           | [Stripe](https://stripe.com)                                                           |
| **Email**              | Nodemailer + Handlebars templates                                                     |
| **Validation**         | [Zod 4](https://zod.dev)                                                               |
| **Security**           | Helmet, HPP, express-mongo-sanitize, express-rate-limit                                |
| **Testing**            | [Vitest](https://vitest.dev) + Supertest                               |
| **Containerisation**   | Docker                                                                                 |

---

## Getting Started

### Prerequisites

| Tool                                                              | Minimum Version | Notes                                        |
| ----------------------------------------------------------------- | --------------- | -------------------------------------------- |
| [Bun](https://bun.sh)                                             | `>= 1.1`        | Primary runtime and package manager          |
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | Latest          | Required for full-stack Docker Compose setup |
| [Node.js](https://nodejs.org)                                     | `>= 18`         | Required only to build the Lambda package    |

> **Tip:** The full stack (MongoDB, Redis, Lambda, media worker, RAG service) is orchestrated via Docker Compose from the repository root. Run the backend standalone only if you are connecting to external cloud services.

---

### 1. Clone the Repository

```bash
git clone https://github.com/<your-org>/edunode.git
cd edunode/backend
```

---

### 2. Configure Environment Variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

**`.env` — complete reference:**

```env
PORT=3000
NODE_ENV=development

# MongoDB
MONGO_URI=your_mongodb_connection_string

# Auth
JWT_SECRET=your_jwt_secret_key
RESETPASSWORDTOKENEXPIRY=3600000        # 60 min in milliseconds

# Storage: aws | azure | localstack
STORAGE_PROVIDER=aws
STORAGE_CONTAINER=your_storage_container
STORAGE_REGION=your_storage_region
STORAGE_ACCESS_KEY=your_storage_access_key
STORAGE_SECRET_KEY=your_storage_secret_key
# STORAGE_ENDPOINT=http://localhost:4566
# STORAGE_PRESIGN_ENDPOINT=http://localhost:4566
# STORAGE_PUBLIC_BASE_URL=https://cdn.example.com

# Azure (when STORAGE_PROVIDER=azure)
# STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=edunodemedia;AccountKey=EXAMPLEEXAMPLEEXAMPLEEXAMPLEEXAMPLEEXAMPLE==;EndpointSuffix=core.windows.net
# STORAGE_ACCOUNT_NAME=your_account
# STORAGE_ACCOUNT_KEY=your_key

INTERNAL_API_SECRET=your_internal_api_secret

# Stripe
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Redis
REDIS_URL=redis://localhost:6379
```

---

### 3. Installation & Running

Install dependencies and start the development server:

```bash
bun install
bun dev
```

The server will start on `http://localhost:3000`.

---

## Testing

The backend uses **Vitest** for both unit and integration tests.

### Running Tests
```bash
# Run all tests
bun test

# Run tests in watch mode
bun test --watch
```

### Testing with Docker (Integration)
The backend includes a dedicated test environment with a clean MongoDB and Redis instance.

```bash
# Spin up test dependencies
bun run test:docker:up

# Run tests
bun test

# Tear down test dependencies
bun run test:docker:down
```

---

## Project Structure

```text
backend/
├── src/
│   ├── app.ts             # Express app configuration
│   ├── index.ts           # Entry point & server initialization
│   ├── controllers/       # Route handlers (business logic)
│   ├── models/            # Mongoose schemas & models
│   ├── routes/            # API endpoint definitions
│   ├── middlewares/       # Auth, Validation, Error handling
│   ├── validator/         # Zod schemas for request validation
│   ├── cache/             # Redis caching logic
│   ├── queue/             # BullMQ producers for async tasks
│   ├── cron/              # Scheduled background jobs
│   ├── storage/           # Provider-neutral storage factory
│   ├── utils/             # Helper functions (Email, Tokens)
│   └── types/             # TypeScript interfaces & type definitions
├── tests/                 # Unit & Integration tests
│   ├── unit/
│   └── integration/
├── .env                   # Environment variables (local)
└── package.json           # Scripts & dependencies
```

---

## API Endpoints (Overview)

| Category       | Base Route        | Description                                      |
| -------------- | ----------------- | ------------------------------------------------ |
| **Auth**       | `/api/v1/user`    | Registration, Login, Password Reset             |
| **Courses**    | `/api/v1/course`  | Course browsing, Management, Purchases          |
| **Lectures**   | `/api/v1/lecture` | Lecture streaming, Progress, Heatmaps           |
| **Payments**   | `/api/v1/purchase`| Stripe checkout & Webhook handling               |
| **RAG / AI**   | `/api/v1/rag`     | AI-powered lecture Q&A                            |
| **Internal**   | `/api/v1/internal`| System-to-system communication (Lambda/Worker)    |
| **Health**     | `/api/v1/health`  | API health check & monitoring                     |

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
PYTHON_ENV=development
PYTHON_PORT=8000
```

---

### 3. Run the Full Stack (Recommended)

From the **repository root**, start the local stack with LocalStack defaults:

```bash
docker compose up -d --build
```

This starts:

| Service        | Port       | Description                              |
| -------------- | ---------- | ---------------------------------------- |
| `backend`      | `3000`     | Express API (this service)               |
| `frontend`     | `5173`     | Vite + React UI                          |
| `mongodb`      | (internal) | MongoDB replica set                      |
| `redis`        | (internal) | Cache + BullMQ message broker            |
| `media-worker` | —          | Python video transcoder (FFmpeg + boto3) |
| `rag-service`  | `8000`     | FastAPI RAG / AI Q&A service             |

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
│   ├── storage/
│   │   ├── index.ts            # getStorage() provider registry
│   │   ├── config.ts           # STORAGE_* resolution + legacy fallbacks
│   │   └── providers/          # aws.ts, azure.ts, localstack.ts, s3.ts
│   ├── types/                  # Shared TypeScript types and interfaces
│   ├── utils/
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

| Method   | Route                            | Auth       | Description                               |
| -------- | -------------------------------- | ---------- | ----------------------------------------- |
| `GET`    | `/health`                        | —          | Liveness health check                     |
| `POST`   | `/users/signup`                  | —          | Register a new user                       |
| `POST`   | `/users/signin`                  | —          | Sign in, sets JWT cookie                  |
| `POST`   | `/users/signout`                 | ✓          | Clear session cookie                      |
| `POST`   | `/users/forgot-password`         | —          | Send password reset email                 |
| `POST`   | `/users/reset-password`          | —          | Reset password via token                  |
| `GET`    | `/courses`                       | —          | List all published courses (Redis-cached) |
| `GET`    | `/courses/:courseId`             | —          | Get single course detail                  |
| `POST`   | `/courses`                       | Instructor | Create a new course                       |
| `PATCH`  | `/courses/:courseId`             | Instructor | Update course metadata                    |
| `POST`   | `/courses/:courseId/publish`     | Instructor | Publish / unpublish a course              |
| `POST`   | `/lecture`                       | Instructor | Add a lecture to a course                 |
| `PATCH`  | `/lecture/:lectureId`            | Instructor | Update lecture metadata                   |
| `DELETE` | `/lecture/:lectureId`            | Instructor | Delete a lecture                          |
| `POST`   | `/media/upload-session`          | User       | Get a presigned storage upload URL        |
| `POST`   | `/payments/checkout`             | Student    | Create Stripe checkout session            |
| `POST`   | `/payments/webhook`              | —          | Stripe webhook handler                    |
| `GET`    | `/progress/:courseId`            | Student    | Get course completion progress            |
| `POST`   | `/progress/:courseId/:lectureId` | Student    | Mark a lecture as watched                 |
| `POST`   | `/playback/heatmap`              | Student    | Submit watch-time heatmap data            |
| `GET`    | `/comment/:lectureId`            | ✓          | Fetch comments on a lecture               |
| `POST`   | `/comment/:lectureId`            | Student    | Post a comment on a lecture               |
| `PATCH`  | `/internal/media/status`         | Internal   | Media worker callback: transcode complete |

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

| Variable                   | Required | Description                                         |
| -------------------------- | -------- | --------------------------------------------------- |
| `PORT`                     | Yes      | Server port (default: `3000`)                       |
| `NODE_ENV`                 | Yes      | `development` or `production`                       |
| `MONGO_URI`                | Yes      | MongoDB connection string                           |
| `JWT_SECRET`               | Yes      | Secret key for signing JWTs                         |
| `RESETPASSWORDTOKENEXPIRY` | Yes      | Token expiry in ms (e.g. `3600000` = 60 min)        |
| `STORAGE_PROVIDER`         | Yes      | `aws`, `azure` or `localstack` (default `aws`)      |
| `STORAGE_CONTAINER`        | Yes      | Bucket/container name                               |
| `STORAGE_REGION`           | AWS/LocalStack | Storage region                                |
| `STORAGE_ACCESS_KEY`       | AWS/LocalStack | Access key                                    |
| `STORAGE_SECRET_KEY`       | AWS/LocalStack | Secret key                                    |
| `STORAGE_ENDPOINT`         | LocalStack | S3-compatible endpoint used by the server        |
| `STORAGE_PRESIGN_ENDPOINT` | LocalStack | Endpoint used in browser-facing signed URLs      |
| `STORAGE_PUBLIC_BASE_URL`  | No       | CDN/proxy base for stored media links               |
| `STORAGE_CONNECTION_STRING`| Azure    | Blob Storage connection string                      |
| `STORAGE_ACCOUNT_NAME` / `STORAGE_ACCOUNT_KEY` | Azure | Alternative to the connection string |
| `INTERNAL_API_SECRET`      | Yes      | Shared secret for internal service-to-service calls |
| `STRIPE_PUBLISHABLE_KEY`   | Yes      | Stripe publishable key                              |
| `STRIPE_SECRET_KEY`        | Yes      | Stripe secret key                                   |
| `STRIPE_WEBHOOK_SECRET`    | Yes      | Stripe webhook signing secret                       |

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
# Step 1: Create the lecture and receive a presigned upload URL
curl -X POST \
  "http://localhost:3000/api/v1/courses/<courseId>/lectures" \
  -H "Content-Type: application/json" \
  -H "Cookie: token=<your_jwt>" \
  -d '{"title":"Intro","description":"Lecture","fileName":"lecture.mp4","contentType":"video/mp4"}'

# Step 2: PUT the file to data.presignedUrl with data.uploadHeaders
curl -X PUT "<presigned_url>" \
  -H "Content-Type: video/mp4" \
  --data-binary @./lecture.mp4
```

Once the upload completes, the storage trigger (`storage-upload-trigger` on
AWS/LocalStack, `storageUploadTrigger` on Azure) confirms the upload and
enqueues a media job. The Python worker transcodes with FFmpeg, uploads HLS
output back to storage, and calls `PATCH /api/v1/internal/media/status` to mark
the lecture `READY`.

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
