import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Loader2, Save, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateCourse } from "@/services/courseService";
import { openCloudinaryWidget } from "@/services/mediaService";
import { getErrorMessage } from "@/utils/getErrorMessage";
import type { Course } from "@/types";

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
      console.error(err);
      setDetailsGeneralError(getErrorMessage(err, "Failed to update course details."));
    } finally {
      setSavingDetails(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
      <h2 className="text-lg font-bold text-slate-900 mb-6">Course Information</h2>
      <form onSubmit={handleSaveDetails} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-baseline">
            <Label htmlFor="title" className="text-sm font-medium text-slate-700">Course Title</Label>
            {detailsErrors.title && <span className="text-xs text-rose-600 font-semibold">{detailsErrors.title}</span>}
          </div>
          <Input
            id="title"
            value={detailsForm.title}
            maxLength={50}
            onChange={(e) => {
              setDetailsForm((f) => ({ ...f, title: e.target.value }));
              setDetailsErrors((errs) => { const copy = { ...errs }; delete copy.title; return copy; });
            }}
            className={detailsErrors.title ? "border-rose-500 focus-visible:ring-rose-500/20" : "border-slate-200"}
          />
          <span className="text-[10px] text-slate-400 text-right block mt-0.5">{detailsForm.title.length}/50</span>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-baseline">
            <Label htmlFor="subtitle" className="text-sm font-medium text-slate-700">Subtitle</Label>
            {detailsErrors.subtitle && <span className="text-xs text-rose-600 font-semibold">{detailsErrors.subtitle}</span>}
          </div>
          <Input
            id="subtitle"
            value={detailsForm.subtitle}
            maxLength={100}
            onChange={(e) => {
              setDetailsForm((f) => ({ ...f, subtitle: e.target.value }));
              setDetailsErrors((errs) => { const copy = { ...errs }; delete copy.subtitle; return copy; });
            }}
            className={detailsErrors.subtitle ? "border-rose-500 focus-visible:ring-rose-500/20" : "border-slate-200"}
          />
          <span className="text-[10px] text-slate-400 text-right block mt-0.5">{detailsForm.subtitle.length}/100</span>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-baseline">
            <Label htmlFor="description" className="text-sm font-medium text-slate-700">Description</Label>
            {detailsErrors.description && <span className="text-xs text-rose-600 font-semibold">{detailsErrors.description}</span>}
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
            className={`w-full rounded-xl border px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors ${
              detailsErrors.description ? "border-rose-500 focus:ring-rose-500/20" : "border-slate-200"
            }`}
          />
          <span className="text-[10px] text-slate-400 text-right block mt-0.5">{detailsForm.description.length}/200</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-baseline">
              <Label htmlFor="category" className="text-sm font-medium text-slate-700">Category</Label>
              {detailsErrors.category && <span className="text-xs text-rose-600 font-semibold">{detailsErrors.category}</span>}
            </div>
            <Input
              id="category"
              value={detailsForm.category}
              maxLength={50}
              onChange={(e) => {
                setDetailsForm((f) => ({ ...f, category: e.target.value }));
                setDetailsErrors((errs) => { const copy = { ...errs }; delete copy.category; return copy; });
              }}
              className={detailsErrors.category ? "border-rose-500 focus-visible:ring-rose-500/20" : "border-slate-200"}
            />
          </div>

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

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-baseline">
              <Label htmlFor="price" className="text-sm font-medium text-slate-700">Price (INR)</Label>
              {detailsErrors.price && <span className="text-xs text-rose-600 font-semibold">{detailsErrors.price}</span>}
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
              className={detailsErrors.price ? "border-rose-500 focus-visible:ring-rose-500/20" : "border-slate-200"}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-sm font-medium text-slate-700">Change Thumbnail File</Label>
          <div
            onClick={async () => {
              try {
                setUploadingThumbnail(true);
                const result = await openCloudinaryWidget("image");
                setThumbnailUrl(result.secureUrl);
              } catch (err: unknown) {
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
            <span className="text-xs text-slate-500 truncate">{thumbnailUrl ? "thumbnail_uploaded.jpg" : "No file chosen"}</span>
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
            <Button type="submit" disabled={savingDetails} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold">
              {savingDetails ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Saving Changes...</> : <><Save className="w-4 h-4 mr-2" /> Save Changes</>}
            </Button>
            <AnimatePresence>
              {savedDetails && (
                <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5 text-emerald-600 text-sm font-medium">
                  <Check className="w-4 h-4" /> Saved!
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </form>
    </motion.div>
  );
}
