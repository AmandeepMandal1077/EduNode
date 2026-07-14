import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CreateCourseFormProps {
  form: {
    title: string;
    subtitle: string;
    description: string;
    category: string;
    level: string;
    price: number | "";
  };
  loading: boolean;
  thumbnailPreview: string;
  uploadingThumbnail: boolean;
  errors: Record<string, string>;
  generalError: string;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handlePriceChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleThumbnailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent) => void;
}

export function CreateCourseForm({
  form,
  loading,
  thumbnailPreview,
  uploadingThumbnail,
  errors,
  generalError,
  handleChange,
  handlePriceChange,
  handleThumbnailChange,
  handleSubmit,
}: CreateCourseFormProps) {
  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">

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


      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between items-baseline">
          <Label className="text-sm font-medium text-slate-700">Thumbnail Image File</Label>
          {errors.thumbnail && (
            <span className="text-xs text-rose-600 font-medium">{errors.thumbnail}</span>
          )}
        </div>
        <div
          onClick={() => document.getElementById("thumbnail-upload")?.click()}
          className={`cursor-pointer w-full flex items-center h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors ${errors.thumbnail ? "border-rose-500 focus-visible:ring-rose-500/20" : ""}`}
        >
          <input
            id="thumbnail-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleThumbnailChange}
          />
          <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg ml-3 mr-4 hover:bg-indigo-100 transition-colors">
            {uploadingThumbnail ? "Uploading..." : "Choose File"}
          </span>
          <span className="text-xs text-slate-500 truncate">
            {thumbnailPreview ? "Thumbnail selected" : "No file chosen"}
          </span>
        </div>
        <p className="text-[10px] text-slate-400">Supported types: PNG, JPG, or JPEG. Max file size: 5MB.</p>
        
        {thumbnailPreview && (
          <div className="mt-2 relative w-full max-w-sm rounded-xl overflow-hidden border border-slate-200 aspect-video">
            <img src={thumbnailPreview} alt="Thumbnail Preview" className="w-full h-full object-cover" />
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
        disabled={loading || uploadingThumbnail}
        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold h-11 shadow-lg shadow-indigo-100 mt-2 cursor-pointer"
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
  );
}
