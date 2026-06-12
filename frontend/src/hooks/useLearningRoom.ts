import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/store";
import {
  fetchCourseDetailsThunk,
  fetchCourseProgressThunk,
  updateLectureProgressThunk,
} from "@/store/courseSlice";
import { getCourseAnnouncements } from "@/services/courseService";
import type { BackendAnnouncement } from "@/api/courseApi";
import type { Lecture } from "@/types";

export function useLearningRoom() {
  const { courseId, lectureId } = useParams<{ courseId: string; lectureId: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const [currentLecture, setCurrentLecture] = useState<Lecture | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  const { currentUser } = useSelector((state: RootState) => state.auth);
  const course = useSelector((state: RootState) => state.course.selectedCourse);
  const completedLecturesList = useSelector(
    (state: RootState) => state.course.completedLectures[courseId || ""] ?? []
  );
  const completedIds = useMemo(() => new Set(completedLecturesList), [completedLecturesList]);

  const [announcements, setAnnouncements] = useState<BackendAnnouncement[]>([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(false);

  useEffect(() => {
    if (!courseId) return;
    setLoading(true);
    setAnnouncementsLoading(true);
    Promise.all([
      dispatch(fetchCourseDetailsThunk(courseId)),
      dispatch(fetchCourseProgressThunk(courseId)),
      getCourseAnnouncements(courseId).then((list) => setAnnouncements(list)),
    ]).finally(() => {
      setLoading(false);
      setAnnouncementsLoading(false);
    });
  }, [dispatch, courseId]);

  useEffect(() => {
    if (course) {
      let found = false;
      for (const mod of course.modules) {
        const lec = mod.lectures.find((l) => l.id === lectureId);
        if (lec) {
          setCurrentLecture(lec);
          found = true;
          break;
        }
      }
      if (!found && course.modules[0]?.lectures[0]) {
        setCurrentLecture(course.modules[0].lectures[0]);
      }
    }
  }, [course, lectureId]);

  const handleProgress = useCallback(
    async (watched: number) => {
      if (!courseId || !currentLecture) return;
      dispatch(
        updateLectureProgressThunk({
          courseId,
          lectureId: currentLecture.id,
          watchedSeconds: watched,
          totalSeconds: currentLecture.durationSeconds,
        })
      );
    },
    [dispatch, courseId, currentLecture]
  );

  const handleToggleCompletion = async (e: React.MouseEvent, targetLecId: string, durationSecs: number) => {
    e.stopPropagation();
    if (!courseId) return;
    const isCurrentlyCompleted = completedIds.has(targetLecId);
    dispatch(
      updateLectureProgressThunk({
        courseId,
        lectureId: targetLecId,
        watchedSeconds: isCurrentlyCompleted ? 0 : durationSecs,
        totalSeconds: durationSecs,
      })
    );
  };

  const allLectures = course?.modules.flatMap((m) => m.lectures) ?? [];
  const currentIndex = allLectures.findIndex((l) => l.id === lectureId);
  const prevLecture = currentIndex > 0 ? allLectures[currentIndex - 1] : null;
  const nextLecture = currentIndex < allLectures.length - 1 ? allLectures[currentIndex + 1] : null;

  const navigateTo = (lec: Lecture) => navigate(`/learn/${courseId}/lecture/${lec.id}`);

  return {
    courseId,
    lectureId,
    navigate,
    currentLecture,
    loading,
    activeTab,
    setActiveTab,
    currentUser,
    course,
    completedIds,
    announcements,
    announcementsLoading,
    handleProgress,
    handleToggleCompletion,
    prevLecture,
    nextLecture,
    navigateTo,
  };
}
