import { motion } from "motion/react";
import { Play } from "lucide-react";
import type { Course } from "@/types";

export function CoursePreview({ course }: { course: Course }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.1 }}
      className="rounded-2xl overflow-hidden aspect-video flex items-center justify-center relative bg-slate-100"
    >
      {course.thumbnail ? (
        <img
          src={course.thumbnail}
          alt={course.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div
          className="absolute inset-0 w-full h-full"
          style={{
            background: `linear-gradient(135deg, ${course.thumbnailAccent}cc, ${course.thumbnailAccent}66)`,
          }}
        />
      )}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      {course.thumbnail && <div className="absolute inset-0 bg-black/25" />}
      <div className="relative z-10 flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center border border-white/30 hover:scale-105 transition-transform duration-200 cursor-pointer shadow-lg">
          <Play className="w-7 h-7 text-white fill-white ml-1" />
        </div>
        <span className="text-white/90 text-sm font-medium drop-shadow-md">
          Preview available
        </span>
      </div>
    </motion.div>
  );
}
