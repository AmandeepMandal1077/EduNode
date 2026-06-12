import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getCourseById, updateCourse } from "@/services/courseService";
import { getErrorMessage } from "@/utils/getErrorMessage";
import type { Course } from "@/types";

export function useInstructorCourseManage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("details");
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  const loadCourseData = useCallback(async () => {
    if (!courseId) return;
    try {
      setLoading(true);
      const data = await getCourseById(courseId);
      if (data) {
        setCourse(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    loadCourseData();
  }, [loadCourseData]);

  const togglePublishStatus = async () => {
    if (!courseId || !course) return;
    try {
      const updated = await updateCourse(courseId, {
        isPublished: !course.isPublished,
      });
      setCourse(updated);
    } catch (err: unknown) {
      console.error(err);
      alert(getErrorMessage(err, "Failed to update publication status."));
    }
  };

  return {
    courseId,
    navigate,
    activeTab,
    setActiveTab,
    course,
    setCourse,
    loading,
    loadCourseData,
    togglePublishStatus,
  };
}
