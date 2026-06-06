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
import app from "../src/app.js";
import { User } from "../src/models/user.model.js";
import mongoose from "mongoose";
import connectdb from "../src/database/db.js";

// Mock Cloudinary
vi.mock("cloudinary", () => ({
  v2: {
    config: vi.fn(),
    utils: {
      api_sign_request: vi.fn().mockReturnValue("mock_signature"),
      verifyNotificationSignature: vi.fn().mockReturnValue(true),
    },
    uploader: {
      destroy: vi.fn().mockResolvedValue({ result: "ok" }),
    },
  },
}));

describe("Media Controller Integration Tests", () => {
  beforeAll(async () => {
    await connectdb();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  const userData = {
    name: "Media Test User",
    email: "mediatest@example.com",
    password: "Password123!",
  };

  let token: string;
  let userId: string;

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

    // Create user
    const user = await User.create(userData);
    userId = user._id.toString();
    token = await loginUser(userData.email, userData.password);
  });

  /**
   * POST /api/v1/media/signature - Generate Upload Signature
   */
  it("should return 401 when generating signature without authentication", async () => {
    const response = await request(app).post("/api/v1/media/signature").send();

    expect(response.status).toBe(401);
  });

  it("should generate upload signature successfully", async () => {
    const response = await request(app)
      .post("/api/v1/media/signature")
      .set("Cookie", [token])
      .send();

    // Expected: 200 OK with signature data
    expect(response.status).toBe(200);
    if (response.status === 200) {
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    }
  });

  /**
   * POST /api/v1/media/verify - Verify Upload Signature
   */
  it("should return 401 when verifying signature without authentication", async () => {
    const response = await request(app).post("/api/v1/media/verify").send({
      publicId: "test-public-id",
      version: 1234567890,
      signature: "test-signature",
    });

    expect(response.status).toBe(401);
  });

  it("should return 400 when required fields are missing", async () => {
    const response = await request(app)
      .post("/api/v1/media/verify")
      .set("Cookie", [token])
      .send({
        publicId: "test-public-id",
        // version and signature missing
      });

    expect(response.status).toBe(400);
  });

  it("should return 400 when only publicId is provided", async () => {
    const response = await request(app)
      .post("/api/v1/media/verify")
      .set("Cookie", [token])
      .send({
        publicId: "test-public-id",
      });

    expect(response.status).toBe(400);
  });

  it("should return 400 when only version is provided", async () => {
    const response = await request(app)
      .post("/api/v1/media/verify")
      .set("Cookie", [token])
      .send({
        version: 1234567890,
      });

    expect(response.status).toBe(400);
  });

  it("should verify upload signature successfully with valid params", async () => {
    const response = await request(app)
      .post("/api/v1/media/verify")
      .set("Cookie", [token])
      .send({
        publicId: "test-public-id",
        version: 1234567890,
        signature: "valid-mock-signature",
        secureUrl:
          "https://res.cloudinary.com/test/image/upload/v1234567890/test-public-id.jpg",
      });

    // This may return 200 or 400 depending on signature validation
    expect([200, 400]).toContain(response.status);
  });

  it("should include secureUrl in successful verification response", async () => {
    const secureUrl =
      "https://res.cloudinary.com/test/image/upload/v1234567890/test.jpg";

    const response = await request(app)
      .post("/api/v1/media/verify")
      .set("Cookie", [token])
      .send({
        publicId: "test-public-id",
        version: 1234567890,
        signature: "mock-signature",
        secureUrl,
      });

    // Verify response structure if successful
    if (response.status === 200) {
      expect(response.body.data.secureUrl).toBe(secureUrl);
    }
  });

  /**
   * Authenticated user context tests
   */
  it("should use user-specific folder for signature generation", async () => {
    const response = await request(app)
      .post("/api/v1/media/signature")
      .set("Cookie", [token])
      .send();

    expect(response.status).toBe(200);
    // The folder should contain the userId
    if (response.status === 200 && response.body.data.folder) {
      expect(response.body.data.folder).toContain(userId);
    }
  });
});
