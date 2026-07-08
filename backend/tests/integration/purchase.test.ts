import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import { User, Role } from "../../src/models/user.model.js";
import { Course, CourseLevel } from "../../src/models/course.model.js";
import { CoursePurchase, PaymentStatus } from "../../src/models/coursePurchase.model.js";
import { CourseProgress } from "../../src/models/courseProgress.model.js";
import { loginUser } from "../setup.js";
import mongoose from "mongoose";

describe("Course Purchase Controller Integration Tests", () => {
  const studentUser = {
    name: "Purchase Student",
    email: "student@example.com",
    password: "Password123!",
    role: Role.STUDENT,
  };

  let token: string;
  let userId: string;
  let courseId: string;

  beforeEach(async () => {
    const student = await User.create(studentUser);
    userId = student._id.toString();

    token = await loginUser(app, studentUser.email, studentUser.password);

    // Create a published premium course
    const course = await Course.create({
      title: "Premium Course",
      subtitle: "Sub",
      description: "Desc",
      category: "Tech",
      level: CourseLevel.BEGINNER,
      price: 100,
      instructor: new mongoose.Types.ObjectId(),
      isPublished: true,
      thumbnail: "http://example.com/thumbnail.png",
    });
    courseId = course._id.toString();
  });

  it("1. POST /api/v1/payments/create-checkout-session should create checkout session successfully", async () => {
    const response = await request(app)
      .post("/api/v1/payments/create-checkout-session")
      .set("Cookie", [token])
      .send({ courseId });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.url).toBe("https://checkout.stripe.com/test-session");

    const purchases = await CoursePurchase.find({ user: userId, course: courseId });
    expect(purchases).toHaveLength(1);
    expect(purchases[0]?.status).toBe(PaymentStatus.PENDING);
  });

  it("2. POST /api/v1/payments/create-checkout-session already purchased should return 400", async () => {
    await CoursePurchase.create({
      user: new mongoose.Types.ObjectId(userId),
      course: new mongoose.Types.ObjectId(courseId),
      amount: 100,
      currency: "inr",
      status: PaymentStatus.COMPLETED,
      paymentMethod: "card",
      paymentId: "pi_mock",
    });

    const response = await request(app)
      .post("/api/v1/payments/create-checkout-session")
      .set("Cookie", [token])
      .send({ courseId });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Course already purchased");
  });

  it("3. POST /api/v1/payments/create-checkout-session with non-existent course should return 404", async () => {
    const randomId = new mongoose.Types.ObjectId().toString();
    const response = await request(app)
      .post("/api/v1/payments/create-checkout-session")
      .set("Cookie", [token])
      .send({ courseId: randomId });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Course not found");
  });

  it("4. POST /api/v1/payments/create-checkout-session with invalid courseId should return 400", async () => {
    const response = await request(app)
      .post("/api/v1/payments/create-checkout-session")
      .set("Cookie", [token])
      .send({ courseId: "invalid-id" });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Invalid course id");
  });

  it("5. GET /api/v1/payments/course/:courseId/detail-with-status when purchased should return isPurchased=true", async () => {
    await CoursePurchase.create({
      user: new mongoose.Types.ObjectId(userId),
      course: new mongoose.Types.ObjectId(courseId),
      amount: 100,
      currency: "inr",
      status: PaymentStatus.COMPLETED,
      paymentMethod: "card",
      paymentId: "pi_mock",
    });

    const response = await request(app)
      .get(`/api/v1/payments/course/${courseId}/detail-with-status`)
      .set("Cookie", [token]);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.isPurchased).toBe(true);
    expect(response.body.data.status).toBe(PaymentStatus.COMPLETED);
  });

  it("6. GET /api/v1/payments/course/:courseId/detail-with-status when not purchased should return isPurchased=false", async () => {
    const response = await request(app)
      .get(`/api/v1/payments/course/${courseId}/detail-with-status`)
      .set("Cookie", [token]);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.isPurchased).toBe(false);
    expect(response.body.data.status).toBeNull();
  });

  it("7. GET /api/v1/payments (purchase history) should return history", async () => {
    await CoursePurchase.create({
      user: new mongoose.Types.ObjectId(userId),
      course: new mongoose.Types.ObjectId(courseId),
      amount: 100,
      currency: "inr",
      status: PaymentStatus.COMPLETED,
      paymentMethod: "card",
      paymentId: "pi_mock",
    });

    const response = await request(app)
      .get("/api/v1/payments")
      .set("Cookie", [token]);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.purchases).toHaveLength(1);
    expect(response.body.data.purchases[0].course._id).toBe(courseId);
  });

  it("8. POST /api/v1/payments/enroll-free should enroll student inside transaction", async () => {
    const freeCourse = await Course.create({
      title: "Free Course",
      subtitle: "Sub",
      description: "Desc",
      category: "Tech",
      level: CourseLevel.BEGINNER,
      price: 0,
      instructor: new mongoose.Types.ObjectId(),
      isPublished: true,
      thumbnail: "http://example.com/thumbnail.png",
    });

    const response = await request(app)
      .post("/api/v1/payments/enroll-free")
      .set("Cookie", [token])
      .send({ courseId: freeCourse._id.toString() });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    const purchase = await CoursePurchase.findOne({
      user: userId,
      course: freeCourse._id,
    });
    expect(purchase).toBeTruthy();
    expect(purchase?.status).toBe(PaymentStatus.COMPLETED);
    expect(purchase?.amount).toBe(0);

    const updatedCourse = await Course.findById(freeCourse._id);
    expect(updatedCourse?.enrolledStudents).toHaveLength(1);

    const progress = await CourseProgress.findOne({
      user: userId,
      course: freeCourse._id,
    });
    expect(progress).toBeTruthy();
  });
});
