import { useState, useEffect } from "react";
import { getEnrolledCourses, getMyAnnouncements } from "@/services/courseService";
import { getCurrentUser } from "@/services/userService";
import type { User, EnrolledCourse } from "@/types";

export interface DashboardAnnouncement {
  id: string;
  courseId: string;
  lastLectureId: string;
  courseTitle: string;
  message: string;
  time: string;
}

export function useDashboard() {
  const [enrolled, setEnrolled] = useState<EnrolledCourse[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [announcements, setAnnouncements] = useState<DashboardAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getEnrolledCourses(), getCurrentUser()]).then(async ([courses, u]) => {
      setEnrolled(courses);
      setUser(u);

      try {
        const list = await getMyAnnouncements();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mappedAnnouncements = list.map((ann: any) => {
          const enrolledCourse = courses.find((c) => c.course.id === (ann.courseId?._id || ann.courseId));
          return {
            id: ann._id,
            courseId: ann.courseId?._id || ann.courseId,
            lastLectureId: enrolledCourse?.enrollment.lastLectureId || "",
            courseTitle: ann.courseId?.title || enrolledCourse?.course.title || "Course",
            message: ann.message,
            time: ann.sentAt,
          };
        });
        setAnnouncements(mappedAnnouncements);
      } catch (err) {
        console.error("Failed to fetch announcements:", err);
      }

      setLoading(false);
    });
  }, []);

  return {
    enrolled,
    user,
    announcements,
    loading,
  };
}
