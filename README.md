# 🎓 EduNode — Learning Management System

EduNode is a production-grade, full-stack Learning Management System designed for online education at scale. Instructors can create, manage, and publish video courses with rich metadata. Students can explore the catalog, enroll via Stripe checkout, stream lectures with resume-from-position playback, visualize engagement through per-lecture heatmaps, and participate in threaded Q&A discussions — all backed by a secure, queue-driven architecture with AI-powered RAG (Retrieval-Augmented Generation) chat.

---

## ✨ Key Features

- **Course Management** — Instructors create courses with thumbnails, pricing, curriculum, and announcements; publish when ready.
- **Secure Video Uploads** — Presigned storage URLs for direct client uploads with server-side validation; upload status tracking via storage event notifications.
- **Stripe Payments** — Full checkout flow with webhook-driven purchase confirmation, success/cancel pages, and purchase history.
- **Video Playback with Resume** — Lecture playback remembers the last watched position via Redis-cached progress sync.
- **Lecture Heatmaps** — Per-segment watch-time telemetry aggregated by a cron job into visual heatmap data.
- **Threaded Q&A** — Nested comment trees on each lecture with like/dislike support and soft-delete.
- **AI RAG Chat** — Ask questions about a lecture and receive AI-generated answers powered by a Python RAG microservice.
- **Background Job Processing** — A provider-neutral media queue (SQS, Azure Storage Queue or LocalStack) handles video transcoding (HLS) and RAG ingestion via a dedicated Python worker. BullMQ handles emails and password resets.
- **Auth & Security** — JWT tokens in HTTP-only cookies, rate limiting, Helmet headers, HPP, and Mongo injection sanitization.
- **Caching Layer** — Redis caching for published courses, lecture progress, and heatmap segments with periodic DB sync via cron.
- **Docker Compose** — One-command orchestration of frontend, backend, MongoDB (replica set), Redis, and Python Workers.

---

## 💻 Tech Stack

| Layer          | Technology                                                     |
| -------------- | -------------------------------------------------------------- |
| **Frontend**   | React 19, Vite, TypeScript, TailwindCSS 4, Radix UI, shadcn/ui |
| **Animation**  | Motion (Framer Motion), Lenis smooth scroll                    |
| **State**      | Redux Toolkit, React Redux                                     |
| **Backend**    | Express 5, TypeScript, Bun runtime                             |
| **Database**   | MongoDB (Mongoose ODM) with replica set for transactions       |
| **Caching**    | Redis (IORedis) — progress, heatmaps, course catalog cache     |
| **Queue**      | SQS / Azure Storage Queue / LocalStack for media. BullMQ for general tasks. |
| **Payments**   | Stripe (checkout sessions + webhooks)                          |
| **Media**      | S3 / Azure Blob / LocalStack presigned uploads + FFmpeg HLS    |
| **AI / RAG**   | Python microservice + Vector DB for lecture content Q&A        |
| **Validation** | Zod schemas                                                    |
| **Testing**    | Vitest + Supertest (real MongoDB replica set, port 27018)      |
| **DevOps**     | Docker, Docker Compose                                         |

---

## 📂 Project Structure

```
lms/
├── docker-compose.yml          # Local stack (MongoDB, Redis, LocalStack, app services)
├── DEPLOY_STEPS.md             # Per-provider deployment guide
├── ROUTES.md                   # Every route with IDs + end-to-end flows
├── .github/workflows/          # Backend CI and deploy
├── localstack/init/            # Auto-provisions bucket, queue, Lambda, trigger
├── lambda/                     # AWS/LocalStack upload trigger
├── az-functions/               # Azure Event Grid upload trigger
├── .env                        # Root-level env (ports, Redis password, internal secret)
│
├── backend/                    # Express API server
│   ├── Dockerfile
│   ├── src/
│   │   ├── app.ts              # Middleware, router mounts, cron imports
│   │   ├── index.ts            # Server entrypoint
│   │   ├── controllers/        # Route handler logic
│   │   ├── routes/             # Express routers
│   │   ├── models/             # Mongoose schemas
│   │   ├── middlewares/        # Auth, validation middleware
│   │   ├── validator/          # Zod validation schemas
│   │   ├── queue/              # BullMQ queues & workers
│   │   ├── cache/              # Redis caching layer
│   │   ├── cron/               # Heatmap/progress sync, upload expiry
│   │   ├── storage/            # Provider-neutral storage factory
│   │   │   └── providers/      # aws, azure, localstack, s3
│   │   ├── utils/              # Email, JWT and misc helpers
│   │   └── types/              # TypeScript type definitions
│   ├── tests/                  # Vitest unit + integration tests
│   └── seed.ts                 # Database seeder script
│
├── frontend/                   # React SPA
│   ├── Dockerfile              # Runs the Vite dev server
│   └── src/
│       ├── App.tsx             # Router & auth guards
│       ├── pages/              # Page-level components
│       ├── components/         # UI components by feature
│       ├── api/                # Axios API client wrappers
│       ├── services/           # Business logic layer
│       ├── hooks/              # Custom React hooks
│       ├── store/              # Redux Toolkit slices
│       ├── types/              # TypeScript interfaces
│       └── utils/              # Helper utilities
│
├── worker/                     # Python media worker (FFmpeg HLS + RAG ingest)
│   ├── media_worker.py
│   ├── messaging/              # Provider-neutral queue factory
│   └── storage/                # Provider-neutral storage factory
│
└── rag-service/                # FastAPI RAG service
    ├── main.py                 # /health, /ingest, /chat routes
    ├── ingestion.py            # Whisper transcription + chunking + embedding
    ├── retrieval.py            # Similarity search + Gemini answer
    ├── vectorstore.py          # Chroma (dev) / Qdrant (prod)
    └── storage/                # Provider-neutral storage factory
```

---

## 🛠️ Prerequisites

Make sure the following are installed on your machine:

- **[Docker](https://www.docker.com/)** & **Docker Compose** — Required to run the full stack (MongoDB, Redis, LocalStack, API, and Worker).
- A **[Stripe](https://stripe.com/)** account (test keys).
- **[Bun](https://bun.sh/)** — Useful if you wish to run scripts locally outside of Docker.
- **[Ollama](https://ollama.com/)** — Development-only local embeddings for RAG; pull the model once with `ollama pull nomic-embed-text:v1.5`.

No cloud account is required for local development: LocalStack emulates S3 and SQS inside Docker.

With `PYTHON_ENV=development`, RAG uses a local Chroma store (`./chroma_db`)
and **embeddings run on Ollama on your host** (`nomic-embed-text:v1.5`, 768
dims) — no Gemini key is needed for embeddings. Chat always uses Gemini, so
`GEMINI_API_KEY` in `rag-service/.env` is still required. Set
`PYTHON_ENV=production` to use Qdrant (`my_docs`) and Gemini embeddings
(`gemini-embedding-001`, 3072 dims); changing the embedding model requires
re-indexing the Qdrant collection.

---

## 🚀 Getting Started

The easiest way to run EduNode locally is using Docker Compose, which orchestrates a MongoDB replica set, Redis, LocalStack (S3 + SQS + Lambda), and the application services. The single `docker-compose.yml` is for local development only and includes LocalStack.

### 1. Configure Environment Variables

```bash
# Root .env (ports, Redis password, shared internal secret)
cp .env.example .env

# Backend .env
cp backend/.env.example backend/.env

# Worker .env
cp worker/.env.example worker/.env

# RAG .env
cp rag-service/.env.example rag-service/.env
```

> **Double Check:** `INTERNAL_API_SECRET` must be identical for the backend,
> worker, and local trigger. Compose defaults it to `local-dev-secret`; keep
> that default or update it in **all** places. You must also configure your
> Stripe test keys in `backend/.env`.
>
> `backend/.env.example` already points `MONGO_URI` at the Compose MongoDB.
> Change it only if you want Atlas or another database.

### 2. Start the Stack

```bash
docker compose up -d --build
```

Compose supplies the LocalStack service and provider settings. On first boot
LocalStack automatically:

- creates the `edunode-dev-bucket` bucket (CORS + public read),
- creates `edunode-media-queue` and its dead-letter queue,
- builds and registers the `storage-upload-trigger` Lambda,
- wires the S3 `ObjectCreated` notification to that Lambda.

The trigger-builder needs a few minutes on the very first run while it installs
the Lambda dependencies.

### 3. Initialize Database (First-time only)

The MongoDB replica set is automatically initialized on startup. To seed the database with mock data, run this **inside** the backend container so it uses the same internal secret:

```bash
docker compose exec backend bun run seed.ts
```

> All seeded user accounts share the password: `Seeded@123`. Query the `users` collection in the `LMS` database for email addresses.

### 4. Access the App

- **Frontend:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:3000](http://localhost:3000)
- **LocalStack:** [http://localhost:4566](http://localhost:4566)
- **RAG service:** [http://localhost:8000](http://localhost:8000)

### 5. AWS or Azure

`docker-compose.yml` is local-only and always runs LocalStack. For AWS or Azure,
deploy the services following **[DEPLOY_STEPS.md](./DEPLOY_STEPS.md)**.

### 6. Reset Local State

```bash
# Keep data
docker compose down

# Delete Mongo, Redis, LocalStack, Chroma and trigger build data
docker compose down -v
```

---

## 🐛 Troubleshooting & Error Tracking

If something isn't working locally (e.g. video uploads failing), use these checks:

1. **Docker Logs:** Track errors easily using docker logs.
   - For backend errors: `docker compose logs backend -f`
   - For FFmpeg/HLS errors: `docker compose logs media-worker -f`
2. **Queue Health:** If a video is stuck in "Processing", check the trigger logs (`docker compose logs localstack`) and the media worker (`docker compose logs media-worker -f`). For AWS/Azure, check the Lambda/Function logs and the queue metrics.
3. **LocalStack Resources:** `docker compose down -v` deletes the LocalStack volume; the init script recreates the bucket, queue and trigger on the next start.
4. **Upload Contract:** The trigger and worker exchange `{ storageKey, courseId, lectureId, container }`. If you change that payload, update the backend, both triggers and the worker together.

---

## 🔑 Environment Variables

### Root `.env`

| Variable                | Description                              | Default            |
| ----------------------- | ---------------------------------------- | ------------------ |
| `BACKEND_PORT`          | Port for the Express server              | `3000`             |
| `NODE_ENV`              | Environment mode                         | `development`      |
| `PYTHON_ENV`            | `development` -> Chroma + Ollama, else Qdrant + Gemini | `development` |
| `REDIS_PASSWORD`        | Redis server password                    | `your_redis_password` |
| `PYTHON_PORT`           | RAG service port                         | `8000`             |
| `INTERNAL_API_SECRET`   | Shared secret for internal service calls | `local-dev-secret` |

### Storage and queue providers

| Variable | Values | Notes |
| --- | --- | --- |
| `STORAGE_PROVIDER` | `aws`, `azure`, `localstack` | Default `aws` outside Compose, `localstack` inside Compose |
| `QUEUE_PROVIDER` | `aws`, `azure`, `localstack` | Default `aws` outside Compose, `localstack` inside Compose |
| `STORAGE_CONTAINER` | string | Bucket/container name |
| `STORAGE_ENDPOINT` | URL | LocalStack/S3-compatible endpoint used by the server |
| `STORAGE_PRESIGN_ENDPOINT` | URL | Endpoint the browser uses for signed uploads (LocalStack) |
| `STORAGE_PUBLIC_BASE_URL` | URL | CDN/proxy base for stored links |
| `STORAGE_CONNECTION_STRING` | string | Azure Blob connection string |
| `QUEUE_URL` / `QUEUE_NAME` | string | Queue address/name |
| `QUEUE_CONNECTION_STRING` | string | Azure Queue connection string |

Legacy `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`,
`S3_BUCKET_NAME` and `SQS_QUEUE_URL` are still accepted as fallbacks.

### `backend/.env`

| Variable                 | Description                   |
| ------------------------ | ----------------------------- |
| `MONGO_URI`              | MongoDB connection string     |
| `JWT_SECRET`             | Secret key for JWT signing    |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable API key    |
| `STRIPE_SECRET_KEY`      | Stripe secret API key         |
| `STRIPE_WEBHOOK_SECRET`  | Stripe webhook signing secret |
| `REDIS_HOST_NAME` | Redis hostname |
| `REDIS_PORT` | Redis port |
| `REDIS_PASSWORD` | Redis password |
| `CACHE_CONTENT_EXPIRATION_DUR`| Cache TTL in milliseconds |
| `FRONTEND_URL` | Frontend origin for CORS |
| `RAG_SERVER_URL` | Python RAG microservice base URL |
| `SMTP_HOST` | SMTP server hostname |
| `SMTP_PORT` | SMTP server port |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password |
| `STORAGE_*` | See the storage/queue table above |

### `rag-service/.env`

| Variable | Description | Default |
| --- | --- | --- |
| `PYTHON_ENV` | `development` -> Chroma + Ollama, else Qdrant + Gemini | `development` |
| `GEMINI_API_KEY` | Gemini API key (chat always; embeddings in production) | — |
| `GEMINI_MODEL` | Chat model | `gemini-3.5-flash` |
| `GEMINI_EMBEDDING_MODEL` | Production embedding model (3072 dims) | `gemini-embedding-001` |
| `OLLAMA_BASE_URL` | Dev Ollama endpoint | `http://host.docker.internal:11434` |
| `OLLAMA_EMBEDDING_MODEL` | Dev embedding model (768 dims) | `nomic-embed-text:v1.5` |
| `QDRANT_URL` / `QDRANT_API_KEY` | Production vector store | — |

`worker/.env` mirrors the queue/storage provider keys plus `BACKEND_URL`,
`RAG_SERVER_URL` and `INTERNAL_API_SECRET` — see `worker/.env.example`.

### `frontend/.env`

| Variable           | Description          | Default                        |
| ------------------ | -------------------- | ------------------------------ |
| `VITE_BACKEND_URL` | Backend API base URL | `http://localhost:3000/api/v1` |

---

## 🧪 Running Tests

Backend tests run against a real MongoDB replica set, not an in-memory database:

```bash
cd backend
bun run test:docker:up    # mongo:7 on localhost:27018, replSet rs0
bun run test              # vitest run
bun run test:docker:down
```

Single file: `bun x vitest run tests/integration/<name>.test.ts` (keep the test
Mongo up). Files run sequentially (`fileParallelism: false`) because they share
DB state. Use Vitest — never `bun test`. The frontend has no test suite;
`bun run lint` is its only static check.

---

## 📜 API Routes

Full route inventory — every backend, RAG, frontend, trigger and cron route with
IDs, callers and end-to-end flows: **[ROUTES.md](./ROUTES.md)**.

---

## 📄 License

This project is for educational purposes.
