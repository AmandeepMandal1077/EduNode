import { Router } from "express";
import {
  getLectureDetails,
} from "../controllers/lecture.controller.js";
import {
  getComments,
} from "../controllers/comment.controller.js";
import { authenticateUserMiddleware } from "../middlewares/auth.middleware.js";
const router = Router();

router.use(authenticateUserMiddleware);

router.route("/:lectureId").get(getLectureDetails);
router.route("/:lectureId/comments").get(getComments);

export default router;
