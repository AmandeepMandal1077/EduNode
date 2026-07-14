import { Router } from "express";
import { confirmUpload, updateMediaStatus } from "../controllers/media.controller.js";
import { internalAuthMiddleware } from "../middlewares/internalAuth.middleware.js";

const router = Router();

router.post("/media/confirm-upload", internalAuthMiddleware, confirmUpload);
router.patch("/media/status", internalAuthMiddleware, updateMediaStatus);

export default router;
