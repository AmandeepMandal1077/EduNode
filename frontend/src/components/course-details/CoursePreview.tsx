import { motion } from "motion/react";
import { Play } from "lucide-react";
import type { Course } from "@/types";

export function CoursePreview({ course }: { course: Course }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="rounded-base border-4 border-border overflow-hidden aspect-video flex items-center justify-center relative bg-secondary-background shadow-shadow"
    >
      {course.thumbnail ? (
        <img
          src={course.thumbnail}
          alt={course.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div
          className="absolute inset-0 w-full h-full bg-main"
        />
      )}
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative z-10 flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-base bg-main border-2 border-border flex items-center justify-center text-main-foreground shadow-[3px_3px_0px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer">
          <Play className="w-7 h-7 fill-current ml-1" />
        </div>
        <span className="bg-background text-foreground font-heading font-black text-xs uppercase px-3 py-1 border-2 border-border rounded-base shadow-[2px_2px_0px_0px_#000]">
          Preview Available
        </span>
      </div>
    </motion.div>
  );
}
