# EduNode — Frontend

The React single-page application for EduNode. Provides the student and instructor experience — from landing page and course catalog to video playback with heatmap visualization, threaded Q&A, Stripe checkout, and AI-powered lecture chat.

---

## Key Features

- **Landing Page** — Animated hero, feature highlights, testimonials, and stats powered by Framer Motion
- **Course Catalog** — Search, filter, and explore published courses with rich course cards
- **Course Detail Page** — Curriculum preview, instructor info, pricing, and enroll-via-Stripe
- **Learning Room** — Full-screen lecture player with resume-from-position, sidebar curriculum, and tabbed panels
- **Video Heatmaps** — Per-lecture visual engagement heatmap rendered from aggregated telemetry
- **Threaded Q&A** — Nested comment trees with like/dislike on each lecture
- **AI Chat FAB** — Floating action button for AI-powered Q&A about the current lecture
- **Instructor Dashboard** — Create courses, manage curriculum, upload videos via S3 presigned URLs, publish courses
- **Profile Management** — Edit account details, change password, security settings
- **Auth Flow** — Login, register, forgot/reset password with form validation
- **Stripe Checkout** — Success and cancel pages with purchase verification
- **Smooth Scrolling** — Lenis-powered smooth scroll throughout the app
- **Responsive Design** — Tailwind CSS utility-first styling with mobile-friendly layouts

---

## Tech Stack

| Component      | Technology                                                    |
|----------------|---------------------------------------------------------------|
| **Framework**  | [React 19](https://react.dev/) with TypeScript                |
| **Build Tool** | [Vite 8](https://vite.dev/)                                   |
| **Styling**    | [TailwindCSS 4](https://tailwindcss.com/) + custom CSS       |
| **UI Library** | [Radix UI](https://radix-ui.com/) + [shadcn/ui](https://ui.shadcn.com/) |
| **Animation**  | [Motion](https://motion.dev/) (Framer Motion)                |
| **Scrolling**  | [Lenis](https://lenis.darkroom.engineering/) smooth scroll   |
| **State**      | [Redux Toolkit](https://redux-toolkit.js.org/) + React Redux |
| **Routing**    | [React Router v7](https://reactrouter.com/)                  |
| **HTTP**       | [Axios](https://axios-http.com/) with auth interceptors      |
| **Icons**      | [Lucide React](https://lucide.dev/)                          |
| **Font**       | [Geist](https://vercel.com/font) via Fontsource              |
| **Media**      | S3 Presigned Uploads (client-side)                           |

---

## Folder Structure

```
frontend/
├── docker-compose.frontend.yml   # Frontend Docker Compose configuration
├── Dockerfile                    # Container image definition
├── index.html                    # HTML entrypoint
├── package.json                  # Dependencies & scripts
├── vite.config.ts                # Vite configuration
├── components.json               # shadcn/ui configuration
├── .env                          # Environment variables (gitignored)
│
└── src/
    ├── main.tsx                  # React DOM mount + Redux Provider
    ├── App.tsx                   # Router setup & AuthGuard
    ├── App.css                   # Global app styles
    ├── index.css                 # Tailwind directives & CSS variables
    │
    ├── assets/                   # Static assets like images and icons
    │
    ├── pages/                    # Route-level page components
    │   ├── LandingPage.tsx
    │   ├── LoginPage.tsx
    │   ├── RegisterPage.tsx
    │   ├── ResetPasswordPage.tsx
    │   ├── ExplorePage.tsx
    │   ├── CourseDetailPage.tsx
    │   ├── DashboardPage.tsx
    │   ├── MyCoursesPage.tsx
    │   ├── LearningRoomPage.tsx
    │   ├── ProfilePage.tsx
    │   ├── InstructorCoursesPage.tsx
    │   ├── CreateCoursePage.tsx
    │   ├── InstructorCourseManagePage.tsx
    │   ├── SuccessPage.tsx
    │   └── CancelPage.tsx
    │
    ├── components/               # Feature-organized UI components
    │   ├── landing/              # Hero, features, testimonials, stats, footer CTA
    │   ├── auth/                 # Login & register forms
    │   ├── explore/              # Course search & catalog grid
    │   ├── course-details/       # Course hero, curriculum preview
    │   ├── dashboard/            # Dashboard widgets, announcements
    │   ├── learning-room/        # Video section, sidebar, comments, announcements
    │   ├── instructor/           # Course creation/management tabs
    │   ├── profile/              # Profile edit, security tabs
    │   ├── checkout/             # Success/cancel screens
    │   ├── layout/               # App layout, navbar, footer
    │   ├── ui/                   # shadcn/ui primitives (Button, Card, Input, etc.)
    │   ├── shadix-ui/            # Extended UI components
    │   ├── smooth-scroll-area/   # Lenis scroll wrapper
    │   ├── AIChatFAB.tsx         # Floating AI chat button
    │   ├── CourseCard.tsx         # Reusable course card component
    │   ├── VideoPlayer.tsx        # Video player with telemetry
    │   ├── LectureHeatmap.tsx     # Heatmap visualization
    │   └── CircularProgress.tsx   # Circular progress indicator
    │
    ├── api/                      # Axios API client layer
    │   ├── client.ts             # Base Axios instance with interceptors
    │   ├── userApi.ts            # Auth & user endpoints
    │   ├── courseApi.ts           # Course & lecture endpoints
    │   ├── commentApi.ts         # Comment CRUD endpoints
    │   ├── purchaseApi.ts        # Payment & purchase endpoints
    │   ├── progressApi.ts        # Progress & heatmap endpoints
    │   ├── ragApi.ts             # RAG AI lecture chat endpoints
    │   └── mediaApi.ts           # Upload signature endpoint
    │
    ├── services/                 # Business logic between hooks & API
    │   ├── authService.ts        # Login, register, logout logic
    │   ├── courseService.ts       # Course data transformations
    │   ├── commentService.ts     # Comment tree management
    │   ├── mediaService.ts       # S3 upload logic
    │   ├── userService.ts        # Profile update logic
    │   └── debounceService.ts    # Debounce utility
    │
    ├── hooks/                    # Custom React hooks (one per page/feature)
    │   ├── useAuth.ts
    │   ├── useLogin.ts
    │   ├── useRegister.ts
    │   ├── useDashboard.ts
    │   ├── useExplore.ts
    │   ├── useCourseDetails.ts
    │   ├── useLearningRoom.ts
    │   ├── useComments.ts
    │   ├── useVideoTelemetry.ts
    │   ├── useCreateCourse.ts
    │   ├── useInstructorCourses.ts
    │   ├── useInstructorCourseManage.ts
    │   ├── useProfile.ts
    │   ├── useSuccess.ts
    │   ├── useCancel.ts
    │   └── useDebounce.ts
    │
    ├── store/                    # Redux Toolkit state
    │   ├── index.ts              # Store configuration
    │   ├── authSlice.ts          # Auth state (user, tokens, init)
    │   ├── chatSlice.ts          # Chat state for AI Q&A
    │   └── courseSlice.ts        # Course catalog state
    │
    ├── constants/                # App-wide constants (e.g. auth routes)
    ├── lib/                      # Third-party configuration and utility libraries (e.g. cn helper)
    ├── types/                    # Shared TypeScript interfaces
    └── utils/                    # Helper utilities
```
```

---

## Prerequisites

- **[Bun](https://bun.sh/)** (v1.0+) or **[Node.js](https://nodejs.org/)** (v18+)
- The **backend server** running (see [backend README](../backend/README.md))


---

## Getting Started

### 1. Install dependencies
```bash
cd frontend
bun install
```

### 2. Configure environment variables
Create a `.env` file in the `frontend/` directory:

```env
VITE_BACKEND_URL=http://localhost:3000/api/v1
```

### 3. Start the development server
```bash
bun run dev
```
The app will be available at **http://localhost:5173**.

---

## Available Scripts

| Script           | Command             | Description                        |
|------------------|---------------------|------------------------------------|
| **dev**          | `bun run dev`       | Start Vite dev server with HMR     |
| **build**        | `bun run build`     | Type-check + production build      |
| **preview**      | `bun run preview`   | Preview the production build       |
| **lint**         | `bun run lint`      | Run ESLint checks                  |

---

## Application Routes

| Path                                      | Auth | Component                    | Description               |
|-------------------------------------------|------|------------------------------|---------------------------|
| `/`                                       | ✗    | LandingPage                  | Marketing landing page    |
| `/login`                                  | ✗    | LoginPage                    | User login                |
| `/register`                               | ✗    | RegisterPage                 | User registration         |
| `/reset-password`                         | ✗    | ResetPasswordPage            | Password reset            |
| `/explore`                                | ✗    | ExplorePage                  | Browse course catalog     |
| `/course/:id`                             | ✗    | CourseDetailPage             | Course details & enroll   |
| `/dashboard`                              | ✓    | DashboardPage                | Student dashboard         |
| `/my-courses`                             | ✓    | MyCoursesPage                | Purchased courses         |
| `/learn/:courseId/lecture/:lectureId`      | ✓    | LearningRoomPage             | Video player & Q&A        |
| `/profile`                                | ✓    | ProfilePage                  | Account settings          |
| `/instructor/courses`                     | ✓    | InstructorCoursesPage        | Instructor course list    |
| `/instructor/courses/create`              | ✓    | CreateCoursePage             | Create new course         |
| `/instructor/courses/:courseId/manage`     | ✓    | InstructorCourseManagePage   | Edit course & curriculum  |
| `/success`                                | ✓    | SuccessPage                  | Post-payment success      |
| `/cancel`                                 | ✓    | CancelPage                   | Payment cancelled         |

---

## Docker

Build and run the frontend as a container:

```bash
docker build -t edunode-frontend .
docker run -p 5173:5173 edunode-frontend
```

Alternatively, you can run it using Docker Compose:

```bash
docker compose -f docker-compose.frontend.yml up
```

Or run all services (including backend and database) from the workspace root (see the [workspace README](../README.md)).

---

## License

This project is for educational purposes.
