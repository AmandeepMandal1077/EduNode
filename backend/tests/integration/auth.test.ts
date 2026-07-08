import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import { User } from "../../src/models/user.model.js";
import { loginUser, mockAddForgotPasswordJob } from "../setup.js";

describe("Auth / User Controller Integration Tests", () => {
  const mockUser = {
    name: "Test User",
    email: "test@example.com",
    password: "Password123!",
  };

  it("1. POST /signup should create a new user and return 201", async () => {
    const response = await request(app)
      .post("/api/v1/users/signup")
      .send(mockUser);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.email).toBe(mockUser.email);

    const user = await User.findOne({ email: mockUser.email });
    expect(user).toBeTruthy();
    expect(user?.name).toBe(mockUser.name);
  });

  it("2. POST /signup with duplicate email should return 400", async () => {
    await User.create(mockUser);

    const response = await request(app)
      .post("/api/v1/users/signup")
      .send(mockUser);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("User already exists");
  });

  it("3. POST /signup with missing password should return 400 via Zod validator", async () => {
    const response = await request(app)
      .post("/api/v1/users/signup")
      .send({
        name: "Test User",
        email: "test@example.com",
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe("error");
  });

  it("4. POST /signin with wrong password should return 401", async () => {
    await User.create(mockUser);

    const response = await request(app)
      .post("/api/v1/users/signin")
      .send({
        email: mockUser.email,
        password: "WrongPassword123!",
      });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Invalid credentials");
  });

  it("5. GET /profile without token should return 401", async () => {
    const response = await request(app).get("/api/v1/users/profile");
    expect(response.status).toBe(401);
  });

  it("6. GET /profile with valid token should return 200 and user data", async () => {
    await User.create(mockUser);
    const tokenCookie = await loginUser(app, mockUser.email, mockUser.password);

    const response = await request(app)
      .get("/api/v1/users/profile")
      .set("Cookie", [tokenCookie]);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user.email).toBe(mockUser.email);
  });

  it("7. POST /forgot-password should generate reset token and add forgot password job to queue", async () => {
    await User.create(mockUser);

    const response = await request(app)
      .post("/api/v1/users/forgot-password")
      .send({ email: mockUser.email });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("If that email exists, a reset link has been sent.");

    // Assert that queue helper was called
    expect(mockAddForgotPasswordJob).toHaveBeenCalled();
    const calledWith = mockAddForgotPasswordJob.mock.calls[0]![0];
    expect(calledWith.username).toBe(mockUser.name);
    expect(calledWith.email).toBe(mockUser.email);
    expect(calledWith.resetUrl).toContain("reset-password?token=");
  });
});
