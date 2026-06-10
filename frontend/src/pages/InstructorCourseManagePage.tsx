import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  Settings,
  FileText,
  Bell,
  Save,
  Trash2,
  Plus,
  Loader2,
  Check,
  BookOpen,
  PlusCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  getCourseById,
  updateCourse,
  addLecture,
  deleteLecture,
  getCourseAnnouncements,
} from "@/services/courseService";
import { postAnnouncement } from "@/api/courseApi";
import { openCloudinaryWidget } from "@/services/mediaService";
import type { Course, Lecture } from "@/types";

export function InstructorCourseManagePage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("details");
  const [course, setCourse] = useState<Course | null>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Details Tab Form States
  const [detailsForm, setDetailsForm] = useState<{
    title: string;
    subtitle: string;
    description: string;
    category: string;
    level: string;
    price: number | "";
  }>({
    title: "",
    subtitle: "",
    description: "",
    category: "",
    level: "beginner",
    price: 0,
  });
  const [thumbnailUrl, setThumbnailUrl] = useState<string>("");
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [savingDetails, setSavingDetails] = useState(false);
  const [savedDetails, setSavedDetails] = useState(false);
  const [detailsErrors, setDetailsErrors] = useState<Record<string, string>>({});
  const [detailsGeneralError, setDetailsGeneralError] = useState("");

  // Add Lecture Form States
  const [lectureForm, setLectureForm] = useState({
    title: "",
    description: "",
  });
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [publicId, setPublicId] = useState<string>("");
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [addingLecture, setAddingLecture] = useState(false);
  const [lectureErrors, setLectureErrors] = useState<Record<string, string>>({});
  const [lectureGeneralError, setLectureGeneralError] = useState("");
  const [deletingLectureId, setDeletingLectureId] = useState<string | null>(null);

  // Announcement Form States
  const [announcementMsg, setAnnouncementMsg] = useState("");
  const [postingAnn, setPostingAnn] = useState(false);
  const [annError, setAnnError] = useState("");

  // Fetch course details
  const loadCourseData = async () => {
    if (!courseId) return;
    try {
      setLoading(true);
      const data = await getCourseById(courseId);
      if (data) {
        setCourse(data);
        setDetailsForm({
          title: data.title,
          subtitle: data.subtitle,
          description: data.description,
          category: data.category,
          level: data.level === "Advanced" ? "advance" : data.level.toLowerCase(),
          price: data.price,
        });
        setThumbnailUrl(data.thumbnail || "");

        const annData = await getCourseAnnouncements(courseId);
        setAnnouncements(annData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourseData();
  }, [courseId]);

  // Tab switching clears all error states
  useEffect(() => {
    setDetailsErrors({});
    setDetailsGeneralError("");
    setLectureErrors({});
    setLectureGeneralError("");
    setAnnError("");
  }, [activeTab]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (!course || !courseId) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <p className="text-slate-600 font-medium mb-4">Course not found.</p>
          <Button onClick={() => navigate("/instructor/courses")} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl">
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Handle Details Submit
  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setDetailsErrors({});
    setDetailsGeneralError("");

    const errs: Record<string, string> = {};
    if (!detailsForm.title.trim()) errs.title = "Title is required.";
    else if (detailsForm.title.length > 50) errs.title = "Title cannot exceed 50 characters.";

    if (!detailsForm.subtitle.trim()) errs.subtitle = "Subtitle is required.";
    else if (detailsForm.subtitle.length > 100) errs.subtitle = "Subtitle cannot exceed 100 characters.";

    if (!detailsForm.description.trim()) errs.description = "Description is required.";
    else if (detailsForm.description.length > 200) errs.description = "Description cannot exceed 200 characters.";

    if (!detailsForm.category.trim()) errs.category = "Category is required.";
    if (detailsForm.price === "") errs.price = "Price is required.";
    else if (Number(detailsForm.price) < 0) errs.price = "Price must be non-negative.";

    if (Object.keys(errs).length > 0) {
      setDetailsErrors(errs);
      return;
    }

    try {
      setSavingDetails(true);
      const updated = await updateCourse(
        courseId,
        {
          title: detailsForm.title,
          subtitle: detailsForm.subtitle,
          description: detailsForm.description,
          category: detailsForm.category,
          level: detailsForm.level,
          price: Number(detailsForm.price),
          thumbnail: thumbnailUrl || undefined,
        }
      );
      setCourse(updated);
      setSavedDetails(true);
      setTimeout(() => setSavedDetails(false), 2500);
    } catch (err: any) {
      console.error(err);
      setDetailsGeneralError(
        err?.response?.data?.message || err?.message || "Failed to update course details."
      );
    } finally {
      setSavingDetails(false);
    }
  };

  // Handle Add Lecture
  const handleAddLecture = async (e: React.FormEvent) => {
    e.preventDefault();
    setLectureErrors({});
    setLectureGeneralError("");

    const errs: Record<string, string> = {};
    if (!lectureForm.title.trim()) errs.title = "Lecture title is required.";
    else if (lectureForm.title.length > 50) errs.title = "Title cannot exceed 50 characters.";

    if (!lectureForm.description.trim()) errs.description = "Lecture description is required.";
    else if (lectureForm.description.length > 100) errs.description = "Description cannot exceed 100 characters.";

    if (!videoUrl) errs.video = "Video file is required.";

    if (Object.keys(errs).length > 0) {
      setLectureErrors(errs);
      return;
    }

    try {
      setAddingLecture(true);
      await addLecture(
        courseId,
        {
          title: lectureForm.title,
          description: lectureForm.description,
          videoUrl: videoUrl,
          publicId: publicId,
        }
      );
      setLectureForm({ title: "", description: "" });
      setVideoUrl("");
      setPublicId("");

      // Refresh course data to show newly added lecture
      await loadCourseData();
    } catch (err: any) {
      console.error(err);
      setLectureGeneralError(
        err?.response?.data?.message || err?.message || "Failed to add lecture to course."
      );
    } finally {
      setAddingLecture(false);
    }
  };

  // Handle Delete Lecture
  const handleDeleteLecture = async (lectureId: string) => {
    if (!window.confirm("Are you sure you want to delete this lecture?")) return;
    try {
      setDeletingLectureId(lectureId);
      await deleteLecture(lectureId);
      await loadCourseData();
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || err?.message || "Failed to delete lecture.");
    } finally {
      setDeletingLectureId(null);
    }
  };

  // Handle Announcement Post
  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setAnnError("");
    if (!announcementMsg.trim()) {
      setAnnError("Announcement message cannot be empty.");
      return;
    }
    if (announcementMsg.length > 500) {
      setAnnError("Announcement cannot exceed 500 characters.");
      return;
    }

    try {
      setPostingAnn(true);
      await postAnnouncement(courseId, announcementMsg);
      setAnnouncementMsg("");
      const annData = await getCourseAnnouncements(courseId);
      setAnnouncements(annData);
    } catch (err: any) {
      console.error(err);
      setAnnError(err?.response?.data?.message || err?.message || "Failed to publish announcement.");
    } finally {
      setPostingAnn(false);
    }
  };

  const getMappedLectures = (): Lecture[] => {
    if (!course.modules || course.modules.length === 0) return [];
    return course.modules[0].lectures;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Back Link */}
        <Button
          onClick={() => navigate("/instructor/courses")}
          variant="ghost"
          size="sm"
          className="mb-6 text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        {/* Title Block */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2.5 py-1 rounded-full">
                {course.category}
              </span>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                course.isPublished 
                  ? "bg-emerald-50 text-emerald-700" 
                  : "bg-amber-50 text-amber-700"
              }`}>
                {course.isPublished ? "Published" : "Draft"}
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 mt-2">{course.title}</h1>
            <p className="text-slate-500 text-sm mt-1">{course.subtitle}</p>
          </div>
          <Button
            onClick={async () => {
              try {
                const updated = await updateCourse(courseId, {
                  isPublished: !course.isPublished
                });
                setCourse(updated);
              } catch (err: any) {
                console.error(err);
                alert(err?.response?.data?.message || err?.message || "Failed to update publication status.");
              }
            }}
            className={`rounded-xl font-semibold px-4 py-2 text-sm shadow-sm transition-all ${
              course.isPublished
                ? "bg-slate-200 hover:bg-slate-300 text-slate-700"
                : "bg-indigo-600 hover:bg-indigo-700 text-white"
            }`}
          >
            {course.isPublished ? "Unpublish Course" : "Publish Course"}
          </Button>
        </div>

        {/* Side-by-Side Tab Panel */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Navigation */}
          <nav className="md:w-56 flex-shrink-0 flex md:flex-col gap-1 flex-wrap">
            {[
              { id: "details", label: "Course Details", icon: Settings },
              { id: "lectures", label: "Manage Lectures", icon: FileText },
              { id: "announcements", label: "Announcements", icon: Bell },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2.5 px-3.5 py-3 rounded-xl text-sm font-semibold transition-colors w-full text-left ${
                  activeTab === t.id
                    ? "bg-indigo-50 text-indigo-700 shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <t.icon className="w-4 h-4" />
                {t.label}
              </button>
            ))}
          </nav>

          {/* Panel */}
          <div className="flex-1 bg-white border border-slate-200 shadow-sm rounded-2xl p-6 sm:p-8">
            <AnimatePresence mode="wait">
              {activeTab === "details" && (
                <motion.div
                  key="details"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <h2 className="text-lg font-bold text-slate-900 mb-6">Course Information</h2>
                  <form onSubmit={handleSaveDetails} className="flex flex-col gap-5">
                    {/* Title */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-baseline">
                        <Label htmlFor="title" className="text-sm font-medium text-slate-700">Course Title</Label>
                        {detailsErrors.title && (
                          <span className="text-xs text-rose-600 font-semibold">{detailsErrors.title}</span>
                        )}
                      </div>
                      <Input
                        id="title"
                        value={detailsForm.title}
                        maxLength={50}
                        onChange={(e) => {
                          setDetailsForm((f) => ({ ...f, title: e.target.value }));
                          setDetailsErrors((errs) => {
                            const copy = { ...errs };
                            delete copy.title;
                            return copy;
                          });
                        }}
                        className={detailsErrors.title ? "border-rose-500 focus-visible:ring-rose-500/20" : "border-slate-200"}
                      />
                      <span className="text-[10px] text-slate-400 text-right block mt-0.5">{detailsForm.title.length}/50</span>
                    </div>

                    {/* Subtitle */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-baseline">
                        <Label htmlFor="subtitle" className="text-sm font-medium text-slate-700">Subtitle</Label>
                        {detailsErrors.subtitle && (
                          <span className="text-xs text-rose-600 font-semibold">{detailsErrors.subtitle}</span>
                        )}
                      </div>
                      <Input
                        id="subtitle"
                        value={detailsForm.subtitle}
                        maxLength={100}
                        onChange={(e) => {
                          setDetailsForm((f) => ({ ...f, subtitle: e.target.value }));
                          setDetailsErrors((errs) => {
                            const copy = { ...errs };
                            delete copy.subtitle;
                            return copy;
                          });
                        }}
                        className={detailsErrors.subtitle ? "border-rose-500 focus-visible:ring-rose-500/20" : "border-slate-200"}
                      />
                      <span className="text-[10px] text-slate-400 text-right block mt-0.5">{detailsForm.subtitle.length}/100</span>
                    </div>

                    {/* Description */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-baseline">
                        <Label htmlFor="description" className="text-sm font-medium text-slate-700">Description</Label>
                        {detailsErrors.description && (
                          <span className="text-xs text-rose-600 font-semibold">{detailsErrors.description}</span>
                        )}
                      </div>
                      <textarea
                        id="description"
                        value={detailsForm.description}
                        maxLength={200}
                        onChange={(e) => {
                          setDetailsForm((f) => ({ ...f, description: e.target.value }));
                          setDetailsErrors((errs) => {
                            const copy = { ...errs };
                            delete copy.description;
                            return copy;
                          });
                        }}
                        rows={4}
                        className={`w-full rounded-xl border px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors ${
                          detailsErrors.description ? "border-rose-500 focus:ring-rose-500/20" : "border-slate-200"
                        }`}
                      />
                      <span className="text-[10px] text-slate-400 text-right block mt-0.5">{detailsForm.description.length}/200</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Category */}
                      <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-baseline">
                          <Label htmlFor="category" className="text-sm font-medium text-slate-700">Category</Label>
                          {detailsErrors.category && (
                            <span className="text-xs text-rose-600 font-semibold">{detailsErrors.category}</span>
                          )}
                        </div>
                        <Input
                          id="category"
                          value={detailsForm.category}
                          maxLength={50}
                          onChange={(e) => {
                            setDetailsForm((f) => ({ ...f, category: e.target.value }));
                            setDetailsErrors((errs) => {
                              const copy = { ...errs };
                              delete copy.category;
                              return copy;
                            });
                          }}
                          className={detailsErrors.category ? "border-rose-500 focus-visible:ring-rose-500/20" : "border-slate-200"}
                        />
                      </div>

                      {/* Level */}
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="level" className="text-sm font-medium text-slate-700">Level</Label>
                        <select
                          id="level"
                          value={detailsForm.level}
                          onChange={(e) => setDetailsForm((f) => ({ ...f, level: e.target.value }))}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors"
                        >
                          <option value="beginner">Beginner</option>
                          <option value="intermediate">Intermediate</option>
                          <option value="advance">Advanced</option>
                        </select>
                      </div>

                      {/* Price */}
                      <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-baseline">
                          <Label htmlFor="price" className="text-sm font-medium text-slate-700">Price (INR)</Label>
                          {detailsErrors.price && (
                            <span className="text-xs text-rose-600 font-semibold">{detailsErrors.price}</span>
                          )}
                        </div>
                        <Input
                          id="price"
                          type="number"
                          min={0}
                          value={detailsForm.price}
                          onChange={(e) => {
                            const raw = e.target.value;
                            const cleaned = raw.replace(/^0+(?=\d)/, "");
                            setDetailsForm((f) => ({ ...f, price: cleaned === "" ? "" : parseInt(cleaned) || 0 }));
                            setDetailsErrors((errs) => {
                              const copy = { ...errs };
                              delete copy.price;
                              return copy;
                            });
                          }}
                          className={detailsErrors.price ? "border-rose-500 focus-visible:ring-rose-500/20" : "border-slate-200"}
                        />
                      </div>
                    </div>

                    {/* Thumbnail File Widget Upload */}
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-sm font-medium text-slate-700">Change Thumbnail File</Label>
                      <div
                        onClick={async () => {
                          try {
                            setUploadingThumbnail(true);
                            const result = await openCloudinaryWidget("image");
                            setThumbnailUrl(result.secureUrl);
                          } catch (err: any) {
                            console.error(err);
                          } finally {
                            setUploadingThumbnail(false);
                          }
                        }}
                        className="cursor-pointer w-full flex items-center h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
                      >
                        <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg ml-3 mr-4 hover:bg-indigo-100 transition-colors">
                          Choose File
                        </span>
                        <span className="text-xs text-slate-500 truncate">
                          {thumbnailUrl ? "thumbnail_uploaded.jpg" : "No file chosen"}
                        </span>
                      </div>
                      
                      {thumbnailUrl && (
                        <div className="mt-2 relative w-full max-w-sm rounded-xl overflow-hidden border border-slate-200 aspect-video">
                          <img src={thumbnailUrl} alt="Thumbnail Preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>

                    {detailsGeneralError && (
                      <p className="text-sm text-rose-600 font-medium bg-rose-50 border border-rose-100 rounded-xl px-4 py-2.5">
                        {detailsGeneralError}
                      </p>
                    )}

                    <div className="flex flex-col gap-2 mt-2">
                      <div className="flex items-center gap-3">
                        <Button
                          type="submit"
                          disabled={savingDetails}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold"
                        >
                          {savingDetails ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              Saving Changes...
                            </>
                          ) : (
                            <Save className="w-4 h-4 mr-2" />
                          )}
                          {savingDetails ? "Saving Changes..." : "Save Changes"}
                        </Button>
                        <AnimatePresence>
                          {savedDetails && (
                            <motion.div
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0 }}
                              className="flex items-center gap-1.5 text-emerald-600 text-sm font-medium"
                            >
                              <Check className="w-4 h-4" />
                              Saved!
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </form>
                </motion.div>
              )}

              {activeTab === "lectures" && (
                <motion.div
                  key="lectures"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="flex flex-col gap-8"
                >
                  {/* Current Lectures */}
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 mb-4">Course Lectures</h2>
                    {getMappedLectures().length === 0 ? (
                      <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                        <p className="text-slate-500 text-sm">No lectures added to this course yet.</p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[320px] pr-2 border border-slate-100 rounded-xl p-2 bg-slate-50/50">
                        {getMappedLectures().map((lect, idx) => (
                          <div
                            key={lect.id}
                            className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">
                                {idx + 1}
                              </span>
                              <div className="min-w-0">
                                <h4 className="text-sm font-bold text-slate-800 truncate">{lect.title}</h4>
                                <p className="text-[11px] text-slate-400 truncate mt-0.5">{lect.description}</p>
                              </div>
                            </div>

                            <Button
                              onClick={() => handleDeleteLecture(lect.id)}
                              disabled={deletingLectureId === lect.id}
                              variant="ghost"
                              className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg p-2"
                              size="icon"
                            >
                              {deletingLectureId === lect.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Add Lecture Form */}
                  <div>
                    <h3 className="font-bold text-slate-900 mb-4">Add New Lecture</h3>
                    <form onSubmit={handleAddLecture} className="flex flex-col gap-4">
                      {/* Title */}
                      <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-baseline">
                          <Label htmlFor="lecture-title" className="text-sm font-medium text-slate-700">Lecture Title</Label>
                          {lectureErrors.title && (
                            <span className="text-xs text-rose-600 font-semibold">{lectureErrors.title}</span>
                          )}
                        </div>
                        <Input
                          id="lecture-title"
                          value={lectureForm.title}
                          maxLength={50}
                          onChange={(e) => {
                            setLectureForm((f) => ({ ...f, title: e.target.value }));
                            setLectureErrors((errs) => {
                              const copy = { ...errs };
                              delete copy.title;
                              return copy;
                            });
                          }}
                          placeholder="e.g. Setting up the environment"
                          className={lectureErrors.title ? "border-rose-500 focus-visible:ring-rose-500/20" : "border-slate-200"}
                        />
                        <span className="text-[10px] text-slate-400 text-right block mt-0.5">{lectureForm.title.length}/50</span>
                      </div>

                      {/* Description */}
                      <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-baseline">
                          <Label htmlFor="lecture-description" className="text-sm font-medium text-slate-700">Lecture Description</Label>
                          {lectureErrors.description && (
                            <span className="text-xs text-rose-600 font-semibold">{lectureErrors.description}</span>
                          )}
                        </div>
                        <Input
                          id="lecture-description"
                          value={lectureForm.description}
                          onChange={(e) => {
                            setLectureForm((f) => ({ ...f, description: e.target.value }));
                            setLectureErrors((errs) => {
                              const copy = { ...errs };
                              delete copy.description;
                              return copy;
                            });
                          }}
                          placeholder="Brief summary (max 100 characters)"
                          maxLength={100}
                          className={lectureErrors.description ? "border-rose-500 focus-visible:ring-rose-500/20" : "border-slate-200"}
                        />
                        <span className="text-[10px] text-slate-400 text-right">{lectureForm.description.length}/100</span>
                      </div>

                      {/* Video File Widget Upload */}
                      <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-baseline">
                          <Label className="text-sm font-medium text-slate-700">Lecture Video File</Label>
                          {lectureErrors.video && (
                            <span className="text-xs text-rose-600 font-semibold">{lectureErrors.video}</span>
                          )}
                        </div>
                        <div
                          onClick={async () => {
                            try {
                              setUploadingVideo(true);
                              const result = await openCloudinaryWidget("video");
                              setVideoUrl(result.secureUrl);
                              setPublicId(result.publicId);
                              if (lectureErrors.video) {
                                setLectureErrors((errs) => {
                                  const copy = { ...errs };
                                  delete copy.video;
                                  return copy;
                                });
                              }
                            } catch (err: any) {
                              console.error(err);
                            } finally {
                              setUploadingVideo(false);
                            }
                          }}
                          className={`cursor-pointer w-full flex items-center h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors ${lectureErrors.video ? "border-rose-500 focus-visible:ring-rose-500/20" : ""}`}
                        >
                          <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg ml-3 mr-4 hover:bg-indigo-100 transition-colors">
                            Choose File
                          </span>
                          <span className="text-xs text-slate-500 truncate">
                            {videoUrl ? "video_uploaded.mp4" : "No file chosen"}
                          </span>
                        </div>
                      </div>

                      {lectureGeneralError && (
                        <p className="text-sm text-rose-600 font-medium bg-rose-50 border border-rose-100 rounded-xl px-4 py-2.5">
                          {lectureGeneralError}
                        </p>
                      )}

                      <Button
                        type="submit"
                        disabled={addingLecture}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold mt-2"
                      >
                        {addingLecture ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            Adding Lecture...
                          </>
                        ) : (
                          <Plus className="w-4 h-4 mr-2" />
                        )}
                        {addingLecture ? "Adding Lecture..." : "Add Lecture"}
                      </Button>
                      {addingLecture && (
                        <p className="text-xs text-amber-600 font-medium animate-pulse mt-1">
                          Uploading video... Please do not refresh or close the page.
                        </p>
                      )}
                    </form>
                  </div>
                </motion.div>
              )}

              {activeTab === "announcements" && (
                <motion.div
                  key="announcements"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="flex flex-col gap-6"
                >
                  <h2 className="text-lg font-bold text-slate-900 mb-2">Announcements</h2>

                  {/* Add Announcement */}
                  <form onSubmit={handlePostAnnouncement} className="flex flex-col gap-3">
                    <Label htmlFor="announcement" className="text-sm font-medium text-slate-700">New Announcement Message</Label>
                    <textarea
                      id="announcement"
                      value={announcementMsg}
                      maxLength={500}
                      onChange={(e) => {
                        setAnnouncementMsg(e.target.value);
                        if (annError) setAnnError("");
                      }}
                      placeholder="Write announcement message here to broadcast to all enrolled students..."
                      rows={3}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors"
                    />
                    <span className="text-[10px] text-slate-400 text-right block">{announcementMsg.length}/500</span>
                    {annError && <p className="text-xs text-rose-600 font-semibold">{annError}</p>}
                    <Button
                      type="submit"
                      disabled={postingAnn}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold ml-auto"
                    >
                      {postingAnn ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Bell className="w-4 h-4 mr-2" />
                      )}
                      {postingAnn ? "Broadcasting..." : "Publish Announcement"}
                    </Button>
                  </form>

                  <Separator />

                  {/* Announcement List */}
                  <div>
                    <h3 className="font-bold text-slate-800 mb-4">Broadcast History</h3>
                    {announcements.length === 0 ? (
                      <div className="text-center py-8 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                        <p className="text-slate-500 text-sm">No announcements broadcasted yet.</p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3 overflow-y-auto max-h-[320px] pr-2 border border-slate-100 rounded-xl p-2 bg-slate-50/50">
                        {announcements.map((ann) => (
                          <div
                            key={ann._id}
                            className="p-4 bg-indigo-50/50 border border-indigo-100/50 rounded-xl flex flex-col gap-2"
                          >
                            <p className="text-sm text-slate-700 font-medium leading-relaxed whitespace-pre-wrap break-all">
                              {ann.message}
                            </p>
                            <span className="text-[10px] text-slate-400 font-medium self-end">
                              {new Date(ann.sentAt).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
