/**
 * courseApi.ts
 * All calls that map to /api/v1/courses and /api/v1/lecture
 *
 * Backend route reference:
 *   GET  /api/v1/courses/published          → getPublishedCourses
 *   GET  /api/v1/courses/search?q=&cat=     → searchCourses
 *   GET  /api/v1/courses/:courseId        → getCourseDetails
 *   GET  /api/v1/courses/:courseId/lectures → getCourseLectures
 *   POST /api/v1/courses/:courseId/announce → announceMessage (instructor)
 *   GET  /api/v1/courses/                   → getMyCreatedCourses (instructor)
 */

import apiClient from "./client";

// ── Shape of what the backend returns ─────────────────────────────────────────

export interface BackendLecture {
  _id: string;
  title: string;
  slug: string;
  courseId: string;
  description: string;
  videoUrl: string;
  duration?: number; // seconds
  isPreview?: boolean;
  publicId: string;
  order?: number;
}

export interface BackendEnrolledStudent {
  student: string;
  rating?: number;
}

export interface BackendCourse {
  _id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  category: string;
  level: "beginner" | "intermediate" | "advance";
  price: number;
  thumbnail: string;
  instructor: {
    _id: string;
    name: string;
    bio?: string;
    avatar?: string;
  } | string;
  enrolledStudents: BackendEnrolledStudent[];
  lectures: string[] | BackendLecture[];
  announcements: string[];
  isPublished: boolean;
  totalLectures: number;
  totalDuration: number; // seconds
  averageRating: number;
  createdAt: string;
  updatedAt: string;
}

export interface BackendAnnouncement {
  _id: string;
  courseId: string;
  message: string;
  sentAt: string;
}

// ── API calls ─────────────────────────────────────────────────────────────────

/**
 * @desc: Fetch all published courses
 * @input: none
 * @return: Promise<BackendCourse[]>
 * @access: Public
 */
export async function fetchPublishedCourses(): Promise<BackendCourse[]> {
  const res = await apiClient.get("/courses/published");
  return res.data?.data?.courses ?? res.data?.courses ?? [];
}

/**
 * @desc: Fetch all unique course categories
 * @input: none
 * @return: Promise<string[]>
 * @access: Public
 */
export async function fetchCategories(): Promise<string[]> {
  const res = await apiClient.get("/courses/categories");
  return res.data?.data?.categories ?? res.data?.categories ?? [];
}

/**
 * @desc: Search for published courses using query text and category
 * @input: query (string, optional), category (string, optional)
 * @return: Promise<BackendCourse[]>
 * @access: Public
 */
export async function fetchSearchCourses(
  query?: string,
  category?: string
): Promise<BackendCourse[]> {
  const params: Record<string, string> = {};
  if (query) params.searchString = query;
  if (category && category !== "all") params.category = category;
  const res = await apiClient.get("/courses/search", { params });
  return res.data?.data?.courses ?? res.data?.courses ?? [];
}

/**
 * @desc: Fetch full details for a course by its ID
 * @input: courseId (string)
 * @return: Promise<BackendCourse>
 * @access: Private
 */
export async function fetchCourseDetails(courseId: string): Promise<BackendCourse> {
  const res = await apiClient.get(`/courses/${courseId}`);
  return res.data?.data?.course ?? res.data?.course;
}

/**
 * @desc: Fetch all lectures associated with a specific course
 * @input: courseId (string)
 * @return: Promise<BackendLecture[]>
 * @access: Private
 */
export async function fetchCourseLectures(courseId: string): Promise<BackendLecture[]> {
  const res = await apiClient.get(`/courses/${courseId}/lectures`);
  const data = res.data?.data?.lectures ?? res.data?.lectures;
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.lectures)) return data.lectures;
  return [];
}

/**
 * @desc: Post a new announcement for a course
 * @input: courseId (string), message (string)
 * @return: Promise<BackendAnnouncement>
 * @access: Private (Instructor only)
 */
export async function postAnnouncement(
  courseId: string,
  message: string
): Promise<BackendAnnouncement> {
  const res = await apiClient.post(`/courses/${courseId}/announce`, { message });
  return res.data?.data?.announcement ?? res.data?.announcement;
}

/**
 * @desc: Create a new course (JSON payload)
 * @input: data (object)
 * @return: Promise<BackendCourse>
 * @access: Private (Instructor only)
 */
export async function createCourse(data: {
  title: string;
  subtitle: string;
  description: string;
  category: string;
  level: string;
  price: number;
  thumbnail: string;
}): Promise<BackendCourse> {
  const res = await apiClient.post("/courses", data);
  return res.data?.data?.course ?? res.data?.course;
}

/**
 * @desc: Fetch courses created by the currently authenticated instructor
 * @input: none
 * @return: Promise<BackendCourse[]>
 * @access: Private (Instructor only)
 */
export async function fetchMyCreatedCourses(): Promise<BackendCourse[]> {
  const res = await apiClient.get("/courses");
  return res.data?.data?.courses ?? res.data?.courses ?? [];
}

/**
 * @desc: Fetch courses purchased by the current user
 * @input: none
 * @return: Promise<BackendCourse[]>
 * @access: Private
 */
export async function fetchPurchasedCoursesNew(): Promise<BackendCourse[]> {
  const res = await apiClient.get("/courses/purchased");
  const data = res.data?.data;
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.courses)) return data.courses;
  if (Array.isArray(res.data)) return res.data;
  return [];
}

/**
 * @desc: Fetch all announcements for a course
 * @input: courseId (string)
 * @return: Promise<BackendAnnouncement[]>
 * @access: Private
 */
export async function fetchCourseAnnouncements(courseId: string): Promise<BackendAnnouncement[]> {
  const res = await apiClient.get(`/courses/${courseId}/announcements`);
  return res.data?.data?.announcements ?? res.data?.announcements ?? [];
}

/**
 * @desc: Fetch announcements for all purchased courses
 * @input: none
 * @return: Promise<BackendAnnouncement[]>
 * @access: Private
 */
export async function fetchMyAnnouncements(): Promise<BackendAnnouncement[]> {
  const res = await apiClient.get("/courses/my-announcements");
  return res.data?.data?.announcements ?? res.data?.announcements ?? [];
}

/**
 * @desc: Update course details (PATCH /api/v1/courses/:courseId)
 * @input: courseId (string), data (object)
 * @return: Promise<BackendCourse>
 * @access: Private (Instructor only)
 */
export async function apiUpdateCourseDetails(
  courseId: string,
  data: {
    title?: string;
    subtitle?: string;
    description?: string;
    category?: string;
    level?: string;
    price?: number;
    thumbnail?: string;
    isPublished?: boolean;
  }
): Promise<BackendCourse> {
  const res = await apiClient.patch(`/courses/${courseId}`, data);
  return res.data?.data?.course ?? res.data?.course;
}

/**
 * @desc: Add lecture to course (JSON payload)
 * @input: courseId (string), data (object)
 * @return: Promise<BackendLecture>
 * @access: Private (Instructor only)
 */
export async function apiAddLecture(
  courseId: string,
  data: {
    title: string;
    description: string;
    videoUrl: string;
    publicId: string;
  }
): Promise<BackendLecture> {
  const res = await apiClient.post(`/courses/${courseId}/lectures`, data);
  return res.data?.data?.lecture ?? res.data?.lecture;
}

/**
 * @desc: Delete lecture (DELETE /api/v1/lecture/:lectureId)
 * @input: lectureId (string)
 * @return: Promise<void>
 * @access: Private (Instructor only)
 */
export async function apiDeleteLecture(lectureId: string): Promise<void> {
  await apiClient.delete(`/lecture/${lectureId}`);
}

/**
 * @desc: Rate a course (POST /api/v1/courses/:courseId/rate)
 * @input: courseId (string), rating (number)
 * @return: Promise<any>
 */
export async function apiRateCourse(courseId: string, rating: number): Promise<any> {
  const res = await apiClient.post(`/courses/${courseId}/rate`, { rating });
  return res.data;
}
