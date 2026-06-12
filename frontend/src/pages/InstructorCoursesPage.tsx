import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Plus, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

import { useInstructorCourses } from "@/hooks/useInstructorCourses";
import { InstructorEmptyState } from "@/components/instructor/InstructorEmptyState";
import { InstructorCourseGrid } from "@/components/instructor/InstructorCourseGrid";

export function InstructorCoursesPage() {
  const navigate = useNavigate();
  const { courses, loading, error } = useInstructorCourses();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8"
        >
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Instructor Dashboard</h1>
            <p className="text-slate-500 text-sm mt-1">Manage, publish, and track the courses you teach.</p>
          </div>
          <Button
            onClick={() => navigate("/instructor/courses/create")}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-lg shadow-indigo-100 cursor-pointer"
            id="create-new-course-btn"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Course
          </Button>
        </motion.div>

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 flex items-center gap-3 text-red-700 text-sm mb-6">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bento-card animate-pulse">
                <div className="h-44 bg-slate-100 rounded-xl mb-4" />
                <div className="h-4 bg-slate-100 rounded w-3/4 mb-2.5" />
                <div className="h-3.5 bg-slate-100 rounded w-1/2 mb-4" />
                <div className="h-8 bg-slate-100 rounded-lg w-full" />
              </div>
            ))}
          </div>
        ) : courses.length === 0 ? (
          <InstructorEmptyState navigate={navigate} />
        ) : (
          <InstructorCourseGrid courses={courses} navigate={navigate} />
        )}
      </div>
    </div>
  );
}
