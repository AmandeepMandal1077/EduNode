import express from "express";
import {
  getUserCourseProgress,
  updateLectureProgress,
  markCourseAsCompleted,
  resetCourseProgress,
} from "../controllers/courseProgress.controller.js";
import { authenticateUserMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Get course progress
router.get("/:courseId", authenticateUserMiddleware, getUserCourseProgress);

// Update lecture progress
router.patch(
  "/:courseId/lectures/:lectureId",
  authenticateUserMiddleware,
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
