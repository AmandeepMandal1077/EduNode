import express from "express";
import { authenticateUserMiddleware } from "../middlewares/auth.middleware.js";
import {
  deleteComment,
  dislikeComment,
  likeComment,
  writeComment,
} from "../controllers/comment.controller.js";
import { commentValidator } from "../validator/comment.zod.js";
import { SourceType, validator } from "../middlewares/validator.middleware.js";

const router = express.Router();

router.use(authenticateUserMiddleware);

router.post("/", validator(SourceType.BODY, commentValidator), writeComment);
router.post("/like", likeComment);
router.post("/dislike", dislikeComment);
router.delete("/", deleteComment);

export default router;
