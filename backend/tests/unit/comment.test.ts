import { describe, it, expect, vi } from "vitest";
import {
  writeComment,
  likeComment,
  deleteComment,
} from "../../src/controllers/comment.controller.js";
import { Comment } from "../../src/models/comment.model.js";
import { ApiError } from "../../src/utils/apiError.js";

describe("Comment Controller Unit Tests", () => {
  it("1. writeComment should throw error if content is missing", async () => {
    const req = {
      body: {
        lectureId: "507f1f77bcf86cd799439011",
        content: "",
      },
    } as any;
    const res = {} as any;
    const next = vi.fn();

    await writeComment(req, res, next);

    expect(next).toHaveBeenCalled();
    const error = next.mock.calls[0][0];
    expect(error).toBeInstanceOf(ApiError);
    expect(error.statusCode).toBe(400);
    expect(error.message).toBe("All fields are required");
  });

  it("2. likeComment should throw error if commentId is missing", async () => {
    const req = {
      body: {
        lectureId: "507f1f77bcf86cd799439011",
        commentId: "",
      },
    } as any;
    const res = {} as any;
    const next = vi.fn();

    await likeComment(req, res, next);

    expect(next).toHaveBeenCalled();
    const error = next.mock.calls[0][0];
    expect(error).toBeInstanceOf(ApiError);
    expect(error.statusCode).toBe(400);
    expect(error.message).toBe("All fields are required");
  });

  it("3. deleteComment should throw error if lectureId is missing", async () => {
    const req = {
      body: {
        lectureId: "",
        commentId: "507f1f77bcf86cd799439012",
      },
    } as any;
    const res = {} as any;
    const next = vi.fn();

    await deleteComment(req, res, next);

    expect(next).toHaveBeenCalled();
    const error = next.mock.calls[0][0];
    expect(error).toBeInstanceOf(ApiError);
    expect(error.statusCode).toBe(400);
    expect(error.message).toBe("All fields are required");
  });
});
