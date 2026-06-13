import express from "express";
import {
  generateSignature,
  verifySignature,
  handleCloudinaryWebhook,
} from "../controllers/media.controller.js";
import { authenticateUserMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authenticateUserMiddleware);

router.route("/signature").post(generateSignature);

router.route("/verify").post(verifySignature);

export default router;
