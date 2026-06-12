import express from "express";
import { syncLectureProgressWithCache, lectureLastWatchPosition, getLectureHeatmap } from "../controllers/playback.controller.js";
import { authenticateUserMiddleware } from "../middlewares/auth.middleware.js";
import { validator, SourceType } from "../middlewares/validator.middleware.js";
import { syncPlaybackSchema, lastWatchPositionSchema } from "../validator/playback.zod.js";

const router = express.Router();

router.route("/sync")
    .post(
        authenticateUserMiddleware,
        validator(SourceType.BODY, syncPlaybackSchema),
        syncLectureProgressWithCache
    )
    .get(
        authenticateUserMiddleware,
        validator(SourceType.BODY, lastWatchPositionSchema),
        lectureLastWatchPosition
    );
router.get("/heatmap/:lectureId", authenticateUserMiddleware, getLectureHeatmap);

export default router;