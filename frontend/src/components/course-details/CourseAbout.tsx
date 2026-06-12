import { motion } from "motion/react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { Course } from "@/types";

interface CourseAboutProps {
  course: Course;
  showFullDesc: boolean;
  setShowFullDesc: React.Dispatch<React.SetStateAction<boolean>>;
}

export function CourseAbout({ course, showFullDesc, setShowFullDesc }: CourseAboutProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="bento-card"
    >
      <h2 className="text-xl font-bold text-slate-800 mb-3">About this course</h2>
      <p
        className={`text-slate-600 text-sm leading-relaxed whitespace-pre-wrap break-words ${
          !showFullDesc ? "line-clamp-4" : ""
        }`}
      >
        {course.description}
      </p>
      <button
        onClick={() => setShowFullDesc((s) => !s)}
        className="flex items-center gap-1 text-indigo-600 text-sm font-medium mt-3 hover:underline"
      >
        {showFullDesc ? (
          <>
            <ChevronUp className="w-4 h-4" /> Show less
          </>
        ) : (
          <>
            <ChevronDown className="w-4 h-4" /> Show more
          </>
        )}
      </button>
    </motion.div>
  );
}
