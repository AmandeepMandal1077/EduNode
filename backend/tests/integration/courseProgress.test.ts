import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import { User, Role } from "../../src/models/user.model.js";
import { Course, CourseLevel } from "../../src/models/course.model.js";
import { Lecture } from "../../src/models/lecture.model.js";
import { CourseProgress } from "../../src/models/courseProgress.model.js";
import { loginUser } from "../setup.js";
import mongoose from "mongoose";

describe("Course Progress Controller Integration Tests", () => {
  const studentUser = {
    name: "Progress Student",
    email: "student@example.com",
    password: "Password123!",
    role: Role.STUDENT,
  };

  let token: string;
  let userId: string;
  let courseId: string;
  let lectureId: string;

  beforeEach(async () => {
    const student = await User.create(studentUser);
    userId = student._id.toString();

    token = await loginUser(app, studentUser.email, studentUser.password);

    const course = await Course.create({
      title: "Progress Course",
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
      title: "Progress Lecture",
      description: "Desc",
      videoUrl: "https://example.com/v.mp4",
      courseId: course._id,
      publicId: "progress-lecture-public-id",
    });
    lectureId = lecture._id.toString();
  });

  it("1. GET /api/v1/progress/:courseId should return course progress data when it exists", async () => {
    await CourseProgress.create({
      user: new mongoose.Types.ObjectId(userId),
      course: new mongoose.Types.ObjectId(courseId),
      isCompleted: false,
      completionPercentage: 100,
      lectureProgress: [
        {
          lecture: new mongoose.Types.ObjectId(lectureId),
          userId: new mongoose.Types.ObjectId(userId),
          isCompleted: true,
          lastWatchedPosition: 10,
          lastWatched: new Date(),
        },
      ],
    });

    const response = await request(app)
      .get(`/api/v1/progress/${courseId}`)
      .set("Cookie", [token]);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.completionPercentage).toBe(100);
    expect(response.body.data.lectureProgress[0].lastWatchedPosition).toBe(10);
  });

  it("2. GET /api/v1/progress/:courseId should return 404 when progress doesn't exist", async () => {
    const response = await request(app)
      .get(`/api/v1/progress/${courseId}`)
      .set("Cookie", [token]);

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Course progress not found");
  });

  it("3. PATCH /api/v1/progress/:courseId/lectures/:lectureId should update lecture progress successfully", async () => {
    await CourseProgress.create({
      user: new mongoose.Types.ObjectId(userId),
      course: new mongoose.Types.ObjectId(courseId),
      isCompleted: false,
      completionPercentage: 0,
      lectureProgress: [
        {
          lecture: new mongoose.Types.ObjectId(lectureId),
          userId: new mongoose.Types.ObjectId(userId),
          isCompleted: false,
          lastWatchedPosition: 0,
          lastWatched: new Date(),
        },
      ],
    });

    const response = await request(app)
      .patch(`/api/v1/progress/${courseId}/lectures/${lectureId}`)
      .set("Cookie", [token])
      .send({
        isCompleted: true,
        lastWatchedPosition: 120,
        lastWatched: new Date().toISOString(),
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.lectureProgress[0].isCompleted).toBe(true);
    expect(response.body.data.lectureProgress[0].lastWatchedPosition).toBe(120);
  });

  it("4. PATCH /api/v1/progress/:courseId/complete should mark course progress as complete", async () => {
    await CourseProgress.create({
      user: new mongoose.Types.ObjectId(userId),
      course: new mongoose.Types.ObjectId(courseId),
      isCompleted: false,
      completionPercentage: 50,
      lectureProgress: [],
    });

    const response = await request(app)
      .patch(`/api/v1/progress/${courseId}/complete`)
      .set("Cookie", [token]);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.isCompleted).toBe(true);
    expect(response.body.data.completionPercentage).toBe(100);
  });

  it("5. PATCH /api/v1/progress/:courseId/reset should reset progress", async () => {
    await CourseProgress.create({
      user: new mongoose.Types.ObjectId(userId),
      course: new mongoose.Types.ObjectId(courseId),
      isCompleted: true,
      completionPercentage: 100,
      lectureProgress: [
        {
          lecture: new mongoose.Types.ObjectId(lectureId),
          userId: new mongoose.Types.ObjectId(userId),
          isCompleted: true,
          lastWatchedPosition: 300,
          lastWatched: new Date(),
        },
      ],
    });

    const response = await request(app)
      .patch(`/api/v1/progress/${courseId}/reset`)
      .set("Cookie", [token]);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.isCompleted).toBe(false);
    expect(response.body.data.completionPercentage).toBe(0);
    expect(response.body.data.lectureProgress).toHaveLength(0);
  });
});
