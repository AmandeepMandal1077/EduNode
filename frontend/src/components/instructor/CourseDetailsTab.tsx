import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Loader2, Save, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateCourse } from "@/services/courseService";
import { requestAndUpload, waitForUploadReady } from "@/services/mediaService";
import { getErrorMessage } from "@/utils/getErrorMessage";
import type { Course } from "@/types";
import debug from "@/utils/debug";

interface CourseDetailsTabProps {
  courseId: string;
  course: Course;
  setCourse: (course: Course) => void;
}

export function CourseDetailsTab({ courseId, course, setCourse }: CourseDetailsTabProps) {
  const [detailsForm, setDetailsForm] = useState({
    title: course.title,
    subtitle: course.subtitle,
    description: course.description,
    category: course.category,
    level: course.level === "Advanced" ? "advance" : course.level.toLowerCase(),
    price: course.price as number | "",
  });
  const [thumbnailUrl, setThumbnailUrl] = useState<string>(course.thumbnail || "");
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [savingDetails, setSavingDetails] = useState(false);
  const [savedDetails, setSavedDetails] = useState(false);
  const [detailsErrors, setDetailsErrors] = useState<Record<string, string>>({});
  const [detailsGeneralError, setDetailsGeneralError] = useState("");

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
      const updated = await updateCourse(courseId, {
        title: detailsForm.title,
        subtitle: detailsForm.subtitle,
        description: detailsForm.description,
        category: detailsForm.category,
        level: detailsForm.level,
        price: Number(detailsForm.price),
        thumbnail: thumbnailUrl || undefined,
      });
      setCourse(updated);
      setSavedDetails(true);
      setTimeout(() => setSavedDetails(false), 2500);
    } catch (err: unknown) {
      debug(err);
      setDetailsGeneralError(getErrorMessage(err, "Failed to update course details."));
    } finally {
      setSavingDetails(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
      <h2 className="text-xl font-heading font-black text-foreground mb-6">Course Information</h2>
      <form onSubmit={handleSaveDetails} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-baseline">
            <Label htmlFor="title" className="text-sm font-heading font-bold text-foreground">Course Title</Label>
            {detailsErrors.title && <span className="text-xs text-red-600 font-heading font-bold">{detailsErrors.title}</span>}
          </div>
          <Input
            id="title"
            value={detailsForm.title}
            maxLength={50}
            onChange={(e) => {
              setDetailsForm((f) => ({ ...f, title: e.target.value }));
              setDetailsErrors((errs) => { const copy = { ...errs }; delete copy.title; return copy; });
            }}
            className={`bg-secondary-background ${detailsErrors.title ? "border-red-500" : ""}`}
          />
          <span className="text-[10px] font-mono text-foreground/60 text-right block mt-0.5">{detailsForm.title.length}/50</span>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-baseline">
            <Label htmlFor="subtitle" className="text-sm font-heading font-bold text-foreground">Subtitle</Label>
            {detailsErrors.subtitle && <span className="text-xs text-red-600 font-heading font-bold">{detailsErrors.subtitle}</span>}
          </div>
          <Input
            id="subtitle"
            value={detailsForm.subtitle}
            maxLength={100}
            onChange={(e) => {
              setDetailsForm((f) => ({ ...f, subtitle: e.target.value }));
              setDetailsErrors((errs) => { const copy = { ...errs }; delete copy.subtitle; return copy; });
            }}
            className={`bg-secondary-background ${detailsErrors.subtitle ? "border-red-500" : ""}`}
          />
          <span className="text-[10px] font-mono text-foreground/60 text-right block mt-0.5">{detailsForm.subtitle.length}/100</span>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-baseline">
            <Label htmlFor="description" className="text-sm font-heading font-bold text-foreground">Description</Label>
            {detailsErrors.description && <span className="text-xs text-red-600 font-heading font-bold">{detailsErrors.description}</span>}
          </div>
          <textarea
            id="description"
            value={detailsForm.description}
            maxLength={200}
            onChange={(e) => {
              setDetailsForm((f) => ({ ...f, description: e.target.value }));
              setDetailsErrors((errs) => { const copy = { ...errs }; delete copy.description; return copy; });
            }}
            rows={4}
            className={`w-full rounded-base border-2 border-border px-3 py-2.5 text-sm font-base bg-secondary-background resize-none focus:outline-hidden focus:ring-2 focus:ring-black transition-all ${
              detailsErrors.description ? "border-red-500" : ""
            }`}
          />
          <span className="text-[10px] font-mono text-foreground/60 text-right block mt-0.5">{detailsForm.description.length}/200</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-baseline">
              <Label htmlFor="category" className="text-sm font-heading font-bold text-foreground">Category</Label>
              {detailsErrors.category && <span className="text-xs text-red-600 font-heading font-bold">{detailsErrors.category}</span>}
            </div>
            <Input
              id="category"
              value={detailsForm.category}
              maxLength={50}
              onChange={(e) => {
                setDetailsForm((f) => ({ ...f, category: e.target.value }));
                setDetailsErrors((errs) => { const copy = { ...errs }; delete copy.category; return copy; });
              }}
              className={`bg-secondary-background ${detailsErrors.category ? "border-red-500" : ""}`}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="level" className="text-sm font-heading font-bold text-foreground">Level</Label>
            <select
              id="level"
              value={detailsForm.level}
              onChange={(e) => setDetailsForm((f) => ({ ...f, level: e.target.value }))}
              className="w-full h-10 rounded-base border-2 border-border px-3 py-2 text-sm font-base bg-secondary-background focus:outline-hidden focus:ring-2 focus:ring-black"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advance">Advanced</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-baseline">
              <Label htmlFor="price" className="text-sm font-heading font-bold text-foreground">Price (INR)</Label>
              {detailsErrors.price && <span className="text-xs text-red-600 font-heading font-bold">{detailsErrors.price}</span>}
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
                setDetailsErrors((errs) => { const copy = { ...errs }; delete copy.price; return copy; });
              }}
              className={`bg-secondary-background ${detailsErrors.price ? "border-red-500" : ""}`}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-sm font-heading font-bold text-foreground">Change Thumbnail File</Label>
          <div
            onClick={() => {
              if (!uploadingThumbnail) {
                document.getElementById("thumbnail-upload")?.click();
              }
            }}
            className="cursor-pointer w-full flex items-center h-11 rounded-base border-2 border-border bg-secondary-background hover:bg-secondary-background/80 transition-colors"
          >
            <input
              id="thumbnail-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  setUploadingThumbnail(true);
                  const { uploadSessionId } = await requestAndUpload(
                    "course-image",
                    courseId,
                    file
                  );
                  const statusObj = await waitForUploadReady(uploadSessionId);
                  if (statusObj.status === "READY" || statusObj.status === "UPLOADED") {
                    setThumbnailUrl(statusObj.finalUrl || "");
                  } else {
                    setDetailsGeneralError(`Upload failed with status: ${statusObj.status}`);
                  }
                } catch (err: unknown) {
                  debug(err);
                  setDetailsGeneralError(getErrorMessage(err));
                } finally {
                  setUploadingThumbnail(false);
                  e.target.value = "";
                }
              }}
            />
            <span className="text-xs font-heading font-black bg-main text-main-foreground px-3 py-1.5 rounded-base border-2 border-border ml-3 mr-4 shadow-[1px_1px_0px_0px_#000]">
              {uploadingThumbnail ? "Uploading..." : "Choose File"}
            </span>
            <span className="text-xs font-base text-foreground/70 truncate">{thumbnailUrl ? "Thumbnail uploaded" : "No file chosen"}</span>
          </div>
          {thumbnailUrl && (
            <div className="mt-2 relative w-full max-w-sm rounded-base overflow-hidden border-2 border-border aspect-video shadow-shadow">
              <img src={thumbnailUrl} alt="Thumbnail Preview" className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        {detailsGeneralError && (
          <p className="text-sm text-red-600 font-heading font-bold bg-red-100 border-2 border-red-500 rounded-base px-4 py-2.5 shadow-[2px_2px_0px_0px_#ef4444]">
            {detailsGeneralError}
          </p>
        )}

        <div className="flex flex-col gap-2 mt-2">
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={savingDetails} variant="default" size="lg" className="font-heading font-black shadow-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none cursor-pointer">
              {savingDetails ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Saving Changes...</> : <><Save className="w-4 h-4 mr-2" /> Save Changes</>}
            </Button>
            <AnimatePresence>
              {savedDetails && (
                <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5 bg-main text-main-foreground border-2 border-border px-3 py-1.5 rounded-base text-sm font-heading font-bold shadow-[2px_2px_0px_0px_#000]">
                  <Check className="w-4 h-4" /> Changes Saved!
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </form>
    </motion.div>
  );
}
