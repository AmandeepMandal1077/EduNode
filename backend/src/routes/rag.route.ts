import { Router } from "express";
import { vectordbProcessed, chatWithLecture } from "../controllers/rag.controller.js";
import { authenticateUserMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/vectordb-processed", vectordbProcessed);
router.post("/chat", authenticateUserMiddleware, chatWithLecture);

export default router;