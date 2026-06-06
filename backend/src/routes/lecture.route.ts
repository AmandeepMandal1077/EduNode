import { Router } from "express";
import {
  getComments,
  getLectureDetails,
} from "../controllers/lecture.controller.js";
import { authenticateUserMiddleware } from "../middlewares/auth.middleware.js";
const router = Router();

router.use(authenticateUserMiddleware);

router.route("/:lectureId").get(getLectureDetails);
router.route("/:lectureId/comments").get(getComments);

export default router;
