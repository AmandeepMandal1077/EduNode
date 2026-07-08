import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import { User, Role } from "../../src/models/user.model.js";
import { Course, CourseLevel } from "../../src/models/course.model.js";
import { Lecture, EUploadStatus } from "../../src/models/lecture.model.js";
import { loginUser } from "../setup.js";
import mongoose from "mongoose";

describe("Lecture Controller Integration Tests", () => {
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
  let courseId: string;
  let lectureId: string;

  beforeEach(async () => {
    // Create users
    const inst = await User.create(instructorUser);
    instructorId = inst._id.toString();
    await User.create(studentUser);

    instructorToken = await loginUser(app, instructorUser.email, instructorUser.password);
    studentToken = await loginUser(app, studentUser.email, studentUser.password);

    // Create a course
    const course = await Course.create({
      title: "Lecture Course",
      subtitle: "Sub",
      description: "Desc",
      category: "Tech",
      level: CourseLevel.BEGINNER,
      price: 0,
      instructor: new mongoose.Types.ObjectId(instructorId),
      totalLectures: 1,
      thumbnail: "http://example.com/thumbnail.png",
    });
    courseId = course._id.toString();

    // Create a lecture
    const lecture = await Lecture.create({
      title: "Intro Lecture",
      description: "Learn basic things",
      videoUrl: "https://example.com/video.mp4",
      courseId: course._id,
      uploadStatus: EUploadStatus.COMPLETED,
      publicId: "intro-lecture-public-id",
    });
    lectureId = lecture._id.toString();

    course.lectures.push(lecture._id as mongoose.Types.ObjectId);
    await course.save();
  });

  it("1. GET /api/v1/lecture/:lectureId should return lecture details", async () => {
    const response = await request(app)
      .get(`/api/v1/lecture/${lectureId}`)
      .set("Cookie", [instructorToken]);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.lecture.title).toBe("Intro Lecture");
  });

  it("2. GET /api/v1/lecture/:lectureId with invalid ID should return 400", async () => {
    const response = await request(app)
      .get("/api/v1/lecture/invalid-id")
      .set("Cookie", [instructorToken]);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Invalid lectureId");
  });

  it("3. GET /api/v1/lecture/:lectureId for non-existent ID should return 404", async () => {
    const randomId = new mongoose.Types.ObjectId().toString();
    const response = await request(app)
      .get(`/api/v1/lecture/${randomId}`)
      .set("Cookie", [instructorToken]);

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Lecture not found");
  });

  it("4. DELETE /api/v1/lecture/:lectureId by non-instructor should return 403", async () => {
    const response = await request(app)
      .delete(`/api/v1/lecture/${lectureId}`)
      .set("Cookie", [studentToken]);

    expect(response.status).toBe(403);
    expect(response.body.message).toBe("You are not authorized to perform this action");
  });

  it("5. DELETE /api/v1/lecture/:lectureId by instructor should delete it and decrement count", async () => {
    const response = await request(app)
      .delete(`/api/v1/lecture/${lectureId}`)
      .set("Cookie", [instructorToken]);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    const deleted = await Lecture.findById(lectureId);
    expect(deleted).toBeNull();

    const updatedCourse = await Course.findById(courseId);
    expect(updatedCourse?.totalLectures).toBe(0);
    expect(updatedCourse?.lectures).not.toContain(lectureId);
  });
});
