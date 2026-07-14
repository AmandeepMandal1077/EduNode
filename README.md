# 🎓 EduNode — Learning Management System

EduNode is a production-grade, full-stack Learning Management System designed for online education at scale. Instructors can create, manage, and publish video courses with rich metadata. Students can explore the catalog, enroll via Stripe checkout, stream lectures with resume-from-position playback, visualize engagement through per-lecture heatmaps, and participate in threaded Q&A discussions — all backed by a secure, queue-driven architecture with AI-powered RAG (Retrieval-Augmented Generation) chat.

---

## ✨ Key Features

- **Course Management** — Instructors create courses with thumbnails, pricing, curriculum, and announcements; publish when ready.
- **Secure Video Uploads** — Presigned S3 URLs for direct client uploads with server-side validation; upload status tracking via LocalStack S3 event notifications.
- **Stripe Payments** — Full checkout flow with webhook-driven purchase confirmation, success/cancel pages, and purchase history.
- **Video Playback with Resume** — Lecture playback remembers the last watched position via Redis-cached progress sync.
- **Lecture Heatmaps** — Per-segment watch-time telemetry aggregated by a cron job into visual heatmap data.
- **Threaded Q&A** — Nested comment trees on each lecture with like/dislike support and soft-delete.
- **AI RAG Chat** — Ask questions about a lecture and receive AI-generated answers powered by a Python RAG microservice.
- **Background Job Processing** — AWS SQS (LocalStack) handles video transcoding (HLS) and RAG ingestion via a dedicated Python worker. BullMQ handles emails and password resets.
- **Auth & Security** — JWT tokens in HTTP-only cookies, rate limiting, Helmet headers, HPP, and Mongo injection sanitization.
- **Caching Layer** — Redis caching for published courses, lecture progress, and heatmap segments with periodic DB sync via cron.
- **Docker Compose** — One-command orchestration of frontend, backend, MongoDB (replica set), Redis, LocalStack, and Python Workers.

---

## 💻 Tech Stack

| Layer         | Technology                                                           |
|---------------|----------------------------------------------------------------------|
| **Frontend**  | React 19, Vite, TypeScript, TailwindCSS 4, Radix UI, shadcn/ui      |
| **Animation** | Motion (Framer Motion), Lenis smooth scroll                          |
| **State**     | Redux Toolkit, React Redux                                          |
| **Backend**   | Express 5, TypeScript, Bun runtime                                  |
| **Database**  | MongoDB (Mongoose ODM) with replica set for transactions             |
| **Caching**   | Redis (IORedis) — progress, heatmaps, course catalog cache          |
| **Queue**     | AWS SQS (via LocalStack) for media tasks. BullMQ for general tasks. |
| **Payments**  | Stripe (checkout sessions + webhooks)                                |
| **Media**     | S3 Presigned Uploads + FFmpeg HLS Transcoding                        |
| **AI / RAG**  | Python microservice + Vector DB for lecture content Q&A              |
| **Validation**| Zod schemas                                                          |
| **Testing**   | Vitest + Supertest + MongoDB Memory Server                           |
| **DevOps**    | Docker, Docker Compose, LocalStack (S3, SQS, Lambda)                 |

---

## 📂 Project Structure

```
EduNode/
├── docker-compose.yml          # Orchestrates all services
├── .env                        # Root-level env (ports, Redis password)
│
├── backend/                    # Express API server
│   ├── Dockerfile
│   ├── src/
│   │   ├── app.ts              # Express app setup & middleware
│   │   ├── index.ts            # Server entrypoint
│   │   ├── controllers/        # Route handler logic
│   │   ├── routes/             # Express routers
│   │   ├── models/             # Mongoose schemas
│   │   ├── middlewares/        # Auth, validation middleware
│   │   ├── validator/          # Zod validation schemas
│   │   ├── queue/              # BullMQ queues & workers
│   │   ├── cache/              # Redis caching layer
│   │   ├── cron/               # Scheduled jobs (heatmaps, progress sync)
│   │   ├── utils/              # S3, email, JWT helpers
│   │   └── types/              # TypeScript type definitions
│   ├── tests/                  # Vitest integration tests
│   └── seed.ts                 # Database seeder script
│
└── frontend/                   # React SPA
    ├── Dockerfile
    ├── src/
    │   ├── App.tsx             # Router & auth guards
    │   ├── pages/              # Page-level components
    │   ├── components/         # UI components by feature
    │   ├── api/                # Axios API client wrappers
    │   ├── services/           # Business logic layer
    │   ├── hooks/              # Custom React hooks
    │   ├── store/              # Redux Toolkit slices
    │   ├── types/              # TypeScript interfaces
    │   └── utils/              # Helper utilities
    └── index.html              # HTML entrypoint
```

---

## 🛠️ Prerequisites

Make sure the following are installed on your machine:

- **[Docker](https://www.docker.com/)** & **Docker Compose** — Required to run the full stack (LocalStack, MongoDB, Redis, API, and Worker).
- A **[Stripe](https://stripe.com/)** account (test keys).
- **[Bun](https://bun.sh/)** — Useful if you wish to run scripts locally outside of Docker.

---

## 🚀 Getting Started

The easiest way to run EduNode locally is using Docker Compose, which automatically provisions LocalStack (S3, SQS, Lambda) for media processing, a MongoDB replica set, and Redis.

### 1. Configure Environment Variables
```bash
# Root .env
cp .env.example .env

# Backend .env
cp backend/.env.example backend/.env

# Worker .env
cp worker/.env.example worker/.env
```
> **Double Check:** Make sure `INTERNAL_API_SECRET` in both `backend/.env` and `worker/.env` match perfectly. You must also configure your Stripe Test Keys in the backend `.env`.

### 2. Start the Stack
```bash
docker compose up --build
```
This will boot up the frontend, backend, RAG service, python worker, LocalStack, MongoDB, and Redis.
> **Note:** LocalStack runs an initialization script on boot (`localstack/init-aws.sh`) that provisions the S3 bucket, SQS queue, and your Lambda trigger. Wait for `LocalStack AWS resources initialized successfully!` in the logs before uploading media.

### 3. Initialize Database (First-time only)
In a new terminal window, initialize the MongoDB replica set and seed the database with mock data:
```bash
docker exec -it edunode-mongodb-1 mongosh --eval "rs.initiate()"
docker exec -it edunode-backend-1 bun run seed.ts
```
> All seeded user accounts share the password: `Seeded@123`. Query the `users` collection in the `LMS` database for email addresses.

### 4. Access the App
- **Frontend:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:3000](http://localhost:3000)

---

## 🐛 Troubleshooting & Error Tracking

If something isn't working locally (e.g. video uploads failing), use these checks:

1. **Docker Logs:** Track errors easily using docker logs.
   - For backend errors: `docker compose logs backend -f`
   - For FFmpeg/HLS errors: `docker compose logs media-worker -f`
   - For S3/Lambda trigger errors: `docker compose logs localstack -f`
2. **Double Check CORS & Connectivity:** Ensure `AWS_ENDPOINT_URL` is properly set so the services can talk to LocalStack internally.
3. **Queue Health:** If a video is stuck in "Processing", ensure the Lambda function fired correctly in the LocalStack logs and placed the message into the SQS queue.

---

## 🔑 Environment Variables

### Root `.env`
| Variable          | Description                     | Default       |
|-------------------|---------------------------------|---------------|
| `BACKEND_PORT`    | Port for the Express server     | `3000`        |
| `NODE_ENV`        | Environment mode                | `development` |
| `REDIS_PASSWORD`  | Redis server password           | `pass`        |

### `backend/.env`
| Variable                      | Description                               |
|-------------------------------|-------------------------------------------|
| `MONGO_URI`                   | MongoDB connection string                 |
| `JWT_SECRET`                  | Secret key for JWT signing                |
| `STRIPE_PUBLISHABLE_KEY`      | Stripe publishable API key                |
| `STRIPE_SECRET_KEY`           | Stripe secret API key                     |
| `STRIPE_WEBHOOK_SECRET`       | Stripe webhook signing secret             |

| `REDIS_HOST_NAME`             | Redis hostname                            |
| `REDIS_PORT`                  | Redis port                                |
| `REDIS_PASSWORD`              | Redis password                            |
| `CACHE_CONTENT_EXPIRATION_DUR`| Cache TTL in milliseconds                 |
| `FRONTEND_URL`                | Frontend origin for CORS                  |
| `RAG_SERVER_URL`              | Python RAG microservice base URL          |
| `SMTP_HOST`                   | SMTP server hostname                      |
| `SMTP_PORT`                   | SMTP server port                          |
| `SMTP_USER`                   | SMTP username                             |
| `SMTP_PASS`                   | SMTP password                             |

### `frontend/.env`
| Variable            | Description                     | Default                          |
|---------------------|---------------------------------|----------------------------------|
| `VITE_BACKEND_URL`  | Backend API base URL            | `http://localhost:3000/api/v1`   |

---

## 🧪 Running Tests

```bash
cd backend
bun run test        # Runs Vitest integration tests against MongoDB Memory Server
```

---

## 📜 API Routes Overview

| Method | Endpoint                                  | Description                      |
|--------|-------------------------------------------|----------------------------------|
| POST   | `/api/v1/users/signup`                    | Register a new user              |
| POST   | `/api/v1/users/signin`                    | Authenticate a user              |
| GET    | `/api/v1/users/me`                        | Get current user profile         |
| GET    | `/api/v1/courses`                         | List published courses           |
| POST   | `/api/v1/courses`                         | Create a course (instructor)     |
| GET    | `/api/v1/courses/c/:courseId`             | Get course details               |
| POST   | `/api/v1/courses/c/:courseId/lectures`    | Add lecture to course            |
| POST   | `/api/v1/payments/checkout`               | Create Stripe checkout session   |
| POST   | `/api/v1/payments/webhook`                | Stripe webhook handler           |
| GET    | `/api/v1/lecture/:lectureId`              | Get lecture details              |
| POST   | `/api/v1/media/upload-signature`          | Generate S3 upload presigned URL |
| GET    | `/api/v1/playback/resume`                 | Get lecture resume position      |
| POST   | `/api/v1/playback/sync`                   | Sync playback progress to cache  |
| GET    | `/api/v1/progress/:courseId`              | Get course progress              |
| POST   | `/api/v1/comment`                         | Post a comment on a lecture      |
| POST   | `/api/v1/internal-rag/chat`               | AI chat with lecture content     |
| POST   | `/api/v1/internal-rag/vectordb-processed` | RAG processing status callback   |

---

## 📄 License

This project is for educational purposes.
