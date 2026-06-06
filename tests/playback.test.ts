/**
 * GENERATION PROMPT:
 * "Write a Vitest and Supertest integration test suite for the lecture playback and heatmap features of an Express LMS application.
 * 
 * Requirements:
 * 1. Mock the Redis cache module (`../src/cache/index.js`) using `vi.hoisted` to avoid requiring a real Redis instance. Use a local `Map` to simulate key storage.
 * 2. Mock `node-cron` to capture the callback of the `syncHeatmaps` cron job.
 * 3. Construct a temporary Express application within the test suite and programmatically mount the controller functions (`syncLectureProgressWithCache`, `lectureLastWatchPosition`, `getLectureHeatmap`) directly to avoid dependency on broken or unmounted routes in `src/`.
 * 4. Add tests for:
 *    - POST `/api/v1/playback/sync`: should verify that progress and heatmap segments are correctly stored in the cache, and that completion is computed based on 95% threshold.
 *    - GET `/api/v1/playback/sync`: should verify progress lookup in cache and fallback to MongoDB.
 *    - GET `/api/v1/playback/heatmap/:lectureId`: should verify sorted heatmap query from MongoDB.
 *    - `syncHeatmaps` cron job: should assert the current behavior of the cron job (demonstrating issues such as keys remaining in cache as `:syncing` due to incorrect key reading, and empty MongoDB results)."
 */

import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from "vitest";
import request from "supertest";
import express from "express";
import mongoose from "mongoose";
import connectdb from "../src/database/db.js";
import { User } from "../src/models/user.model.js";
import { Course, CourseLevel } from "../src/models/course.model.js";
import { Lecture } from "../src/models/lecture.model.js";
import { CourseProgress } from "../src/models/courseProgress.model.js";
import { LectureHeatmap } from "../src/models/lectureHeatmap.model.js";

// --- HOISTED MOCKS USING VI.HOISTED ---
const hoisted = vi.hoisted(() => {
  const store = new Map<string, any>();
  
  return {
    redisStore: store,
    mockCache: {
      connect: vi.fn().mockResolvedValue(undefined),
      on: vi.fn(),
      get: vi.fn(async (key: string) => {
        return store.get(key) || null;
      }),
      set: vi.fn(async (key: string, value: string, options?: any) => {
        store.set(key, value);
      }),
      type: vi.fn(async (key: string) => {
        return store.has(key) ? "string" : "none";
      }),
      incrByFloat: vi.fn(async (key: string, value: number) => {
        const current = parseFloat(store.get(key) || "0");
        const next = current + value;
        store.set(key, String(next));
        return next;
      }),
      pExpireAt: vi.fn().mockResolvedValue(true),
      del: vi.fn(async (key: string) => {
        store.delete(key);
        return 1;
      }),
      keys: vi.fn(async (pattern: string) => {
        const prefix = pattern.replace("*", "");
        return Array.from(store.keys()).filter(k => k.startsWith(prefix));
      }),
      rename: vi.fn(async (oldKey: string, newKey: string) => {
        if (!store.has(oldKey)) {
          throw new Error("ERR no such key");
        }
        const val = store.get(oldKey);
        store.delete(oldKey);
        store.set(newKey, val);
      })
    },
    cronCallbacks: {
      callback: null as (() => Promise<void>) | null
    }
  };
});

// Mock cache index
vi.mock("../src/cache/index.js", () => {
  return {
    default: hoisted.mockCache,
    content_expiration_duration: 600000,
  };
});

// Mock node-cron
vi.mock("node-cron", () => {
  return {
    default: {
      schedule: vi.fn((pattern, cb) => {
        hoisted.cronCallbacks.callback = cb;
        return {
          start: vi.fn(),
          stop: vi.fn()
        };
      })
    }
  };
});

// Import controllers and cron job
import {
  lectureLastWatchPosition,
  getLectureHeatmap,
  syncLectureProgressWithCache
} from "../src/controllers/playback.controller.js";

// Import cron job to register callback
await import("../src/cron/syncHeatmaps.js");

describe("Playback & Heatmap Controller Integration Tests", () => {
  let app: express.Express;
  let userId: string;
  let courseId: string;
  let lectureId: string;

  beforeAll(async () => {
    await connectdb();

    // Set up test express app programmatically mounting the controllers directly
    app = express();
    app.use(express.json());

    // Middleware to mock AuthenticatedRequest (req.userId)
    app.use((req: any, res, next) => {
      req.userId = userId;
      next();
    });

    // Mount endpoints
    app.post("/api/v1/playback/sync", syncLectureProgressWithCache);
    app.get("/api/v1/playback/sync", lectureLastWatchPosition);
    app.get("/api/v1/playback/heatmap/:lectureId", getLectureHeatmap);

    // Error handler middleware
    app.use((err: any, req: any, res: any, next: any) => {
      const statusCode = err.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        message: err.message || "Internal Server Error"
      });
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    hoisted.redisStore.clear();
    vi.clearAllMocks();

    await User.deleteMany({});
    await Course.deleteMany({});
    await Lecture.deleteMany({});
    await CourseProgress.deleteMany({});
    await LectureHeatmap.deleteMany({});

    // Create a mock user
    const user = await User.create({
      name: "Playback Tester",
      email: "playbacktester@example.com",
      password: "Password123!",
    });
    userId = user._id.toString();

    // Create a mock course
    const course = await Course.create({
      title: "Playback Course",
      subtitle: "Course Subtitle",
      description: "Description",
      category: "Technology",
      level: CourseLevel.BEGINNER,
      price: 99,
      thumbnail: "thumbnail.jpg",
      instructor: new mongoose.Types.ObjectId(userId),
      isPublished: true,
    });
    courseId = course._id.toString();

    // Create a mock lecture
    const lecture = await Lecture.create({
      title: "Playback Lecture",
      slug: "playback-lecture",
      courseId: new mongoose.Types.ObjectId(courseId),
      description: "Lecture description",
      videoUrl: "https://example.com/video.mp4",
      duration: 300, // 5 minutes (300 seconds)
      isPreview: false,
      publicId: "public-id",
      order: 1,
    });
    lectureId = lecture._id.toString();
  });

  describe("POST /api/v1/playback/sync - Sync Lecture Progress & Caching", () => {
    it("should successfully save lecture progress and heatmap segment to Redis cache", async () => {
      const payload = {
        lectureId,
        currentPosition: 120,
        previousPosition: 100,
        lectureDuration: 300,
      };

      const response = await request(app)
        .post("/api/v1/playback/sync")
        .send(payload);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Lecture progress synced with cache successfully");

      // Verify that progress is saved in mock cache
      const progressCacheKey = `lecture_progress:${userId}:${lectureId}`;
      expect(hoisted.redisStore.has(progressCacheKey)).toBe(true);

      const cachedProgress = JSON.parse(hoisted.redisStore.get(progressCacheKey));
      expect(cachedProgress.lastWatchedPosition).toBe(120);
      expect(cachedProgress.isCompleted).toBe(false);

      // Verify heatmap segment is saved in mock cache
      // Bug 1 is demonstrated: segment index calculated as 0 due to Math.floor(previousPosition/duration)*100
      const heatmapCacheKey = `lecture_heatmap:${lectureId}:0`;
      expect(hoisted.redisStore.has(heatmapCacheKey)).toBe(true);
      expect(hoisted.redisStore.get(heatmapCacheKey)).toBe("21");
    });

    it("should mark lecture progress completed when current position >= 95% duration", async () => {
      const payload = {
        lectureId,
        currentPosition: 290,
        previousPosition: 280,
        lectureDuration: 300,
      };

      const response = await request(app)
        .post("/api/v1/playback/sync")
        .send(payload);

      expect(response.status).toBe(200);

      const progressCacheKey = `lecture_progress:${userId}:${lectureId}`;
      const cachedProgress = JSON.parse(hoisted.redisStore.get(progressCacheKey));
      expect(cachedProgress.isCompleted).toBe(true);
    });
  });

  describe("GET /api/v1/playback/sync - Get Last Watched Position", () => {
    it("should return the position from cache if it exists", async () => {
      const progressCacheKey = `lecture_progress:${userId}:${lectureId}`;
      const mockProgress = {
        userId,
        lecture: lectureId,
        isCompleted: false,
        lastWatchedPosition: 150,
        lastWatched: new Date().toISOString(),
      };
      hoisted.redisStore.set(progressCacheKey, JSON.stringify(mockProgress));

      const response = await request(app)
        .get("/api/v1/playback/sync")
        .send({ lectureId, courseId });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.resumePosition.lastWatchedPosition).toBe(150);
    });

    it("should fallback to MongoDB CourseProgress if not in cache", async () => {
      await CourseProgress.create({
        user: new mongoose.Types.ObjectId(userId),
        course: new mongoose.Types.ObjectId(courseId),
        lectureProgress: [
          {
            lecture: new mongoose.Types.ObjectId(lectureId),
            userId: new mongoose.Types.ObjectId(userId),
            isCompleted: true,
            lastWatchedPosition: 200,
            lastWatched: new Date(),
          }
        ]
      });

      const response = await request(app)
        .get("/api/v1/playback/sync")
        .send({ lectureId, courseId });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.resumePosition.lastWatchedPosition).toBe(200);
    });

    it("should return null resumePosition if progress is not in cache or DB", async () => {
      const response = await request(app)
        .get("/api/v1/playback/sync")
        .send({ lectureId, courseId });

      expect(response.status).toBe(200);
      expect(response.body.data.resumePosition).toBeNull();
    });
  });

  describe("GET /api/v1/playback/heatmap/:lectureId - Get Heatmap", () => {
    it("should return 400 for invalid lecture ID", async () => {
      const response = await request(app)
        .get("/api/v1/playback/heatmap/invalid-id");

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Invalid Lecture ID");
    });

    it("should return sorted heatmap data from MongoDB", async () => {
      await LectureHeatmap.create([
        {
          lectureId: new mongoose.Types.ObjectId(lectureId),
          segmentIndex: 1,
          secondsWatched: 15,
        },
        {
          lectureId: new mongoose.Types.ObjectId(lectureId),
          segmentIndex: 0,
          secondsWatched: 10,
        },
        {
          lectureId: new mongoose.Types.ObjectId(lectureId),
          segmentIndex: 2,
          secondsWatched: 5,
        }
      ]);

      const response = await request(app)
        .get(`/api/v1/playback/heatmap/${lectureId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const heatmap = response.body.data.heatmap;
      expect(heatmap).toHaveLength(3);
      expect(heatmap[0].segmentIndex).toBe(0);
      expect(heatmap[0].secondsWatched).toBe(10);
      expect(heatmap[1].segmentIndex).toBe(1);
      expect(heatmap[1].secondsWatched).toBe(15);
      expect(heatmap[2].segmentIndex).toBe(2);
      expect(heatmap[2].secondsWatched).toBe(5);
    });
  });

  describe("syncHeatmaps Cron Job Execution & Documented Bugs Verification", () => {
    it("should trigger cron callback and demonstrate documented bugs as-is in src/", async () => {
      const cronCallback = hoisted.cronCallbacks.callback;
      expect(cronCallback).toBeTypeOf("function");

      const segmentIdx = 0;
      const key = `lecture_heatmap:${lectureId}:${segmentIdx}`;
      hoisted.redisStore.set(key, "15");

      if (cronCallback) {
        await cronCallback();
      }

      // Assert that the renamed key remains in Redis (Bug 3: key is leaked because read query checks the original key, gets 0, and doesn't update or clean up the syncing key)
      const expectedRenamedKey = `${key}:syncing`;
      expect(hoisted.redisStore.has(expectedRenamedKey)).toBe(true);
      expect(hoisted.redisStore.get(expectedRenamedKey)).toBe("15");

      // Assert that the MongoDB collection remains empty
      const count = await LectureHeatmap.countDocuments({ lectureId });
      expect(count).toBe(0);
    });
  });
});
