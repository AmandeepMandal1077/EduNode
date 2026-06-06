import express from "express";
import { syncLectureProgressWithCache, lectureLastWatchPosition, getLectureHeatmap } from "../controllers/playback.controller.js";
import { authenticateUserMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.route("/sync")
    .post(authenticateUserMiddleware, syncLectureProgressWithCache)
    .get(authenticateUserMiddleware, lectureLastWatchPosition);
router.get("/heatmap/:lectureId", authenticateUserMiddleware, getLectureHeatmap);

export default router;