

import apiClient from "./client";



export interface BackendLecture {
  _id: string;
  title: string;
  slug: string;
  courseId: string;
  description: string;
  videoUrl: string;
  duration?: number;
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
  totalDuration: number;
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



/**
 * @desc Fetch all published courses.
 * @input None
 * @output {Promise<BackendCourse[]>} List of published courses.
 */
export async function fetchPublishedCourses(): Promise<BackendCourse[]> {
  const res = await apiClient.get("/courses/published");
  return res.data?.data?.courses ?? res.data?.courses ?? [];
}

/**
 * @desc Fetch all unique course categories.
 * @input None
 * @output {Promise<string[]>} List of categories.
 */
export async function fetchCategories(): Promise<string[]> {
  const res = await apiClient.get("/courses/categories");
  return res.data?.data?.categories ?? res.data?.categories ?? [];
}

/**
 * @desc Search for published courses using query text and category.
 * @input {string} [query] - Optional search query string.
 * @input {string} [category] - Optional category to filter by.
 * @output {Promise<BackendCourse[]>} List of matching courses.
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
 * @desc Fetch full details for a course by its ID.
 * @input {string} courseId - The ID of the course.
 * @output {Promise<BackendCourse>} The course details.
 */
export async function fetchCourseDetails(courseId: string): Promise<BackendCourse> {
  const res = await apiClient.get(`/courses/${courseId}`);
  return res.data?.data?.course ?? res.data?.course;
}

/**
 * @desc Fetch all lectures associated with a specific course.
 * @input {string} courseId - The ID of the course.
 * @output {Promise<BackendLecture[]>} List of lectures.
 */
export async function fetchCourseLectures(courseId: string): Promise<BackendLecture[]> {
  const res = await apiClient.get(`/courses/${courseId}/lectures`);
  const data = res.data?.data?.lectures ?? res.data?.lectures;
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.lectures)) return data.lectures;
  return [];
}

export interface BackendProcessingLecture {
  _id: string;
  title: string;
  description: string;
  uploadStatus: string;
  createdAt: string;
}

/**
 * @desc Fetch all lectures that are currently processing for a specific course.
 * @input {string} courseId - The ID of the course.
 * @output {Promise<BackendProcessingLecture[]>} List of processing lectures.
 */
export async function fetchProcessingLectures(courseId: string): Promise<BackendProcessingLecture[]> {
  const res = await apiClient.get(`/courses/${courseId}/lectures/processing`);
  return res.data?.data?.lectures ?? res.data?.lectures ?? [];
}

/**
 * @desc Post a new announcement for a course.
 * @input {string} courseId - The ID of the course.
 * @input {string} message - The announcement message.
 * @output {Promise<BackendAnnouncement>} The created announcement.
 */
export async function postAnnouncement(
  courseId: string,
  message: string
): Promise<BackendAnnouncement> {
  const res = await apiClient.post(`/courses/${courseId}/announce`, { message });
  return res.data?.data?.announcement ?? res.data?.announcement;
}

/**
 * @desc Create a new course.
 * @input {Object} data - The course details (title, subtitle, description, category, level, price, thumbnail).
 * @output {Promise<BackendCourse>} The created course.
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
 * @desc Fetch courses created by the currently authenticated instructor.
 * @input None
 * @output {Promise<BackendCourse[]>} List of courses created by the instructor.
 */
export async function fetchMyCreatedCourses(): Promise<BackendCourse[]> {
  const res = await apiClient.get("/courses");
  return res.data?.data?.courses ?? res.data?.courses ?? [];
}

/**
 * @desc Fetch courses purchased by the current user.
 * @input None
 * @output {Promise<BackendCourse[]>} List of purchased courses.
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
 * @desc Fetch all announcements for a course.
 * @input {string} courseId - The ID of the course.
 * @output {Promise<BackendAnnouncement[]>} List of announcements.
 */
export async function fetchCourseAnnouncements(courseId: string): Promise<BackendAnnouncement[]> {
  const res = await apiClient.get(`/courses/${courseId}/announcements`);
  return res.data?.data?.announcements ?? res.data?.announcements ?? [];
}

/**
 * @desc Fetch announcements for all purchased courses.
 * @input None
 * @output {Promise<BackendAnnouncement[]>} List of announcements.
 */
export async function fetchMyAnnouncements(): Promise<BackendAnnouncement[]> {
  const res = await apiClient.get("/courses/my-announcements");
  return res.data?.data?.announcements ?? res.data?.announcements ?? [];
}

/**
 * @desc Update course details.
 * @input {string} courseId - The ID of the course.
 * @input {Object} data - The updated course details.
 * @output {Promise<BackendCourse>} The updated course.
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
 * @desc Add a new lecture to a course.
 * @input {string} courseId - The ID of the course.
 * @input {Object} data - The lecture details (title, description, videoUrl, publicId).
 * @output {Promise<BackendLecture>} The added lecture.
 */
export async function apiAddLecture(
  courseId: string,
  data: {
    title: string;
    description: string;
    videoUrl: string;
    publicId: string;
    signature: string;
    version: number;
  }
): Promise<BackendLecture> {
  const res = await apiClient.post(`/courses/${courseId}/lectures`, data);
  return res.data?.data?.lecture ?? res.data?.lecture;
}

/**
 * @desc Delete a lecture.
 * @input {string} lectureId - The ID of the lecture.
 * @output {Promise<void>} Resolves when the lecture is deleted.
 */
export async function apiDeleteLecture(lectureId: string): Promise<void> {
  await apiClient.delete(`/lecture/${lectureId}`);
}

/**
 * @desc Rate a course.
 * @input {string} courseId - The ID of the course.
 * @input {number} rating - The rating value.
 * @output {Promise<any>} The response data.
 */
export async function apiRateCourse(courseId: string, rating: number): Promise<any> {
  const res = await apiClient.post(`/courses/${courseId}/rate`, { rating });
  return res.data;
}
