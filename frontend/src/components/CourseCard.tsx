import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { Star, Users, Clock, BookOpen, Award, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import type { Course, Enrollment } from "@/types";
import { cn } from "@/lib/utils";

interface CourseCardProps {
  course: Course;
  enrollment?: Enrollment;
  index?: number;
  compact?: boolean;
}

export function CourseCard({ course, enrollment, index = 0, compact = false }: CourseCardProps) {
  const navigate = useNavigate();

  const handleCardClick = () => {
    if (enrollment) {
      navigate(`/learn/${course.id}/lecture/${enrollment.lastLectureId}`);
    } else {
      navigate(`/course/${course.id}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ scale: 1.01, y: -2 }}
      onClick={handleCardClick}
      className="flex flex-col gap-0 overflow-hidden cursor-pointer p-0 rounded-base border-2 border-border bg-background text-foreground shadow-shadow hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
      role="article"
      aria-label={course.title}
    >
      <div
        className={cn("w-full relative overflow-hidden border-b-2 border-border bg-secondary-background flex items-center justify-center", compact ? "h-36" : "h-44")}
      >
        {course.thumbnail ? (
          <img
            src={course.thumbnail}
            alt={course.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center relative overflow-hidden bg-main"
          >
            <div
              className="absolute -top-6 -right-6 w-32 h-32 border-2 border-border rounded-base opacity-20 bg-background"
            />
            <div
              className="absolute -bottom-4 -left-4 w-20 h-20 border-2 border-border rounded-base opacity-15 bg-background"
            />
            <BookOpen className="w-10 h-10 text-main-foreground relative z-10" />
          </div>
        )}

        <div className="absolute top-3 left-3 flex gap-1.5 z-10">
          {course.isBestseller && (
            <Badge className="bg-main text-main-foreground font-heading font-black">
              <Award className="w-2.5 h-2.5 mr-0.5" />
              Bestseller
            </Badge>
          )}
          {course.price === 0 && (
            <Badge className="bg-[#10b981] text-black font-heading font-black">
              Free
            </Badge>
          )}
        </div>

        <div className="absolute top-3 right-3 z-10">
          <Badge
            variant="neutral"
            className="font-heading font-bold"
          >
            {course.level}
          </Badge>
        </div>
      </div>

      <div className={cn("flex flex-col gap-2 flex-1", compact ? "p-3" : "p-4")}>
        <div>
          <span className="text-[10px] font-heading font-black text-main-foreground bg-main px-2 py-0.5 rounded-base border border-border inline-block uppercase tracking-wider mb-1.5">
            {course.category}
          </span>
          <h3
            className={cn(
              "font-heading font-black text-foreground leading-snug line-clamp-2 break-words",
              compact ? "text-sm" : "text-base"
            )}
          >
            {course.title}
          </h3>
          {!compact && (
            <p className="text-xs text-foreground/70 mt-1 line-clamp-1 font-base">{course.instructor}</p>
          )}
        </div>

        {!enrollment && (
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={cn(
                    "w-3.5 h-3.5",
                    s <= Math.round(course.rating)
                      ? "text-main fill-main stroke-border stroke-[1.5]"
                      : "text-border/30 fill-border/30"
                  )}
                />
              ))}
            </div>
            <span className="text-xs font-mono font-bold text-foreground">{course.rating.toFixed(1)}</span>
            <span className="text-xs text-foreground/50 font-base">({course.reviewCount.toLocaleString()})</span>
          </div>
        )}

        {!compact && !enrollment && (
          <div className="flex items-center gap-3 text-xs text-foreground/70 font-base">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {course.totalDuration}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {course.studentCount >= 1000
                ? `${(course.studentCount / 1000).toFixed(0)}k`
                : course.studentCount}
            </span>
          </div>
        )}

        {enrollment && (
          <div className="mt-auto pt-2 flex flex-col gap-2.5">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-foreground/70 font-heading font-bold">
                  {enrollment.progressPercent === 100
                    ? "Completed"
                    : enrollment.progressPercent === 0
                    ? "Not started"
                    : "In progress"}
                </span>
                <span className="text-xs font-mono font-bold text-foreground">{enrollment.progressPercent}%</span>
              </div>
              <Progress value={enrollment.progressPercent} className="h-3" />
            </div>

            <Button
              size="sm"
              variant={enrollment.progressPercent === 100 ? "neutral" : "default"}
              className="w-full font-heading font-black mt-1 shadow-[2px_2px_0px_0px_#000] cursor-pointer"
              onClick={(ev) => {
                ev.stopPropagation();
                navigate(`/learn/${course.id}/lecture/${enrollment.lastLectureId}`);
              }}
            >
              <Play className="w-3.5 h-3.5 mr-1.5 fill-current" />
              {enrollment.progressPercent === 0
                ? "Start Course"
                : enrollment.progressPercent === 100
                ? "Review Course"
                : "Continue"}
            </Button>
          </div>
        )}

        {!enrollment && (
          <div className="mt-auto pt-2 flex items-center gap-2 border-t-2 border-border/10">
            {course.price === 0 ? (
              <span className="text-base font-heading font-black text-foreground">Free</span>
            ) : (
              <>
                <span className="text-base font-heading font-black text-foreground">
                  ₹{course.price.toFixed(2)}
                </span>
                {course.originalPrice > course.price && (
                  <span className="text-xs text-foreground/40 line-through font-mono">
                    ₹{course.originalPrice.toFixed(2)}
                  </span>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
