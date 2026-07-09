
import type { Course, Lecture, Enrollment, LectureProgress } from "../types";
import {
  fetchPublishedCourses,
  fetchSearchCourses,
  fetchCourseDetails,
  fetchCourseLectures,
  fetchProcessingLectures,
  fetchCourseAnnouncements,
  fetchMyAnnouncements,
  fetchCategories,
  createCourse as apiCreateCourse,
  fetchMyCreatedCourses as apiFetchMyCreatedCourses,
  apiUpdateCourseDetails,
  apiAddLecture,
  apiDeleteLecture,
  apiRateCourse,
  type BackendCourse,
  type BackendLecture,
  type BackendAnnouncement,
  type BackendProcessingLecture,
} from "../api/courseApi";
import {
  fetchCoursePurchaseStatus,
  fetchMyEnrollments,
} from "../api/purchaseApi";
import {
  fetchCourseProgress,
  updateLectureProgress as apiUpdateLectureProgress,
  type CourseProgressResponse,
} from "../api/progressApi";


const ACCENTS = [
  "#7c3aed", "#4338ca", "#0d9488", "#be185d", "#d97706",
  "#0284c7", "#a21caf", "#16a34a", "#475569", "#dc2626",
  "#3b82f6", "#14b8a6",
];
function accentForSlug(slug: string | undefined): string {
  if (!slug) return ACCENTS[0];
  let hash = 0;
  for (const ch of slug) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffffff;
  return ACCENTS[Math.abs(hash) % ACCENTS.length];
}


function normalizeLevel(
  raw: string
): "Beginner" | "Intermediate" | "Advanced" {
  if (raw === "advance" || raw === "Advanced") return "Advanced";
  if (raw === "intermediate" || raw === "Intermediate") return "Intermediate";
  return "Beginner";
}

function toBackendLevel(lvl: string): string {
  const l = lvl.toLowerCase();
  if (l === "advanced" || l === "advance") return "advance";
  if (l === "intermediate") return "intermediate";
  return "beginner";
}


function fmtDuration(seconds: number | undefined): string {
  if (seconds == null || isNaN(seconds)) return "0m";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}


function mapLecture(bl: BackendLecture): Lecture {
  const dur = bl.duration ?? 0;
  const min = Math.floor(dur / 60)
    .toString()
    .padStart(2, "0");
  const sec = (dur % 60).toString().padStart(2, "0");
  return {
    id:              bl._id,
    title:           bl.title,
    duration:        `${min}:${sec}`,
    durationSeconds: dur,
    videoUrl:        bl.videoUrl,
    description:     bl.description,
    resources:       [],
    isPreview:       bl.isPreview ?? false,
    order:           bl.order ?? 0,
  };
}


function mapCourse(bc: BackendCourse, lectures?: BackendLecture[]): Course {
  const instructorName =
    typeof bc.instructor === "string"
      ? "Instructor"
      : bc.instructor?.name ?? "Instructor";
  const instructorBio =
    typeof bc.instructor === "string"
      ? ""
      : bc.instructor?.bio ?? "";
  const instructorAvatar =
    typeof bc.instructor === "string"
      ? ""
      : bc.instructor?.avatar ?? "";


  const mappedLectures: Lecture[] =
    lectures?.map(mapLecture) ??
    (Array.isArray(bc.lectures)
      ? (bc.lectures as BackendLecture[])
          .filter((l) => typeof l === "object")
          .map(mapLecture)
      : []);

  return {
    id:               bc._id,
    title:            bc.title,
    subtitle:         bc.subtitle,
    description:      bc.description,
    instructor:       instructorName,
    instructorBio:    instructorBio,
    instructorAvatar: instructorAvatar,
    category:         bc.category,
    level:            normalizeLevel(bc.level),
    price:            bc.price,
    originalPrice:    bc.price,
    currency:         "INR",
    rating:           bc.averageRating ?? 0,
    reviewCount:      bc.enrolledStudents?.filter((s) => s.rating !== undefined).length ?? 0,
    studentCount:     bc.enrolledStudents?.length ?? 0,
    totalDuration:    fmtDuration(bc.totalDuration),
    lectureCount:     bc.totalLectures,
    language:         "English",
    lastUpdated:      bc.updatedAt?.slice(0, 10) ?? "",
    thumbnailAccent:  accentForSlug(bc.slug),
    tags:             [bc.category],
    modules: [
      {
        id:       `${bc._id}-module`,
        title:    bc.title,
        order:    1,
        lectures: mappedLectures,
      },
    ],
    requirements:     [],
    learningOutcomes: [],
    isBestseller:     bc.enrolledStudents?.length > 100,
    isFeatured:       bc.averageRating >= 4.5,
    thumbnail:        bc.thumbnail,
    isPublished:      bc.isPublished ?? false,
    enrolledStudents: bc.enrolledStudents?.map((s) => ({
      student: typeof s.student === "object" && s.student ? (s.student as any)._id || (s.student as any).id : s.student,
      rating: s.rating,
    })) ?? [],
  } as Course & { thumbnail: string };
}


function buildEnrollment(
  courseId: string,
  progress: CourseProgressResponse | null,
  firstLectureId?: string,
  enrolledAt?: string
): Enrollment {
  return {
    id:              `enr_${courseId}`,
    courseId,
    userId:          progress?.user ?? "",
    enrolledAt:      enrolledAt ?? new Date().toISOString(),
    progressPercent: progress?.completionPercentage ?? 0,
    lastLectureId:
      progress?.lectureProgress.find((lp) => !lp.isCompleted)?.lecture ??
      progress?.lectureProgress[progress.lectureProgress.length - 1]?.lecture ??
      firstLectureId ?? "",
    lastModuleId:    `${courseId}-module`,
    lectureProgress: (progress?.lectureProgress ?? []).map(
      (lp): LectureProgress => ({
        lectureId:      lp.lecture,
        watchedSeconds: lp.lastWatchedPosition,
        completed:      lp.isCompleted,
        lastWatchedAt:  lp.lastWatched,
      })
    ),
    completedAt:     progress?.isCompleted ? progress.lastAccessed : undefined,
  };
}



/**
 * @desc Fetch all published courses.
 * @input None
 * @output {Promise<Course[]>} List of mapped courses.
 */
export async function getCourses(): Promise<Course[]> {
  const bc = await fetchPublishedCourses();
  return bc.map((c) => mapCourse(c));
}

/**
 * @desc Fetch details and lectures for a specific course by ID.
 * @input {string} id - The course ID.
 * @output {Promise<Course | null>} The mapped course details or null.
 */
export async function getCourseById(id: string): Promise<Course | null> {
  try {
    const [bc, lectures] = await Promise.all([
      fetchCourseDetails(id),
      fetchCourseLectures(id),
    ]);
    return mapCourse(bc, lectures);
  } catch {
    return null;
  }
}

/**
 * @desc Fetch courses marked as featured.
 * @input None
 * @output {Promise<Course[]>} List of featured courses.
 */
export async function getFeaturedCourses(): Promise<Course[]> {
  const courses = await getCourses();
  return courses.filter((c) => c.isFeatured);
}

/**
 * @desc Fetch courses marked as bestsellers.
 * @input None
 * @output {Promise<Course[]>} List of bestseller courses.
 */
export async function getBestsellerCourses(): Promise<Course[]> {
  const courses = await getCourses();
  return courses.filter((c) => c.isBestseller);
}

/**
 * @desc Search published courses with query/category filters.
 * @input {string} query - Search query.
 * @input {string} [category] - Optional category filter.
 * @input {string} [priceFilter] - Optional price filter.
 * @output {Promise<Course[]>} List of matching courses.
 */
export async function searchCourses(
  query: string,
  category?: string,
  priceFilter?: string
): Promise<Course[]> {
  let bc: BackendCourse[] = [];
  if (query && query.trim() !== "") {
    bc = await fetchSearchCourses(query, category);
  } else {
    bc = await fetchPublishedCourses();
  }
  let courses = bc.map((c) => mapCourse(c));

  if (category && category !== "all") {
    courses = courses.filter(
      (c) => c.category.toLowerCase() === category.toLowerCase()
    );
  }



  if (priceFilter === "free") {
    courses = courses.filter((c) => c.price === 0);
  } else if (priceFilter === "paid") {
    courses = courses.filter((c) => c.price > 0);
  } else if (priceFilter === "under50") {
    courses = courses.filter((c) => c.price > 0 && c.price < 4000);
  } else if (priceFilter === "under100") {
    courses = courses.filter((c) => c.price > 0 && c.price < 8000);
  }

  return courses;
}

/**
 * @desc Fetch all unique course categories.
 * @input None
 * @output {Promise<string[]>} List of category names.
 */
export async function getCategories(): Promise<string[]> {
  try {
    return await fetchCategories();
  } catch {
    return [];
  }
}

/**
 * @desc Fetch purchased (enrolled) courses with progress details.
 * @input None
 * @output {Promise<Array<{ course: Course, enrollment: Enrollment }>>} Enrolled courses data.
 */
export async function getEnrolledCourses(): Promise<
  { course: Course; enrollment: Enrollment }[]
> {
  try {
    const backendData = await fetchMyEnrollments();
    return backendData.map((data) => {
      const courseId = data.course._id;
      const course = mapCourse(data.course, Array.isArray(data.course.lectures) ? (data.course.lectures as unknown as BackendLecture[]) : undefined);
      const firstLecture = Array.isArray(data.course.lectures) && data.course.lectures.length > 0 
                           ? (data.course.lectures[0] as any)._id 
                           : undefined;
      const enrollment = buildEnrollment(
        courseId,
        data.progress,
        firstLecture,
        data.purchase.createdAt
      );
      return { course, enrollment };
    });
  } catch {
    return [];
  }
}


/**
 * @desc Update progress and mark completion of a lecture.
 * @input {string} courseId - The ID of the course.
 * @input {string} lectureId - The ID of the lecture.
 * @input {number} watchedSeconds - Number of seconds watched.
 * @input {number} totalSeconds - Total duration of the lecture.
 * @output {Promise<void>} Resolves on success.
 */
export async function updateLectureProgress(
  courseId: string,
  lectureId: string,
  watchedSeconds: number,
  totalSeconds: number
): Promise<void> {
  const isCompleted = watchedSeconds >= totalSeconds * 0.95;
  try {
    await apiUpdateLectureProgress(courseId, lectureId, {
      isCompleted,
      lastWatchedPosition: watchedSeconds,
    });
  } catch {

  }
}

/**
 * @desc Fetch all announcements for a course.
 * @input {string} courseId - The ID of the course.
 * @output {Promise<BackendAnnouncement[]>} List of announcements.
 */
export async function getCourseAnnouncements(courseId: string): Promise<BackendAnnouncement[]> {
  try {
    return await fetchCourseAnnouncements(courseId);
  } catch {
    return [];
  }
}

/**
 * @desc Fetch all announcements for purchased courses.
 * @input None
 * @output {Promise<BackendAnnouncement[]>} List of personal announcements.
 */
export async function getMyAnnouncements(): Promise<BackendAnnouncement[]> {
  try {
    return await fetchMyAnnouncements();
  } catch {
    return [];
  }
}

/**
 * @desc Check if a course is purchased by the current user.
 * @input {string} courseId - The ID of the course.
 * @output {Promise<boolean>} True if enrolled, false otherwise.
 */
export async function isEnrolled(courseId: string): Promise<boolean> {
  try {
    const data = await fetchCoursePurchaseStatus(courseId);
    return data.isPurchased || data.status === "completed";
  } catch {
    return false;
  }
}

/**
 * @desc Create a new course via JSON.
 * @input {Object} data - The course details to create.
 * @output {Promise<Course>} The created course.
 */
export async function createCourse(
  data: {
    title: string;
    subtitle: string;
    description: string;
    category: string;
    level: string;
    price: number;
    thumbnail: string;
  }
): Promise<Course> {
  const bc = await apiCreateCourse({
    title: data.title,
    subtitle: data.subtitle,
    description: data.description,
    category: data.category,
    level: toBackendLevel(data.level),
    price: data.price,
    thumbnail: data.thumbnail,
  });

  return mapCourse(bc);
}

/**
 * @desc Fetch courses created by currently authenticated instructor.
 * @input None
 * @output {Promise<Course[]>} List of created courses.
 */
export async function getMyCreatedCourses(): Promise<Course[]> {
  const bc = await apiFetchMyCreatedCourses();
  return bc.map((c) => mapCourse(c));
}

/**
 * @desc Update course details via JSON.
 * @input {string} courseId - The ID of the course.
 * @input {Object} data - The updated course details.
 * @output {Promise<Course>} The updated course.
 */
export async function updateCourse(
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
): Promise<Course> {
  const bc = await apiUpdateCourseDetails(courseId, {
    title: data.title,
    subtitle: data.subtitle,
    description: data.description,
    category: data.category,
    level: data.level ? toBackendLevel(data.level) : undefined,
    price: data.price,
    thumbnail: data.thumbnail,
    isPublished: data.isPublished,
  });

  return mapCourse(bc);
}

/**
 * @desc Add a lecture to a course.
 * @input {string} courseId - The ID of the course.
 * @input {Object} data - The lecture details.
 * @output {Promise<Lecture>} The added lecture.
 */
export async function addLecture(
  courseId: string,
  data: {
    title: string;
    description: string;
    videoUrl: string;
    publicId: string;
    signature: string;
    version: number;
  }
): Promise<Lecture> {
  const bl = await apiAddLecture(courseId, {
    title: data.title,
    description: data.description,
    videoUrl: data.videoUrl,
    publicId: data.publicId,
    signature: data.signature,
    version: data.version,
  });

  return mapLecture(bl);
}

/**
 * @desc Delete a lecture from a course.
 * @input {string} lectureId - The ID of the lecture.
 * @output {Promise<void>} Resolves on success.
 */
export async function deleteLecture(lectureId: string): Promise<void> {
  await apiDeleteLecture(lectureId);
}

/**
 * @desc Fetch all processing lectures for a course.
 * @input {string} courseId - The ID of the course.
 * @output {Promise<BackendProcessingLecture[]>} List of processing lectures.
 */
export async function getProcessingLectures(courseId: string): Promise<BackendProcessingLecture[]> {
  try {
    return await fetchProcessingLectures(courseId);
  } catch {
    return [];
  }
}

/**
 * @desc Submit a rating for a course.
 * @input {string} courseId - The ID of the course.
 * @input {number} rating - The submitted rating.
 * @output {Promise<any>} Response object from the backend.
 */
export async function rateCourse(courseId: string, rating: number): Promise<any> {
  return await apiRateCourse(courseId, rating);
}
