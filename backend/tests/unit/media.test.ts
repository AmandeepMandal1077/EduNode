import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import { User, Role } from "../../src/models/user.model.js";
import { MediaUpload, EMediaUploadStatus } from "../../src/models/mediaUpload.model.js";
import { loginUser } from "../setup.js";
import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

describe("Media Routes", () => {
  let userCookie: string;
  let adminCookie: string;
  let testUserId: string;

  beforeEach(async () => {
    // Create standard user
    const user = await User.create({
      name: "Test User",
      email: "test@example.com",
      password: "password123",
      role: Role.STUDENT,
    });
    testUserId = (user._id as mongoose.Types.ObjectId).toString();
    userCookie = await loginUser(app, "test@example.com", "password123");

    // Create admin user
    await User.create({
      name: "Admin User",
      email: "admin@example.com",
      password: "password123",
      role: Role.ADMIN,
    });
    adminCookie = await loginUser(app, "admin@example.com", "password123");
  });

  describe("POST /api/v1/media/upload-session", () => {
    it("should allow a user to request an avatar upload session", async () => {
      const res = await request(app)
        .post("/api/v1/media/upload-session")
        .set("Cookie", userCookie)
        .send({
          type: "avatar",
          entityId: testUserId,
          fileName: "avatar.png",
          contentType: "image/png",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.uploadSessionId).toBeDefined();
      expect(res.body.data.presignedUrl).toContain("mock-presigned-url");
      expect(res.body.data.s3Key).toContain(`avatars/users/${testUserId}/`);
    });

    it("should reject avatar upload if entityId does not match user id", async () => {
      const otherUserId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .post("/api/v1/media/upload-session")
        .set("Cookie", userCookie)
        .send({
          type: "avatar",
          entityId: otherUserId,
          fileName: "avatar.png",
          contentType: "image/png",
        });

      expect(res.status).toBe(403);
    });
  });

  describe("Internal Media Routes", () => {
    let testS3Key: string;

    beforeEach(async () => {
      testS3Key = "test-s3-key";
      await MediaUpload.create({
        uploadSessionId: uuidv4(),
        userId: new mongoose.Types.ObjectId(testUserId),
        entityType: "avatar",
        entityId: testUserId,
        s3Key: testS3Key,
        status: EMediaUploadStatus.PENDING_UPLOAD,
        presignedUrlExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
      });
    });

    it("should allow Lambda to confirm upload with correct secret", async () => {
      const res = await request(app)
        .post("/api/v1/internal/media/confirm-upload")
        .set("x-internal-secret", process.env.INTERNAL_API_SECRET || "test-internal-secret")
        .send({
          s3Key: testS3Key,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("should reject internal route access without correct secret", async () => {
      const res = await request(app)
        .post("/api/v1/internal/media/confirm-upload")
        .set("x-internal-secret", "wrong-secret")
        .send({
          s3Key: testS3Key,
        });

      expect(res.status).toBe(403);
    });
  });
});
