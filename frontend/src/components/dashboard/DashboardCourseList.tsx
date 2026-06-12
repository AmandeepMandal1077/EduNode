import { motion } from "motion/react";
import { BookOpen, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { EnrolledCourse } from "@/types";

interface DashboardCourseListProps {
  enrolled: EnrolledCourse[];
  navigate: (path: string) => void;
}

export function DashboardCourseList({ enrolled, navigate }: DashboardCourseListProps) {
  if (enrolled.length === 0) return null;

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-800">My Courses</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/my-courses")}
          className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 cursor-pointer"
        >
          View all
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {enrolled.map((e, i) => (
          <motion.div
            key={e.course.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            onClick={() => navigate(`/learn/${e.course.id}/lecture/${e.enrollment.lastLectureId}`)}
            className="bento-card bento-card-interactive flex gap-3 p-3 cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden bg-slate-100">
              {e.course.thumbnail ? (
                <img
                  src={e.course.thumbnail}
                  alt={e.course.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{ background: `${e.course.thumbnailAccent}22` }}
                >
                  <BookOpen className="w-5 h-5" style={{ color: e.course.thumbnailAccent }} />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">{e.course.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <Progress value={e.enrollment.progressPercent} className="h-1.5 flex-1" />
                <span className="text-xs font-semibold text-indigo-600 flex-shrink-0">{e.enrollment.progressPercent}%</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
