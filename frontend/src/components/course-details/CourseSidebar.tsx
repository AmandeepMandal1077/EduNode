import { motion } from "motion/react";
import { Play, ShoppingCart, Loader2, Star, Pencil, Clock, BookOpen, Globe, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { Course, User } from "@/types";

interface CourseSidebarProps {
  course: Course;
  enrolled: boolean;
  enrolling: boolean;
  handleEnroll: () => void;
  user: User | null;
  hasRated: boolean;
  isEditingRating: boolean;
  setIsEditingRating: (val: boolean) => void;
  hoverRating: number;
  setHoverRating: (val: number) => void;
  existingRating: number;
  canRate: boolean;
  handleRateCourse: (val: number) => void;
  ratingError: string;
}

export function CourseSidebar({
  course,
  enrolled,
  enrolling,
  handleEnroll,
  user,
  hasRated,
  isEditingRating,
  setIsEditingRating,
  hoverRating,
  setHoverRating,
  existingRating,
  canRate,
  handleRateCourse,
  ratingError,
}: CourseSidebarProps) {
  const totalLectures = course.modules.reduce((a, m) => a + m.lectures.length, 0);

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bento-card sticky top-24 shadow-xl"
    >
      <div className="mb-5">
        {course.price === 0 ? (
          <span className="text-3xl font-extrabold text-emerald-600">Free</span>
        ) : (
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-extrabold text-slate-900">
              ${course.price.toFixed(2)}
            </span>
            {course.originalPrice > course.price && (
              <span className="text-lg text-slate-400 line-through">
                ${course.originalPrice.toFixed(2)}
              </span>
            )}
            {course.originalPrice > course.price && (
              <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">
                {Math.round((1 - course.price / course.originalPrice) * 100)}% off
              </Badge>
            )}
          </div>
        )}
      </div>

      <Button
        onClick={handleEnroll}
        disabled={enrolling}
        className={`w-full h-12 text-base font-semibold rounded-xl mb-4 ${
          enrolled ? "bg-emerald-600 hover:bg-emerald-700" : "bg-indigo-600 hover:bg-indigo-700"
        } text-white shadow-lg`}
        id="course-enroll-btn"
      >
        {enrolling ? (
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
        ) : enrolled ? (
          <Play className="w-4 h-4 mr-2 fill-white" />
        ) : (
          <ShoppingCart className="w-4 h-4 mr-2" />
        )}
        {enrolling
          ? "Processing..."
          : enrolled
          ? "Continue Learning"
          : course.price === 0
          ? "Enroll for Free"
          : "Enroll Now"}
      </Button>

      {enrolled && user && (
        <div className="mb-4 p-4 bg-slate-50 border border-slate-100 rounded-xl flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {hasRated ? "Your Rating" : isEditingRating ? "Edit Rating" : "Rate this course"}
            </p>
            {hasRated && (
              <button
                onClick={() => setIsEditingRating(true)}
                className="text-indigo-600 hover:text-indigo-800 transition-colors p-1"
                title="Edit Rating"
                id="edit-rating-btn"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((star) => {
              const isLit =
                star <= (hoverRating || (canRate ? hoverRating || existingRating : existingRating));
              return (
                <Star
                  key={star}
                  onClick={() => canRate && handleRateCourse(star)}
                  onMouseEnter={() => canRate && setHoverRating(star)}
                  onMouseLeave={() => canRate && setHoverRating(0)}
                  className={`w-5 h-5 ${
                    canRate ? "cursor-pointer transition-colors duration-150" : ""
                  } ${isLit ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200"}`}
                />
              );
            })}
          </div>
          {ratingError && <p className="text-xs text-rose-500 font-semibold">{ratingError}</p>}
          {hasRated && (
            <p className="text-xs text-slate-500 font-medium">
              You rated this course {existingRating} stars.
            </p>
          )}
          {isEditingRating && (
            <div className="flex justify-between items-center mt-1">
              <span className="text-[10px] text-slate-400 font-medium">Click a star to save</span>
              <button
                onClick={() => {
                  setIsEditingRating(false);
                  setHoverRating(0);
                }}
                className="text-xs text-slate-500 hover:text-slate-700 font-semibold"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

      <Separator className="mb-4" />

      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
        This course includes
      </p>
      <div className="flex flex-col gap-2.5">
        {[
          { icon: Clock, text: `${course.totalDuration} on-demand video` },
          { icon: BookOpen, text: `${totalLectures} lectures across ${course.modules.length} modules` },
          { icon: Globe, text: "Full lifetime access" },
          { icon: Award, text: "Certificate of completion" },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-2.5 text-sm text-slate-600">
            <item.icon className="w-4 h-4 text-slate-400 flex-shrink-0" />
            {item.text}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5 mt-5">
        {course.tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="text-xs bg-slate-100 text-slate-600 border-0">
            {tag}
          </Badge>
        ))}
      </div>
    </motion.div>
  );
}
