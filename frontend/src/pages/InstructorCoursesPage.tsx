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
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8"
        >
          <div>
            <h1 className="text-3xl sm:text-4xl font-heading font-black text-foreground tracking-tight">Instructor Studio</h1>
            <p className="text-foreground/70 text-sm font-base mt-1">Manage, publish, and track the curriculum you teach.</p>
          </div>
          <Button
            size="lg"
            variant="default"
            onClick={() => navigate("/instructor/courses/create")}
            className="font-heading font-black shadow-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none cursor-pointer"
            id="create-new-course-btn"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Course
          </Button>
        </motion.div>

        {error && (
          <div className="bg-red-100 border-2 border-red-500 rounded-base px-4 py-3 flex items-center gap-3 text-red-700 font-heading font-bold text-sm mb-6 shadow-[2px_2px_0px_0px_#ef4444]">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-background border-2 border-border rounded-base p-0 overflow-hidden shadow-shadow animate-pulse">
                <div className="h-44 bg-secondary-background border-b-2 border-border mb-4" />
                <div className="p-4">
                  <div className="h-4 bg-secondary-background rounded-base w-3/4 mb-2.5" />
                  <div className="h-3.5 bg-secondary-background rounded-base w-1/2 mb-4" />
                  <div className="h-9 bg-secondary-background rounded-base w-full" />
                </div>
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
