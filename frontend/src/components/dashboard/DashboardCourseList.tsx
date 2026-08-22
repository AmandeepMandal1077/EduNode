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
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-heading font-black text-foreground">Enrolled Courses</h2>
        <Button
          variant="neutral"
          size="sm"
          onClick={() => navigate("/my-courses")}
          className="font-heading font-bold cursor-pointer"
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
            className="bg-background border-2 border-border rounded-base p-3 shadow-shadow flex gap-3 cursor-pointer hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
          >
            <div className="w-12 h-12 rounded-base border-2 border-border flex items-center justify-center flex-shrink-0 overflow-hidden bg-secondary-background shadow-[1px_1px_0px_0px_#000]">
              {e.course.thumbnail ? (
                <img
                  src={e.course.thumbnail}
                  alt={e.course.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center bg-main"
                >
                  <BookOpen className="w-5 h-5 text-foreground" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-heading font-black text-foreground truncate">{e.course.title}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <Progress value={e.enrollment.progressPercent} className="h-2 flex-1" />
                <span className="text-xs font-mono font-bold text-foreground flex-shrink-0">{e.enrollment.progressPercent}%</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
