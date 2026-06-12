import express from "express";
import {
  generateSignature,
  verifySignature,
  handleCloudinaryWebhook,
} from "../controllers/media.controller.js";
import { authenticateUserMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authenticateUserMiddleware);

// Generate upload signature for frontend
router.route("/signature").post(generateSignature);

// Verify upload signature
router.route("/verify").post(verifySignature);

// Note: /api/v1/media/webhook is registered separately in app.ts 
// because it requires express.raw() body parsing for signature verification.

export default router;
