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
      className="bg-background border-2 border-border rounded-base p-6 shadow-shadow"
    >
      <h2 className="text-xl font-heading font-black text-foreground mb-3">About This Course</h2>
      <p
        className={`text-foreground/80 text-sm leading-relaxed whitespace-pre-wrap break-words font-base ${
          !showFullDesc ? "line-clamp-4" : ""
        }`}
      >
        {course.description}
      </p>
      <button
        onClick={() => setShowFullDesc((s) => !s)}
        className="flex items-center gap-1 font-heading font-bold text-foreground text-sm mt-3 underline decoration-2 hover:bg-main px-1 rounded-base cursor-pointer"
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
