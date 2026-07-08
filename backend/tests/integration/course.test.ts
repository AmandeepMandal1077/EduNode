import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import { User, Role } from "../../src/models/user.model.js";
import { Course, CourseLevel } from "../../src/models/course.model.js";
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
});
