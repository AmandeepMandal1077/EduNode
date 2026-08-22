import { useParams, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

import { useCourseDetails } from "@/hooks/useCourseDetails";
import { CourseHero } from "@/components/course-details/CourseHero";
import { CourseSidebar } from "@/components/course-details/CourseSidebar";
import { CourseAccordion } from "@/components/course-details/CourseAccordion";
import { CourseInstructor } from "@/components/course-details/CourseInstructor";
import { CoursePreview } from "@/components/course-details/CoursePreview";
import { CourseAbout } from "@/components/course-details/CourseAbout";

export function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    course,
    enrolled,
    loading,
    enrolling,
    user,
    hoverRating,
    setHoverRating,
    existingRating,
    canRate,
    hasRated,
    isEditingRating,
    setIsEditingRating,
    ratingError,
    handleRateCourse,
    handleEnroll,
    showFullDesc,
    setShowFullDesc,
  } = useCourseDetails(id);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-foreground animate-spin" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center bg-secondary-background border-2 border-border rounded-base p-8 shadow-shadow max-w-sm">
          <h2 className="text-xl font-heading font-black text-foreground mb-2">Course not found</h2>
          <Button onClick={() => navigate("/explore")} variant="neutral" className="font-heading font-bold">
            Browse courses
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <CourseHero course={course} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <CoursePreview course={course} />
          <CourseAbout
            course={course}
            showFullDesc={showFullDesc}
            setShowFullDesc={setShowFullDesc}
          />
          <CourseAccordion course={course} />
          <CourseInstructor course={course} />
        </div>

        <div className="lg:col-span-1">
          <CourseSidebar
            course={course}
            enrolled={enrolled}
            enrolling={enrolling}
            handleEnroll={handleEnroll}
            user={user}
            hasRated={hasRated}
            isEditingRating={isEditingRating}
            setIsEditingRating={setIsEditingRating}
            hoverRating={hoverRating}
            setHoverRating={setHoverRating}
            existingRating={existingRating}
            canRate={canRate}
            handleRateCourse={handleRateCourse}
            ratingError={ratingError}
          />
        </div>
      </div>
    </div>
  );
}
