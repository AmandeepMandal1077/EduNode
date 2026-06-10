import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Loader2, PlusCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCourse } from "@/services/courseService";
import { openCloudinaryWidget } from "@/services/mediaService";

export function CreateCoursePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<{
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

  // Field validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) {
      setErrors((errs) => {
        const copy = { ...errs };
        delete copy[name];
        return copy;
      });
    }
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const cleaned = raw.replace(/^0+(?=\d)/, "");
    const val = cleaned === "" ? "" : parseInt(cleaned) || 0;
    setForm((f) => ({ ...f, price: val }));
    if (errors.price) {
      setErrors((errs) => {
        const copy = { ...errs };
        delete copy.price;
        return copy;
      });
    }
  };

  // Removed handleFileChange since uploading is handled by widget

  const validate = () => {
    const errs: Record<string, string> = {};

    if (!form.title.trim()) {
      errs.title = "Title is required.";
    } else if (form.title.length > 50) {
      errs.title = "Title can be at most 50 characters long.";
    }

    if (!form.subtitle.trim()) {
      errs.subtitle = "Subtitle is required.";
    } else if (form.subtitle.length > 100) {
      errs.subtitle = "Subtitle can be at most 100 characters long.";
    }

    if (!form.description.trim()) {
      errs.description = "Description is required.";
    } else if (form.description.length > 200) {
      errs.description = "Description can be at most 200 characters long.";
    }

    if (!form.category.trim()) {
      errs.category = "Category is required.";
    }

    if (form.price === "") {
      errs.price = "Price is required.";
    } else if (Number(form.price) < 0) {
      errs.price = "Price must be non-negative.";
    }

    if (!thumbnailUrl) {
      errs.thumbnail = "Thumbnail is required.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError("");

    if (!validate()) return;

    try {
      setLoading(true);
      await createCourse({
        title: form.title,
        subtitle: form.subtitle,
        description: form.description,
        category: form.category,
        level: form.level,
        price: Number(form.price),
        thumbnail: thumbnailUrl,
      });
      navigate("/instructor/courses");
    } catch (err: any) {
      console.error(err);
      setGeneralError(
        err?.response?.data?.message || err?.message || "Failed to create course. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <Button
          onClick={() => navigate("/instructor/courses")}
          variant="ghost"
          size="sm"
          className="mb-6 text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Courses
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
              <PlusCircle className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">Create New Course</h1>
              <p className="text-slate-500 text-sm">Draft your course metadata and upload a thumbnail.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {/* Title */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-baseline">
                <Label htmlFor="title" className="text-sm font-medium text-slate-700">Course Title</Label>
                {errors.title && (
                  <span className="text-xs text-rose-600 font-medium">{errors.title}</span>
                )}
              </div>
              <Input
                id="title"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="e.g. Master React 19 from Scratch"
                maxLength={50}
                className={`rounded-xl border-slate-200 ${errors.title ? "border-rose-500 focus-visible:ring-rose-500/20" : ""}`}
              />
              <span className="text-[10px] text-slate-400 text-right">{form.title.length}/50</span>
            </div>

            {/* Subtitle */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-baseline">
                <Label htmlFor="subtitle" className="text-sm font-medium text-slate-700">Subtitle / Headline</Label>
                {errors.subtitle && (
                  <span className="text-xs text-rose-600 font-medium">{errors.subtitle}</span>
                )}
              </div>
              <Input
                id="subtitle"
                name="subtitle"
                value={form.subtitle}
                onChange={handleChange}
                placeholder="e.g. Build modern web apps using custom hooks, Redux, and concurrent mode features"
                maxLength={100}
                className={`rounded-xl border-slate-200 ${errors.subtitle ? "border-rose-500 focus-visible:ring-rose-500/20" : ""}`}
              />
              <span className="text-[10px] text-slate-400 text-right">{form.subtitle.length}/100</span>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-baseline">
                <Label htmlFor="description" className="text-sm font-medium text-slate-700">Description</Label>
                {errors.description && (
                  <span className="text-xs text-rose-600 font-medium">{errors.description}</span>
                )}
              </div>
              <textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                maxLength={200}
                placeholder="Describe what your students will learn in this course..."
                className={`w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors ${errors.description ? "border-rose-500 focus:ring-rose-500/20" : ""}`}
              />
              <span className="text-[10px] text-slate-400 text-right">{form.description.length}/200</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Category */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-baseline">
                  <Label htmlFor="category" className="text-sm font-medium text-slate-700">Category</Label>
                  {errors.category && (
                    <span className="text-xs text-rose-600 font-medium">{errors.category}</span>
                  )}
                </div>
                <Input
                  id="category"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  placeholder="e.g. Web Development"
                  maxLength={50}
                  className={`rounded-xl border-slate-200 ${errors.category ? "border-rose-500 focus-visible:ring-rose-500/20" : ""}`}
                />
              </div>

              {/* Level */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="level" className="text-sm font-medium text-slate-700">Difficulty Level</Label>
                <select
                  id="level"
                  name="level"
                  value={form.level}
                  onChange={handleChange}
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
                  {errors.price && (
                    <span className="text-xs text-rose-600 font-medium">{errors.price}</span>
                  )}
                </div>
                <Input
                  id="price"
                  type="number"
                  name="price"
                  min={0}
                  value={form.price}
                  onChange={handlePriceChange}
                  className={`rounded-xl border-slate-200 ${errors.price ? "border-rose-500 focus-visible:ring-rose-500/20" : ""}`}
                />
              </div>
            </div>

            {/* Thumbnail */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-baseline">
                <Label className="text-sm font-medium text-slate-700">Thumbnail Image File</Label>
                {errors.thumbnail && (
                  <span className="text-xs text-rose-600 font-medium">{errors.thumbnail}</span>
                )}
              </div>
              <div
                onClick={async () => {
                  try {
                    setUploadingThumbnail(true);
                    const result = await openCloudinaryWidget("image");
                    setThumbnailUrl(result.secureUrl);
                    if (errors.thumbnail) {
                      setErrors((errs) => {
                        const copy = { ...errs };
                        delete copy.thumbnail;
                        return copy;
                      });
                    }
                  } catch (err: any) {
                    console.error(err);
                  } finally {
                    setUploadingThumbnail(false);
                  }
                }}
                className={`cursor-pointer w-full flex items-center h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors ${errors.thumbnail ? "border-rose-500 focus-visible:ring-rose-500/20" : ""}`}
              >
                <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg ml-3 mr-4 hover:bg-indigo-100 transition-colors">
                  Choose File
                </span>
                <span className="text-xs text-slate-500 truncate">
                  {thumbnailUrl ? "thumbnail_uploaded.jpg" : "No file chosen"}
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Supported types: PNG, JPG, or JPEG. Max file size: 5MB.</p>
              
              {thumbnailUrl && (
                <div className="mt-2 relative w-full max-w-sm rounded-xl overflow-hidden border border-slate-200 aspect-video">
                  <img src={thumbnailUrl} alt="Thumbnail Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            {generalError && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5 mt-2">
                {generalError}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold h-11 shadow-lg shadow-indigo-100 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Creating Course...
                </>
              ) : (
                "Create Course"
              )}
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
