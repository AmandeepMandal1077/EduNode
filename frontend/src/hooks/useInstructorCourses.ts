import { useState, useEffect } from "react";
import { getMyCreatedCourses } from "@/services/courseService";
import type { Course } from "@/types";

export function useInstructorCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getMyCreatedCourses()
      .then((data) => {
        setCourses(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load your created courses. Please refresh the page.");
        setLoading(false);
      });
  }, []);

  return { courses, loading, error };
}
