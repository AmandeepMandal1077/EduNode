import cron from "node-cron";
import cache from "../cache/index.js";
import { CacheKeys } from "../cache/keys.js";
import { CourseProgress, type ILectureProgress } from "../models/courseProgress.model.js";
import debug from "../utils/debug.js";

cron.schedule("*/5 * * * *", async () => {
    try {
        if (!cache) {
            throw new Error("Redis server is not running")
        }
        const allkeys = await cache.keys(CacheKeys.LECTURE_PROGRESS + ":*");
        const keys = allkeys.filter(key => !key.endsWith(":syncing"));
        if (!keys || keys.length === 0) return;

        for (const liveKey of keys) {
            const key = `${liveKey}:syncing`;

            try {
                await cache.rename(liveKey, key);
            } catch (err) {
                continue; // Skip if another instance renamed it
            }

            const raw = await cache.get(key);
            if (!raw) {
                await cache.del(key);
                continue;
            }

            const progress: ILectureProgress = JSON.parse(raw);

            // Update database to persist the cache
            await CourseProgress.updateOne(
                {
                    user: progress.userId,
                    "lectureProgress.lecture": progress.lecture
                },
                {
                    $set: {
                        "lectureProgress.$.isCompleted": progress.isCompleted,
                        "lectureProgress.$.lastWatchedPosition": progress.lastWatchedPosition,
                        "lectureProgress.$.lastWatched": progress.lastWatched,
                    }
                }
            );

            await cache.del(key);
        }

    } catch (err: unknown) {
        debug("Error in syncProgress cron", err);
    }
});
