import type { ILectureProgress } from "../models/courseProgress.model.js"
import cache, { content_expiration_duration } from "./index.js";
import { CacheKeys, generateKey } from "./keys.js"
import { getJSON, setJSON } from "./query.js";


export const saveLectureProgressToCache = async (progress: ILectureProgress) => {
    const key = generateKey(CacheKeys.LECTURE_PROGRESS, `${progress.userId.toString()}:${progress.lecture.toString()}`);

    await setJSON<ILectureProgress>(
        key,
        progress,
        new Date(Date.now() + Number(content_expiration_duration))
    )
}

export const getLectureProgressFromCahce = async (userId: string, lectureId: string): Promise<ILectureProgress | null> => {
    const key = generateKey(CacheKeys.LECTURE_PROGRESS, `${userId}:${lectureId}`);
    return await getJSON<ILectureProgress>(key);
}

export const invalidateLectureProgressInCache = async (userId: string, lectureId: string) => {
    const key = generateKey(CacheKeys.LECTURE_PROGRESS, `${userId}:${lectureId}`);
    await cache.del(key);
}