import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { BookOpen, Eye, ShieldCheck, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Course } from "@/types";

interface InstructorCourseGridProps {
  courses: Course[];
  navigate: (path: string) => void;
}

export function InstructorCourseGrid({ courses, navigate }: InstructorCourseGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {courses.map((course, idx) => (
        <motion.div
          key={course.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05 }}
          className="bento-card flex flex-col overflow-hidden p-0"
        >
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

            <div className="absolute top-3 left-3 z-10">
              <Badge variant="secondary" className="text-[10px] bg-black/40 text-white border-0 backdrop-blur">
                {course.level}
              </Badge>
            </div>

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

          <div className="p-5 flex flex-col gap-4 flex-grow">
            <div>
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">{course.category}</span>
              <h3 className="font-extrabold text-slate-800 text-base leading-snug line-clamp-2 mt-1">
                {course.title}
              </h3>
              <p className="text-xs text-slate-500 line-clamp-2 mt-1.5">{course.subtitle}</p>
            </div>

            <div className="flex justify-between items-center text-xs text-slate-500 border-t border-slate-100 pt-3.5 mt-auto">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                <span>{course.studentCount} Students</span>
              </div>
              <span className="font-bold text-slate-800">
                {course.price === 0 ? "Free" : `₹${course.price}`}
              </span>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                asChild
                className="flex-1 rounded-xl border-slate-200 text-xs font-semibold cursor-pointer"
              >
                <Link to={`/course/${course.id}`}>
                  <Eye className="w-3.5 h-3.5 mr-1" />
                  Preview Page
                </Link>
              </Button>
              <Button
                size="sm"
                onClick={() => navigate(`/instructor/courses/${course.id}/manage`)}
                className="flex-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 mr-1" />
                Manage Course
              </Button>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
