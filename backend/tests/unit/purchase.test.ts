import { describe, it, expect, vi } from "vitest";
import {
  initiateStripeCheckout,
  verifyStripeSession,
  getCoursePurchaseStatus,
  enrollFreeCourse,
} from "../../src/controllers/coursePurchase.controller.js";
import { ApiError } from "../../src/utils/apiError.js";

describe("Course Purchase Controller Unit Tests", () => {
  it("1. initiateStripeCheckout should throw error if courseId is invalid", async () => {
    const req = {
      body: {
        courseId: "invalid-id",
      },
      userId: "some-user-id",
    } as any;
    const res = {} as any;
    const next = vi.fn();

    await initiateStripeCheckout(req, res, next);

    expect(next).toHaveBeenCalled();
    const error = next.mock.calls[0][0];
    expect(error).toBeInstanceOf(ApiError);
    expect(error.statusCode).toBe(400);
    expect(error.message).toBe("Invalid course id");
  });

  it("2. verifyStripeSession should throw error if session_id is missing", async () => {
    const req = {
      body: {
        session_id: "",
      },
      userId: "some-user-id",
    } as any;
    const res = {} as any;
    const next = vi.fn();

    await verifyStripeSession(req, res, next);

    expect(next).toHaveBeenCalled();
    const error = next.mock.calls[0][0];
    expect(error).toBeInstanceOf(ApiError);
    expect(error.statusCode).toBe(400);
    expect(error.message).toBe("Session id is required");
  });

  it("3. getCoursePurchaseStatus should throw error if courseId is invalid", async () => {
    const req = {
      params: {
        courseId: "invalid-id",
      },
      userId: "some-user-id",
    } as any;
    const res = {} as any;
    const next = vi.fn();

    await getCoursePurchaseStatus(req, res, next);

    expect(next).toHaveBeenCalled();
    const error = next.mock.calls[0][0];
    expect(error).toBeInstanceOf(ApiError);
    expect(error.statusCode).toBe(400);
    expect(error.message).toBe("Invalid course id");
  });

  it("4. enrollFreeCourse should throw error if courseId is invalid", async () => {
    const req = {
      body: {
        courseId: "invalid-id",
      },
      userId: "some-user-id",
    } as any;
    const res = {} as any;
    const next = vi.fn();

    await enrollFreeCourse(req, res, next);

    expect(next).toHaveBeenCalled();
    const error = next.mock.calls[0][0];
    expect(error).toBeInstanceOf(ApiError);
    expect(error.statusCode).toBe(400);
    expect(error.message).toBe("Invalid course id");
  });
});
