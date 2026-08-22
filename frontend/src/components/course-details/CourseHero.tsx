import { motion } from "motion/react";
import { Star, Users, Globe, BarChart2, Award, CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Course } from "@/types";

export function CourseHero({ course }: { course: Course }) {
  return (
    <div className="w-full py-12 px-4 bg-secondary-background border-b-4 border-border">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex items-center gap-2 mb-3">
              {course.isBestseller && (
                <Badge variant="default" className="text-xs font-heading font-black">
                  <Award className="w-3 h-3 mr-1" />
                  BESTSELLER
                </Badge>
              )}
              <span className="text-xs font-heading font-black uppercase tracking-wider bg-background px-2.5 py-1 rounded-base border-2 border-border text-foreground">
                {course.category}
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-heading font-black text-foreground leading-tight mb-3 break-words">
              {course.title}
            </h1>
            <p className="text-base sm:text-lg font-base text-foreground/80 mb-5 break-words">{course.subtitle}</p>

            <div className="flex flex-wrap items-center gap-4 text-sm font-heading font-bold">
              <div className="flex items-center gap-1.5 bg-background px-3 py-1.5 rounded-base border-2 border-border shadow-[2px_2px_0px_0px_#000]">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-4 h-4 ${
                        s <= Math.round(course.rating)
                          ? "text-amber-500 fill-amber-500"
                          : "text-border/30 fill-border/30"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-foreground">{course.rating.toFixed(1)}</span>
                <span className="text-foreground/60 font-base text-xs">
                  ({course.reviewCount.toLocaleString()} ratings)
                </span>
              </div>

              <span className="flex items-center gap-1.5 text-foreground bg-background px-3 py-1.5 rounded-base border-2 border-border shadow-[2px_2px_0px_0px_#000]">
                <Users className="w-4 h-4" />
                {course.studentCount.toLocaleString()} students
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-4 text-xs font-heading font-bold text-foreground">
              <span className="flex items-center gap-1.5 bg-background px-2.5 py-1 rounded-base border-2 border-border">
                <CalendarDays className="w-3.5 h-3.5" />
                Updated {new Date(course.lastUpdated).toLocaleDateString("en-US", {
                  month: "short",
                  year: "numeric",
                })}
              </span>
              <span className="flex items-center gap-1.5 bg-background px-2.5 py-1 rounded-base border-2 border-border">
                <Globe className="w-3.5 h-3.5" />
                {course.language}
              </span>
              <span className="flex items-center gap-1.5 bg-background px-2.5 py-1 rounded-base border-2 border-border">
                <BarChart2 className="w-3.5 h-3.5" />
                {course.level}
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
