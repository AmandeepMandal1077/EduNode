# Route map (all services)

IDs are `3-letter service prefix + number`.

| Prefix | Service |
|---|---|
| `bac` | backend (Express API) |
| `rag` | rag-service (FastAPI) |
| `fro` | frontend pages (React Router) |
| `lam` | AWS Lambda storage trigger |
| `azf` | Azure Function storage trigger |
| `sto` | object storage (presigned upload) |
| `wor` | media worker (queue consumer) |
| `bkc` | backend scheduled jobs |

Legend: `U` = human/browser action. `JWT` = needs the cookie written by `bac3`. `secret` = `x-internal-secret` header. "owner" = the instructor who created the course.

## Backend — `bac`

| ID | Route | What it does / flow | Auth | Called when | Caller |
|---|---|---|---|---|---|
| `bac1` | GET `/health` | DB status + uptime/memory/version | pub | ops checks | ops, tests, U direct |
| `bac2` | POST `/api/v1/users/signup` | Creates user (`student`/`instructor` from body) | pub, rate-limited | register form submit | U via `fro3` |
| `bac3` | POST `/api/v1/users/signin` | Verifies password, sets httpOnly `token` cookie | pub, rate-limited | login form submit | U via `fro2` |
| `bac4` | POST `/api/v1/users/signout` | Clears token cookie | pub | navbar sign-out | U |
| `bac5` | GET `/api/v1/users/profile` | Returns current user | JWT | **every app boot** (`checkAuthThunk`); silent 401 = guest | U via any page |
| `bac6` | PATCH `/api/v1/users/profile` | Updates name/bio (avatar handled by `bac36`→`bac52`) | JWT | profile general tab save | U via `fro12` |
| `bac7` | PATCH `/api/v1/users/change-password` | Sets new password | JWT | profile security tab | U via `fro12` |
| `bac8` | POST `/api/v1/users/forgot-password` | Always 200; if user exists makes reset token and queues BullMQ `forgot-password` → nodemailer → SMTP | pub, rate-limited | "forgot password" modal | U via `fro2` |
| `bac9` | POST `/api/v1/users/reset-password` | Validates email+token+expiry, sets new password | pub, rate-limited | reset page from email link | U via `fro4` |
| `bac10` | DELETE `/api/v1/users/account` | Deletes user, clears cookie | JWT | profile security "delete account" | U via `fro12` |
| `bac11` | POST `/api/v1/payments/webhook` | Stripe `checkout.session.completed`/`async_payment_succeeded`: transaction validates amount/currency/paid/user/course/payment_intent vs the PENDING purchase; mismatch → FAILED; else enroll + create per-lecture `CourseProgress` + COMPLETED. `async_payment_failed`/`expired` → FAILED | Stripe signature (raw body) | when Stripe finishes payment (async, may land before or after `bac13`) | Stripe only |
| `bac12` | POST `/api/v1/payments/create-checkout-session` | Creates/reuses PENDING purchase, opens Stripe session (inr, `success_url=/success?session_id=`, `cancel_url=/cancel`, metadata order/user/course) | JWT | course page "Buy" | U via `fro6` |
| `bac13` | POST `/api/v1/payments/checkout/verify` | Fetches Stripe session, checks `metadata.userId`, checks amount, idempotently enrolls + creates progress | JWT | `/success` page on Stripe return | U via `fro7` |
| `bac14` | GET `/api/v1/payments/course/:courseId/detail-with-status` | `isPurchased` / `isCompleted` | JWT | course page decides Buy / Enroll / Continue | U via `fro6` |
| `bac15` | GET `/api/v1/payments` | Purchase history (populated course) | JWT | profile billing tab | U via `fro12` |
| `bac16` | GET `/api/v1/payments/my-enrollments` | COMPLETED purchases + populated course + progress → enrollments[] | JWT | dashboard / my-courses / continue-watching | U via `fro9`,`fro10` |
| `bac17` | POST `/api/v1/payments/enroll-free` | Requires `price===0` & published; transaction: COMPLETED purchase(0, free) + enrolledStudents + `CourseProgress` | JWT | course page when free | U via `fro6` |
| `bac18` | GET `/api/v1/courses/published` | Published courses (instructor name/bio/avatar), Redis cache-first | pub | landing / explore | U via `fro1`,`fro5` |
| `bac19` | GET `/api/v1/courses/search` | Mongo `$text` over published, limit 50 (`searchString`; `category` ignored) | pub | explore search box | U via `fro5` |
| `bac20` | GET `/api/v1/courses/categories` | Distinct published categories | pub | explore filter load | U via `fro5` |
| `bac21` | GET `/api/v1/courses` | Courses where `instructor = user` | JWT | instructor course list | U via `fro13` |
| `bac22` | GET `/api/v1/courses/purchased` | COMPLETED purchases populated course | JWT | **no UI caller** (`fetchPurchasedCoursesNew` unused) | direct API only |
| `bac23` | GET `/api/v1/courses/my-announcements` | Announcements across purchased courses, newest first | JWT | dashboard announcements | U via `fro9` |
| `bac24` | GET `/api/v1/courses/:courseId` | Published → public detail; otherwise falls through to JWT + owner-only (drafts) | pub / JWT+owner | course page, learning room, instructor manage | U via `fro6`,`fro11`,`fro15` |
| `bac25` | GET `/api/v1/courses/:courseId/lectures` | Published path: lectures filtered to READY; draft path: owner only | pub / JWT+owner | course page + learning room (only READY playable) | U via `fro6`,`fro11`,`fro15` |
| `bac26` | POST `/api/v1/courses` | Creates draft course (slug from title), instructor=user, clears published cache | JWT | create-course form | U via `fro14` |
| `bac27` | PATCH `/api/v1/courses/:courseId` | Partial update incl. `isPublished`, clears published cache | JWT + owner | manage → details tab / publish toggle | U via `fro15` |
| `bac28` | POST `/api/v1/courses/:courseId/announce` | Transaction: Announcement + push to course; post-save hook → BullMQ announcement → email queue → SMTP to enrolled students | JWT + owner | manage → announcements tab | U via `fro15` |
| `bac29` | GET `/api/v1/courses/:courseId/announcements` | Course announcements, newest first | JWT only (no enrollment check) | learning room announcements tab / instructor manage | U via `fro11`,`fro15` |
| `bac30` | POST `/api/v1/courses/:courseId/rate` | Sets rating if user is in `enrolledStudents`, clears published cache | JWT + enrollment | enrolled student on course page | U via `fro6` |
| `bac31` | GET `/api/v1/courses/:courseId/lectures/processing` | Lectures in PENDING_UPLOAD/UPLOADED/PROCESSING | JWT + owner | curriculum tab polling during uploads | U via `fro15` |
| `bac32` | POST `/api/v1/courses/:courseId/lectures` | Makes lecture `PENDING_UPLOAD` + storageKey `root/courses/{courseId}/lectures/{tempId}/{ts}_{fileName}`, returns presigned PUT + session id | JWT + owner | curriculum tab "add lecture" | U via `fro15` |
| `bac33` | GET `/api/v1/lecture/:lectureId` | Lecture if READY (or no status), **no enrollment/ownership check** | JWT | not called by UI (tests only) | direct API |
| `bac34` | DELETE `/api/v1/lecture/:lectureId` | Removes id from course, decrements totalLectures, deletes lecture | JWT + owner | curriculum tab delete | U via `fro15` |
| `bac35` | GET `/api/v1/lecture/:lectureId/comments` | Comments + user's liked/disliked ids | JWT + enrollment | comments panel load | U via `fro11` |
| `bac36` | POST `/api/v1/media/upload-session` | `avatar` or `course-image` only; creates MediaUpload PENDING_UPLOAD + presigned PUT (15 min) | JWT | avatar / course thumbnail upload start | U via `fro12`,`fro14`,`fro15` |
| `bac37` | GET `/api/v1/media/status/:uploadSessionId` | MediaUpload status/finalUrl, fallback Lecture uploadStatus/videoUrl | JWT | polling right after `sto1` upload | U via `fro12`,`fro15` |
| `bac38` | POST `/api/v1/sendEmail` | Sends announcement email synchronously | **none** | no production caller (tests only) | anyone (risk) |
| `bac39` | POST `/api/v1/playback/sync` | Writes progress + heatmap deltas to Redis (complete at ≥95%) | JWT | player every ~1% segment, on seek, on unmount | U via `fro11` |
| `bac40` | GET `/api/v1/playback/sync` | Resume position, Redis-first then `CourseProgress` | JWT | player mount | U via `fro11` |
| `bac41` | GET `/api/v1/playback/heatmap/:lectureId` | Aggregated heatmap segments, **no ownership check** | JWT | `LectureHeatmap` inside `VideoPlayer` | U via `fro11` |
| `bac42` | GET `/api/v1/progress/:courseId` | `CourseProgress` for user+course | JWT | learning room / dashboard load | U via `fro11` |
| `bac43` | PATCH `/api/v1/progress/:courseId/lectures/:lectureId` | Sets completed/position/lastWatched on existing row | JWT | lecture hits 95% or manual toggle | U via `fro11` |
| `bac44` | PATCH `/api/v1/progress/:courseId/complete` | Course 100% complete | JWT | last lecture completed (courseSlice) | U via `fro11` |
| `bac45` | PATCH `/api/v1/progress/:courseId/reset` | Clears progress | JWT | **helper unused by UI** | direct API |
| `bac46` | POST `/api/v1/comment` | New comment/reply, bumps parent `replyCount` | JWT + enrollment | comment box submit | U via `fro11` |
| `bac47` | POST `/api/v1/comment/like` | Like toggle | JWT + enrollment | like button | U via `fro11` |
| `bac48` | POST `/api/v1/comment/dislike` | Dislike toggle | JWT + enrollment | dislike button | U via `fro11` |
| `bac49` | DELETE `/api/v1/comment` | Soft delete (author only) | JWT + enrollment | own comment delete | U via `fro11` |
| `bac50` | POST `/api/v1/internal-rag/chat` | Proxies question to `rag5`, saves user+assistant `ChatMessage`, invalidates chat cache | JWT (no enrollment check) | AI chat send | U via `fro11`, then → `rag5` |
| `bac51` | GET `/api/v1/internal-rag/chat-history/:courseId/:lectureId` | Chat history, Redis-first then Mongo | JWT | AI chat opened | U via `fro11` |
| `bac52` | POST `/api/v1/internal/media/confirm-upload` | Lecture PENDING→UPLOADED, or MediaUpload PENDING→UPLOADED + finalUrl and auto-sets `avatarUrl`/`thumbnail` | secret | trigger fires after object lands in bucket | `lam1`, `azf1` only |
| `bac53` | PATCH `/api/v1/internal/media/status` | Sets PROCESSING/READY/FAILED (+videoUrl, duration, error) | secret | worker progress reports | `wor1` only |

## RAG service — `rag`

| ID | Route | What it does | Auth | Called when | Caller |
|---|---|---|---|---|---|
| `rag1` | GET `/health` | Liveness | pub | ops | ops, U direct |
| `rag2` | POST `/ingest` | 202; background: download video via storage → faster-whisper transcript → chunk 1000/200 → embed into Chroma (dev/Ollama) or Qdrant (prod/Gemini) with `course_id`,`lecture_id` | pub (network-internal) | lecture raw upload done | `wor1` only |
| `rag3` | GET `/ingest/{lecture_id}` | In-memory ingest status or 404 | pub | worker polls up to 60×10 s | `wor1` only |
| `rag4` | DELETE `/ingest/{lecture_id}` | Mark failed, delete vectors, remove temp files | pub | worker cleanup on RAG failure | `wor1` only |
| `rag5` | POST `/chat/{course_id}/{lecture_id}` | Similarity k=5 filtered by course+lecture → Gemini structured answer | pub (network-internal) | student asks a question | `bac50` only |

## Frontend pages — `fro` (user navigates here)

| ID | Path | What it triggers |
|---|---|---|
| `fro1` | `/` | `bac18` via landing course sections |
| `fro2` | `/login` | `bac3`; `bac8` via forgot modal; redirect-after-login |
| `fro3` | `/register` | `bac2` |
| `fro4` | `/reset-password` | `bac9` (token+email from email link) |
| `fro5` | `/explore` | `bac18`, `bac20`, `bac19` on search |
| `fro6` | `/course/:id` | `bac24`, `bac25`, and if logged in `bac14`, `bac30`; then `bac12`/`bac17` |
| `fro7` | `/success` | `bac13` (guarded) |
| `fro8` | `/cancel` | page only, no API (guarded) |
| `fro9` | `/dashboard` | `bac16`, `bac23` |
| `fro10` | `/my-courses` | `bac16` |
| `fro11` | `/learn/:courseId/lecture/:lectureId` | `bac24`, `bac25`, `bac29`, `bac35`, `bac40`, `bac41`, `bac39`, `bac42`, `bac43`/`bac44`, `bac46`–`bac49`, `bac51`/`bac50` (guarded) |
| `fro12` | `/profile` | `bac5`, `bac6`, `bac7`, `bac10`, `bac15`, `bac36` (avatar), `bac37` |
| `fro13` | `/instructor/courses` | `bac21` |
| `fro14` | `/instructor/courses/create` | `bac26`, optional `bac36` (thumbnail), `bac37` |
| `fro15` | `/instructor/courses/:courseId/manage` | `bac24`, `bac25`, `bac31`, `bac27`, `bac32`, `bac34`, `bac28`, `bac29`, `bac36` |

## Non-HTTP entry points (needed to read the flows)

| ID | Entry | What it does |
|---|---|---|
| `sto1` | `PUT <presignedUrl>` → S3/LocalStack/Azure Blob | Browser uploads the file directly. Only this makes a trigger fire. |
| `lam1` | S3 `ObjectCreated` (Lambda) | Skips keys containing an `hls` segment; calls `bac52`; if key is `root/courses/{course}/{lecture}/...` enqueues job |
| `azf1` | Azure `BlobCreated` (Function) | Same behaviour for Azure, 60 s timeout |
| `wor1` | Queue message `{storageKey,courseId,lectureId,container}` | Worker: `bac53` PROCESSING → download → FFmpeg HLS 144p/240p + `rag2` in parallel → upload HLS → delete raw → `bac53` READY (or FAILED) |
| `bkc1` | cron `expireUploads`, 5 min | PENDING_UPLOAD past expiry → EXPIRED, deletes storage object |
| `bkc2` | cron `syncProgress`, 5 min | Flushes Redis progress keys from `bac39` into `CourseProgress` |
| `bkc3` | cron `syncHeatmaps`, 5 min | Flushes Redis heatmap deltas from `bac39` into `LectureHeatmap` |

---

# Flows

**Global rule:** every authenticated route listed below needs the cookie written by `bac3`. `bac5` runs on every page load and its 401 is swallowed, so anonymous browsing still shows the public pages.

**F1 — Any page load (auth bootstrap)**
`U → fro* → bac5` → (200: user in store) OR (401: treated as guest). On a non-public page, a 401 triggers client-side logout.

**F2 — Register → login → dashboard**
`U → fro3 → bac2 → fro2 → bac3 → [cookie] → bac5 → fro9 → bac16 (+bac23)`

**F3 — Logout**
`U → (navbar) → bac4 → fro1`

**F4 — Forgot / reset password** (the only flow that leaves and re-enters the app)
`U → fro2 → bac8 → [BullMQ forgot-password → SMTP email] → U clicks link → fro4 → bac9 → fro2 → bac3`

**F5 — Change password / delete account**
`U → bac3 → fro12 → bac7`
`U → bac3 → fro12 → bac10 → (cookie cleared) → fro1`

**F6 — Public browsing (no login required)**
`U → fro1 → bac18`
`U → fro5 → bac18 + bac20 → bac19` (search submit)
`U → fro5/fro1 → fro6 → bac24 → bac25` (published branch only; READY lectures only)

**F7 — Course page with a session** (prerequisite: `bac3`, else the page stays in guest mode)
`U → bac5 → fro6 → bac24 + bac25 + bac14` → `bac14` decides the button: Buy / Enroll / Continue.

**F8 — Free enrollment**
`U → fro6 → bac14 (not purchased) → bac17` → enrollment + `CourseProgress` created by `bac17` → `U → fro9/fro10 → bac16` or `U → fro11`.

**F9 — Paid enrollment** (two independent completion paths; order is not guaranteed)
1. `U → fro6 → bac14 → bac12 →` Stripe hosted checkout (external)
2. Payment finishes → Stripe → `bac11` (webhook, async) — validates PENDING purchase, enrolls, creates progress.
3. Browser returns → `U → fro7 → bac13` — verifies session, enrolls idempotently.
4. `U → fro9 → bac16` or `U → fro11`.

**F10 — Abandoned checkout**
Stripe cancel URL → `U → fro8` (no backend call). The PENDING purchase from `bac12` stays PENDING; `bac11` may later mark it FAILED/expired.

**F11 — Watching a lecture** (prerequisites: `bac3`, enrollment from `bac17`/`bac11`/`bac13`, lecture READY from ≥`bac32`+`sto1`+`lam1|azf1`+`wor1`)
`U → fro11 → bac24 → bac25 → bac42 → bac29 → bac35 → bac40 → bac41`
then, while playing: `bac39` (each ~1% segment, on seek, on unmount) → `bkc2`/`bkc3` persist it.
At ≥95%: `bac39` (sets complete) and `bac43`; when every lecture is done: `bac44`.
`bac45` exists but no UI calls it.

**F12 — Comments / Q&A**
`U → fro11 → bac35` → `U → bac46` (post/reply) → `bac35` reload; `bac47`/`bac48` toggles; `bac49` soft delete.

**F13 — AI chat**
`U → fro11 (AI FAB open) → bac51` (Redis/Mongo history)
`U → bac50 → rag5 → (Chroma/Qdrant k=5 + Gemini) →` answer back to `bac50`, saved as `ChatMessage`, cache cleared → next open uses `bac51`.

**F14 — Rating a course**
`U → bac3 → enrollment (bac17/bac11/bac13) → fro6 → bac30` → published cache invalidated.

**F15 — Instructor creates a course**
`U → bac3 → fro13 → bac21` → `U → fro14 → bac26` (draft, cached listing cleared)
Optional thumbnail: `bac36 (course-image) → sto1 → lam1|azf1 → bac52` (sets `thumbnail`) → `bac37` polls until UPLOADED.

**F16 — Instructor publishes + adds lectures** (the full media pipeline)
`U → fro15 → bac24 (draft owner branch) + bac25 + bac31`
Edit/publish: `bac27` (sets `isPublished` → appears in `bac18`)
Add lecture: `bac32` (PENDING_UPLOAD + presigned URL)
→ `U` uploads → `sto1`
→ `lam1` or `azf1` (object created, non-`hls` key) → `bac52` (UPLOADED)
→ `wor1` (queue message) → `bac53` PROCESSING
→ worker downloads from storage → `rag2` (parallel) → `rag3` polled; on RAG failure `rag4` then continue
→ worker FFmpeg HLS → upload to storage under `.../hls/`
→ `bac53` READY (videoUrl + duration) or FAILED
→ UI sees READY via `bac31` (curriculum poll) or `bac37`.
Delete: `bac34` (decrements totalLectures).
Failure/expiry: if `sto1` never happens, `bkc1` marks EXPIRED and deletes the object.

**F17 — Avatar upload**
`U → bac3 → fro12 → bac36 (type=avatar) → sto1 → lam1|azf1 → bac52` (sets `avatarUrl`) → `bac37` poll. `bac6` only handles name/bio.

**F18 — Announcements**
`U (instructor) → bac3 + owner → fro15 → bac28` → Announcement row + BullMQ announcement → email queue worker → SMTP.
Recipients: `U (student) → bac3 → fro9 → bac23` or `fro11 → bac29`.

**F19 — Media expiry sweep** (no user)
`bkc1` → PENDING_UPLOAD rows past `presignedUrlExpiresAt` → EXPIRED + storage delete.

**F20 — Ops / direct hits**
`bac1`, `rag1`: anyone. `bac52`/`bac53`: impossible without `x-internal-secret` (401). `bac11`: needs a valid Stripe signature (400 otherwise). Every `bac*` marked JWT can be hit with curl if the caller has the cookie or Bearer token.

---

## Gating summary (what must come first)

| To reach | You first need |
|---|---|
| any JWT route | `bac3` (cookie) |
| `bac26`–`bac28`, `bac31`, `bac32`, `bac34` | JWT + role `instructor` + course ownership |
| `bac25` READY lectures, playable video | `bac32` → `sto1` → `lam1`/`azf1` → `bac52` → `wor1` → `bac53 READY` |
| `bac30`, `bac35`, `bac46`–`bac49`, working `bac42`–`bac44` | enrollment from `bac17` / `bac11` / `bac13` |
| `bac11` to succeed | PENDING purchase created by `bac12` |
| `bac50` answers | `rag2` completed for that lecture (`rag3` = completed) |
| `bac39`/`bac40` persisted data | `bkc2`/`bkc3` flush (5 min), or `bac42`/`bac43` direct reads |

## Known risks

- `bac38` sends email with **no auth and no caller** — dead but reachable.
- `bac33`, `bac41`, `bac50`, `bac51` have **no enrollment/ownership checks**; any logged-in user with IDs can read lecture metadata, heatmaps, and chat.
- `bac29` lets any logged-in user read any course's announcements.
- Orphans: `bac22`, `bac33` (tests only), `bac38` (tests only), `bac45`, frontend `fetchPurchasedCoursesNew`.
- `bac19` accepts `category` but ignores it, so explore filters client-side after a text search.
