import type { Request, Response, NextFunction } from "express";
import { asyncHandler } from "../utils/asynchandler.js";
import { ApiError } from "../utils/apiError.js";
import { verifyJWTToken } from "../utils/generateToken.js";
import type { AuthenticatedRequest } from "../types/user.js";
import { User, type Role } from "../models/user.model.js";
import mongoose from "mongoose";
import { Course } from "../models/course.model.js";

const authenticateUserMiddleware = asyncHandler(
  async (req: AuthenticatedRequest, _: Response, next: NextFunction) => {
    const token =
      req.cookies.token || req.headers.authorization?.split("Bearer ")?.at(1);
    if (!token) {
      throw new ApiError("No token found", 401);
    }

    const decodedPayload = verifyJWTToken(token);
    if (
      !decodedPayload ||
      !mongoose.Types.ObjectId.isValid(decodedPayload.userId)
    ) {
      throw new ApiError("Invalid token", 401);
    }

    req.userId = decodedPayload.userId;
    next();
  },
);

function restrictToInstructor() {
  return asyncHandler(
    async (req: AuthenticatedRequest, _: Response, next: NextFunction) => {
      const user = await User.findById(new mongoose.Types.ObjectId(req.userId));

      if (!user) {
        throw new ApiError("User not found", 404);
      }

      if (
        !req.params.courseId ||
        !mongoose.Types.ObjectId.isValid(req.params.courseId)
      ) {
        throw new ApiError("Invalid course ID", 400);
      }
      const course = await Course.findOne({
        _id: new mongoose.Types.ObjectId(req.params.courseId),
        instructor: new mongoose.Types.ObjectId(req.userId),
      });
      if (!course) {
        throw new ApiError("Unauthorized", 403);
      }

      next();
    },
  );
}

export { authenticateUserMiddleware, restrictToInstructor };
