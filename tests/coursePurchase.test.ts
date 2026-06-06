import {
  describe,
  it,
  expect,
  beforeEach,
  beforeAll,
  afterAll,
  vi,
} from "vitest";
import request from "supertest";
import { User } from "../src/models/user.model.js";
import { Course, CourseLevel } from "../src/models/course.model.js";
import {
  CoursePurchase,
  PaymentStatus,
} from "../src/models/coursePurchase.model.js";
import mongoose from "mongoose";
import connectdb from "../src/database/db.js";

// Mock Stripe before importing app
vi.mock("stripe", () => {
  class MockStripe {
    checkout = {
      sessions: {
        create: vi.fn().mockResolvedValue({
          id: "cs_test_session_id",
          url: "https://checkout.stripe.com/test-session",
        }),
        retrieve: vi.fn().mockResolvedValue({
          id: "cs_test_session_id",
          payment_status: "paid",
          amount_total: 10000,
          metadata: {
            userId: "test-user-id",
            courseId: "test-course-id",
            courseOrderId: "test-order-id",
          },
          payment_intent: "pi_test_payment_intent",
        }),
      },
    };
    webhooks = {
      constructEventAsync: vi.fn(),
    };
  }
  return { default: MockStripe };
});

// Import app after mock
import app from "../src/app.js";

describe("Course Purchase Controller Integration Tests", () => {
  beforeAll(async () => {
    await connectdb();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  const userData = {
    name: "Test User",
    email: "purchasetest@example.com",
    password: "Password123!",
  };

  let token: string;
  let userId: string;
  let courseId: string;

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
    await CoursePurchase.deleteMany({});

    // Create user
    const user = await User.create(userData);
    userId = user._id.toString();
    token = await loginUser(userData.email, userData.password);

    // Create a course
    const course = await Course.create({
      title: "Premium Course",
      subtitle: "Learn everything",
      description: "A premium course for testing",
      category: "Technology",
      level: CourseLevel.INTERMEDIATE,
      price: 100,
      thumbnail: "premium-thumbnail.jpg",
      instructor: new mongoose.Types.ObjectId(userId),
      isPublished: true,
    });
    courseId = course._id.toString();
  });

  /**
   * POST /api/v1/payments/create-checkout-session
   */
  it("should return 401 when creating checkout session without authentication", async () => {
    const response = await request(app)
      .post("/api/v1/payments/create-checkout-session")
      .send({ courseId });

    expect(response.status).toBe(401);
  });

  it("should return 400 for invalid courseId format", async () => {
    const response = await request(app)
      .post("/api/v1/payments/create-checkout-session")
      .set("Cookie", [token])
      .send({ courseId: "invalid-id" });

    expect(response.status).toBe(400);
  });

  it("should return 404 when course does not exist", async () => {
    const nonExistentCourseId = new mongoose.Types.ObjectId().toString();

    const response = await request(app)
      .post("/api/v1/payments/create-checkout-session")
      .set("Cookie", [token])
      .send({ courseId: nonExistentCourseId });

    expect(response.status).toBe(404);
  });

  it("should create checkout session for valid course", async () => {
    const response = await request(app)
      .post("/api/v1/payments/create-checkout-session")
      .set("Cookie", [token])
      .send({ courseId });

    // Expected: 200 OK with checkout URL
    expect(response.status).toBe(200);
    if (response.status === 200) {
      expect(response.body.success).toBe(true);
      expect(response.body.data.url).toBeDefined();
    }

    // Verify DB state - CoursePurchase record should be created
    const purchaseCount = await CoursePurchase.countDocuments({
      user: new mongoose.Types.ObjectId(userId),
      course: new mongoose.Types.ObjectId(courseId),
    });
    expect(purchaseCount).toBe(1);
  });

  it("should return 400 when course already purchased", async () => {
    // Create a completed purchase
    await CoursePurchase.create({
      user: new mongoose.Types.ObjectId(userId),
      course: new mongoose.Types.ObjectId(courseId),
      amount: 100,
      currency: "INR",
      status: PaymentStatus.COMPLETED,
      paymentMethod: "card",
      paymentId: "pi_completed",
    });

    const response = await request(app)
      .post("/api/v1/payments/create-checkout-session")
      .set("Cookie", [token])
      .send({ courseId });

    expect(response.status).toBe(400);
  });

  /**
   * GET /api/v1/payments/course/:courseId/detail-with-status
   */
  it("should return 401 when getting purchase status without authentication", async () => {
    const response = await request(app).get(
      `/api/v1/payments/course/${courseId}/detail-with-status`,
    );

    expect(response.status).toBe(401);
  });

  it("should return 400 for invalid courseId when getting status", async () => {
    const response = await request(app)
      .get("/api/v1/payments/course/invalid-id/detail-with-status")
      .set("Cookie", [token]);

    expect(response.status).toBe(400);
  });

  it("should return 404 when course not purchased", async () => {
    const response = await request(app)
      .get(`/api/v1/payments/course/${courseId}/detail-with-status`)
      .set("Cookie", [token]);

    expect(response.status).toBe(404);
  });

  it("should get purchase status for purchased course", async () => {
    // Create a purchase record
    await CoursePurchase.create({
      user: new mongoose.Types.ObjectId(userId),
      course: new mongoose.Types.ObjectId(courseId),
      amount: 100,
      currency: "INR",
      status: PaymentStatus.COMPLETED,
      paymentMethod: "card",
      paymentId: "pi_test",
    });

    const response = await request(app)
      .get(`/api/v1/payments/course/${courseId}/detail-with-status`)
      .set("Cookie", [token]);

    expect(response.status).toBe(200);
    if (response.status === 200) {
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe(PaymentStatus.COMPLETED);
    }
  });

  /**
   * GET /api/v1/payments - Get All Purchased Courses
   */
  it("should return 401 when getting purchased courses without authentication", async () => {
    const response = await request(app).get("/api/v1/payments");

    expect(response.status).toBe(401);
  });

  it("should return empty array when no courses purchased", async () => {
    const response = await request(app)
      .get("/api/v1/payments")
      .set("Cookie", [token]);

    expect(response.status).toBe(200);
    if (response.status === 200) {
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    }
  });

  it("should return purchased courses list", async () => {
    // Create a completed purchase
    await CoursePurchase.create({
      user: new mongoose.Types.ObjectId(userId),
      course: new mongoose.Types.ObjectId(courseId),
      amount: 100,
      currency: "INR",
      status: PaymentStatus.COMPLETED,
      paymentMethod: "card",
      paymentId: "pi_test",
    });

    await User.findByIdAndUpdate(userId, {
      $push: {
        enrolledCourses: { course: new mongoose.Types.ObjectId(courseId) },
      },
    });

    const response = await request(app)
      .get("/api/v1/payments")
      .set("Cookie", [token]);

    expect(response.status).toBe(200);
    if (response.status === 200) {
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toBe("Premium Course");
    }
  });

  it("should only return completed purchases, not pending ones", async () => {
    // Create pending purchase
    await CoursePurchase.create({
      user: new mongoose.Types.ObjectId(userId),
      course: new mongoose.Types.ObjectId(courseId),
      amount: 100,
      currency: "INR",
      status: PaymentStatus.PENDING,
      paymentMethod: "card",
      paymentId: "pi_pending",
    });

    const response = await request(app)
      .get("/api/v1/payments")
      .set("Cookie", [token]);

    expect(response.status).toBe(200);
    if (response.status === 200) {
      expect(response.body.data).toEqual([]);
    }

    // Verify DB state
    const pendingCount = await CoursePurchase.countDocuments({
      status: PaymentStatus.PENDING,
    });
    expect(pendingCount).toBe(1);
  });
});
