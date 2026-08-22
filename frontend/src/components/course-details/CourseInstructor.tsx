import { motion } from "motion/react";
import type { Course } from "@/types";

export function CourseInstructor({ course }: { course: Course }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="bg-background border-2 border-border rounded-base p-6 shadow-shadow"
    >
      <h2 className="text-xl font-heading font-black text-foreground mb-4">Your Instructor</h2>
      <div className="flex items-start gap-4">
        <div
          className="w-14 h-14 rounded-base bg-main border-2 border-border flex items-center justify-center text-lg font-heading font-black text-main-foreground shadow-[2px_2px_0px_0px_#000] flex-shrink-0"
        >
          {course.instructor
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)}
        </div>
        <div>
          <p className="font-heading font-black text-base text-foreground">{course.instructor}</p>
          <p className="text-sm font-base text-foreground/80 mt-1 leading-relaxed">
            {course.instructorBio}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
