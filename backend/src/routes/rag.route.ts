import { Router } from "express";
import { vectordbProcessed, chatWithLecture, getChatHistory } from "../controllers/rag.controller.js";
import { authenticateUserMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/vectordb-processed", vectordbProcessed);
router.post("/chat", authenticateUserMiddleware, chatWithLecture);
router.get("/chat-history/:courseId/:lectureId", authenticateUserMiddleware, getChatHistory);

export default router;