import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "motion/react";
import { Plus, BookOpen, AlertCircle, Eye, ShieldCheck, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getMyCreatedCourses } from "@/services/courseService";
import type { Course } from "@/types";

export function InstructorCoursesPage() {
  const navigate = useNavigate();
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

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
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
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-lg shadow-indigo-100"
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
          /* Loading Skeletons */
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
          /* Empty State */
          <div className="text-center py-20 bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-indigo-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">No courses created yet</h3>
            <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">
              Share your knowledge with the world. Create your first online course in just a few clicks.
            </p>
            <Button
              onClick={() => navigate("/instructor/courses/create")}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Course
            </Button>
          </div>
        ) : (
          /* Courses Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course, idx) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bento-card flex flex-col overflow-hidden p-0"
              >
                {/* Thumbnail */}
                <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                  {course.thumbnail ? (
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center text-white"
                      style={{ background: `linear-gradient(135deg, ${course.thumbnailAccent}dd, ${course.thumbnailAccent}88)` }}
                    >
                      <BookOpen className="w-12 h-12" />
                    </div>
                  )}

                  {/* Level Badge */}
                  <div className="absolute top-3 left-3 z-10">
                    <Badge variant="secondary" className="text-[10px] bg-black/40 text-white border-0 backdrop-blur">
                      {course.level}
                    </Badge>
                  </div>

                  {/* Publish Status Badge */}
                  <div className="absolute top-3 right-3 z-10">
                    <Badge
                      className={`text-[10px] border-0 font-semibold shadow-sm px-2.5 py-0.5 rounded-full ${
                        course.isPublished
                          ? "bg-emerald-500 text-white"
                          : "bg-amber-500 text-white"
                      }`}
                    >
                      {course.isPublished ? "Published" : "Draft"}
                    </Badge>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col gap-4 flex-grow">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">{course.category}</span>
                    <h3 className="font-extrabold text-slate-800 text-base leading-snug line-clamp-2 mt-1">
                      {course.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1.5">{course.subtitle}</p>
                  </div>

                  {/* Meta stats */}
                  <div className="flex justify-between items-center text-xs text-slate-500 border-t border-slate-100 pt-3.5 mt-auto">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{course.studentCount} Students</span>
                    </div>
                    <span className="font-bold text-slate-800">
                      {course.price === 0 ? "Free" : `₹${course.price}`}
                    </span>
                  </div>

                  {/* Buttons */}
                  <div className="flex items-center gap-2 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="flex-1 rounded-xl border-slate-200 text-xs font-semibold"
                    >
                      <Link to={`/course/${course.id}`}>
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        Preview Page
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => navigate(`/instructor/courses/${course.id}/manage`)}
                      className="flex-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold"
                    >
                      <FileText className="w-3.5 h-3.5 mr-1" />
                      Manage Course
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
