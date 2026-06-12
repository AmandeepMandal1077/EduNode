import { describe, it, expect, beforeEach, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import { User, Role } from "../src/models/user.model.js";
import { Course, CourseLevel } from "../src/models/course.model.js";
import mongoose from "mongoose";
import path from "path";
import connectdb from "../src/database/db.js";

describe("Course Controller Integration Tests", () => {
  beforeAll(async () => {
    await connectdb();
    await Course.syncIndexes();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });
  // Mock data
  const instructorData = {
    name: "Instructor User",
    email: "instructor@example.com",
    password: "Password123!",
  };

  const studentData = {
    name: "Student User",
    email: "student@example.com",
    password: "Password123!",
  };

  let instructorToken: string;
  let studentToken: string;
  let instructorId: string;

  // Helpers
  const loginUser = async (email: string, password: string) => {
    const response = await request(app).post("/api/v1/users/signin").send({
      email,
      password,
    });
    const cookies = response.headers["set-cookie"];
    if (!cookies) throw new Error("No cookies set");
    return cookies[0].split(";")[0];
  };

  beforeEach(async () => {
    await User.deleteMany({});
    await Course.deleteMany({});

    // Create Instructor
    const instructor = await User.create({
      ...instructorData,
    });
    instructorId = instructor._id.toString();
    instructorToken = await loginUser(
      instructorData.email,
      instructorData.password,
    );

    // Create Student
    await User.create(studentData);
    studentToken = await loginUser(studentData.email, studentData.password);
  });

  /**
   * Create Course Tests
   */
  describe("POST /api/v1/courses", () => {
    it("should allow instructor to create a course", async () => {
      // NOTE: The controller requires `thumbnail` in req.body.
      // But the route uses upload.single('thumbnail').
      // We will assume for the test that sending the field is enough or the controller
      // is expected to handle the file.
      // Current controller logic requires req.body.thumbnail explicitly.
      // We will send a dummy thumbnail string to satisfy validation, AND attach a file.

      const response = await request(app)
        .post("/api/v1/courses")
        .set("Cookie", [instructorToken])
        .field("title", "Test Course")
        .field("subtitle", "Test Subtitle")
        .field("description", "Test Description")
        .field("category", "Tech")
        .field("level", CourseLevel.BEGINNER)
        .field("price", 100)
        .field("thumbnail", "dummy-thumbnail-path") // Satisfy body validation
        .attach("thumbnail", Buffer.from("dummy-image"), "thumbnail.jpg");

      if (response.status !== 201) {
        console.log(
          "Create Course Failed Response:",
          JSON.stringify(response.body, null, 2),
        );
      }

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.course.title).toBe("Test Course");
      expect(response.body.data.course.instructor).toBe(instructorId);
    });

    it("should allow any user to create a course", async () => {
      const response = await request(app)
        .post("/api/v1/courses")
        .set("Cookie", [studentToken])
        .field("title", "Student Course")
        .field("subtitle", "Student Subtitle")
        .field("description", "Student Description")
        .field("category", "Student Category")
        .field("level", CourseLevel.BEGINNER)
        .field("price", 50)
        .field("thumbnail", "path")
        .attach("thumbnail", Buffer.from("dummy"), "thumb.jpg");

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it("should return 400 if fields are missing", async () => {
      const response = await request(app)
        .post("/api/v1/courses")
        .set("Cookie", [instructorToken])
        .send({
          title: "", // Missing title
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe("error");
    });
  });

  /**
   * Search Courses Tests
   */
  describe("GET /api/v1/courses/search", () => {
    beforeEach(async () => {
      await Course.create({
        title: "Advanced React",
        subtitle: "Deep dive",
        description: "Learn advanced patterns",
        category: "Web Dev",
        level: CourseLevel.ADVANCE,
        price: 200,
        thumbnail: "react.jpg",
        instructor: new mongoose.Types.ObjectId(instructorId),
        isPublished: true,
      });
    });

    it("should search courses by string", async () => {
      // Route is GET /search but controller reads req.body.searchString
      // GET requests with body are unconventional but supported by some clients/servers.
      // Ideally should be query param. Testing as implemented.

      const response = await request(app)
        .get("/api/v1/courses/search")
        .query({ searchString: "React" });

      if (response.status !== 200) {
        console.log(
          "Search Failed Response:",
          JSON.stringify(response.body, null, 2),
        );
      }

      expect(response.status).toBe(200);
      expect(response.body.data.courses.length).toBeGreaterThan(0);
      expect(response.body.data.courses[0].title).toBe("Advanced React");
    });

    it("should return 400 if searchString is missing", async () => {
      const response = await request(app).get("/api/v1/courses/search");

      expect(response.status).toBe(400);
    });
  });

  /**
   * Published Courses Tests
   */
  describe("GET /api/v1/courses/published", () => {
    beforeEach(async () => {
      // Published course
      await Course.create({
        title: "Published Course",
        subtitle: "Sub",
        description: "Desc",
        category: "Cat",
        level: CourseLevel.BEGINNER,
        price: 10,
        thumbnail: "p.jpg",
        instructor: new mongoose.Types.ObjectId(instructorId),
        isPublished: true,
      });
      // Unpublished course
      await Course.create({
        title: "Draft Course",
        subtitle: "Sub",
        description: "Desc",
        category: "Cat",
        level: CourseLevel.BEGINNER,
        price: 10,
        thumbnail: "d.jpg",
        instructor: new mongoose.Types.ObjectId(instructorId),
        isPublished: false,
      });
    });

    it("should return only published courses", async () => {
      const response = await request(app).get("/api/v1/courses/published");

      expect(response.status).toBe(200);
      expect(response.body.data.courses).toBeDefined();
      const courses = response.body.data.courses;

      const titles = courses.map((c: any) => c.title);
      expect(titles).toContain("Published Course");
      expect(titles).not.toContain("Draft Course");
      expect(courses.every((c: any) => c.isPublished === true)).toBe(true);
      expect(courses.length).toBeGreaterThanOrEqual(1);
    });
  });

  /**
   * Get My Courses Tests
   */
  describe("GET /api/v1/courses", () => {
    // Route for my-courses is: router.route("/").get(restrictTo(Role.INSTRUCTOR), getMyCreatedCourses);

    it("should return courses created by the instructor", async () => {
      // Create a course for this instructor
      await Course.create({
        title: "My Course",
        subtitle: "Sub",
        description: "Desc",
        category: "Cat",
        level: CourseLevel.BEGINNER,
        price: 10,
        thumbnail: "m.jpg",
        instructor: new mongoose.Types.ObjectId(instructorId),
      });

      const response = await request(app)
        .get("/api/v1/courses/")
        .set("Cookie", [instructorToken]);

      expect(response.status).toBe(200);
      expect(response.body.data.courses.length).toBeGreaterThan(0);
      expect(response.body.data.courses[0].instructor.toString()).toBe(
        instructorId,
      );
    });
  });

  /**
   * Course Details & Update Tests
   */
  describe("Course Details & Update", () => {
    let courseId: string;

    beforeEach(async () => {
      const course = await Course.create({
        title: "Original Title",
        subtitle: "Sub",
        description: "Desc",
        category: "Cat",
        level: CourseLevel.BEGINNER,
        price: 50,
        thumbnail: "thumb.jpg",
        instructor: new mongoose.Types.ObjectId(instructorId),
      });
      courseId = course._id.toString();
    });

    it("should get course details", async () => {
      const response = await request(app)
        .get(`/api/v1/courses/c/${courseId}`)
        .set("Cookie", [instructorToken]); // Protected route? route file says: router.route("/c/:courseId").get(getCourseDetails) under "Protected routes" block?
      // Checking route file: "router.use(authenticateUserMiddleware)" is above it. So yes, protected.

      expect(response.status).toBe(200);
      expect(response.body.data.course.title).toBe("Original Title");
    });

    it("should update course details", async () => {
      const response = await request(app)
        .patch(`/api/v1/courses/c/${courseId}`)
        .set("Cookie", [instructorToken])
        .field("title", "Updated Title")
        .field("price", 99);

      expect(response.status).toBe(200);
      expect(response.body.data.course.title).toBe("Updated Title");
      expect(response.body.data.course.price).toBe(99);
    });

    it("should not allow non-creator to update course", async () => {
      const response = await request(app)
        .patch(`/api/v1/courses/c/${courseId}`)
        .set("Cookie", [studentToken])
        .field("title", "Hacked Title");

      expect([401, 403]).toContain(response.status);
    });
  });

  /**
   * Lecture Tests
   */
  describe("Lecture Management", () => {
    let courseId: string;

    beforeEach(async () => {
      const course = await Course.create({
        title: "Lecture Course",
        subtitle: "Sub",
        description: "Desc",
        category: "Cat",
        level: CourseLevel.BEGINNER,
        price: 50,
        thumbnail: "thumb.jpg",
        instructor: new mongoose.Types.ObjectId(instructorId),
      });
      courseId = course._id.toString();
    });

    it("should add a lecture to the course", async () => {
      // Controller: addLectureToCourse
      // Uses: req.file?.path for videoUrl

      const response = await request(app)
        .post(`/api/v1/courses/c/${courseId}/lectures`)
        .set("Cookie", [instructorToken])
        .field("title", "Lecture 1")
        .field("description", "Intro to lecture")
        .attach("video", Buffer.from("dummy-video-content"), "video.mp4");

      // NOTE: If using mock fs/uploads, this might fail if path is invalid?
      // But we are not testing actual file storage, just that controller accepts it.
      // However, middleware 'upload' might try to save to disk/cloudinary.
      // If 'utils/multer.js' uses Cloudinary, this test will fail w/o network/mock.
      // If it uses diskStorage, it might work.
      // Assuming test environment handles this or it fails and we diagnose.

      // If it fails due to Cloudinary, we might need to mock multer middleware in setup.
      // But let's try.

      if (response.status !== 201) {
        console.log("Add Lecture Failed:", response.body);
      }

      expect(response.status).toBe(201);
      expect(response.body.data.lecture.title).toBe("Lecture 1");

      // Verify course was updated
      const course = await Course.findById(courseId);
      expect(course?.totalLectures).toBe(1);
    });

    it("should get course lectures", async () => {
      // First add one manually or via helpers if needed, but for now we test empty list or after adding
      // Let's rely on finding 0 lectures first
      const response = await request(app)
        .get(`/api/v1/courses/c/${courseId}/lectures`)
        .set("Cookie", [instructorToken]);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined(); // Controller returns 'data: lectures' which is an object { lectures: [] }?
      // check controller: res...json({ data: lectures }) where lectures = await Course...select('lectures')
      // so data is the course object with only lectures field?
    });
  });
});
