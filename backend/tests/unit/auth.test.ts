import { describe, it, expect, vi } from "vitest";
import {
  createUserAccount,
  authenticateUser,
  signOutUser,
  updateUserProfile,
} from "../../src/controllers/user.controller.js";
import { User } from "../../src/models/user.model.js";
import { ApiError } from "../../src/utils/apiError.js";

describe("User / Auth Controller Unit Tests", () => {
  it("1. createUserAccount should create user account and return 201 on success", async () => {
    const findSpy = vi.spyOn(User, "findOne").mockResolvedValue(null);
    const createSpy = vi.spyOn(User, "create").mockResolvedValue({
      name: "Test User",
      email: "test@example.com",
      password: "password",
    } as any);

    const req = {
      body: {
        name: "Test User",
        email: "test@example.com",
        password: "password",
      },
    } as any;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as any;
    const next = vi.fn();

    await createUserAccount(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalled();
    const data = res.json.mock.calls[0][0];
    expect(data.success).toBe(true);
    expect(data.message).toBe("User account created successfully");

    findSpy.mockRestore();
    createSpy.mockRestore();
  });

  it("2. createUserAccount should throw error if user already exists", async () => {
    const findSpy = vi.spyOn(User, "findOne").mockResolvedValue({
      email: "test@example.com",
    } as any);

    const req = {
      body: {
        name: "Test User",
        email: "test@example.com",
        password: "password",
      },
    } as any;
    const res = {} as any;
    const next = vi.fn();

    await createUserAccount(req, res, next);

    expect(next).toHaveBeenCalled();
    const error = next.mock.calls[0][0];
    expect(error).toBeInstanceOf(ApiError);
    expect(error.statusCode).toBe(400);
    expect(error.message).toBe("User already exists");

    findSpy.mockRestore();
  });

  it("3. authenticateUser should throw error when email or password is missing", async () => {
    const req = {
      body: {
        email: "",
        password: "",
      },
    } as any;
    const res = {} as any;
    const next = vi.fn();

    await authenticateUser(req, res, next);

    expect(next).toHaveBeenCalled();
    const error = next.mock.calls[0][0];
    expect(error).toBeInstanceOf(ApiError);
    expect(error.statusCode).toBe(400);
    expect(error.message).toBe("Email or Password is missing");
  });

  it("4. signOutUser should clear cookie and return 200", async () => {
    const req = {} as any;
    const res = {
      status: vi.fn().mockReturnThis(),
      clearCookie: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as any;
    const next = vi.fn();

    await signOutUser(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.clearCookie).toHaveBeenCalledWith("token", expect.any(Object));
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it("5. updateUserProfile should throw error when both name and bio are missing", async () => {
    const req = {
      userId: "some-id",
      body: {
        name: "",
        bio: undefined,
      },
    } as any;
    const res = {} as any;
    const next = vi.fn();

    await updateUserProfile(req, res, next);

    expect(next).toHaveBeenCalled();
    const error = next.mock.calls[0][0];
    expect(error).toBeInstanceOf(ApiError);
    expect(error.statusCode).toBe(400);
    expect(error.message).toBe("Either name or bio is required");
  });
});
