import { describe, it, expect, vi } from "vitest";
import {
  getLectureDetails,
  deleteLecture,
} from "../../src/controllers/lecture.controller.js";
import { Lecture } from "../../src/models/lecture.model.js";
import { ApiError } from "../../src/utils/apiError.js";

describe("Lecture Controller Unit Tests", () => {
  it("1. getLectureDetails should throw error if lectureId is invalid", async () => {
    const req = {
      params: {
        lectureId: "invalid-id",
      },
    } as any;
    const res = {} as any;
    const next = vi.fn();

    await getLectureDetails(req, res, next);

    expect(next).toHaveBeenCalled();
    const error = next.mock.calls[0][0];
    expect(error).toBeInstanceOf(ApiError);
    expect(error.statusCode).toBe(400);
    expect(error.message).toBe("Invalid lectureId");
  });

  it("2. getLectureDetails should throw 404 if lecture is not found", async () => {
    const findSpy = vi.spyOn(Lecture, "findOne").mockResolvedValue(null);

    const req = {
      params: {
        lectureId: "507f1f77bcf86cd799439011",
      },
    } as any;
    const res = {} as any;
    const next = vi.fn();

    await getLectureDetails(req, res, next);

    expect(next).toHaveBeenCalled();
    const error = next.mock.calls[0][0];
    expect(error).toBeInstanceOf(ApiError);
    expect(error.statusCode).toBe(404);
    expect(error.message).toBe("Lecture not found");

    findSpy.mockRestore();
  });

  it("3. deleteLecture should throw error if lectureId is missing", async () => {
    const req = {
      params: {
        lectureId: "",
      },
    } as any;
    const res = {} as any;
    const next = vi.fn();

    await deleteLecture(req, res, next);

    expect(next).toHaveBeenCalled();
    const error = next.mock.calls[0][0];
    expect(error).toBeInstanceOf(ApiError);
    expect(error.statusCode).toBe(400);
    expect(error.message).toBe("lectureId is required");
  });
});
