<![CDATA[# 🎓 EduNode — Learning Management System

EduNode is a production-grade, full-stack Learning Management System designed for online education at scale. Instructors can create, manage, and publish video courses with rich metadata. Students can explore the catalog, enroll via Stripe checkout, stream lectures with resume-from-position playback, visualize engagement through per-lecture heatmaps, and participate in threaded Q&A discussions — all backed by a secure, queue-driven architecture with AI-powered RAG (Retrieval-Augmented Generation) chat.

---

## ✨ Key Features

- **Course Management** — Instructors create courses with thumbnails, pricing, curriculum, and announcements; publish when ready.
- **Secure Video Uploads** — Client-side Cloudinary uploads verified with server-side signature validation; upload status tracking (Uploading → Processing → Completed).
- **Stripe Payments** — Full checkout flow with webhook-driven purchase confirmation, success/cancel pages, and purchase history.
- **Video Playback with Resume** — Lecture playback remembers the last watched position via Redis-cached progress sync.
- **Lecture Heatmaps** — Per-segment watch-time telemetry aggregated by a cron job into visual heatmap data.
- **Threaded Q&A** — Nested comment trees on each lecture with like/dislike support and soft-delete.
- **AI RAG Chat** — Ask questions about a lecture and receive AI-generated answers powered by a Python RAG microservice.
- **Background Job Processing** — BullMQ queues handle email delivery, announcement broadcasts, password resets, and lecture ingestion into the vector database.
- **Auth & Security** — JWT tokens in HTTP-only cookies, rate limiting, Helmet headers, HPP, and Mongo injection sanitization.
- **Caching Layer** — Redis caching for published courses, lecture progress, and heatmap segments with periodic DB sync via cron.
- **Docker Compose** — One-command orchestration of frontend, backend, MongoDB (replica set), and Redis.

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
| **Queue**     | BullMQ — emails, announcements, password resets, lecture ingestion   |
| **Payments**  | Stripe (checkout sessions + webhooks)                                |
| **Media**     | Cloudinary (upload widget + signed uploads)                          |
| **AI / RAG**  | Python microservice (external) for lecture content Q&A               |
| **Validation**| Zod schemas                                                          |
| **Testing**   | Vitest + Supertest + MongoDB Memory Server                           |
| **DevOps**    | Docker, Docker Compose                                               |

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
│   │   ├── utils/              # Cloudinary, email, JWT helpers
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

- **[Bun](https://bun.sh/)** (v1.0+) — JavaScript runtime & package manager
- **[Docker](https://www.docker.com/)** & **Docker Compose** — for containerized setup
- **[MongoDB](https://www.mongodb.com/)** (v6+) — if running locally without Docker (must support replica sets)
- **[Redis](https://redis.io/)** (v7+) — if running locally without Docker
- A **[Stripe](https://stripe.com/)** account (test keys)
- A **[Cloudinary](https://cloudinary.com/)** account

---

## 🚀 Getting Started

### Option A: Docker Compose (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/EduNode.git
   cd EduNode
   ```

2. **Configure environment variables**
   ```bash
   # Root .env (already has sensible defaults)
   cp .env.example .env  # or edit .env directly

   # Backend .env
   # Edit backend/.env with your Stripe, Cloudinary, and SMTP credentials
   ```

3. **Start all services**
   ```bash
   docker compose up --build
   ```

4. **Initialize MongoDB replica set** (first-time only)
   ```bash
   docker exec -it edunode-mongodb-1 mongosh --eval "rs.initiate()"
   ```

5. **Seed the database** (optional)
   ```bash
   docker exec -it edunode-backend-1 bun run seed.ts
   ```

6. **Open the app**
   - Frontend: [http://localhost:5173](http://localhost:5173)
   - Backend API: [http://localhost:3000](http://localhost:3000)

---

### Option B: Local Development (without Docker)

1. **Start MongoDB with replica set support**
   ```bash
   mongod --replSet rs0 --bind_ip_all
   # In another terminal, initiate the replica set:
   mongosh --eval "rs.initiate()"
   ```

2. **Start Redis**
   ```bash
   redis-server --requirepass pass
   ```

3. **Install dependencies & start the backend**
   ```bash
   cd backend
   bun install
   bun run dev          # Starts on http://localhost:3000
   ```

4. **Install dependencies & start the frontend**
   ```bash
   cd frontend
   bun install
   bun run dev          # Starts on http://localhost:5173
   ```

5. **Seed mock data** (optional)
   ```bash
   cd backend
   bun run seed.ts
   ```
   > All seeded user accounts share the password: `Seeded@123`. Query the `users` collection in the `LMS` database for email addresses.

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
| `CLOUDINARY_CLOUD_NAME`       | Cloudinary cloud name                     |
| `CLOUDINARY_API_KEY`          | Cloudinary API key                        |
| `CLOUDINARY_API_SECRET`       | Cloudinary API secret                     |
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
| POST   | `/api/v1/media/upload-signature`          | Generate Cloudinary upload sig   |
| GET    | `/api/v1/playback/resume`                 | Get lecture resume position      |
| POST   | `/api/v1/playback/sync`                   | Sync playback progress to cache  |
| GET    | `/api/v1/progress/:courseId`              | Get course progress              |
| POST   | `/api/v1/comment`                         | Post a comment on a lecture      |
| POST   | `/api/v1/internal-rag/chat`               | AI chat with lecture content     |
| POST   | `/api/v1/internal-rag/vectordb-processed` | RAG processing status callback   |

---

## 📄 License

This project is for educational purposes.
]]>
