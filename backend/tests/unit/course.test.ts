import { describe, it, expect, vi } from "vitest";
import {
  createNewCourse,
  searchCourses,
  getCourseDetails,
  rateCourse,
} from "../../src/controllers/course.controller.js";
import { Course } from "../../src/models/course.model.js";
import { ApiError } from "../../src/utils/apiError.js";

describe("Course Controller Unit Tests", () => {
  it("1. createNewCourse should throw error if course title slug already exists", async () => {
    const findSpy = vi.spyOn(Course, "findOne").mockResolvedValue({
      title: "Existing Course",
    } as any);

    const req = {
      body: {
        title: "Existing Course",
      },
    } as any;
    const res = {} as any;
    const next = vi.fn();

    await createNewCourse(req, res, next);

    expect(next).toHaveBeenCalled();
    const error = next.mock.calls[0][0];
    expect(error).toBeInstanceOf(ApiError);
    expect(error.statusCode).toBe(400);
    expect(error.message).toBe("Course already exists");

    findSpy.mockRestore();
  });

  it("2. searchCourses should throw error if searchString is missing", async () => {
    const req = {
      query: {
        searchString: "",
      },
    } as any;
    const res = {} as any;
    const next = vi.fn();

    await searchCourses(req, res, next);

    expect(next).toHaveBeenCalled();
    const error = next.mock.calls[0][0];
    expect(error).toBeInstanceOf(ApiError);
    expect(error.statusCode).toBe(400);
    expect(error.message).toBe("Search string is required");
  });

  it("3. getCourseDetails should throw error if courseId is invalid", async () => {
    const req = {
      params: {
        courseId: "invalid-id",
      },
    } as any;
    const res = {} as any;
    const next = vi.fn();

    await getCourseDetails(req, res, next);

    expect(next).toHaveBeenCalled();
    const error = next.mock.calls[0][0];
    expect(error).toBeInstanceOf(ApiError);
    expect(error.statusCode).toBe(400);
    expect(error.message).toBe("Invalid courseId");
  });

  it("4. rateCourse should throw error if rating is not a number between 1 and 5", async () => {
    const req = {
      params: {
        courseId: "507f1f77bcf86cd799439011",
      },
      userId: "507f1f77bcf86cd799439012",
      body: {
        rating: 6, // invalid
      },
    } as any;
    const res = {} as any;
    const next = vi.fn();

    await rateCourse(req, res, next);

    expect(next).toHaveBeenCalled();
    const error = next.mock.calls[0][0];
    expect(error).toBeInstanceOf(ApiError);
    expect(error.statusCode).toBe(400);
    expect(error.message).toBe("Rating must be a number between 1 and 5");
  });
});
