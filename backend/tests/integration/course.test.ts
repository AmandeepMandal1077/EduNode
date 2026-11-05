import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import { User, Role } from "../../src/models/user.model.js";
import { Course, CourseLevel } from "../../src/models/course.model.js";
import { Lecture, EUploadStatus } from "../../src/models/lecture.model.js";
import { Announcement } from "../../src/models/announcement.model.js";
import { loginUser } from "../setup.js";
import mongoose from "mongoose";

describe("Course Controller Integration Tests", () => {
  const instructorUser = {
    name: "Instructor User",
    email: "instructor@example.com",
    password: "Password123!",
    role: Role.INSTRUCTOR,
  };

  const studentUser = {
    name: "Student User",
    email: "student@example.com",
    password: "Password123!",
    role: Role.STUDENT,
  };

  let instructorToken: string;
  let studentToken: string;
  let instructorId: string;

  beforeEach(async () => {
    // Create users
    const inst = await User.create(instructorUser);
    instructorId = inst._id.toString();
    await User.create(studentUser);

    // Login users
    instructorToken = await loginUser(app, instructorUser.email, instructorUser.password);
    studentToken = await loginUser(app, studentUser.email, studentUser.password);
  });

  it("1. POST /api/v1/courses should allow instructor to create a course", async () => {
    const response = await request(app)
      .post("/api/v1/courses")
      .set("Cookie", [instructorToken])
      .send({
        title: "Test Course Title",
        subtitle: "Test Subtitle",
        description: "Test Description",
        category: "Tech",
        level: CourseLevel.BEGINNER,
        price: 100,
        thumbnail: "http://example.com/thumbnail.png",
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.course.title).toBe("Test Course Title");
    expect(response.body.data.course.instructor).toBe(instructorId);
  });

  it("2. POST /api/v1/courses with missing fields should return 400", async () => {
    const response = await request(app)
      .post("/api/v1/courses")
      .set("Cookie", [instructorToken])
      .send({
        title: "", // invalid
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe("error");
  });

  it("3. PATCH /api/v1/courses/:courseId by non-owner should return 403", async () => {
    const course = await Course.create({
      title: "Some Course",
      subtitle: "Sub",
      description: "Desc",
      category: "Tech",
      level: CourseLevel.BEGINNER,
      price: 50,
      instructor: new mongoose.Types.ObjectId(instructorId),
      thumbnail: "http://example.com/thumbnail.png",
    });

    const response = await request(app)
      .patch(`/api/v1/courses/${course._id}`)
      .set("Cookie", [studentToken])
      .send({
        title: "Hacked Title",
      });

    expect(response.status).toBe(403);
    expect(response.body.message).toBe("Unauthorized");
  });

  it("4. GET /api/v1/courses/published should return only published courses", async () => {
    // 1 published course
    await Course.create({
      title: "Published Course",
      subtitle: "Sub",
      description: "Desc",
      category: "Tech",
      level: CourseLevel.BEGINNER,
      price: 10,
      instructor: new mongoose.Types.ObjectId(instructorId),
      isPublished: true,
      thumbnail: "http://example.com/thumbnail.png",
    });

    // 1 unpublished (draft) course
    await Course.create({
      title: "Draft Course",
      subtitle: "Sub",
      description: "Desc",
      category: "Tech",
      level: CourseLevel.BEGINNER,
      price: 10,
      instructor: new mongoose.Types.ObjectId(instructorId),
      isPublished: false,
      thumbnail: "http://example.com/thumbnail.png",
    });

    const response = await request(app).get("/api/v1/courses/published");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.courses).toHaveLength(1);
    expect(response.body.data.courses[0].title).toBe("Published Course");
  });

  it("5. GET /api/v1/courses/search should search courses by query", async () => {
    await Course.create({
      title: "Advanced React Patterns",
      subtitle: "Sub",
      description: "Desc",
      category: "Tech",
      level: CourseLevel.ADVANCE,
      price: 150,
      instructor: new mongoose.Types.ObjectId(instructorId),
      isPublished: true,
      thumbnail: "http://example.com/thumbnail.png",
    });

    const response = await request(app)
      .get("/api/v1/courses/search")
      .query({ searchString: "React" });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.courses.length).toBeGreaterThan(0);
    expect(response.body.data.courses[0].title).toBe("Advanced React Patterns");
  });

  it("6. GET /api/v1/courses/search with empty searchString should return 400", async () => {
    const response = await request(app)
      .get("/api/v1/courses/search")
      .query({ searchString: "" });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Search string is required");
  });

  it("7. POST /api/v1/courses/:courseId/announce should create announcement inside transaction", async () => {
    const course = await Course.create({
      title: "Announcement Course",
      subtitle: "Sub",
      description: "Desc",
      category: "Tech",
      level: CourseLevel.BEGINNER,
      price: 0,
      instructor: new mongoose.Types.ObjectId(instructorId),
      thumbnail: "http://example.com/thumbnail.png",
    });

    const response = await request(app)
      .post(`/api/v1/courses/${course._id}/announce`)
      .set("Cookie", [instructorToken])
      .send({
        message: "Welcome to the course!",
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    const announcements = await Announcement.find({ courseId: course._id });
    expect(announcements).toHaveLength(1);
    expect(announcements[0]?.message).toBe("Welcome to the course!");

    const updatedCourse = await Course.findById(course._id);
    expect(updatedCourse?.announcements).toHaveLength(1);
  });

  it("8. GET /api/v1/courses/:courseId should return a published course without auth", async () => {
    const course = await Course.create({
      title: "Public Course",
      subtitle: "Sub",
      description: "Desc",
      category: "Tech",
      level: CourseLevel.BEGINNER,
      price: 50,
      instructor: new mongoose.Types.ObjectId(instructorId),
      isPublished: true,
      thumbnail: "http://example.com/thumbnail.png",
    });

    const response = await request(app).get(`/api/v1/courses/${course._id}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.course.title).toBe("Public Course");
  });

  it("9. GET /api/v1/courses/:courseId should require auth for a draft course", async () => {
    const course = await Course.create({
      title: "Draft Course",
      subtitle: "Sub",
      description: "Desc",
      category: "Tech",
      level: CourseLevel.BEGINNER,
      price: 50,
      instructor: new mongoose.Types.ObjectId(instructorId),
      isPublished: false,
      thumbnail: "http://example.com/thumbnail.png",
    });

    const guestResponse = await request(app).get(`/api/v1/courses/${course._id}`);
    expect(guestResponse.status).toBe(401);

    const ownerResponse = await request(app)
      .get(`/api/v1/courses/${course._id}`)
      .set("Cookie", [instructorToken]);
    expect(ownerResponse.status).toBe(200);
    expect(ownerResponse.body.data.course.title).toBe("Draft Course");

    const otherResponse = await request(app)
      .get(`/api/v1/courses/${course._id}`)
      .set("Cookie", [studentToken]);
    expect(otherResponse.status).toBe(404);
  });

  it("10. GET /api/v1/courses/:courseId/lectures should be public for a published course", async () => {
    const course = await Course.create({
      title: "Lecture Course",
      subtitle: "Sub",
      description: "Desc",
      category: "Tech",
      level: CourseLevel.BEGINNER,
      price: 50,
      instructor: new mongoose.Types.ObjectId(instructorId),
      isPublished: true,
      thumbnail: "http://example.com/thumbnail.png",
    });

    const lecture = await Lecture.create({
      title: "First Lecture",
      slug: "first-lecture",
      courseId: course._id,
      description: "Desc",
      videoUrl: "http://example.com/video.m3u8",
      storageKey: "root/courses/x/lectures/y/video.mp4",
      uploadSessionId: "session-public-lectures",
      uploadStatus: EUploadStatus.READY,
    });

    await Course.findByIdAndUpdate(course._id, {
      $push: { lectures: lecture._id },
    });

    const response = await request(app).get(
      `/api/v1/courses/${course._id}/lectures`,
    );

    expect(response.status).toBe(200);
    expect(response.body.data.lectures.lectures).toHaveLength(1);
    expect(response.body.data.lectures.lectures[0].title).toBe("First Lecture");
  });
});
