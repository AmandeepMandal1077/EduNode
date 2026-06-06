import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import { User } from "../src/models/user.model.js";

describe("User Controller Integration Tests", () => {
  const mockUser = {
    name: "Test User",
    email: "test@example.com",
    password: "Password123!",
  };

  /**
   * Signup Tests
   */
  describe("POST /api/v1/users/signup", () => {
    it("should create a new user with valid details", async () => {
      const response = await request(app)
        .post("/api/v1/users/signup")
        .send(mockUser);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(mockUser.email);
      expect(response.body.message).toBe("User account created successfully");

      const user = await User.findOne({ email: mockUser.email });
      expect(user).toBeTruthy();
      expect(user?.name).toBe(mockUser.name);
    });

    it("should return 400 if required fields are missing", async () => {
      const response = await request(app).post("/api/v1/users/signup").send({
        email: "incomplete@example.com",
      });

      expect(response.status).toBe(400); // Zod validation catches this first
      expect(response.body.success).toBe("error");
    });

    it("should return 400 if user already exists", async () => {
      await User.create(mockUser);

      const response = await request(app)
        .post("/api/v1/users/signup")
        .send(mockUser);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("User already exists");
    });
  });

  /**
   * Signin Tests
   */
  describe("POST /api/v1/users/signin", () => {
    beforeEach(async () => {
      await User.create(mockUser);
    });

    it("should authenticate user with valid credentials", async () => {
      const response = await request(app).post("/api/v1/users/signin").send({
        email: mockUser.email,
        password: mockUser.password,
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();

      const cookies = response.headers["set-cookie"];
      expect(cookies).toBeDefined();
      expect(Array.isArray(cookies)).toBe(true);
      expect(cookies![0].includes("token")).toBe(true);
    });

    it("should return 404 if user not found", async () => {
      const response = await request(app).post("/api/v1/users/signin").send({
        email: "nonexistent@example.com",
        password: "password",
      });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("User not found");
    });

    it("should return 401 for invalid password", async () => {
      const response = await request(app).post("/api/v1/users/signin").send({
        email: mockUser.email,
        password: "WrongPassword!",
      });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Invalid credentials");
    });
  });

  /**
   * Profile Tests
   */
  describe("Profile Management", () => {
    let token: string;

    beforeEach(async () => {
      const user = await User.create(mockUser);
      // Log in to get the token cookie
      const loginRes = await request(app).post("/api/v1/users/signin").send({
        email: mockUser.email,
        password: mockUser.password,
      });
      const cookies = loginRes.headers["set-cookie"];
      if (!cookies) throw new Error("Login failed to set cookie");
      token = cookies[0].split(";")[0];
    });

    describe("GET /api/v1/users/profile", () => {
      it("should get current user profile when authenticated", async () => {
        const response = await request(app)
          .get("/api/v1/users/profile")
          .set("Cookie", [token]);

        expect(response.status).toBe(200);
        expect(response.body.data.user.email).toBe(mockUser.email);
      });

      it("should return 401 when not authenticated", async () => {
        const response = await request(app).get("/api/v1/users/profile");
        expect(response.status).toBe(401);
      });
    });

    describe("PATCH /api/v1/users/profile", () => {
      it("should update user profile", async () => {
        const updateData = {
          name: "Updated Name",
          bio: "Updated Bio",
        };

        const response = await request(app)
          .patch("/api/v1/users/profile")
          .set("Cookie", [token])
          .send(updateData);

        expect(response.status).toBe(200);
        expect(response.body.data.name).toBe(updateData.name);
        expect(response.body.data.bio).toBe(updateData.bio);

        const updatedUser = await User.findOne({ email: mockUser.email });
        expect(updatedUser?.name).toBe(updateData.name);
        expect(updatedUser?.bio).toBe(updateData.bio);
      });
    });
  });

  /**
   * Password Management
   */
  describe("Password Management", () => {
    let user: any;
    let token: string;

    beforeEach(async () => {
      user = await User.create(mockUser);
      // Log in
      const loginRes = await request(app).post("/api/v1/users/signin").send({
        email: mockUser.email,
        password: mockUser.password,
      });
      const cookies = loginRes.headers["set-cookie"];
      if (!cookies) throw new Error("Login failed to set cookie");
      token = cookies[0].split(";")[0];
    });

    describe("PATCH /api/v1/users/change-password", () => {
      it("should change password successfully", async () => {
        const newPassword = "NewPassword123!";
        const response = await request(app)
          .patch("/api/v1/users/change-password")
          .set("Cookie", [token])
          .send({ password: newPassword });

        expect(response.status).toBe(200);
        expect(response.body.message).toBe("Password changed successfully");

        // Verify login with new password
        const loginRes = await request(app).post("/api/v1/users/signin").send({
          email: mockUser.email,
          password: newPassword,
        });
        expect(loginRes.status).toBe(200);
      });
    });

    describe("POST /api/v1/users/forgot-password", () => {
      // NOTE: The controller calls getResetPasswordToken but doesn't send email in the code snippet,
      // it just returns the token in response for dev/test purposes presumably or assumes email service.
      // Based on controller code: res.status(200).json({ data: { resetPasswordToken } })

      it("should generate reset password token", async () => {
        // Requires authentication based on route definition?
        // Route: router.post("/forgot-password", authenticateUserMiddleware, forgotPassword);
        // Usually forgot password is unauthenticated, but the current route requires auth.
        // Following the existing route definition.

        const response = await request(app)
          .post("/api/v1/users/forgot-password")
          .set("Cookie", [token]);

        expect(response.status).toBe(200);
        expect(response.body.data.resetPasswordToken).toBeDefined();
      });
    });

    describe("POST /api/v1/users/reset-password", () => {
      // Route: router.post("/reset-password", authenticateUserMiddleware, resetPassword);
      // Again, requires auth.

      it("should reset password with valid token", async () => {
        // First get the token
        const forgotRes = await request(app)
          .post("/api/v1/users/forgot-password")
          .set("Cookie", [token]);

        const resetToken = forgotRes.body.data.resetPasswordToken;

        // Now reset (controller returns "Valid reset password token" but doesn't actually CHANGE the password in the snippet provided??)
        // Looking at controller:
        // const isValid = await user.compareResetPasswordToken(resetPasswordToken);
        // if (!isValid) throw...
        // res.status(200).json({ message: "Valid reset password token" });
        // It seems this endpoint only VALIDATES the token, it doesn't set a new password.
        // The naming 'resetPassword' is slightly misleading if it only checks validity, but I must test what is there.

        const response = await request(app)
          .post("/api/v1/users/reset-password")
          .set("Cookie", [token])
          .send({ resetPasswordToken: resetToken });

        expect(response.status).toBe(200);
        expect(response.body.message).toBe("Valid reset password token");
      });
    });
  });

  /**
   * Account Deletion
   */
  describe("DELETE /api/v1/users/account", () => {
    let token: string;

    beforeEach(async () => {
      await User.create(mockUser);
      const loginRes = await request(app).post("/api/v1/users/signin").send({
        email: mockUser.email,
        password: mockUser.password,
      });
      const cookies = loginRes.headers["set-cookie"];
      if (!cookies) throw new Error("Login failed to set cookie");
      token = cookies[0].split(";")[0];
    });

    it("should delete user account", async () => {
      const response = await request(app)
        .delete("/api/v1/users/account")
        .set("Cookie", [token]);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("User deleted successfully");

      const user = await User.findOne({ email: mockUser.email });
      expect(user).toBeNull();
    });
  });
});
