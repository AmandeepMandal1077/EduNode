import { motion } from "motion/react";
import type { Variants } from "motion/react";
import { Play, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { EnrolledCourse } from "@/types";

interface DashboardContinueWatchingProps {
  continueItem: EnrolledCourse | undefined;
  cardVariants: Variants;
  navigate: (path: string) => void;
}

export function DashboardContinueWatching({ continueItem, cardVariants, navigate }: DashboardContinueWatchingProps) {
  return (
    <motion.div
      variants={cardVariants}
      className="md:col-span-2 xl:col-span-2 xl:row-span-2 bento-card flex flex-col gap-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
            <Play className="w-4 h-4 text-indigo-600" />
          </div>
          <span className="text-sm font-semibold text-slate-700">Continue Watching</span>
        </div>
        {continueItem && (
          <Badge variant="secondary" className="text-xs bg-indigo-50 text-indigo-600 border-0">
            {continueItem.enrollment.progressPercent}% done
          </Badge>
        )}
      </div>

      {continueItem ? (
        <>
          <div
            className="w-full rounded-xl overflow-hidden relative flex items-center justify-center bg-slate-100"
            style={{ aspectRatio: "16/9" }}
          >
            {continueItem.course.thumbnail ? (
              <img
                src={continueItem.course.thumbnail}
                alt={continueItem.course.title}
                className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center relative overflow-hidden"
                style={{ background: `linear-gradient(135deg, ${continueItem.course.thumbnailAccent}dd, ${continueItem.course.thumbnailAccent}88)` }}
              >
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)", backgroundSize: "30px 30px" }} />
                <div className="relative z-10 w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center border border-white/30">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
              </div>
            )}
          </div>

          <div className="flex-1">
            <p className="text-xs text-slate-500 mb-0.5">{continueItem.course.category}</p>
            <h3 className="font-bold text-slate-800 text-base leading-snug mb-1">{continueItem.course.title}</h3>
            <p className="text-xs text-slate-500">
              Next: <span className="text-slate-700 font-medium">
                {continueItem.course.modules
                  .flatMap((m) => m.lectures)
                  .find((l) => l.id === continueItem.enrollment.lastLectureId)?.title ?? "First lecture"}
              </span>
            </p>
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-500 mb-1.5">
              <span>Progress</span>
              <span className="font-semibold text-indigo-600">{continueItem.enrollment.progressPercent}%</span>
            </div>
            <Progress value={continueItem.enrollment.progressPercent} className="h-2" />
          </div>

          <Button
            onClick={() => navigate(`/learn/${continueItem.course.id}/lecture/${continueItem.enrollment.lastLectureId}`)}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold cursor-pointer"
            id="dashboard-resume-btn"
          >
            <Play className="w-4 h-4 mr-2 fill-white" />
            Resume Learning
          </Button>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 py-8">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-slate-600 text-sm">No courses in progress yet.</p>
          <Button
            onClick={() => navigate("/explore")}
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
          >
            Explore Courses
          </Button>
        </div>
      )}
    </motion.div>
  );
}
