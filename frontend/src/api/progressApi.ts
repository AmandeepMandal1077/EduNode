/**
 * progressApi.ts
 * Calls to /api/v1/progress and /api/v1/playback
 *
 * Backend route reference:
 *   GET   /api/v1/progress/:courseId                           → getUserCourseProgress
 *   PATCH /api/v1/progress/:courseId/lectures/:lectureId       → updateLectureProgress
 *   PATCH /api/v1/progress/:courseId/complete                  → markCourseAsCompleted
 *   PATCH /api/v1/progress/:courseId/reset                     → resetCourseProgress
 *   POST  /api/v1/playback/sync                                → syncLectureProgressWithCache
 *   GET   /api/v1/playback/sync?lectureId=&courseId=           → lectureLastWatchPosition
 *   GET   /api/v1/playback/heatmap/:lectureId                  → getLectureHeatmap
 *
 * NOTE: /api/v1/progress is not yet mounted in app.ts — this file is ready for
 *       when the route is added. Currently falls back gracefully.
 */

import apiClient from "./client";

export interface LectureProgressEntry {
  lecture: string;
  userId: string;
  isCompleted: boolean;
  lastWatchedPosition: number;
  lastWatched: string;
}

export interface CourseProgressResponse {
  _id: string;
  user: string;
  course: string;
  isCompleted: boolean;
  completionPercentage: number;
  lectureProgress: LectureProgressEntry[];
  lastAccessed: string;
}

export interface HeatmapSegment {
  segmentIndex: number;
  secondsWatched: number;
}

// ── Course Progress ───────────────────────────────────────────────────────────

/**
 * @desc: Fetch progress for a specific course by its ID
 * @input: courseId (string)
 * @return: Promise<CourseProgressResponse | null>
 * @access: Private
 */
export async function fetchCourseProgress(
  courseId: string
): Promise<CourseProgressResponse | null> {
  try {
    const res = await apiClient.get(`/progress/${courseId}`);
    const data = res.data?.data ?? res.data;
    if (data && (data.lectureProgress || data.completionPercentage !== undefined)) {
      return data;
    }
    return data?.progress ?? null;
  } catch {
    return null;
  }
}

/**
 * @desc: Update progress parameters for a specific lecture
 * @input: courseId (string), lectureId (string), payload (object containing isCompleted: boolean, lastWatchedPosition: number)
 * @return: Promise<void>
 * @access: Private
 */
export async function updateLectureProgress(
  courseId: string,
  lectureId: string,
  payload: { isCompleted: boolean; lastWatchedPosition: number }
): Promise<void> {
  await apiClient.patch(`/progress/${courseId}/lectures/${lectureId}`, payload);
}

/**
 * @desc: Mark a specific course as completed
 * @input: courseId (string)
 * @return: Promise<void>
 * @access: Private
 */
export async function markCourseCompleted(courseId: string): Promise<void> {
  await apiClient.patch(`/progress/${courseId}/complete`);
}

/**
 * @desc: Reset progress for a specific course
 * @input: courseId (string)
 * @return: Promise<void>
 * @access: Private
 */
export async function resetCourseProgress(courseId: string): Promise<void> {
  await apiClient.patch(`/progress/${courseId}/reset`);
}

// ── Playback / Heatmap ────────────────────────────────────────────────────────

/**
 * @desc: Sync current video playback position to Redis cache
 * @input: payload (object containing lectureId: string, courseId: string, watchedSeconds: number)
 * @return: Promise<void>
 * @access: Private
 */
export async function syncPlaybackPosition(payload: {
  lectureId: string;
  courseId: string;
  watchedSeconds: number;
}): Promise<void> {
  await apiClient.post("/playback/sync", payload);
}

/**
 * @desc: Fetch the last saved watch position for a specific lecture
 * @input: lectureId (string), courseId (string)
 * @return: Promise<number>
 * @access: Private
 */
export async function fetchLastWatchPosition(
  lectureId: string,
  courseId: string
): Promise<number> {
  try {
    const res = await apiClient.get("/playback/sync", {
      params: { lectureId, courseId },
    });
    return res.data?.data?.lastWatchedPosition ?? 0;
  } catch {
    return 0;
  }
}

/**
 * @desc: Fetch the heatmap engagement data for a specific lecture
 * @input: lectureId (string)
 * @return: Promise<HeatmapSegment[]>
 * @access: Private
 */
export async function fetchLectureHeatmap(
  lectureId: string
): Promise<HeatmapSegment[]> {
  try {
    const res = await apiClient.get(`/playback/heatmap/${lectureId}`);
    return res.data?.data?.heatmap ?? res.data?.heatmap ?? [];
  } catch {
    return [];
  }
}
