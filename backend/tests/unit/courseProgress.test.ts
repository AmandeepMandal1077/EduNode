import { describe, it, expect, vi } from "vitest";
import {
  getUserCourseProgress,
  updateLectureProgress,
  markCourseAsCompleted,
  resetCourseProgress,
} from "../../src/controllers/courseProgress.controller.js";
import { ApiError } from "../../src/utils/apiError.js";

describe("Course Progress Controller Unit Tests", () => {
  it("1. getUserCourseProgress should throw error if courseId is invalid", async () => {
    const req = {
      params: {
        courseId: "invalid-id",
      },
      userId: "some-user-id",
    } as any;
    const res = {} as any;
    const next = vi.fn();

    await getUserCourseProgress(req, res, next);

    expect(next).toHaveBeenCalled();
    const error = next.mock.calls[0][0];
    expect(error).toBeInstanceOf(ApiError);
    expect(error.statusCode).toBe(400);
    expect(error.message).toBe("Invalid courseId");
  });

  it("2. updateLectureProgress should throw error if courseId is invalid", async () => {
    const req = {
      params: {
        courseId: "invalid-id",
        lectureId: "507f1f77bcf86cd799439011",
      },
      userId: "some-user-id",
    } as any;
    const res = {} as any;
    const next = vi.fn();

    await updateLectureProgress(req, res, next);

    expect(next).toHaveBeenCalled();
    const error = next.mock.calls[0][0];
    expect(error).toBeInstanceOf(ApiError);
    expect(error.statusCode).toBe(400);
    expect(error.message).toBe("Invalid courseId");
  });

  it("3. markCourseAsCompleted should throw error if courseId is invalid", async () => {
    const req = {
      params: {
        courseId: "invalid-id",
      },
      userId: "some-user-id",
    } as any;
    const res = {} as any;
    const next = vi.fn();

    await markCourseAsCompleted(req, res, next);

    expect(next).toHaveBeenCalled();
    const error = next.mock.calls[0][0];
    expect(error).toBeInstanceOf(ApiError);
    expect(error.statusCode).toBe(400);
    expect(error.message).toBe("Invalid courseId");
  });

  it("4. resetCourseProgress should throw error if courseId is invalid", async () => {
    const req = {
      params: {
        courseId: "invalid-id",
      },
      userId: "some-user-id",
    } as any;
    const res = {} as any;
    const next = vi.fn();

    await resetCourseProgress(req, res, next);

    expect(next).toHaveBeenCalled();
    const error = next.mock.calls[0][0];
    expect(error).toBeInstanceOf(ApiError);
    expect(error.statusCode).toBe(400);
    expect(error.message).toBe("Invalid courseId");
  });
});
