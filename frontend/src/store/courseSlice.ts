import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { Course, Enrollment } from "../types";
import {
  getCourses,
  getCourseById,
  getFeaturedCourses,
  getBestsellerCourses,
  searchCourses,
  getCategories,
  getEnrolledCourses,
} from "../services/courseService";
import {
  fetchCourseProgress,
  updateLectureProgress as apiUpdateLectureProgress,
} from "../api/progressApi";

interface CourseState {
  courses: Course[];
  featuredCourses: Course[];
  bestsellerCourses: Course[];
  enrolledCourses: { course: Course; enrollment: Enrollment }[];
  selectedCourse: Course | null;
  categories: string[];
  completedLectures: Record<string, string[]>;
  loading: boolean;
  error: string | null;
}

const initialState: CourseState = {
  courses: [],
  featuredCourses: [],
  bestsellerCourses: [],
  enrolledCourses: [],
  selectedCourse: null,
  categories: [],
  completedLectures: {},
  loading: false,
  error: null,
};

export const fetchCoursesThunk = createAsyncThunk(
  "course/fetchCourses",
  async () => {
    return await getCourses();
  }
);

export const fetchCourseDetailsThunk = createAsyncThunk(
  "course/fetchCourseDetails",
  async (courseId: string) => {
    return await getCourseById(courseId);
  }
);

export const fetchFeaturedCoursesThunk = createAsyncThunk(
  "course/fetchFeatured",
  async () => {
    return await getFeaturedCourses();
  }
);

export const fetchBestsellerCoursesThunk = createAsyncThunk(
  "course/fetchBestseller",
  async () => {
    return await getBestsellerCourses();
  }
);

export const searchCoursesThunk = createAsyncThunk(
  "course/searchCourses",
  async (payload: { query: string; category?: string; priceFilter?: string }) => {
    const { query, category, priceFilter } = payload;
    return await searchCourses(query, category, priceFilter);
  }
);

export const fetchCategoriesThunk = createAsyncThunk(
  "course/fetchCategories",
  async () => {
    return await getCategories();
  }
);

export const fetchEnrolledCoursesThunk = createAsyncThunk(
  "course/fetchEnrolled",
  async () => {
    return await getEnrolledCourses();
  }
);

export const fetchCourseProgressThunk = createAsyncThunk(
  "course/fetchProgress",
  async (courseId: string) => {
    const progress = await fetchCourseProgress(courseId);
    return { courseId, progress };
  }
);

export const updateLectureProgressThunk = createAsyncThunk(
  "course/updateLectureProgress",
  async (
    payload: { courseId: string; lectureId: string; watchedSeconds: number; totalSeconds: number },
    { rejectWithValue }
  ) => {
    const { courseId, lectureId, watchedSeconds, totalSeconds } = payload;
    const isCompleted = watchedSeconds >= totalSeconds * 0.95;
    try {
      await apiUpdateLectureProgress(courseId, lectureId, {
        isCompleted,
        lastWatchedPosition: watchedSeconds,
      });
      return { courseId, lectureId, isCompleted };
    } catch (err: unknown) {
      return rejectWithValue(err instanceof Error ? err.message : "Failed to update lecture progress");
    }
  }
);

const courseSlice = createSlice({
  name: "course",
  initialState,
  reducers: {
    clearSelectedCourse: (state) => {
      state.selectedCourse = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder

      .addCase(fetchCoursesThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCoursesThunk.fulfilled, (state, action) => {
        state.courses = action.payload;
        state.loading = false;
      })
      .addCase(fetchCoursesThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch courses";
      })


      .addCase(fetchCourseDetailsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCourseDetailsThunk.fulfilled, (state, action) => {
        state.selectedCourse = action.payload;
        state.loading = false;
      })
      .addCase(fetchCourseDetailsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch course details";
      })


      .addCase(fetchFeaturedCoursesThunk.fulfilled, (state, action) => {
        state.featuredCourses = action.payload;
      })


      .addCase(fetchBestsellerCoursesThunk.fulfilled, (state, action) => {
        state.bestsellerCourses = action.payload;
      })


      .addCase(searchCoursesThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchCoursesThunk.fulfilled, (state, action) => {
        state.courses = action.payload;
        state.loading = false;
      })
      .addCase(searchCoursesThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Search failed";
      })


      .addCase(fetchCategoriesThunk.fulfilled, (state, action) => {
        state.categories = action.payload;
      })


      .addCase(fetchEnrolledCoursesThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEnrolledCoursesThunk.fulfilled, (state, action) => {
        state.enrolledCourses = action.payload;
        state.loading = false;

        action.payload.forEach((item) => {
          const courseId = item.course.id;
          state.completedLectures[courseId] = item.enrollment.lectureProgress
            .filter((lp) => lp.completed)
            .map((lp) => lp.lectureId);
        });
      })
      .addCase(fetchEnrolledCoursesThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch enrolled courses";
      })


      .addCase(fetchCourseProgressThunk.fulfilled, (state, action) => {
        const { courseId, progress } = action.payload;
        if (progress && progress.lectureProgress) {
          state.completedLectures[courseId] = progress.lectureProgress
            .filter((lp: { isCompleted: boolean; lecture: string }) => lp.isCompleted)
            .map((lp: { isCompleted: boolean; lecture: string }) => lp.lecture);
        } else {
          state.completedLectures[courseId] = [];
        }
      })


      .addCase(updateLectureProgressThunk.fulfilled, (state, action) => {
        const { courseId, lectureId, isCompleted } = action.payload;
        if (!state.completedLectures[courseId]) {
          state.completedLectures[courseId] = [];
        }
        const list = state.completedLectures[courseId];
        if (isCompleted) {
          if (!list.includes(lectureId)) {
            list.push(lectureId);
          }
        } else {
          state.completedLectures[courseId] = list.filter((id) => id !== lectureId);
        }
      });
  },
});

export const { clearSelectedCourse, clearError } = courseSlice.actions;
export default courseSlice.reducer;
