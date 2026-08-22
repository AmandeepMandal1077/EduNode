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
      className="md:col-span-2 xl:col-span-2 xl:row-span-2 bg-background border-2 border-border rounded-base p-6 shadow-shadow flex flex-col gap-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-base bg-main border-2 border-border flex items-center justify-center shadow-[2px_2px_0px_0px_#000]">
            <Play className="w-4 h-4 text-main-foreground" />
          </div>
          <span className="text-base font-heading font-black text-foreground">Continue Watching</span>
        </div>
        {continueItem && (
          <Badge variant="default" className="font-heading font-black text-xs">
            {continueItem.enrollment.progressPercent}% DONE
          </Badge>
        )}
      </div>

      {continueItem ? (
        <>
          <div
            className="w-full rounded-base border-2 border-border overflow-hidden relative flex items-center justify-center bg-secondary-background"
            style={{ aspectRatio: "16/9" }}
          >
            {continueItem.course.thumbnail ? (
              <img
                src={continueItem.course.thumbnail}
                alt={continueItem.course.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center relative overflow-hidden bg-main"
              >
                <div className="relative z-10 w-14 h-14 rounded-base bg-background border-2 border-border flex items-center justify-center shadow-[2px_2px_0px_0px_#000]">
                  <BookOpen className="w-7 h-7 text-foreground" />
                </div>
              </div>
            )}
          </div>

          <div className="flex-1">
            <span className="text-xs font-heading font-black uppercase text-foreground/70 mb-0.5 tracking-wider inline-block">
              {continueItem.course.category}
            </span>
            <h3 className="font-heading font-black text-foreground text-lg leading-snug mb-1">{continueItem.course.title}</h3>
            <p className="text-xs font-base text-foreground/70">
              Next: <span className="text-foreground font-heading font-bold">
                {continueItem.course.modules
                  .flatMap((m) => m.lectures)
                  .find((l) => l.id === continueItem.enrollment.lastLectureId)?.title ?? "First lecture"}
              </span>
            </p>
          </div>

          <div>
            <div className="flex justify-between text-xs font-heading font-bold text-foreground mb-1.5">
              <span>Progress</span>
              <span>{continueItem.enrollment.progressPercent}%</span>
            </div>
            <Progress value={continueItem.enrollment.progressPercent} className="h-3" />
          </div>

          <Button
            size="lg"
            variant="default"
            onClick={() => navigate(`/learn/${continueItem.course.id}/lecture/${continueItem.enrollment.lastLectureId}`)}
            className="w-full font-heading font-black text-sm h-11 cursor-pointer shadow-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
            id="dashboard-resume-btn"
          >
            <Play className="w-4 h-4 mr-2 fill-current" />
            Resume Learning
          </Button>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 py-8">
          <div className="w-14 h-14 rounded-base bg-secondary-background border-2 border-border flex items-center justify-center shadow-[2px_2px_0px_0px_#000]">
            <BookOpen className="w-7 h-7 text-foreground" />
          </div>
          <p className="text-foreground font-heading font-bold text-sm">No courses in progress yet.</p>
          <Button
            onClick={() => navigate("/explore")}
            size="sm"
            variant="default"
            className="font-heading font-bold cursor-pointer"
          >
            Explore Courses
          </Button>
        </div>
      )}
    </motion.div>
  );
}
