import { describe, it, expect, beforeEach, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import { User } from "../src/models/user.model.js";
import { Course, CourseLevel } from "../src/models/course.model.js";
import { Lecture } from "../src/models/lecture.model.js";
import { Comment } from "../src/models/comment.model.js";
import mongoose from "mongoose";
import connectdb from "../src/database/db.js";

describe("Lecture Controller Integration Tests", () => {
  beforeAll(async () => {
    await connectdb();
    await Lecture.syncIndexes();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  const userData = {
    name: "Test User",
    email: "testuser@example.com",
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
    await Comment.deleteMany({});

    // Create user
    const user = await User.create(userData);
    userId = user._id.toString();
    token = await loginUser(userData.email, userData.password);

    // Create a course
    const course = await Course.create({
      title: "Test Course",
      subtitle: "Test Subtitle",
      description: "Test Description",
      category: "Technology",
      level: CourseLevel.BEGINNER,
      price: 100,
      thumbnail: "test-thumbnail.jpg",
      instructor: new mongoose.Types.ObjectId(userId),
      isPublished: true,
    });
    courseId = course._id.toString();

    // Create a lecture
    const lecture = await Lecture.create({
      title: "Test Lecture",
      slug: "test-lecture",
      courseId: new mongoose.Types.ObjectId(courseId),
      description: "Test lecture description",
      videoUrl: "https://example.com/video.mp4",
      duration: 120.5,
      isPreview: true,
      publicId: "test-public-id-123",
      order: 1,
    });
    lectureId = lecture._id.toString();
  });

  /**
   * GET /api/v1/lecture/:lectureId - Get Lecture Details
   */
  it("should return 401 when accessing lecture without authentication", async () => {
    const response = await request(app).get(`/api/v1/lecture/${lectureId}`);

    // Expected: 401 Unauthorized when no token provided
    expect(response.status).toBe(401);
  });

  it("should return 400 for invalid lectureId format", async () => {
    const response = await request(app)
      .get("/api/v1/lecture/invalid-id")
      .set("Cookie", [token]);

    // Expected: 400 Bad Request for malformed ObjectId
    expect(response.status).toBe(400);
  });

  it("should return 404 when lecture does not exist", async () => {
    const nonExistentId = new mongoose.Types.ObjectId().toString();

    const response = await request(app)
      .get(`/api/v1/lecture/${nonExistentId}`)
      .set("Cookie", [token]);

    // Expected: 404 Not Found for non-existent lecture
    expect(response.status).toBe(404);

    // Verify DB state unchanged
    const lectureCount = await Lecture.countDocuments();
    expect(lectureCount).toBe(1);
  });

  it("should fetch lecture details successfully with valid lectureId", async () => {
    const response = await request(app)
      .get(`/api/v1/lecture/${lectureId}`)
      .set("Cookie", [token]);

    // Expected: 200 OK with lecture data
    expect(response.status).toBe(200);
    if (response.status === 200) {
      expect(response.body.success).toBe(true);
      expect(response.body.data.lecture).toBeDefined();
      expect(response.body.data.lecture.title).toBe("Test Lecture");
    }
  });

  /**
   * GET /api/v1/lecture/:lectureId/comments - Get Comments for Lecture
   */
  it("should return 401 when accessing comments without authentication", async () => {
    const response = await request(app).get(
      `/api/v1/lecture/${lectureId}/comments`,
    );

    // Expected: 401 Unauthorized when no token provided
    expect(response.status).toBe(401);
  });

  it("should return 400 for invalid lectureId when fetching comments", async () => {
    const response = await request(app)
      .get("/api/v1/lecture/not-valid-id/comments")
      .set("Cookie", [token]);

    // Expected: 400 Bad Request for malformed ObjectId
    expect(response.status).toBe(400);
  });

  it("should return empty array when lecture has no comments", async () => {
    const response = await request(app)
      .get(`/api/v1/lecture/${lectureId}/comments`)
      .set("Cookie", [token]);

    // Expected: 200 OK with empty comments array
    expect(response.status).toBe(200);
    if (response.status === 200) {
      expect(response.body.success).toBe(true);
      expect(response.body.data.comments).toEqual([]);
    }

    // Verify DB state
    const commentCount = await Comment.countDocuments({
      lectureId: new mongoose.Types.ObjectId(lectureId),
    });
    expect(commentCount).toBe(0);
  });

  it("should fetch comments with user info when lecture has comments", async () => {
    // Create comments for the lecture
    await Comment.create([
      {
        lectureId: new mongoose.Types.ObjectId(lectureId),
        userId: new mongoose.Types.ObjectId(userId),
        content: "First comment",
        likes: 5,
        dislikes: 1,
      },
      {
        lectureId: new mongoose.Types.ObjectId(lectureId),
        userId: new mongoose.Types.ObjectId(userId),
        content: "Second comment",
        likes: 3,
        dislikes: 0,
      },
    ]);

    const response = await request(app)
      .get(`/api/v1/lecture/${lectureId}/comments`)
      .set("Cookie", [token]);

    // Expected: 200 OK with populated comments
    expect(response.status).toBe(200);
    if (response.status === 200) {
      expect(response.body.data.comments).toHaveLength(2);
    }

    // Verify DB state
    const commentCount = await Comment.countDocuments({
      lectureId: new mongoose.Types.ObjectId(lectureId),
    });
    expect(commentCount).toBe(2);
  });

  it("should only return comments for the specified lecture", async () => {
    // Create another lecture
    const anotherLecture = await Lecture.create({
      title: "Another Lecture",
      slug: "another-lecture",
      courseId: new mongoose.Types.ObjectId(courseId),
      description: "Another description",
      videoUrl: "https://example.com/video2.mp4",
      publicId: "another-public-id",
      order: 2,
    });

    // Create comments for both lectures
    await Comment.create([
      {
        lectureId: new mongoose.Types.ObjectId(lectureId),
        userId: new mongoose.Types.ObjectId(userId),
        content: "Comment on first lecture",
      },
      {
        lectureId: anotherLecture._id,
        userId: new mongoose.Types.ObjectId(userId),
        content: "Comment on second lecture",
      },
    ]);

    const response = await request(app)
      .get(`/api/v1/lecture/${lectureId}/comments`)
      .set("Cookie", [token]);

    // Expected: 200 OK with only comments for specified lecture
    expect(response.status).toBe(200);
    if (response.status === 200) {
      expect(response.body.data.comments).toHaveLength(1);
    }

    // Verify total DB state
    const totalComments = await Comment.countDocuments();
    expect(totalComments).toBe(2);
  });
});
