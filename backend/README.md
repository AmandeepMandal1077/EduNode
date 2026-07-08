# EduNode — Backend API Server

The Express.js API server powering EduNode. Handles authentication, course management, video lecture orchestration, Stripe payments, real-time playback telemetry, threaded Q&A comments, and AI-powered RAG chat — all running on the Bun runtime.

---

## ✨ Key Features

- **RESTful API** — Clean controller → route → model architecture with Express 5
- **JWT Authentication** — HTTP-only cookie-based auth with role-aware middleware
- **Course & Lecture CRUD** — Full lifecycle management with slug generation and ordering
- **Secure Video Uploads** — Cloudinary widget uploads verified via server-side HMAC signature validation
- **Upload Status Tracking** — Lectures move through `UPLOADING → PROCESSING → COMPLETED` states
- **Stripe Integration** — Checkout session creation + webhook-driven purchase confirmation
- **Playback Telemetry** — Redis-cached lecture progress with resume-from-position and per-segment heatmaps
- **Cron Jobs** — Periodic sync of heatmap segments and lecture progress from Redis to MongoDB
- **Background Queues** — BullMQ workers for email delivery, announcements, password resets, and RAG ingestion
- **RAG Service Integration** — Routes that proxy to an external Python microservice for AI-powered lecture Q&A
- **Input Validation** — Zod schemas on all request bodies via validation middleware
- **Security Hardened** — Helmet, HPP, rate limiting, and MongoDB query sanitization
- **Integration Tests** — Vitest + Supertest against MongoDB Memory Server

---

## 💻 Tech Stack

| Component       | Technology                                           |
|-----------------|------------------------------------------------------|
| **Runtime**     | [Bun](https://bun.sh/)                               |
| **Framework**   | Express 5                                            |
| **Language**    | TypeScript                                           |
| **Database**    | MongoDB (Mongoose ODM) with replica set transactions |
| **Caching**     | Redis via IORedis                                    |
| **Queue**       | BullMQ (Redis-backed)                                |
| **Payments**    | Stripe                                               |
| **Media**       | Cloudinary                                           |
| **Email**       | Nodemailer (SMTP — Mailtrap / Ethereal)              |
| **Scheduling**  | node-cron                                            |
| **Validation**  | Zod                                                  |
| **Testing**     | Vitest, Supertest, MongoDB Memory Server             |

---

## 📂 Folder Structure

```
backend/
├── Dockerfile                    # Container image definition
├── .env                          # Environment variables (gitignored)
├── package.json                  # Dependencies & scripts
├── seed.ts                       # Database seeder (users, courses, lectures, etc.)
├── vitest.config.ts              # Test runner configuration
│
├── src/
│   ├── index.ts                  # Server entrypoint — boots DB & listens
│   ├── app.ts                    # Express app — middleware, CORS, routes
│   │
│   ├── controllers/              # Request handlers (business logic)
│   │   ├── course.controller.ts
│   │   ├── user.controller.ts
│   │   ├── lecture.controller.ts
│   │   ├── media.controller.ts
│   │   ├── playback.controller.ts
│   │   ├── courseProgress.controller.ts
│   │   ├── coursePurchase.controller.ts
│   │   ├── comment.controller.ts
│   │   ├── email.controller.ts
│   │   ├── health.controller.ts
│   │   └── rag.controller.ts
│   │
│   ├── routes/                   # Express routers
│   │   ├── course.route.ts
│   │   ├── user.route.ts
│   │   ├── lecture.route.ts
│   │   ├── media.route.ts
│   │   ├── playback.route.ts
│   │   ├── courseProgress.route.ts
│   │   ├── purchaseCourse.route.ts
│   │   ├── comment.route.ts
│   │   ├── email.route.ts
│   │   ├── health.routes.ts
│   │   └── rag.route.ts
│   │
│   ├── models/                   # Mongoose schemas & interfaces
│   │   ├── user.model.ts
│   │   ├── course.model.ts
│   │   ├── lecture.model.ts       # Includes EUploadStatus enum
│   │   ├── announcement.model.ts
│   │   ├── comment.model.ts
│   │   ├── courseProgress.model.ts
│   │   ├── coursePurchase.model.ts
│   │   ├── lectureHeatmap.model.ts
│   │   └── chatMessage.model.ts   # RAG chat history schema
│   │
│   ├── middlewares/
│   │   ├── auth.middleware.ts     # JWT cookie verification
│   │   └── validator.middleware.ts # Zod schema validation
│   │
│   ├── validator/                # Zod schemas per resource
│   │   ├── user.zod.ts
│   │   ├── course.zod.ts
│   │   ├── lecture.zod.ts
│   │   └── ...
│   │
│   ├── queue/                    # BullMQ queues & workers
│   │   ├── index.ts              # Redis connection for queues
│   │   ├── keys.ts               # Queue name constants
│   │   ├── email.queue.ts
│   │   ├── announcement.queue.ts
│   │   ├── forgot-password.queue.ts
│   │   └── lecture-upload.queue.ts # RAG ingestion dispatcher
│   │
│   ├── cache/                    # Redis caching utilities
│   │   ├── index.ts              # Redis client
│   │   ├── keys.ts               # Cache key prefixes
│   │   ├── courses-cache.ts      # Published courses cache
│   │   ├── lecture-progress-cache.ts
│   │   ├── lecture-heatmap-cache.ts
│   │   ├── chat-messages-cache.ts # RAG chat history cache
│   │   └── query.ts              # Generic query cache helper
│   │
│   ├── cron/                     # Scheduled background jobs
│   │   ├── syncHeatmaps.ts       # Flush heatmap data → MongoDB (every 5 min)
│   │   └── syncProgress.ts       # Flush lecture progress → MongoDB
│   │
│   ├── database/
│   │   └── db.ts                 # MongoDB connection with retry logic
│   │
│   ├── utils/
│   │   ├── cloudinary.ts         # Upload signature generation & verification
│   │   ├── email.ts              # Handlebars email templates & Nodemailer
│   │   ├── generateToken.ts      # JWT creation & cookie setting
│   │   ├── asynchandler.ts       # Async error wrapper
│   │   ├── apiError.ts           # Custom API error class
│   │   └── multer.ts             # File upload configuration
│   │
│   └── types/
│       └── user.ts               # AuthenticatedRequest type
│
└── tests/                        # Test suites (unit & integration)
    ├── setup.ts                  # Test configuration and mocks
    ├── unit/                     # Unit test suites (auth, course, comment, etc.)
    └── integration/              # Integration test suites
```

---

## 🛠️ Prerequisites

- **[Bun](https://bun.sh/)** (v1.0+)
- **MongoDB** (v6+) with replica set enabled (required for transactions)
- **Redis** (v7+)
- **Stripe** test API keys
- **Cloudinary** account credentials
- **SMTP credentials** (Mailtrap, Ethereal, or your own provider)

---

## 🚀 Getting Started

### 1. Install dependencies
```bash
cd backend
bun install
```

### 2. Configure environment variables
Create a `.env` file in the `backend/` directory:

```env
PORT=3000
NODE_ENV=development

MONGO_URI=mongodb://localhost:27017/LMS?replicaSet=rs0
JWT_SECRET=your-jwt-secret

RESETPASSWORDTOKENEXPIRY=3600000

STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

REDIS_HOST_NAME=localhost
REDIS_PORT=6379
REDIS_PASSWORD=pass

CACHE_CONTENT_EXPIRATION_DUR=600000

FRONTEND_URL=http://localhost:5173
RAG_SERVER_URL=http://localhost:8000

SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=465
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-pass
```

### 3. Start databases
```bash
# MongoDB with replica set
mongod --replSet rs0 --bind_ip_all
mongosh --eval "rs.initiate()"

# Redis
redis-server --requirepass pass
```

### 4. Seed the database (optional)
```bash
bun run seed.ts
```
> All seeded accounts use the password: `Seeded@123`

### 5. Start the development server
```bash
bun run dev
```
The API will be available at **http://localhost:3000**.

---

## 🧪 Testing

The backend includes both **unit** (isolated controller tests with mocks) and **integration** (full API lifecycle) test suites. Detailed documentation can be found in [README_TESTS.md](file:///e:/Dev/LMS/backend/README_TESTS.md).

### 1. Spin up the Test Databases (MongoDB replica set & Redis)
```bash
bun run test:docker:up
```

### 2. Run the Tests
```bash
bun run test
```

To run in watch mode:
```bash
bun x vitest
```

### 3. Tear down the Test Databases
```bash
bun run test:docker:down
```

---

## 🐳 Docker

Build and run the backend as a container:

```bash
docker build -t edunode-backend .
docker run --env-file .env -p 3000:3000 edunode-backend
```

Or use Docker Compose from the project root — see the [root README](../README.md).

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint                    | Auth | Description                |
|--------|-----------------------------|------|----------------------------|
| POST   | `/api/v1/users/signup`      | ✗    | Register a new user        |
| POST   | `/api/v1/users/signin`      | ✗    | Log in                     |
| GET    | `/api/v1/users/signout`     | ✓    | Log out                    |
| GET    | `/api/v1/users/me`          | ✓    | Get current user           |
| PATCH  | `/api/v1/users/update`      | ✓    | Update profile             |
| POST   | `/api/v1/users/forgot-password` | ✗ | Request password reset     |
| POST   | `/api/v1/users/reset-password`  | ✗ | Reset password with token  |

### Courses
| Method | Endpoint                                  | Auth | Description                     |
|--------|-------------------------------------------|------|---------------------------------|
| GET    | `/api/v1/courses`                         | ✗    | List published courses          |
| POST   | `/api/v1/courses`                         | ✓    | Create a course                 |
| GET    | `/api/v1/courses/c/:courseId`             | ✗    | Get course details              |
| PATCH  | `/api/v1/courses/c/:courseId`             | ✓    | Update course                   |
| POST   | `/api/v1/courses/c/:courseId/lectures`    | ✓    | Add lecture (signature verified) |
| GET    | `/api/v1/courses/c/:courseId/lectures`    | ✓    | Get course lectures             |

### Payments
| Method | Endpoint                          | Auth | Description                   |
|--------|-----------------------------------|------|-------------------------------|
| POST   | `/api/v1/payments/checkout`       | ✓    | Create Stripe checkout        |
| POST   | `/api/v1/payments/webhook`        | ✗    | Stripe webhook (raw body)     |
| GET    | `/api/v1/payments/status/:courseId`| ✓    | Purchase status               |

### Playback & Progress
| Method | Endpoint                           | Auth | Description                  |
|--------|------------------------------------|------|------------------------------|
| GET    | `/api/v1/playback/resume`          | ✓    | Resume position              |
| POST   | `/api/v1/playback/sync`            | ✓    | Sync progress to Redis cache |
| GET    | `/api/v1/playback/heatmap/:lectureId`| ✓  | Lecture heatmap data         |
| GET    | `/api/v1/progress/:courseId`       | ✓    | Course progress              |

### RAG (AI Chat)
| Method | Endpoint                                  | Auth | Description                      |
|--------|-------------------------------------------|------|----------------------------------|
| POST   | `/api/v1/internal-rag/chat`               | ✓    | Ask AI about lecture content     |
| GET    | `/api/v1/internal-rag/chat-history/:courseId/:lectureId` | ✓    | Get chat history for a lecture |
| POST   | `/api/v1/internal-rag/vectordb-processed` | ✗    | Processing status callback (internal) |

---

## 📄 License

This project is for educational purposes.
