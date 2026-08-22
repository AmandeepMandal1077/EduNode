import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { BookOpen, Eye, ShieldCheck, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Course } from "@/types";

interface InstructorCourseGridProps {
  courses: Course[];
  navigate: (path: string) => void;
}

export function InstructorCourseGrid({ courses, navigate }: InstructorCourseGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {courses.map((course, idx) => (
        <motion.div
          key={course.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05 }}
          className="bg-background border-2 border-border rounded-base shadow-shadow flex flex-col overflow-hidden p-0 hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
        >
          <div className="relative h-44 w-full bg-secondary-background border-b-2 border-border overflow-hidden">
            {course.thumbnail ? (
              <img
                src={course.thumbnail}
                alt={course.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center bg-main text-main-foreground"
              >
                <BookOpen className="w-12 h-12" />
              </div>
            )}

            <div className="absolute top-3 left-3 z-10">
              <Badge variant="neutral" className="text-[10px]">
                {course.level}
              </Badge>
            </div>

            <div className="absolute top-3 right-3 z-10">
              <Badge
                variant={course.isPublished ? "default" : "neutral"}
                className="text-[10px] font-heading font-black"
              >
                {course.isPublished ? "PUBLISHED" : "DRAFT"}
              </Badge>
            </div>
          </div>

          <div className="p-5 flex flex-col gap-4 flex-grow">
            <div>
              <span className="text-[10px] font-heading font-black text-foreground/70 uppercase tracking-wider">{course.category}</span>
              <h3 className="font-heading font-black text-foreground text-base leading-snug line-clamp-2 mt-1">
                {course.title}
              </h3>
              <p className="text-xs font-base text-foreground/70 line-clamp-2 mt-1">{course.subtitle}</p>
            </div>

            <div className="flex justify-between items-center text-xs font-heading font-bold text-foreground border-t-2 border-border/20 pt-3 mt-auto">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-foreground" />
                <span>{course.studentCount} Students</span>
              </div>
              <span className="font-mono text-sm">
                {course.price === 0 ? "Free" : `₹${course.price}`}
              </span>
            </div>

            <div className="flex items-center gap-2 mt-1">
              <Button
                variant="neutral"
                size="sm"
                asChild
                className="flex-1 text-xs font-heading font-bold cursor-pointer"
              >
                <Link to={`/course/${course.id}`}>
                  <Eye className="w-3.5 h-3.5 mr-1" />
                  Preview
                </Link>
              </Button>
              <Button
                size="sm"
                variant="default"
                onClick={() => navigate(`/instructor/courses/${course.id}/manage`)}
                className="flex-1 text-xs font-heading font-black cursor-pointer shadow-[2px_2px_0px_0px_#000]"
              >
                <FileText className="w-3.5 h-3.5 mr-1" />
                Manage
              </Button>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
