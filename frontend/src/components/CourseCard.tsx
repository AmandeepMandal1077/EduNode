import { useState } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { Star, Users, Clock, BookOpen, Award, Play, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/store";
import { fetchEnrolledCoursesThunk } from "@/store/courseSlice";
import { rateCourse } from "@/services/courseService";
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
  const dispatch = useDispatch<AppDispatch>();
  const { currentUser: user } = useSelector((state: RootState) => state.auth);

  const [hoverRating, setHoverRating] = useState(0);
  const [localRating, setLocalRating] = useState(0);
  const [isEditingRating, setIsEditingRating] = useState(false);

  const userRating = course.enrolledStudents?.find((s) => s.student === user?.id)?.rating;

  const handleRateCourse = async (ratingVal: number) => {
    try {
      await rateCourse(course.id, ratingVal);
      setLocalRating(ratingVal);
      setIsEditingRating(false);
      dispatch(fetchEnrolledCoursesThunk());
    } catch (err) {
      console.error(err);
      alert("Failed to save rating. Please try again.");
    }
  };

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
      whileHover={{ scale: 1.02, y: -3 }}
      onClick={handleCardClick}
      className="bento-card bento-card-interactive flex flex-col gap-0 overflow-hidden cursor-pointer p-0"
      role="article"
      aria-label={course.title}
    >
      {/* Thumbnail */}
      <div
        className={cn("w-full relative overflow-hidden bg-slate-100 flex items-center justify-center", compact ? "h-36" : "h-44")}
      >
        {course.thumbnail ? (
          <img
            src={course.thumbnail}
            alt={course.title}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${course.thumbnailAccent}dd 0%, ${course.thumbnailAccent}88 100%)`,
            }}
          >
            {/* decorative circles */}
            <div
              className="absolute -top-6 -right-6 w-32 h-32 rounded-full opacity-20"
              style={{ background: "rgba(255,255,255,0.4)" }}
            />
            <div
              className="absolute -bottom-4 -left-4 w-20 h-20 rounded-full opacity-15"
              style={{ background: "rgba(255,255,255,0.4)" }}
            />
            <BookOpen className="w-10 h-10 text-white/80 relative z-10" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-1.5 z-10">
          {course.isBestseller && (
            <Badge className="bg-amber-400 text-amber-900 text-[10px] font-bold px-2 py-0.5 border-0">
              <Award className="w-2.5 h-2.5 mr-0.5" />
              Bestseller
            </Badge>
          )}
          {course.price === 0 && (
            <Badge className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 border-0">
              Free
            </Badge>
          )}
        </div>

        {/* Level */}
        <div className="absolute top-3 right-3 z-10">
          <Badge
            variant="secondary"
            className="text-[10px] px-2 py-0.5 bg-black/30 text-white border-0 backdrop-blur"
          >
            {course.level}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className={cn("flex flex-col gap-2 flex-1", compact ? "p-3" : "p-4")}>
        <div>
          <p className="text-xs font-medium text-indigo-600 mb-0.5 break-words">{course.category}</p>
          <h3
            className={cn(
              "font-semibold text-slate-800 leading-snug line-clamp-2 break-words",
              compact ? "text-sm" : "text-base"
            )}
          >
            {course.title}
          </h3>
          {!compact && (
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{course.instructor}</p>
          )}
        </div>

        {/* Rating */}
        {!enrollment && (
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={cn(
                    "w-3 h-3",
                    s <= Math.round(course.rating)
                      ? "text-amber-400 fill-amber-400"
                      : "text-slate-200 fill-slate-200"
                  )}
                />
              ))}
            </div>
            <span className="text-xs font-semibold text-amber-600">{course.rating.toFixed(1)}</span>
            <span className="text-xs text-slate-400">({course.reviewCount.toLocaleString()})</span>
          </div>
        )}

        {!compact && !enrollment && (
          <div className="flex items-center gap-3 text-xs text-slate-500">
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

        {/* Enrollment progress & Actions */}
        {enrollment && (
          <div className="mt-auto pt-2 flex flex-col gap-2.5">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-slate-500">
                  {enrollment.progressPercent === 100
                    ? "Completed"
                    : enrollment.progressPercent === 0
                    ? "Not started"
                    : "In progress"}
                </span>
                <span className="text-xs font-semibold text-indigo-600">{enrollment.progressPercent}%</span>
              </div>
              <Progress value={enrollment.progressPercent} className="h-2" />
            </div>

            {/* Action Button */}
            <Button
              size="sm"
              className={cn(
                "w-full rounded-xl font-semibold mt-1",
                enrollment.progressPercent === 100
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white"
              )}
              onClick={(ev) => {
                ev.stopPropagation();
                navigate(`/learn/${course.id}/lecture/${enrollment.lastLectureId}`);
              }}
            >
              <Play className="w-3.5 h-3.5 mr-1.5 fill-white" />
              {enrollment.progressPercent === 0
                ? "Start Course"
                : enrollment.progressPercent === 100
                ? "Review Course"
                : "Continue"}
            </Button>

            {/* Rating Option below Continue Button */}
            <div
              className="mt-1 pt-2 border-t border-slate-100 flex items-center justify-between flex-shrink-0"
              onClick={(ev) => ev.stopPropagation()}
            >
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                {userRating !== undefined && !isEditingRating
                  ? "Your Rating"
                  : isEditingRating
                  ? "Edit Rating"
                  : "Rate Course"}
              </span>
              <div className="flex items-center gap-1.5">
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const localRat = localRating || userRating || 0;
                    const canInteract = userRating === undefined || isEditingRating;
                    const isLit = star <= (hoverRating || localRat);

                    return (
                      <Star
                        key={star}
                        onClick={() => canInteract && handleRateCourse(star)}
                        onMouseEnter={() => canInteract && setHoverRating(star)}
                        onMouseLeave={() => canInteract && setHoverRating(0)}
                        className={cn(
                          "w-3.5 h-3.5",
                          canInteract ? "cursor-pointer transition-colors duration-150" : "",
                          isLit ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200"
                        )}
                      />
                    );
                  })}
                </div>
                {userRating !== undefined && !isEditingRating && (
                  <button
                    onClick={() => setIsEditingRating(true)}
                    className="text-indigo-600 hover:text-indigo-800 transition-colors p-0.5"
                    title="Edit Rating"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                )}
                {isEditingRating && (
                  <button
                    onClick={() => setIsEditingRating(false)}
                    className="text-[9px] text-slate-500 hover:text-slate-700 font-semibold ml-1"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Price */}
        {!enrollment && (
          <div className="mt-auto pt-2 flex items-center gap-2">
            {course.price === 0 ? (
              <span className="text-base font-bold text-emerald-600">Free</span>
            ) : (
              <>
                <span className="text-base font-bold text-slate-800">
                  ${course.price.toFixed(2)}
                </span>
                {course.originalPrice > course.price && (
                  <span className="text-xs text-slate-400 line-through">
                    ${course.originalPrice.toFixed(2)}
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
