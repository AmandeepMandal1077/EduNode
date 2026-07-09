import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "motion/react";
import { Loader2, Plus, Trash2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { addLecture, deleteLecture, getProcessingLectures } from "@/services/courseService";
import { openCloudinaryWidget } from "@/services/mediaService";
import { getErrorMessage } from "@/utils/getErrorMessage";
import type { Course, Lecture } from "@/types";
import type { BackendProcessingLecture } from "@/api/courseApi";
import ScrollArea from "@/components/shadix-ui/components/smooth-scroll-area/scroll-area";

const POLL_INTERVAL_MS = 10_000;

interface CourseCurriculumTabProps {
  courseId: string;
  course: Course;
  loadCourseData: () => Promise<void>;
}

export function CourseCurriculumTab({ courseId, course, loadCourseData }: CourseCurriculumTabProps) {
  const [lectureForm, setLectureForm] = useState({ title: "", description: "" });
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [publicId, setPublicId] = useState<string>("");
  const [signature, setSignature] = useState<string>("");
  const [version, setVersion] = useState<number | null>(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [addingLecture, setAddingLecture] = useState(false);
  const [lectureErrors, setLectureErrors] = useState<Record<string, string>>({});
  const [lectureGeneralError, setLectureGeneralError] = useState("");
  const [deletingLectureId, setDeletingLectureId] = useState<string | null>(null);

  const [processingLectures, setProcessingLectures] = useState<BackendProcessingLecture[]>([]);
  const prevProcessingCountRef = useRef<number | null>(null);

  const pollProcessingLectures = useCallback(async () => {
    const lectures = await getProcessingLectures(courseId);
    setProcessingLectures(lectures);

    // If we previously had processing lectures and now some completed, refresh the main list
    if (
      prevProcessingCountRef.current !== null &&
      prevProcessingCountRef.current > lectures.length
    ) {
      await loadCourseData();
    }
    prevProcessingCountRef.current = lectures.length;
  }, [courseId, loadCourseData]);

  // Initial fetch + polling
  useEffect(() => {
    pollProcessingLectures();
    const interval = setInterval(pollProcessingLectures, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [pollProcessingLectures]);

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
      await addLecture(courseId, {
        title: lectureForm.title,
        description: lectureForm.description,
        videoUrl: videoUrl,
        publicId: publicId,
        signature: signature,
        version: version ?? 0,
      });
      setLectureForm({ title: "", description: "" });
      setVideoUrl("");
      setPublicId("");
      setSignature("");
      setVersion(null);
      await loadCourseData();
      // Immediately refresh processing list so the new lecture shows up
      await pollProcessingLectures();
    } catch (err: unknown) {
      console.error(err);
      setLectureGeneralError(getErrorMessage(err, "Failed to add lecture to course."));
    } finally {
      setAddingLecture(false);
    }
  };

  const handleDeleteLecture = async (lectureId: string) => {
    if (!window.confirm("Are you sure you want to delete this lecture?")) return;
    try {
      setDeletingLectureId(lectureId);
      await deleteLecture(lectureId);
      await loadCourseData();
    } catch (err: unknown) {
      console.error(err);
      alert(getErrorMessage(err, "Failed to delete lecture."));
    } finally {
      setDeletingLectureId(null);
    }
  };

  const mappedLectures: Lecture[] = course.modules && course.modules.length > 0 ? course.modules[0].lectures : [];

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="flex flex-col gap-8">
      {/* Processing Lectures Section */}
      {processingLectures.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
            Processing Videos
          </h2>
          <div className="flex flex-col gap-2.5">
            {processingLectures.map((lect) => (
              <div
                key={lect._id}
                className="flex items-center justify-between p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-amber-100">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                  </span>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-slate-800 truncate">{lect.title}</h4>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">{lect.description}</p>
                  </div>
                </div>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full flex-shrink-0 ml-3">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-600" />
                  </span>
                  Processing
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-4">Course Lectures</h2>
        {mappedLectures.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
            <p className="text-slate-500 text-sm">No lectures added to this course yet.</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[320px] border border-slate-100 rounded-xl bg-slate-50/50">
            <div className="flex flex-col gap-2.5 p-2">
            {mappedLectures.map((lect, idx) => (
              <div key={lect.id} className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
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
                  {deletingLectureId === lect.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </Button>
              </div>
            ))}
            </div>
          </ScrollArea>
        )}
      </div>

      <Separator />

      <div>
        <h3 className="font-bold text-slate-900 mb-4">Add New Lecture</h3>
        <form onSubmit={handleAddLecture} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-baseline">
              <Label htmlFor="lecture-title" className="text-sm font-medium text-slate-700">Lecture Title</Label>
              {lectureErrors.title && <span className="text-xs text-rose-600 font-semibold">{lectureErrors.title}</span>}
            </div>
            <Input
              id="lecture-title"
              value={lectureForm.title}
              maxLength={50}
              onChange={(e) => {
                setLectureForm((f) => ({ ...f, title: e.target.value }));
                setLectureErrors((errs) => { const copy = { ...errs }; delete copy.title; return copy; });
              }}
              placeholder="e.g. Setting up the environment"
              className={lectureErrors.title ? "border-rose-500 focus-visible:ring-rose-500/20" : "border-slate-200"}
            />
            <span className="text-[10px] text-slate-400 text-right block mt-0.5">{lectureForm.title.length}/50</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-baseline">
              <Label htmlFor="lecture-description" className="text-sm font-medium text-slate-700">Lecture Description</Label>
              {lectureErrors.description && <span className="text-xs text-rose-600 font-semibold">{lectureErrors.description}</span>}
            </div>
            <Input
              id="lecture-description"
              value={lectureForm.description}
              onChange={(e) => {
                setLectureForm((f) => ({ ...f, description: e.target.value }));
                setLectureErrors((errs) => { const copy = { ...errs }; delete copy.description; return copy; });
              }}
              placeholder="Brief summary (max 100 characters)"
              maxLength={100}
              className={lectureErrors.description ? "border-rose-500 focus-visible:ring-rose-500/20" : "border-slate-200"}
            />
            <span className="text-[10px] text-slate-400 text-right">{lectureForm.description.length}/100</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-baseline">
              <Label className="text-sm font-medium text-slate-700">Lecture Video File</Label>
              {lectureErrors.video && <span className="text-xs text-rose-600 font-semibold">{lectureErrors.video}</span>}
            </div>
            <div
              onClick={async () => {
                try {
                  setUploadingVideo(true);
                  const result = await openCloudinaryWidget("video");
                  setVideoUrl(result.secureUrl);
                  setPublicId(result.publicId);
                  setSignature(result.signature);
                  setVersion(result.version);
                  if (lectureErrors.video) {
                    setLectureErrors((errs) => { const copy = { ...errs }; delete copy.video; return copy; });
                  }
                } catch (err: unknown) {
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
              <span className="text-xs text-slate-500 truncate">{videoUrl ? "video_uploaded.mp4" : "No file chosen"}</span>
            </div>
          </div>

          {lectureGeneralError && (
            <p className="text-sm text-rose-600 font-medium bg-rose-50 border border-rose-100 rounded-xl px-4 py-2.5">
              {lectureGeneralError}
            </p>
          )}

          <Button type="submit" disabled={addingLecture} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold mt-2">
            {addingLecture ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Adding Lecture...</> : <><Plus className="w-4 h-4 mr-2" /> Add Lecture</>}
          </Button>
          {addingLecture && <p className="text-xs text-amber-600 font-medium animate-pulse mt-1">Uploading video... Please do not refresh or close the page.</p>}
        </form>
      </div>
    </motion.div>
  );
}
