import { useEffect, useState } from "react";
import { getCourseById, isEnrolled, rateCourse } from "@/services/courseService";
import { createCheckoutSession, enrollFreeCourse } from "@/api/purchaseApi";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import type { Course } from "@/types";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { useNavigate } from "react-router-dom";
import debug from "@/utils/debug";

export function useCourseDetails(id: string | undefined) {
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [enrolled, setEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  const { currentUser: user } = useSelector((state: RootState) => state.auth);
  const [hoverRating, setHoverRating] = useState(0);
  const [activeRating, setActiveRating] = useState(0);
  const [ratingError, setRatingError] = useState("");
  const [isEditingRating, setIsEditingRating] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);

  const enrollment = course?.enrolledStudents?.find((s) => s.student === user?.id);
  const canRate = !enrollment || enrollment.rating === undefined || isEditingRating;
  const hasRated = enrollment?.rating !== undefined && !isEditingRating;
  const existingRating = activeRating || enrollment?.rating || 0;

  const handleRateCourse = async (ratingVal: number) => {
    if (!course) return;
    try {
      setRatingError("");
      await rateCourse(course.id, ratingVal);
      setActiveRating(ratingVal);
      setIsEditingRating(false);
      const updated = await getCourseById(course.id);
      setCourse(updated);
    } catch (err: unknown) {
      debug(err);
      setRatingError(getErrorMessage(err, "Failed to submit rating."));
    }
  };

  useEffect(() => {
    if (!id) return;
    Promise.all([getCourseById(id), isEnrolled(id)]).then(([c, e]) => {
      setCourse(c);
      setEnrolled(e);
      setLoading(false);
    });
  }, [id]);

  const handleEnroll = async () => {
    if (!course) return;
    if (enrolled) {
      const firstLecture = course.modules[0]?.lectures[0];
      if (firstLecture) navigate(`/learn/${course.id}/lecture/${firstLecture.id}`);
      return;
    }

    try {
      setEnrolling(true);

      // Free course: skip Stripe, enroll directly
      if (course.price === 0) {
        await enrollFreeCourse(course.id);
        setEnrolled(true);
        const firstLecture = course.modules[0]?.lectures[0];
        if (firstLecture) {
          navigate(`/learn/${course.id}/lecture/${firstLecture.id}`);
        }
        return;
      }

      // Paid course: go through Stripe checkout
      const session = await createCheckoutSession(course.id);
      if (session && session.url) {
        window.location.href = session.url;
      } else {
        throw new Error("Failed to retrieve checkout session url.");
      }
    } catch (err: unknown) {
      debug(err);
      alert(getErrorMessage(err, "Failed to initiate enrollment. Please try again."));
    } finally {
      setEnrolling(false);
    }
  };

  return {
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
    setShowFullDesc
  };
}
