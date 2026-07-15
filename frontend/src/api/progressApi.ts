import apiClient from "./client";

export interface LectureProgressEntry {
  lecture: string;
  userId: string;
  isCompleted: boolean;
  lastWatchedPosition: number;
  lastWatched: string;
}

export interface CourseProgressResponse {
  isCompleted: boolean;
  completionPercentage: number;
  lectureProgress: LectureProgressEntry[];
  lastAccessed: string;
}

export interface HeatmapSegment {
  segmentIndex: number;
  secondsWatched: number;
}

/**
 * @desc Fetch progress for a specific course by its ID.
 * @input {string} courseId - The ID of the course.
 * @output {Promise<CourseProgressResponse | null>} Course progress details or null.
 */
export async function fetchCourseProgress(
  courseId: string,
): Promise<CourseProgressResponse | null> {
  try {
    const res = await apiClient.get(`/progress/${courseId}`);
    const data = res.data?.data ?? res.data;
    if (
      data &&
      (data.lectureProgress || data.completionPercentage !== undefined)
    ) {
      return data;
    }
    return data?.progress ?? null;
  } catch {
    return null;
  }
}

/**
 * @desc Update progress parameters for a specific lecture.
 * @input {string} courseId - The ID of the course.
 * @input {string} lectureId - The ID of the lecture.
 * @input {Object} payload - The updated progress (isCompleted, lastWatchedPosition).
 * @output {Promise<void>} Resolves on success.
 */
export async function updateLectureProgress(
  courseId: string,
  lectureId: string,
  payload: { isCompleted: boolean; lastWatchedPosition: number },
): Promise<void> {
  await apiClient.patch(`/progress/${courseId}/lectures/${lectureId}`, payload);
}

/**
 * @desc Mark a specific course as completed.
 * @input {string} courseId - The ID of the course.
 * @output {Promise<void>} Resolves on success.
 */
export async function markCourseCompleted(courseId: string): Promise<void> {
  await apiClient.patch(`/progress/${courseId}/complete`);
}

/**
 * @desc Reset progress for a specific course.
 * @input {string} courseId - The ID of the course.
 * @output {Promise<void>} Resolves on success.
 */
export async function resetCourseProgress(courseId: string): Promise<void> {
  await apiClient.patch(`/progress/${courseId}/reset`);
}

/**
 * @desc Sync current video playback position to Redis cache.
 * @input {Object} payload - Contains lectureId, courseId, currentPosition, previousPosition, lectureDuration.
 * @output {Promise<void>} Resolves on success.
 */
export async function syncPlaybackPosition(payload: {
  lectureId: string;
  courseId: string;
  currentPosition: number;
  previousPosition: number;
  lectureDuration: number;
}): Promise<void> {
  await apiClient.post("/playback/sync", payload);
}

/**
 * @desc Fetch the last saved watch position for a specific lecture.
 * @input {string} lectureId - The ID of the lecture.
 * @input {string} courseId - The ID of the course.
 * @output {Promise<number>} The last watched position in seconds.
 */
export async function fetchLastWatchPosition(
  lectureId: string,
  courseId: string,
): Promise<number> {
  try {
    const res = await apiClient.get("/playback/sync", {
      params: { lectureId, courseId },
    });
    return res.data?.data?.resumePosition?.lastWatchedPosition ?? 0;
  } catch {
    return 0;
  }
}

/**
 * @desc Fetch the heatmap engagement data for a specific lecture.
 * @input {string} lectureId - The ID of the lecture.
 * @output {Promise<HeatmapSegment[]>} List of heatmap segments.
 */
export async function fetchLectureHeatmap(
  lectureId: string,
): Promise<HeatmapSegment[]> {
  try {
    const res = await apiClient.get(`/playback/heatmap/${lectureId}`);
    return res.data?.data?.heatmap ?? res.data?.heatmap ?? [];
  } catch {
    return [];
  }
}
