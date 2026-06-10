import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import {
  Star,
  Users,
  Clock,
  Globe,
  BarChart2,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Play,
  Lock,
  Check,
  ShoppingCart,
  Loader2,
  Award,
  CalendarDays,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { getCourseById, enrollInCourse, isEnrolled, rateCourse } from "@/services/courseService";
import { createCheckoutSession } from "@/api/purchaseApi";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import type { Course } from "@/types";

export function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [enrolled, setEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);

  const { currentUser: user } = useSelector((state: RootState) => state.auth);
  const [hoverRating, setHoverRating] = useState(0);
  const [activeRating, setActiveRating] = useState(0);
  const [ratingError, setRatingError] = useState("");
  const [isEditingRating, setIsEditingRating] = useState(false);

  const enrollment = course?.enrolledStudents?.find(
    (s) => s.student === user?.id
  );

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
    } catch (err: any) {
      console.error(err);
      setRatingError(err?.response?.data?.message || err?.message || "Failed to submit rating.");
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
      const session = await createCheckoutSession(course.id);
      if (session && session.url) {
        window.location.href = session.url;
      } else {
        throw new Error("Failed to retrieve checkout session url.");
      }
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || err?.message || "Failed to initiate payment. Please try again.");
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-800 mb-2">Course not found</h2>
          <Button onClick={() => navigate("/explore")} variant="outline">Browse courses</Button>
        </div>
      </div>
    );
  }

  const totalLectures = course.modules.reduce((a, m) => a + m.lectures.length, 0);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero banner */}
      <div
        className="w-full py-12 px-4"
        style={{
          background: `linear-gradient(135deg, ${course.thumbnailAccent}22 0%, ${course.thumbnailAccent}08 100%)`,
          borderBottom: `1px solid ${course.thumbnailAccent}20`,
        }}
      >
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Course info */}
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

              {/* Rating row */}
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={`w-4 h-4 ${s <= Math.round(course.rating) ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200"}`} />
                    ))}
                  </div>
                  <span className="font-bold text-amber-600">{course.rating.toFixed(1)}</span>
                  <span className="text-slate-500">({course.reviewCount.toLocaleString()} ratings)</span>
                </div>
                <span className="flex items-center gap-1.5 text-slate-600">
                  <Users className="w-4 h-4" />
                  {course.studentCount.toLocaleString()} students
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-slate-600">
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="w-4 h-4 text-slate-400" />
                  Last updated {new Date(course.lastUpdated).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
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

      {/* Main content + sidebar */}
      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left: Details */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Thumbnail */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="rounded-2xl overflow-hidden aspect-video flex items-center justify-center relative bg-slate-100"
          >
            {course.thumbnail ? (
              <img
                src={course.thumbnail}
                alt={course.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div
                className="absolute inset-0 w-full h-full"
                style={{ background: `linear-gradient(135deg, ${course.thumbnailAccent}cc, ${course.thumbnailAccent}66)` }}
              />
            )}
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
            {course.thumbnail && <div className="absolute inset-0 bg-black/25" />}
            <div className="relative z-10 flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center border border-white/30 hover:scale-105 transition-transform duration-200 cursor-pointer shadow-lg">
                <Play className="w-7 h-7 text-white fill-white ml-1" />
              </div>
              <span className="text-white/90 text-sm font-medium drop-shadow-md">Preview available</span>
            </div>
          </motion.div>

          {/* Description */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bento-card">
            <h2 className="text-xl font-bold text-slate-800 mb-3">About this course</h2>
            <p className={`text-slate-600 text-sm leading-relaxed whitespace-pre-wrap break-words ${!showFullDesc ? "line-clamp-4" : ""}`}>
              {course.description}
            </p>
            <button
              onClick={() => setShowFullDesc((s) => !s)}
              className="flex items-center gap-1 text-indigo-600 text-sm font-medium mt-3 hover:underline"
            >
              {showFullDesc ? <><ChevronUp className="w-4 h-4" /> Show less</> : <><ChevronDown className="w-4 h-4" /> Show more</>}
            </button>
          </motion.div>

          {/* Syllabus */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bento-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-800">Course Curriculum</h2>
              <span className="text-sm text-slate-500">{totalLectures} lectures • {course.totalDuration}</span>
            </div>
            <Accordion type="multiple" className="flex flex-col gap-2">
              {course.modules.map((mod) => (
                <AccordionItem key={mod.id} value={mod.id} className="border border-slate-200 rounded-xl overflow-hidden">
                  <AccordionTrigger className="px-4 py-3 hover:bg-slate-50 hover:no-underline text-sm font-semibold text-slate-800">
                    <div className="flex items-center gap-3 text-left w-full min-w-0">
                      <BookOpen className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                      <span className="break-words flex-1 min-w-0">{mod.title}</span>
                      <span className="text-xs font-normal text-slate-400 ml-auto mr-3 flex-shrink-0">{mod.lectures.length} lectures</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-0 pt-0 pb-0">
                    <div className="border-t border-slate-100">
                      {mod.lectures.map((lec, li) => (
                        <div
                          key={lec.id}
                          className={`flex items-center gap-3 px-4 py-3 text-sm ${li < mod.lectures.length - 1 ? "border-b border-slate-50" : ""}`}
                        >
                          {lec.isPreview ? (
                            <Play className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                          ) : (
                            <Lock className="w-4 h-4 text-slate-300 flex-shrink-0" />
                          )}
                          <span className="flex-1 text-slate-700 break-words">{lec.title}</span>
                          {lec.isPreview && (
                            <Badge variant="outline" className="text-[10px] text-indigo-600 border-indigo-200 py-0">Preview</Badge>
                          )}
                          <span className="text-xs text-slate-400 ml-auto flex-shrink-0">{lec.duration}</span>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>

          {/* Instructor */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="bento-card">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Your Instructor</h2>
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold text-white flex-shrink-0"
                style={{ background: course.thumbnailAccent }}>
                {course.instructor.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </div>
              <div>
                <p className="font-semibold text-slate-800">{course.instructor}</p>
                <p className="text-sm text-slate-500 mt-1 leading-relaxed">{course.instructorBio}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right: Sticky sidebar */}
        <div className="lg:col-span-1">
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bento-card sticky top-24 shadow-xl"
          >
            {/* Price */}
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
              className={`w-full h-12 text-base font-semibold rounded-xl mb-4 ${enrolled ? "bg-emerald-600 hover:bg-emerald-700" : "bg-indigo-600 hover:bg-indigo-700"} text-white shadow-lg`}
              id="course-enroll-btn"
            >
              {enrolling ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : enrolled ? (
                <Play className="w-4 h-4 mr-2 fill-white" />
              ) : (
                <ShoppingCart className="w-4 h-4 mr-2" />
              )}
              {enrolling ? "Processing..." : enrolled ? "Continue Learning" : course.price === 0 ? "Enroll for Free" : "Enroll Now"}
            </Button>

            {/* Rating Widget */}
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
                    const isLit = star <= (hoverRating || (canRate ? hoverRating || existingRating : existingRating));
                    return (
                      <Star
                        key={star}
                        onClick={() => canRate && handleRateCourse(star)}
                        onMouseEnter={() => canRate && setHoverRating(star)}
                        onMouseLeave={() => canRate && setHoverRating(0)}
                        className={`w-5 h-5 ${canRate ? "cursor-pointer transition-colors duration-150" : ""} ${isLit ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200"
                          }`}
                      />
                    );
                  })}
                </div>
                {ratingError && <p className="text-xs text-rose-500 font-semibold">{ratingError}</p>}
                {hasRated && <p className="text-xs text-slate-500 font-medium">You rated this course {existingRating} stars.</p>}
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
        </div>
      </div>
    </div>
  );
}
