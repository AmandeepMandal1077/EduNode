import { motion } from "motion/react";
import { Star, Users, Globe, BarChart2, Award, CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Course } from "@/types";

export function CourseHero({ course }: { course: Course }) {
  return (
    <div
      className="w-full py-12 px-4"
      style={{
        background: `linear-gradient(135deg, ${course.thumbnailAccent}22 0%, ${course.thumbnailAccent}08 100%)`,
        borderBottom: `1px solid ${course.thumbnailAccent}20`,
      }}
    >
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {course.isBestseller && (
              <Badge className="bg-amber-400 text-amber-900 mb-3 text-xs font-bold border-0">
                <Award className="w-3 h-3 mr-1" />
                Bestseller
              </Badge>
            )}
            <p className="text-sm font-semibold mb-2" style={{ color: course.thumbnailAccent }}>
              {course.category}
            </p>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-3 break-words">
              {course.title}
            </h1>
            <p className="text-lg text-slate-600 mb-5 break-words">{course.subtitle}</p>

            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-4 h-4 ${
                        s <= Math.round(course.rating)
                          ? "text-amber-400 fill-amber-400"
                          : "text-slate-200 fill-slate-200"
                      }`}
                    />
                  ))}
                </div>
                <span className="font-bold text-amber-600">{course.rating.toFixed(1)}</span>
                <span className="text-slate-500">
                  ({course.reviewCount.toLocaleString()} ratings)
                </span>
              </div>
              <span className="flex items-center gap-1.5 text-slate-600">
                <Users className="w-4 h-4" />
                {course.studentCount.toLocaleString()} students
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-slate-600">
              <span className="flex items-center gap-1.5">
                <CalendarDays className="w-4 h-4 text-slate-400" />
                Last updated{" "}
                {new Date(course.lastUpdated).toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </span>
              <span className="flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-slate-400" />
                {course.language}
              </span>
              <span className="flex items-center gap-1.5">
                <BarChart2 className="w-4 h-4 text-slate-400" />
                {course.level}
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
