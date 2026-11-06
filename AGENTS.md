# AGENTS.md

EduNode LMS: multi-service monorepo, no root manifest or workspace tool. Each service has its own manifest; run commands inside the service directory.

| Dir | What | Runtime |
|---|---|---|
| `backend/` | Express 5 REST API + BullMQ + crons + Stripe, Mongoose 9 | Bun |
| `frontend/` | React 19, Vite, Tailwind 4, Redux Toolkit, React Router 7 | Bun |
| `worker/` | Media worker: FFmpeg HLS + RAG ingest jobs | Python |
| `rag-service/` | FastAPI RAG (Gemini chat, Chroma/Qdrant search) | Python |
| `lambda/`, `az-functions/` | Storage-upload triggers (AWS / Azure) | Node |

**Route inventory:** `ROUTES.md` lists every route across all services with IDs (`bac*` backend, `rag*`, `fro*` frontend pages, plus triggers/crons) and the end-to-end flows. Read it before touching request flow; update it in the same change when routes or flows move.

## Where the wiring lives

- Backend: `src/app.ts` builds middleware, mounts every router, and imports the crons (side-effect imports); `src/index.ts` listens. Routes `src/routes/*.route.ts`, handlers `src/controllers/*`, Zod `src/validator/*.zod.ts`.
- Frontend: `src/App.tsx` (BrowserRouter, auth guard); `src/api/client.ts` sets axios `baseURL = VITE_BACKEND_URL` and `withCredentials`. Layering is page → hook → `services/` → `api/`; don't call axios from components.
- Media pipeline: `worker/media_worker.py`; triggers `lambda/storage-upload-trigger/index.mjs` and `az-functions/storage-upload-trigger/src/functions/storageUploadTrigger.js`.
- RAG: `rag-service/main.py` (FastAPI), `ingestion.py`, `retrieval.py`, `vectorstore.py`.
- Storage and queue are provider factories (`backend/src/storage`, `worker/messaging`, `worker/storage`, `rag-service/storage`): one file in `providers/` + one registry entry in `index`/`factory`.

## Commands

Full stack (root, Docker required). Service names are `frontend`, `backend`, `rag-service`, `media-worker`, `localstack`, `mongodb`, `redis`:
```bash
docker compose up -d --build
docker compose exec backend bun run seed.ts   # seeded password: Seeded@123
docker compose down -v                        # wipes Mongo/Redis/LocalStack
```
Seed must run inside the container so `INTERNAL_API_SECRET` matches.

Backend alone: `cd backend && bun install && bun run dev` (port `PORT`, default 3000).
Frontend alone: `cd frontend && bun install && bun run dev`.
Backend has no `build`/`lint` script; `bun x tsc --noEmit` is the typecheck and only covers `src/` (tests are excluded from `tsconfig.json`).

## Tests

Backend tests need a real Mongo replica set — NOT in-memory:
```bash
cd backend
bun run test:docker:up    # mongo:7 on localhost:27018, replSet rs0
bun run test              # vitest run
bun run test:docker:down
```
Single file: `bun x vitest run tests/integration/<name>.test.ts` (keep the test Mongo up).

- Never `bun test`; the backend uses Vitest (the `package.json` script is `vitest run`).
- `fileParallelism: false`: files must stay sequential or they collide on DB state.
- `tests/setup.ts` overrides `.env.test` and mocks Redis, BullMQ, Stripe, rate limiting, nodemailer, the storage registry, and the `syncHeatmaps`/`syncProgress` crons. Do not add real-network calls, and don't judge cron/queue behavior from tests.
- Frontend has no tests and no typecheck script: `bun run lint` is its only static check. `bun run build` does not typecheck.

## Backend conventions

- Relative imports use `.js` extensions that resolve to `.ts` files (`./foo.js`), required by `nodenext`.
- tsconfig is strict + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes`; `tests/`, `vitest.config.ts`, `seed.ts` are excluded from it.
- Auth reads JWT from the `token` cookie or `Authorization: Bearer`. `POST /users/signin` is what writes the cookie.
- `/api/v1/internal/*` uses `x-internal-secret`; **`/api/v1/internal-rag/*` is the opposite** — user-cookie auth, proxying to the Python RAG service. Don't mix them up.
- Stripe webhook is mounted with `express.raw` BEFORE `express.json`. Keep it above the body parsers or signature verification breaks.
- Auth rate limiting is skipped when `NODE_ENV=development`; don't trust local behavior for limiter changes.
- New static `/api/v1/courses/...` routes must be declared above `/:courseId` in `course.route.ts`, or Express captures them as a course ID.
- `bun run migrate:storage-key` is the one-shot `s3Key` -> `storageKey` data migration.

## Media pipeline (change atomically)

Producers return a presigned PUT: `POST /api/v1/courses/:courseId/lectures` for lecture video, `POST /api/v1/media/upload-session` for avatar/course image. The browser uploads directly to storage. The storage trigger then calls `POST /api/v1/internal/media/confirm-upload` and, for lecture video only, enqueues the job; the worker transcodes and reports via `PATCH /api/v1/internal/media/status`.

The message shape `{ storageKey, courseId, lectureId, container }` and the status flow `PENDING_UPLOAD -> UPLOADED -> PROCESSING -> READY|FAILED|EXPIRED` are duplicated in four places. Any change must land in all of them in one commit:
- `backend/` (producer + status endpoint)
- `lambda/storage-upload-trigger/index.mjs`
- `az-functions/storage-upload-trigger/src/functions/storageUploadTrigger.js`
- `worker/media_worker.py`

Both triggers skip keys containing an `hls` path segment to avoid re-triggering on worker output. Preserve that.

## LocalStack specifics

- `STORAGE_ENDPOINT` is container-internal (`http://localstack:4566`); `STORAGE_PRESIGN_ENDPOINT` is `http://localhost:4566` so the browser can upload.
- Lambda reaches the backend only via `LAMBDA_DOCKER_NETWORK=edunode` + the mounted docker socket.
- `INTERNAL_API_SECRET` must be identical in root `.env`, `backend/.env`, `worker/.env`, and both triggers, or uploads stall at `PENDING_UPLOAD`.
- Missing bucket/queue after a restart means `docker compose down -v`.

## RAG service

- `PYTHON_ENV=development` -> local Chroma (`./chroma_db`, collection `test`); anything else -> Qdrant collection `my_docs` via `QDRANT_URL`/`QDRANT_API_KEY`.
- Embeddings: development uses local Ollama (`OLLAMA_BASE_URL`, default `http://host.docker.internal:11434`; `OLLAMA_EMBEDDING_MODEL`, default `nomic-embed-text:v1.5`, 768 dims). Production uses Gemini (`GEMINI_EMBEDDING_MODEL`, default `gemini-embedding-001`, 3072 dims) with Qdrant; the collection dimension must match and changing the model requires re-indexing. Chat always uses Gemini (`model.py`).
- Ingest runs in a FastAPI BackgroundTask with **in-memory** status: `GET /ingest/{lecture_id}` returns 404 after a restart, and jobs do not survive a restart.
- `rag-service/tests/` is ad-hoc DeepEval against a local Ollama model with a missing JSON fixture. It is not runnable or wired to CI — don't use it to verify changes.

## CI / deploy

- Only backend has CI: `.github/workflows/backend-tests.yml` on PR/push touching `backend/**`, using the same test-docker scripts.
- `backend-deploy.yml` builds `backend/` on every push to `main` touching `backend/**` and pushes `amandeep1077/edunode-backend:<commit-sha>` to Docker Hub. It does not deploy and is not gated on CI. Frontend, worker, and RAG are deployed manually.
- `frontend/Dockerfile` runs the Vite dev server, not a production build.
