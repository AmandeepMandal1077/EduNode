import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import { User } from "../../src/models/user.model.js";
import { Course, CourseLevel } from "../../src/models/course.model.js";
import { Lecture } from "../../src/models/lecture.model.js";
import { CourseProgress } from "../../src/models/courseProgress.model.js";
import {
  lectureLastWatchPosition,
  getLectureHeatmap,
  syncLectureProgressWithCache,
} from "../../src/controllers/playback.controller.js";
import { localStore } from "../setup.js";
import mongoose from "mongoose";

describe("Playback & Heatmap Controller Unit-Style Tests", () => {
  let app: express.Express;
  let userId: string;
  let courseId: string;
  let lectureId: string;

  beforeAll(() => {
    app = express();
    app.use(express.json());

    // Mock auth middleware for unit testing
    app.use((req: any, res, next) => {
      req.userId = userId;
      next();
    });

    // Mount endpoints directly
    app.post("/api/v1/playback/sync", syncLectureProgressWithCache);
    app.get("/api/v1/playback/sync", lectureLastWatchPosition);
    app.get("/api/v1/playback/heatmap/:lectureId", getLectureHeatmap);

    // Global error handler
    app.use((err: any, req: any, res: any, next: any) => {
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message,
      });
    });
  });

  beforeEach(async () => {
    // Create users & courses
    const user = await User.create({
      name: "Playback Student",
      email: "playback@example.com",
      password: "Password123!",
    });
    userId = user._id.toString();

    const course = await Course.create({
      title: "Playback Course",
      subtitle: "Sub",
      description: "Desc",
      category: "Tech",
      level: CourseLevel.BEGINNER,
      price: 0,
      instructor: new mongoose.Types.ObjectId(),
      thumbnail: "http://example.com/thumbnail.png",
    });
    courseId = course._id.toString();

    const lecture = await Lecture.create({
      title: "Playback Lecture",
      description: "Desc",
      videoUrl: "https://example.com/v.mp4",
      courseId: course._id,
      s3Key: "playback/lecture/key.mp4",
      uploadSessionId: "playback-upload-session-id",
    });
    lectureId = lecture._id.toString();
  });

  it("1. POST /api/v1/playback/sync should save progress to cache and return 200", async () => {
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

    const progressKey = `lecture_progress:${userId}:${lectureId}`;
    expect(localStore.has(progressKey)).toBe(true);

    const cachedProgress = JSON.parse(localStore.get(progressKey)!);
    expect(cachedProgress.lastWatchedPosition).toBe(120);
    expect(cachedProgress.isCompleted).toBe(false);
  });

  it("2. POST /api/v1/playback/sync at 95% position should mark lecture as completed", async () => {
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

    const progressKey = `lecture_progress:${userId}:${lectureId}`;
    const cachedProgress = JSON.parse(localStore.get(progressKey)!);
    expect(cachedProgress.isCompleted).toBe(true);
  });

  it("3. GET /api/v1/playback/sync should return cached position", async () => {
    const progressKey = `lecture_progress:${userId}:${lectureId}`;
    const mockCached = {
      userId,
      lecture: lectureId,
      isCompleted: false,
      lastWatchedPosition: 145,
      lastWatched: new Date().toISOString(),
    };
    localStore.set(progressKey, JSON.stringify(mockCached));

    const response = await request(app)
      .get("/api/v1/playback/sync")
      .query({ lectureId, courseId });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.resumePosition.lastWatchedPosition).toBe(145);
  });

  it("4. GET /api/v1/playback/sync should fallback to MongoDB when not cached", async () => {
    await CourseProgress.create({
      user: new mongoose.Types.ObjectId(userId),
      course: new mongoose.Types.ObjectId(courseId),
      isCompleted: false,
      completionPercentage: 10,
      lectureProgress: [
        {
          lecture: new mongoose.Types.ObjectId(lectureId),
          userId: new mongoose.Types.ObjectId(userId),
          isCompleted: false,
          lastWatchedPosition: 222,
          lastWatched: new Date(),
        },
      ],
    });

    const response = await request(app)
      .get("/api/v1/playback/sync")
      .query({ lectureId, courseId });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.resumePosition.lastWatchedPosition).toBe(222);
  });

  it("5. GET /api/v1/playback/heatmap/:lectureId with invalid ID should return 400", async () => {
    const response = await request(app)
      .get("/api/v1/playback/heatmap/invalid-id");

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Invalid Lecture ID");
  });
});
