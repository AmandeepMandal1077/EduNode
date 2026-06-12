import { motion } from "motion/react";
import type { Course } from "@/types";

export function CourseInstructor({ course }: { course: Course }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="bento-card"
    >
      <h2 className="text-xl font-bold text-slate-800 mb-4">Your Instructor</h2>
      <div className="flex items-start gap-4">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold text-white flex-shrink-0"
          style={{ background: course.thumbnailAccent }}
        >
          {course.instructor
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)}
        </div>
        <div>
          <p className="font-semibold text-slate-800">{course.instructor}</p>
          <p className="text-sm text-slate-500 mt-1 leading-relaxed">
            {course.instructorBio}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
