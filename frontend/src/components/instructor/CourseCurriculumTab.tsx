import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "motion/react";
import { Loader2, Plus, Trash2, Clock, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  addLecture,
  deleteLecture,
  getProcessingLectures,
} from "@/services/courseService";
import { uploadFileToS3 } from "@/services/mediaService";
import { getErrorMessage } from "@/utils/getErrorMessage";
import type { Course, Lecture } from "@/types";
import type { BackendProcessingLecture } from "@/api/courseApi";
import debug from "@/utils/debug";

const POLL_INTERVAL_MS = 10_000;

interface CourseCurriculumTabProps {
  courseId: string;
  course: Course;
  loadCourseData: () => Promise<void>;
}

export function CourseCurriculumTab({
  courseId,
  course,
  loadCourseData,
}: CourseCurriculumTabProps) {
  const [lectureForm, setLectureForm] = useState({
    title: "",
    description: "",
  });
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [addingLecture, setAddingLecture] = useState(false);
  const [lectureErrors, setLectureErrors] = useState<Record<string, string>>(
    {},
  );
  const [lectureGeneralError, setLectureGeneralError] = useState("");
  const [deletingLectureId, setDeletingLectureId] = useState<string | null>(
    null,
  );

  const [processingLectures, setProcessingLectures] = useState<
    BackendProcessingLecture[]
  >([]);
  const prevProcessingCountRef = useRef<number | null>(null);

  const pollProcessingLectures = useCallback(async () => {
    const lectures = await getProcessingLectures(courseId);
    setProcessingLectures(lectures);

    if (
      prevProcessingCountRef.current !== null &&
      prevProcessingCountRef.current > lectures.length
    ) {
      await loadCourseData();
    }
    prevProcessingCountRef.current = lectures.length;
  }, [courseId, loadCourseData]);

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
    else if (lectureForm.title.length > 50)
      errs.title = "Title cannot exceed 50 characters.";

    if (!lectureForm.description.trim())
      errs.description = "Lecture description is required.";
    else if (lectureForm.description.length > 100)
      errs.description = "Description cannot exceed 100 characters.";

    if (!selectedVideo) errs.video = "Video file is required.";

    if (Object.keys(errs).length > 0) {
      setLectureErrors(errs);
      return;
    }

    try {
      setAddingLecture(true);
      setUploadProgress(0);

      const { presignedUrl } = await addLecture(courseId, {
        title: lectureForm.title,
        description: lectureForm.description,
        fileName: selectedVideo.name,
        contentType: selectedVideo.type,
      });

      await uploadFileToS3(presignedUrl, selectedVideo, (percent) =>
        setUploadProgress(percent),
      );

      setLectureForm({ title: "", description: "" });
      setSelectedVideo(null);
      setUploadProgress(0);
      await loadCourseData();
      await pollProcessingLectures();
    } catch (err: unknown) {
      debug(err);
      setLectureGeneralError(
        getErrorMessage(err, "Failed to add lecture to course."),
      );
    } finally {
      setAddingLecture(false);
    }
  };

  const handleDeleteLecture = async (lectureId: string) => {
    if (!window.confirm("Are you sure you want to delete this lecture?"))
      return;
    try {
      setDeletingLectureId(lectureId);
      await deleteLecture(lectureId);
      await loadCourseData();
    } catch (err: unknown) {
      debug(err);
      alert(getErrorMessage(err, "Failed to delete lecture."));
    } finally {
      setDeletingLectureId(null);
    }
  };

  const mappedLectures: Lecture[] =
    course.modules && course.modules.length > 0
      ? course.modules[0].lectures
      : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="flex flex-col gap-8"
    >
      {/* Processing Lectures Section */}
      {processingLectures.length > 0 && (
        <div>
          <h2 className="text-lg font-heading font-black text-foreground mb-4 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-foreground" />
            Processing Videos
          </h2>
          <div className="flex flex-col gap-2.5">
            {processingLectures.map((lect) => (
              <div
                key={lect._id}
                className="flex items-center justify-between p-3.5 bg-main border-2 border-border rounded-base shadow-[2px_2px_0px_0px_#000]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-base bg-background border-2 border-border">
                    <Clock className="w-4 h-4 text-foreground" />
                  </span>
                  <div className="min-w-0">
                    <h4 className="text-sm font-heading font-black text-main-foreground truncate">
                      {lect.title}
                    </h4>
                    <p className="text-xs font-base text-main-foreground/80 truncate mt-0.5">
                      {lect.description}
                    </p>
                  </div>
                </div>
                <span className="flex items-center gap-1.5 text-xs font-heading font-black text-foreground bg-background border-2 border-border px-2.5 py-1 rounded-base flex-shrink-0 ml-3 shadow-[1px_1px_0px_0px_#000]">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-black opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-black" />
                  </span>
                  Processing
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-heading font-black text-foreground mb-4">
          Course Lectures
        </h2>
        {mappedLectures.length === 0 ? (
          <div className="text-center py-10 bg-secondary-background border-2 border-border rounded-base shadow-shadow">
            <p className="text-foreground/70 font-heading font-bold text-sm">
              No lectures added to this course yet.
            </p>
          </div>
        ) : (
          <div className="h-[280px] sm:h-[320px] md:h-[420px] border-2 border-border rounded-base bg-secondary-background p-2 overflow-y-auto custom-scrollbar">
            <div className="flex flex-col gap-2.5">
              {mappedLectures.map((lect, idx) => (
                <div
                  key={lect.id}
                  className="flex items-center justify-between p-3.5 bg-background border-2 border-border rounded-base shadow-[2px_2px_0px_0px_#000]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-heading font-black text-main-foreground bg-main border-2 border-border w-7 h-7 rounded-base flex items-center justify-center flex-shrink-0 shadow-[1px_1px_0px_0px_#000]">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <h4 className="text-sm font-heading font-black text-foreground truncate">
                        {lect.title}
                      </h4>
                      <p className="text-xs font-base text-foreground/70 truncate mt-0.5">
                        {lect.description}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleDeleteLecture(lect.id)}
                    disabled={deletingLectureId === lect.id}
                    variant="neutral"
                    size="icon"
                    className="border-2 border-border text-red-600 hover:bg-red-500 hover:text-white rounded-base h-8 w-8 cursor-pointer"
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
          </div>
        )}
      </div>

      <Separator />

      <div>
        <h3 className="font-heading font-black text-lg text-foreground mb-4">Add New Lecture</h3>
        <form onSubmit={handleAddLecture} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-baseline">
              <Label
                htmlFor="lecture-title"
                className="text-sm font-heading font-bold text-foreground"
              >
                Lecture Title
              </Label>
              {lectureErrors.title && (
                <span className="text-xs text-red-600 font-heading font-bold">
                  {lectureErrors.title}
                </span>
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
              className={`bg-secondary-background ${
                lectureErrors.title ? "border-red-500" : ""
              }`}
            />
            <span className="text-[10px] font-mono text-foreground/60 text-right block mt-0.5">
              {lectureForm.title.length}/50
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-baseline">
              <Label
                htmlFor="lecture-description"
                className="text-sm font-heading font-bold text-foreground"
              >
                Lecture Description
              </Label>
              {lectureErrors.description && (
                <span className="text-xs text-red-600 font-heading font-bold">
                  {lectureErrors.description}
                </span>
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
              className={`bg-secondary-background ${
                lectureErrors.description ? "border-red-500" : ""
              }`}
            />
            <span className="text-[10px] font-mono text-foreground/60 text-right">
              {lectureForm.description.length}/100
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-baseline">
              <Label className="text-sm font-heading font-bold text-foreground">
                Lecture Video File
              </Label>
              {lectureErrors.video && (
                <span className="text-xs text-red-600 font-heading font-bold">
                  {lectureErrors.video}
                </span>
              )}
            </div>
            <div
              onClick={() => {
                if (!addingLecture && processingLectures.length === 0) {
                  document.getElementById("lecture-video-upload")?.click();
                }
              }}
              className={`w-full flex items-center h-11 rounded-base border-2 border-border bg-secondary-background transition-colors ${
                addingLecture || processingLectures.length > 0
                  ? "cursor-not-allowed opacity-60"
                  : "cursor-pointer hover:bg-secondary-background/80"
              }`}
            >
              <input
                id="lecture-video-upload"
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setSelectedVideo(file);
                    setLectureErrors((errs) => {
                      const copy = { ...errs };
                      delete copy.video;
                      return copy;
                    });
                  }
                  e.target.value = "";
                }}
              />
              <span className="text-xs font-heading font-black bg-main text-main-foreground px-3 py-1.5 rounded-base border-2 border-border ml-3 mr-4 shadow-[1px_1px_0px_0px_#000]">
                Choose File
              </span>
              <span className="text-xs font-base text-foreground/70 truncate">
                {selectedVideo ? selectedVideo.name : "No file chosen"}
              </span>
            </div>
            {addingLecture && uploadProgress > 0 && uploadProgress < 100 && (
              <div className="w-full bg-secondary-background rounded-base border-2 border-border h-3 mt-2 overflow-hidden">
                <div
                  className="bg-main h-full transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
            {selectedVideo && !addingLecture && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between bg-main border-2 border-border p-2.5 rounded-base mt-2 shadow-[2px_2px_0px_0px_#000]"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-base bg-background border-2 border-border flex items-center justify-center flex-shrink-0">
                    <Video className="w-4 h-4 text-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-main-foreground font-heading font-black uppercase tracking-wider">
                      Ready to upload
                    </p>
                    <p className="text-xs font-heading font-bold text-main-foreground truncate pr-2">
                      {selectedVideo.name}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="neutral"
                  size="sm"
                  className="h-8 w-8 p-0 text-red-600 hover:bg-red-500 hover:text-white rounded-base flex-shrink-0"
                  onClick={() => setSelectedVideo(null)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </motion.div>
            )}
          </div>

          {lectureGeneralError && (
            <p className="text-sm text-red-600 font-heading font-bold bg-red-100 border-2 border-red-500 rounded-base px-4 py-2.5 shadow-[2px_2px_0px_0px_#ef4444]">
              {lectureGeneralError}
            </p>
          )}

          <Button
            type="submit"
            disabled={addingLecture || processingLectures.length > 0}
            size="lg"
            variant="default"
            className="font-heading font-black shadow-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none mt-2 cursor-pointer"
          >
            {addingLecture ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" /> Adding Lecture...
              </>
            ) : processingLectures.length > 0 ? (
              <>
                <Plus className="w-5 h-5 mr-2" /> Video Processing... Please Wait
              </>
            ) : (
              <>
                <Plus className="w-5 h-5 mr-2" /> Add Lecture
              </>
            )}
          </Button>
          {addingLecture && (
            <p className="text-xs text-foreground font-heading font-bold animate-pulse mt-1">
              Uploading video... Please do not refresh or close the page.
            </p>
          )}
        </form>
      </div>
    </motion.div>
  );
}
