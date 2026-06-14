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

router.get("/:courseId", authenticateUserMiddleware, getUserCourseProgress);

router.patch(
  "/:courseId/lectures/:lectureId",
  authenticateUserMiddleware,
  validator(SourceType.BODY, updateLectureProgressSchema),
  updateLectureProgress,
);

router.patch(
  "/:courseId/complete",
  authenticateUserMiddleware,
  markCourseAsCompleted,
);

router.patch(
  "/:courseId/reset",
  authenticateUserMiddleware,
  resetCourseProgress,
);

export default router;
