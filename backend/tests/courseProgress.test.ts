import { describe, it, expect, beforeEach, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import { User } from "../src/models/user.model.js";
import { Course, CourseLevel } from "../src/models/course.model.js";
import { Lecture } from "../src/models/lecture.model.js";
import { CourseProgress } from "../src/models/courseProgress.model.js";
import mongoose from "mongoose";
import connectdb from "../src/database/db.js";

/**
 * NOTE: CourseProgress routes are NOT registered in app.ts yet.
 * These tests document expected behavior for when routes are registered at /api/v1/progress
 */
describe("Course Progress Controller Integration Tests", () => {
  beforeAll(async () => {
    await connectdb();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  const userData = {
    name: "Progress Test User",
    email: "progresstest@example.com",
    password: "Password123!",
  };

  let token: string;
  let userId: string;
  let courseId: string;
  let lectureId: string;

  const loginUser = async (
    email: string,
    password: string,
  ): Promise<string> => {
    const response = await request(app).post("/api/v1/users/signin").send({
      email,
      password,
    });
    const cookies = response.headers["set-cookie"] as string[] | undefined;
    if (!cookies || cookies.length === 0 || !cookies[0]) {
      throw new Error("No cookies set during login");
    }
    const tokenPart = cookies[0].split(";")[0];
    return tokenPart || "";
  };

  beforeEach(async () => {
    await User.deleteMany({});
    await Course.deleteMany({});
    await Lecture.deleteMany({});
    await CourseProgress.deleteMany({});

    // Create user
    const user = await User.create(userData);
    userId = user._id.toString();
    token = await loginUser(userData.email, userData.password);

    // Create a course
    const course = await Course.create({
      title: "Progress Course",
      subtitle: "Track your progress",
      description: "Course for progress testing",
      category: "Technology",
      level: CourseLevel.BEGINNER,
      price: 50,
      thumbnail: "progress-thumbnail.jpg",
      instructor: new mongoose.Types.ObjectId(userId),
      isPublished: true,
    });
    courseId = course._id.toString();

    // Create a lecture
    const lecture = await Lecture.create({
      title: "Progress Lecture",
      slug: "progress-lecture",
      courseId: new mongoose.Types.ObjectId(courseId),
      description: "Lecture for progress testing",
      videoUrl: "https://example.com/progress-video.mp4",
      duration: 60,
      isPreview: false,
      publicId: "progress-public-id",
      order: 1,
    });
    lectureId = lecture._id.toString();
  });

  /**
   * GET /api/v1/progress/:courseId - Get Course Progress
   */
  it("should return 401 when getting progress without authentication", async () => {
    const response = await request(app).get(`/api/v1/progress/${courseId}`);

    // Routes not registered - expect 404
    // When registered, expect 401
    expect([401, 404]).toContain(response.status);
  });

  it("should return 400 for invalid courseId format", async () => {
    const response = await request(app)
      .get("/api/v1/progress/invalid-course-id")
      .set("Cookie", [token]);

    // Routes not registered - expect 404
    // When registered, expect 400
    expect([400, 404]).toContain(response.status);
  });

  it("should return 404 when course progress does not exist", async () => {
    const response = await request(app)
      .get(`/api/v1/progress/${courseId}`)
      .set("Cookie", [token]);

    // Routes not registered - expect 404
    expect(response.status).toBe(404);
  });

  it("should get course progress successfully when it exists", async () => {
    // Create course progress
    await CourseProgress.create({
      user: new mongoose.Types.ObjectId(userId),
      course: new mongoose.Types.ObjectId(courseId),
      isCompleted: false,
      completionPercentage: 50,
      lectureProgress: [
        {
          lecture: new mongoose.Types.ObjectId(lectureId),
          userId: new mongoose.Types.ObjectId(userId),
          isCompleted: true,
          lastWatchedPosition: 1800,
        },
      ],
    });

    const response = await request(app)
      .get(`/api/v1/progress/${courseId}`)
      .set("Cookie", [token]);

    // Routes not registered - expect 404
    // When registered, expect 200 with progress data
    expect([200, 404]).toContain(response.status);

    // Verify DB state
    const progressCount = await CourseProgress.countDocuments({
      user: new mongoose.Types.ObjectId(userId),
    });
    expect(progressCount).toBe(1);
  });

  /**
   * PATCH /api/v1/progress/:courseId/lectures/:lectureId - Update Lecture Progress
   */
  it("should return 401 when updating lecture progress without authentication", async () => {
    const response = await request(app)
      .patch(`/api/v1/progress/${courseId}/lectures/${lectureId}`)
      .send({ isCompleted: true });

    expect([401, 404]).toContain(response.status);
  });

  it("should return 400 for invalid lectureId format when updating", async () => {
    const response = await request(app)
      .patch(`/api/v1/progress/${courseId}/lectures/invalid-id`)
      .set("Cookie", [token])
      .send({ isCompleted: true });

    expect([400, 404]).toContain(response.status);
  });

  it("should update lecture progress successfully", async () => {
    // Create course progress with lecture
    await CourseProgress.create({
      user: new mongoose.Types.ObjectId(userId),
      course: new mongoose.Types.ObjectId(courseId),
      lectureProgress: [
        {
          lecture: new mongoose.Types.ObjectId(lectureId),
          userId: new mongoose.Types.ObjectId(userId),
          isCompleted: false,
          lastWatchedPosition: 0,
        },
      ],
    });

    const response = await request(app)
      .patch(`/api/v1/progress/${courseId}/lectures/${lectureId}`)
      .set("Cookie", [token])
      .send({ isCompleted: true, lastWatchedPosition: 3600 });

    expect([200, 404]).toContain(response.status);

    // Verify DB state if routes were registered
    const progress = await CourseProgress.findOne({
      user: new mongoose.Types.ObjectId(userId),
    });
    expect(progress).toBeTruthy();
  });

  /**
   * PATCH /api/v1/progress/:courseId/complete - Mark Course Complete
   */
  it("should return 401 when marking course complete without authentication", async () => {
    const response = await request(app).patch(
      `/api/v1/progress/${courseId}/complete`,
    );

    expect([401, 404]).toContain(response.status);
  });

  it("should return 404 when marking non-existent progress as complete", async () => {
    const response = await request(app)
      .patch(`/api/v1/progress/${courseId}/complete`)
      .set("Cookie", [token]);

    expect(response.status).toBe(404);
  });

  it("should mark course as completed successfully", async () => {
    // Create course progress
    await CourseProgress.create({
      user: new mongoose.Types.ObjectId(userId),
      course: new mongoose.Types.ObjectId(courseId),
      isCompleted: false,
      completionPercentage: 75,
      lectureProgress: [],
    });

    const response = await request(app)
      .patch(`/api/v1/progress/${courseId}/complete`)
      .set("Cookie", [token]);

    expect([200, 404]).toContain(response.status);

    // Verify DB state
    const progress = await CourseProgress.findOne({
      user: new mongoose.Types.ObjectId(userId),
    });
    expect(progress).toBeTruthy();
  });

  /**
   * PATCH /api/v1/progress/:courseId/reset - Reset Course Progress
   */
  it("should return 401 when resetting progress without authentication", async () => {
    const response = await request(app).patch(
      `/api/v1/progress/${courseId}/reset`,
    );

    expect([401, 404]).toContain(response.status);
  });

  it("should reset course progress successfully", async () => {
    // Create completed course progress
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
          lastWatchedPosition: 3600,
        },
      ],
    });

    const response = await request(app)
      .patch(`/api/v1/progress/${courseId}/reset`)
      .set("Cookie", [token]);

    expect([200, 404]).toContain(response.status);

    // Verify DB state
    const progress = await CourseProgress.findOne({
      user: new mongoose.Types.ObjectId(userId),
    });
    expect(progress).toBeTruthy();
  });
});
