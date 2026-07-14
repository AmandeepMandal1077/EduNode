/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                    GENESIS PROMPT (AI-Generated File)                   ║
 * ║      The following is the exact instruction that produced this file.    ║
 * ╠══════════════════════════════════════════════════════════════════════════╣
 * ║                                                                         ║
 * ║  "You are an expert backend developer. Your task is to write a          ║
 * ║   high-volume database seeding script named `seed.ts` inside the        ║
 * ║   `backend/` directory.                                                 ║
 * ║                                                                         ║
 * ║   Please follow these exact requirements:                               ║
 * ║                                                                         ║
 * ║   1. Schema Analysis: First, analyze the schema definitions inside      ║
 * ║      the `backend/models/` directory. Understand the fields, data       ║
 * ║      types, and the relational connectivity (foreign keys, references,  ║
 * ║      one-to-many, etc.) between the different models.                   ║
 * ║                                                                         ║
 * ║   2. Massive Data Generation: Write the script to generate and insert   ║
 * ║      a *massive* amount of realistic mock data. Use loops and a mock    ║
 * ║      data library (like `@faker-js/faker`) to bulk-insert hundreds or   ║
 * ║      thousands of records per model.                                    ║
 * ║                                                                         ║
 * ║   3. Relational Integrity: Structure the insertion logic sequentially   ║
 * ║      to maintain database constraints. Always seed independent/parent   ║
 * ║      schemas first, store their resulting IDs, and map those IDs to     ║
 * ║      the dependent/child schemas.                                       ║
 * ║                                                                         ║
 * ║   4. Scope: Focus strictly on filling the primary database. Ignore      ║
 * ║      Redis entirely — do not write any caching logic.                   ║
 * ║                                                                         ║
 * ║   5. Use `bun` as the runtime. The script must be executable directly   ║
 * ║      via `bun run seed.ts` from the backend directory."                 ║
 * ║                                                                         ║
 * ╠══════════════════════════════════════════════════════════════════════════╣
 * ║                    AI REASONING & DESIGN DECISIONS                      ║
 * ╠══════════════════════════════════════════════════════════════════════════╣
 * ║                                                                         ║
 * ║  After analyzing all 8 schemas in `backend/src/models/`, three non-     ║
 * ║  obvious constraints shaped the final architecture of this script:      ║
 * ║                                                                         ║
 * ║  • ZERO model imports — Importing `announcement.model.ts` transitively  ║
 * ║    loads `announcement.queue.ts` which instantiates a BullMQ/ioredis   ║
 * ║    client at module-load time, crashing the script when Redis is down.  ║
 * ║    Solution: all inserts go through raw `mongoose.connection.db`        ║
 * ║    collection calls, bypassing Mongoose entirely.                       ║
 * ║                                                                         ║
 * ║  • Password field — `user.model.ts` declares `password` with           ║
 * ║    `maxLength: 20` AND a `pre("save")` bcrypt hook. Using              ║
 * ║    `Model.insertMany()` would still validate, rejecting any bcrypt      ║
 * ║    hash (60 chars). Raw collection insert skips both validation and     ║
 * ║    the hook. One shared hash is pre-computed once for all 60 users.    ║
 * ║                                                                         ║
 * ║  • Slug uniqueness — `courses` has a unique index on `slug`, and        ║
 * ║    `lectures` has a compound unique index on `(courseId, slug)`.        ║
 * ║    A collision-resistant suffix loop (`title-1`, `title-2`, …) is      ║
 * ║    used during generation to guarantee zero duplicate key errors.       ║
 * ║                                                                         ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * EduNode LMS — High-Volume Database Seeding Script
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * HOW TO RUN:
 *   1. Start MongoDB  →  mongod
 *   2. bun run seed.ts
 *
 * REQUIREMENTS:
 *   @faker-js/faker   (bun add @faker-js/faker — already installed)
 *   MONGO_URI         set in backend/.env
 *
 * SEEDING ORDER (parent → child):
 *   1. users            — 10 instructors + 50 students
 *   2. courses          — 30 published (3 per instructor)
 *   3. lectures         — 8–15 per course  (~330 total)
 *   4. announcements    — 1–3 per course   (~60 total)
 *   5. coursepurchases  — ~220 records
 *   6. courseprogresses — 1 per enrollment
 *   7. comments         — 3–10 per lecture + 15% reply threads
 *   8. lectureheatmaps  — 12 segments per lecture (drop-off curve)
 *
 * LOGIN CREDENTIALS FOR ALL SEEDED USERS:
 *   Password: Seeded@123
 * 
 * Test Videos URLs:
 * http://localhost:4566/edunode-local/test-video-1.mp4
 * http://localhost:4566/edunode-local/test-video-2.mp4
 * http://localhost:4566/edunode-local/test-video-3.mp4
 * 
 */

import mongoose, { type Types } from "mongoose";
import bcrypt from "bcryptjs";
import { faker } from "@faker-js/faker";
import dotenv from "dotenv";

dotenv.config();

// ─── Inline enum values (avoids importing models / triggering Redis) ──────────
const Role = { STUDENT: "student", INSTRUCTOR: "instructor" } as const;
const CourseLevel = { BEGINNER: "beginner", INTERMEDIATE: "intermediate", ADVANCE: "advance" } as const;
const PaymentStatus = { COMPLETED: "completed", REFUNDED: "refunded" } as const;

type CourseLevelVal = typeof CourseLevel[keyof typeof CourseLevel];
type PaymentStatusVal = typeof PaymentStatus[keyof typeof PaymentStatus];

// ─── Config ───────────────────────────────────────────────────────────────────
const CFG = {
  NUM_INSTRUCTORS: 10,
  NUM_STUDENTS: 50,
  COURSES_PER_INSTR: 3,
  MIN_LECTURES: 8,
  MAX_LECTURES: 15,
  ANN_MIN: 1,
  ANN_MAX: 3,
  ENROLL_MIN: 2,
  ENROLL_MAX: 8,
  COMMENTS_MIN: 3,
  COMMENTS_MAX: 10,
  HEATMAP_SEGMENTS: 100,
};

// ─── Utilities ────────────────────────────────────────────────────────────────
const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const shuffle = <T>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);
const sample = <T>(arr: T[], n: number): T[] => shuffle(arr).slice(0, Math.min(n, arr.length));
const pickOne = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const toSlug = (text: string, suffix?: string | number): string => {
  const base = text.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").slice(0, 40);
  return suffix !== undefined ? `${base}-${suffix}` : base;
};

// ─── Domain data ──────────────────────────────────────────────────────────────
const CATEGORIES = [
  "Web Development", "Data Science", "Machine Learning",
  "Mobile Development", "DevOps & Cloud", "Cybersecurity",
  "UI/UX Design", "Blockchain", "Game Development", "Database Design",
];

const COURSE_TITLES: Record<string, string[]> = {
  "Web Development": ["React 19 from Zero to Hero", "Next.js 14 Full-Stack Mastery", "Node.js Microservices in Production", "Modern TypeScript for Enterprise", "GraphQL API Design Patterns", "Vue 3 Composition API Deep Dive", "Svelte and SvelteKit Complete Guide", "HTMX and Hypermedia Patterns"],
  "Data Science": ["Python for Data Analysis", "Pandas and NumPy Mastery", "Data Visualization with Matplotlib", "Statistics for Data Scientists", "SQL Advanced Analytics", "Apache Spark for Big Data", "Excel to Python Migration", "Exploratory Data Analysis Bootcamp"],
  "Machine Learning": ["Deep Learning with TensorFlow 2", "Scikit-Learn Complete Guide", "PyTorch Neural Networks from Scratch", "NLP Mastery", "Computer Vision with OpenCV", "Reinforcement Learning Fundamentals", "MLOps Models to Production", "Transformers and LLM Fine-tuning"],
  "Mobile Development": ["Flutter 3 Cross-Platform Apps", "React Native for Production", "SwiftUI Complete Masterclass", "Jetpack Compose for Android", "Expo SDK Zero to App Store", "Kotlin Multiplatform Mobile", "iOS Architecture Patterns", "Android Jetpack Fundamentals"],
  "DevOps & Cloud": ["Docker and Kubernetes in Production", "AWS Solutions Architect Prep", "Terraform Infrastructure as Code", "CI/CD with GitHub Actions", "Linux System Administration", "Prometheus and Grafana Monitoring", "Ansible Automation Mastery", "GCP Professional Cloud Architect"],
  "Cybersecurity": ["Ethical Hacking Complete Course", "OWASP Top 10 for Developers", "Network Security Fundamentals", "Penetration Testing Bootcamp", "Web Application Security Testing", "Zero Trust Architecture Design", "CISSP Certification Prep", "Malware Analysis and Reverse Engineering"],
  "UI/UX Design": ["Figma UI Design Masterclass", "UX Research Methods and Practice", "Design Systems at Scale", "Mobile App UX Best Practices", "Accessibility in Modern Design", "Prototyping with Adobe XD", "Motion Design with After Effects", "User Psychology and Behavioral Design"],
  "Blockchain": ["Solidity Smart Contract Development", "Ethereum DApp from Scratch", "Web3.js and Ethers.js Complete Guide", "DeFi Protocol Architecture", "NFT Marketplace Development", "Rust for Solana Development", "Zero Knowledge Proofs Explained", "Blockchain Security Auditing"],
  "Game Development": ["Unity 3D Game Development Bootcamp", "Unreal Engine 5 Complete Guide", "Godot 4 from Zero to Game Store", "2D Pixel Art Game Design", "Multiplayer Game Architecture", "Game AI Programming Fundamentals", "Shader Development with GLSL", "Mobile Game Monetization Strategy"],
  "Database Design": ["MongoDB Advanced Aggregations", "PostgreSQL Performance Tuning", "Redis Architecture and Caching Patterns", "Database Design and Normalization", "Cassandra for High-Scale Systems", "ElasticSearch Complete Guide", "Neo4j Graph Database Mastery", "TimescaleDB for Time-Series Data"],
};

const LECTURE_PREFIXES = ["Introduction to", "Deep Dive into", "Mastering", "Advanced", "Understanding", "Building with", "Optimizing", "Testing", "Deploying", "Debugging", "Securing", "Scaling", "Integrating", "Refactoring", "Patterns in"];
const LECTURE_TOPICS = ["Core Concepts", "Architecture Patterns", "Configuration and Setup", "State Management", "Error Handling", "Performance Optimization", "Authentication and Authorization", "Database Integration", "API Design", "Unit Testing", "End-to-End Testing", "Deployment Strategies", "Monitoring and Logging", "CI/CD Pipelines", "Security Hardening"];

const makeLectureTitle = () => `${pickOne(LECTURE_PREFIXES)} ${pickOne(LECTURE_TOPICS)}`;
const makeCourseTitle = (cat: string) => {
  const pool = COURSE_TITLES[cat] ?? [];
  return pool.length ? pool[randInt(0, pool.length - 1)] : faker.lorem.words(5);
};

// ─── Pre-compute bcrypt hash once (avoids 60 individual hashes) ───────────────
console.log("Pre-computing password hash...");
const SHARED_HASH = await bcrypt.hash("Seeded@123", 10);

// ══════════════════════════════════════════════════════════════════════════════
// MAIN SEED FUNCTION
// ══════════════════════════════════════════════════════════════════════════════
async function seed() {
  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) { console.error("ERROR: MONGO_URI missing in .env"); process.exit(1); }

  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGO_URI, { family: 4, serverSelectionTimeoutMS: 5000 });
  console.log("Connected!\n");

  const db = mongoose.connection.db!;
  const now = new Date();

  // ── Step 0: Wipe all target collections ─────────────────────────────────────
  console.log("Clearing existing collections...");
  await Promise.all([
    db.collection("users").deleteMany({}),
    db.collection("courses").deleteMany({}),
    db.collection("lectures").deleteMany({}),
    db.collection("announcements").deleteMany({}),
    db.collection("coursepurchases").deleteMany({}),
    db.collection("courseprogresses").deleteMany({}),
    db.collection("comments").deleteMany({}),
    db.collection("lectureheatmaps").deleteMany({}),
  ]);
  console.log("Done.\n");

  // ════════════════════════════════════════════════════════════════════════════
  // STEP 1 — Users
  // ════════════════════════════════════════════════════════════════════════════
  console.log(`Seeding ${CFG.NUM_INSTRUCTORS} instructors + ${CFG.NUM_STUDENTS} students...`);

  const makeUser = (role: string) => ({
    name: faker.person.fullName().slice(0, 50),
    email: faker.internet.email({ provider: "edunode.dev" }).toLowerCase(),
    password: SHARED_HASH,
    role,
    avatar: `https://api.dicebear.com/8.x/avataaars/svg?seed=${faker.string.alphanumeric(8)}`,
    bio: faker.lorem.sentences(2).slice(0, 198),
    enrolledCourses: [],
    createdCourses: [],
    lastActive: faker.date.recent({ days: 30 }),
    createdAt: now,
    updatedAt: now,
  });

  const instrResult = await db.collection("users").insertMany([
    {
      name: "Demo Instructor",
      email: "instructor@edunode.dev",
      password: SHARED_HASH,
      role: Role.INSTRUCTOR,
      avatar: `https://api.dicebear.com/8.x/avataaars/svg?seed=demo-instructor`,
      bio: "This is the demo instructor account.",
      enrolledCourses: [],
      createdCourses: [],
      lastActive: now,
      createdAt: now,
      updatedAt: now,
    },
    ...Array.from({ length: CFG.NUM_INSTRUCTORS - 1 }, () => makeUser(Role.INSTRUCTOR))
  ]);
  const studResult = await db.collection("users").insertMany([
    {
      name: "Demo Student",
      email: "student@edunode.dev",
      password: SHARED_HASH,
      role: Role.STUDENT,
      avatar: `https://api.dicebear.com/8.x/avataaars/svg?seed=demo-student`,
      bio: "This is the demo student account.",
      enrolledCourses: [],
      createdCourses: [],
      lastActive: now,
      createdAt: now,
      updatedAt: now,
    },
    ...Array.from({ length: CFG.NUM_STUDENTS - 1 }, () => makeUser(Role.STUDENT))
  ]);

  const instructorIds = Object.values(instrResult.insertedIds) as Types.ObjectId[];
  const studentIds = Object.values(studResult.insertedIds) as Types.ObjectId[];
  const allUserIds = [...instructorIds, ...studentIds];
  console.log(`  Created ${allUserIds.length} users.\n`);

  // ════════════════════════════════════════════════════════════════════════════
  // STEP 2 — Courses
  // ════════════════════════════════════════════════════════════════════════════
  console.log("Seeding courses...");

  const seenCourseSlugs = new Set<string>();
  const courseDocs: Array<Record<string, unknown>> = [];

  for (const instructorId of instructorIds) {
    const cats = shuffle(CATEGORIES).slice(0, CFG.COURSES_PER_INSTR);
    for (const cat of cats) {
      let title = makeCourseTitle(cat).slice(0, 48);
      let slug = toSlug(title);
      let att = 0;
      while (seenCourseSlugs.has(slug)) { att++; slug = toSlug(title, att); }
      seenCourseSlugs.add(slug);

      const price = pickOne([0, 999, 1499, 1999, 2499, 2999, 3499, 4999]) as number;
      const level = pickOne(Object.values(CourseLevel)) as CourseLevelVal;

      courseDocs.push({
        slug, title,
        subtitle: faker.lorem.words(randInt(8, 14)).slice(0, 98),
        description: faker.lorem.sentences(2).slice(0, 196),
        category: cat,
        level,
        price,
        thumbnail: `https://picsum.photos/seed/${slug}/800/450`,
        instructor: instructorId,
        isPublished: true,
        totalLectures: 0,
        totalDuration: 0,
        enrolledStudents: [],
        lectures: [],
        announcements: [],
        createdAt: faker.date.past({ years: 2 }),
        updatedAt: now,
      });
    }
  }

  const courseResult = await db.collection("courses").insertMany(courseDocs, { ordered: false });
  const courseIds = Object.values(courseResult.insertedIds) as Types.ObjectId[];
  console.log(`  Created ${courseIds.length} courses.\n`);

  // ════════════════════════════════════════════════════════════════════════════
  // STEP 3 — Lectures
  // ════════════════════════════════════════════════════════════════════════════
  console.log("Seeding lectures...");

  // lectureIndex: courseId (string) → [{_id, duration}]
  const lectureIndex = new Map<string, { _id: Types.ObjectId; duration: number }[]>();

  for (const courseId of courseIds) {
    const n = randInt(CFG.MIN_LECTURES, CFG.MAX_LECTURES);
    const usedSlugs = new Set<string>();
    const batch: object[] = [];
    let totalDuration = 0;

    for (let i = 0; i < n; i++) {
      let title = makeLectureTitle().slice(0, 48);
      let slug = toSlug(title);
      let att = 0;
      while (usedSlugs.has(slug)) { att++; slug = toSlug(title, att); }
      usedSlugs.add(slug);

      const dur = randInt(300, 3600);
      totalDuration += dur;

      const TEST_VIDEOS = [
        "http://localhost:4566/edunode-local/test-video-1.mp4",
        "http://localhost:4566/edunode-local/test-video-2.mp4",
        "http://localhost:4566/edunode-local/test-video-3.mp4",
      ];

      batch.push({
        title, slug,
        courseId,
        description: faker.lorem.sentences(2).slice(0, 98),
        videoUrl: TEST_VIDEOS[i % TEST_VIDEOS.length],
        s3Key: `lectures/courses/${courseId.toString()}/${slug}.mp4`,
        uploadSessionId: new mongoose.Types.ObjectId().toString(),
        uploadStatus: "READY",
        duration: dur,
        isPreview: i < 2,
        order: i + 1,
        createdAt: now,
        updatedAt: now,
      });
    }

    const lecRes = await db.collection("lectures").insertMany(batch, { ordered: false });
    const lecIds = Object.values(lecRes.insertedIds) as Types.ObjectId[];

    lectureIndex.set(
      courseId.toString(),
      lecIds.map((lid, idx) => ({ _id: lid, duration: (batch[idx] as any).duration as number })),
    );

    await db.collection("courses").updateOne(
      { _id: courseId },
      { $set: { lectures: lecIds, totalLectures: lecIds.length, totalDuration } },
    );
  }

  const totalLectures = [...lectureIndex.values()].reduce((s, a) => s + a.length, 0);
  console.log(`  Created ${totalLectures} lectures.\n`);

  // ════════════════════════════════════════════════════════════════════════════
  // STEP 4 — Announcements  (raw insert; skips BullMQ post-save hook)
  // ════════════════════════════════════════════════════════════════════════════
  console.log("Seeding announcements...");

  const annBatch: object[] = [];
  const annCounts: { courseId: Types.ObjectId; count: number }[] = [];

  for (const courseId of courseIds) {
    const count = randInt(CFG.ANN_MIN, CFG.ANN_MAX);
    annCounts.push({ courseId, count });
    for (let i = 0; i < count; i++) {
      annBatch.push({
        courseId,
        message: faker.lorem.sentences(randInt(1, 3)).slice(0, 498),
        sentAt: faker.date.recent({ days: 120 }),
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  const annResult = await db.collection("announcements").insertMany(annBatch, { ordered: false });
  const annIds = Object.values(annResult.insertedIds) as Types.ObjectId[];

  // Back-link announcement IDs to their parent courses
  let annOffset = 0;
  for (const { courseId, count } of annCounts) {
    const slice = annIds.slice(annOffset, annOffset + count);
    if (slice.length) {
      await db.collection("courses").updateOne({ _id: courseId }, { $push: { announcements: { $each: slice } } });
    }
    annOffset += count;
  }
  console.log(`  Created ${annIds.length} announcements.\n`);

  // ════════════════════════════════════════════════════════════════════════════
  // STEP 5 — Purchases & Enrollments
  // ════════════════════════════════════════════════════════════════════════════
  console.log("Seeding purchases and enrollments...");

  // enrollmentMap: studentId (string) → [courseId, ...]
  const enrollmentMap = new Map<string, Types.ObjectId[]>();
  const purchaseBatch: object[] = [];

  for (const studentId of studentIds) {
    const numEnroll = randInt(CFG.ENROLL_MIN, CFG.ENROLL_MAX);
    const chosen = sample(courseIds, numEnroll);
    const enrolled: Types.ObjectId[] = [];

    for (const courseId of chosen) {
      const isRefunded = Math.random() < 0.06;
      const status = (isRefunded ? PaymentStatus.REFUNDED : PaymentStatus.COMPLETED) as PaymentStatusVal;
      const courseDoc = courseDocs.find((c) => c._id?.toString() === courseId.toString());
      const amount = (courseDoc?.price ?? 0) as number;

      const purchase: Record<string, unknown> = {
        course: courseId, user: studentId,
        amount, currency: "RUPEES", status,
        paymentMethod: pickOne(["card", "upi", "netbanking", "wallet"]),
        paymentId: `pay_${faker.string.alphanumeric(16)}`,
        createdAt: faker.date.past({ years: 1 }),
        updatedAt: now,
      };
      if (isRefunded) {
        purchase.refundId = `rfnd_${faker.string.alphanumeric(14)}`;
        purchase.refundAmount = amount;
        purchase.refundReason = faker.lorem.sentence();
      }
      purchaseBatch.push(purchase);

      if (!isRefunded) {
        enrolled.push(courseId);
        await db.collection("courses").updateOne(
          { _id: courseId },
          { $push: { enrolledStudents: { student: studentId, rating: Math.random() > 0.4 ? randInt(3, 5) : undefined } } },
        );
        await db.collection("users").updateOne(
          { _id: studentId },
          { $push: { enrolledCourses: { course: courseId } } },
        );
      }
    }
    enrollmentMap.set(studentId.toString(), enrolled);
  }

  await db.collection("coursepurchases").insertMany(purchaseBatch, { ordered: false });
  console.log(`  Created ${purchaseBatch.length} purchase records.\n`);

  // ════════════════════════════════════════════════════════════════════════════
  // STEP 6 — CourseProgress
  // ════════════════════════════════════════════════════════════════════════════
  console.log("Seeding course progress records...");

  const progressBatch: object[] = [];

  for (const [sidStr, enrolledCourses] of enrollmentMap.entries()) {
    const studentId = new mongoose.Types.ObjectId(sidStr);
    for (const courseId of enrolledCourses) {
      const lecs = lectureIndex.get(courseId.toString()) ?? [];
      if (!lecs.length) continue;

      const fraction = Math.random();
      const numDone = Math.floor(lecs.length * fraction);
      const doneSet = new Set(shuffle(lecs).slice(0, numDone).map((l) => l._id.toString()));

      const lectureProgress = lecs.map((lec) => {
        const done = doneSet.has(lec._id.toString());
        return {
          lecture: lec._id,
          userId: studentId,
          isCompleted: done,
          lastWatchedPosition: done ? lec.duration : randInt(0, lec.duration),
          lastWatched: faker.date.recent({ days: 60 }),
        };
      });

      const pct = Math.round((numDone / lecs.length) * 100);
      progressBatch.push({
        user: studentId, course: courseId,
        isCompleted: pct === 100,
        completionPercentage: pct,
        lectureProgress,
        lastAccessed: faker.date.recent({ days: 30 }),
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  if (progressBatch.length) {
    await db.collection("courseprogresses").insertMany(progressBatch, { ordered: false });
  }
  console.log(`  Created ${progressBatch.length} progress records.\n`);

  // ════════════════════════════════════════════════════════════════════════════
  // STEP 7 — Comments + Replies
  // ════════════════════════════════════════════════════════════════════════════
  console.log("Seeding comments...");

  const allLecIds = [...lectureIndex.values()].flatMap((a) => a.map((l) => l._id));
  const commentBatch: object[] = [];

  for (const lecId of allLecIds) {
    const n = randInt(CFG.COMMENTS_MIN, CFG.COMMENTS_MAX);
    for (let i = 0; i < n; i++) {
      commentBatch.push({
        lectureId: lecId,
        userId: pickOne(allUserIds),
        content: faker.lorem.sentences(randInt(1, 4)),
        likes: randInt(0, 120),
        dislikes: randInt(0, 20),
        replyCount: 0,
        isDeleted: Math.random() < 0.03,
        deletedAt: null,
        createdAt: faker.date.recent({ days: 180 }),
        updatedAt: faker.date.recent({ days: 60 }),
      });
    }
  }

  const commentResult = await db.collection("comments").insertMany(commentBatch, { ordered: false });
  const commentIds = Object.values(commentResult.insertedIds) as Types.ObjectId[];

  // 15% of top-level comments get 1–4 replies
  const parents = sample(commentIds, Math.floor(commentIds.length * 0.15));
  const replyBatch: object[] = [];

  for (const parentId of parents) {
    const numReplies = randInt(1, 4);
    for (let r = 0; r < numReplies; r++) {
      replyBatch.push({
        lectureId: pickOne(allLecIds),
        userId: pickOne(allUserIds),
        content: faker.lorem.sentences(randInt(1, 2)),
        likes: randInt(0, 30),
        dislikes: randInt(0, 5),
        parentCommentId: parentId,
        replyCount: 0,
        isDeleted: false,
        deletedAt: null,
        createdAt: faker.date.recent({ days: 90 }),
        updatedAt: faker.date.recent({ days: 30 }),
      });
    }
    await db.collection("comments").updateOne({ _id: parentId }, { $set: { replyCount: numReplies } });
  }

  if (replyBatch.length) {
    await db.collection("comments").insertMany(replyBatch, { ordered: false });
  }
  console.log(`  Created ${commentBatch.length} top-level comments + ${replyBatch.length} replies.\n`);

  // ════════════════════════════════════════════════════════════════════════════
  // STEP 8 — LectureHeatmaps
  // ════════════════════════════════════════════════════════════════════════════
  console.log("Seeding heatmap data...");

  const heatmapBatch: object[] = [];
  for (const lecId of allLecIds) {
    for (let seg = 0; seg < CFG.HEATMAP_SEGMENTS; seg++) {
      const pos = seg / CFG.HEATMAP_SEGMENTS;
      const weight = pos < 0.15 ? 0.85 + Math.random() * 0.15
        : pos > 0.85 ? 0.65 + Math.random() * 0.25
          : 0.35 + Math.random() * 0.50;
      const seconds = Math.round(weight * randInt(40, 280));
      if (seconds > 0) {
        heatmapBatch.push({ lectureId: lecId, segmentIndex: seg, secondsWatched: seconds, createdAt: now, updatedAt: now });
      }
    }
  }

  if (heatmapBatch.length) {
    await db.collection("lectureheatmaps").insertMany(heatmapBatch, { ordered: false });
  }
  console.log(`  Created ${heatmapBatch.length} heatmap segments.\n`);

  // ─── Final Summary ────────────────────────────────────────────────────────
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  SEEDING COMPLETE");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(`  Users            : ${allUserIds.length}  (${instructorIds.length} instructors / ${studentIds.length} students)`);
  console.log(`  Courses          : ${courseIds.length}`);
  console.log(`  Lectures         : ${totalLectures}`);
  console.log(`  Announcements    : ${annIds.length}`);
  console.log(`  Purchases        : ${purchaseBatch.length}`);
  console.log(`  Progress records : ${progressBatch.length}`);
  console.log(`  Comments         : ${commentBatch.length + replyBatch.length}  (incl. ${replyBatch.length} replies)`);
  console.log(`  Heatmap segments : ${heatmapBatch.length}`);
  console.log("═══════════════════════════════════════════════════════════");
  console.log("\n  All seeded users can log in with:  Password: Seeded@123\n");

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("\nSeeding failed:", err?.message ?? err);
  mongoose.disconnect().finally(() => process.exit(1));
});
