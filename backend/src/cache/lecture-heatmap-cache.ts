import cache, { content_expiration_duration } from "./index.js";
import { CacheKeys, generateKey } from "./keys.js";
import { getJSON, incByNum, setJSON } from "./query.js";


export interface HeatmapSegment {
    lectureId: string;
    lectureDuration: number;
    previousPosition: number;
    currentPosition: number;
}

export const saveHeatmapSegmentToCache = async (heatmapData: HeatmapSegment) => {
    const getSegmentIdx = Math.min(Math.floor((heatmapData.previousPosition / heatmapData.lectureDuration) * 100), 99);
    const key = generateKey(CacheKeys.LECTURE_HEATMAP, `${heatmapData.lectureId}:${getSegmentIdx}`);

    const watchLength = Math.abs(heatmapData.currentPosition - heatmapData.previousPosition) + 1;

    const expireTime = new Date(Date.now() + Number(content_expiration_duration));

    await incByNum(key, watchLength, expireTime)
}

export const getHeatmapSegmentFromCache = async (lectureId: string, segmentId: number) => {
    const key = generateKey(CacheKeys.LECTURE_HEATMAP, `${lectureId}:${segmentId}`);
    return await getJSON<number>(key);
}

export const invalidateHeatmapSegmentFromCache = async (lectureId: string, segmentId: number) => {
    const key = generateKey(CacheKeys.LECTURE_HEATMAP, `${lectureId}:${segmentId}`);
    await cache.del(key);
}