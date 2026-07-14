import { Router } from "express";
import { createUploadSession, getUploadStatus } from "../controllers/media.controller.js";
import { authenticateUserMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/upload-session", authenticateUserMiddleware, createUploadSession);
router.get("/status/:uploadSessionId", authenticateUserMiddleware, getUploadStatus);

export default router;
