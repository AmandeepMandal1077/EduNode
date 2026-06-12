import express from "express";
import {
  getUserCourseProgress,
  updateLectureProgress,
  markCourseAsCompleted,
  resetCourseProgress,
} from "../controllers/courseProgress.controller.js";
import { authenticateUserMiddleware } from "../middlewares/auth.middleware.js";

import { validator, SourceType } from "../middlewares/validator.middleware.js";
import { updateLectureProgressSchema } from "../validator/courseProgress.zod.js";

const router = express.Router();

// Get course progress
router.get("/:courseId", authenticateUserMiddleware, getUserCourseProgress);

// Update lecture progress
router.patch(
  "/:courseId/lectures/:lectureId",
  authenticateUserMiddleware,
  validator(SourceType.BODY, updateLectureProgressSchema),
  updateLectureProgress,
);

// Mark course as completed
router.patch(
  "/:courseId/complete",
  authenticateUserMiddleware,
  markCourseAsCompleted,
);

// Reset course progress
router.patch(
  "/:courseId/reset",
  authenticateUserMiddleware,
  resetCourseProgress,
);

export default router;
