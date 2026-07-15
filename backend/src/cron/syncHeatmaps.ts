import cron from "node-cron";
import cache from "../cache/index.js";
import { CacheKeys } from "../cache/keys.js";
import { getHeatmapSegmentFromCache, invalidateHeatmapSegmentFromCache } from "../cache/lecture-heatmap-cache.js";
import { LectureHeatmap } from "../models/lectureHeatmap.model.js";
import mongoose from "mongoose";
import debug from "../utils/debug.js";

cron.schedule("*/5 * * * *", async () => {
    try {
        if (!cache) {
            throw new Error("Redis server is not running")
        }
        const allkeys = await cache.keys(CacheKeys.LECTURE_HEATMAP + ":*");
        const keys = allkeys.filter(key => !key.endsWith(":syncing"));
        if (!keys || keys.length === 0) return;

        for (const liveKey of keys) {
            const key = `${liveKey}:syncing`;

            const parts = key.split(":");
            if (!parts[1] || !parts[2]) continue;

            const lectureId = parts[1];
            const segmentIdx = parseInt(parts[2], 10);

            try {
                await cache.rename(liveKey, key);
            } catch (err) {
                continue;
            }

            const raw = await cache.get(key);
            const watchSeconds = raw ? parseFloat(raw) : 0;

            if (watchSeconds > 0) {
                await LectureHeatmap.findOneAndUpdate(
                    {
                        lectureId: new mongoose.Types.ObjectId(lectureId),
                        segmentIndex: segmentIdx,
                    },
                    {
                        $inc: {
                            secondsWatched: watchSeconds
                        }
                    },
                    {
                        upsert: true,
                    }
                );

                await cache.del(key);
            } else {
                await cache.del(key);
            }
        }

    } catch (err: unknown) {
        debug("Error in syncHeatmaps cron", err);
    }
});