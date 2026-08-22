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
          <Label htmlFor="title" className="text-sm font-heading font-bold text-foreground">Course Title</Label>
          {errors.title && (
            <span className="text-xs text-red-600 font-heading font-bold">{errors.title}</span>
          )}
        </div>
        <Input
          id="title"
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="e.g. Master React 19 from Scratch"
          maxLength={50}
          className={`bg-secondary-background ${errors.title ? "border-red-500" : ""}`}
        />
        <span className="text-[10px] font-mono text-foreground/60 text-right">{form.title.length}/50</span>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between items-baseline">
          <Label htmlFor="subtitle" className="text-sm font-heading font-bold text-foreground">Subtitle / Headline</Label>
          {errors.subtitle && (
            <span className="text-xs text-red-600 font-heading font-bold">{errors.subtitle}</span>
          )}
        </div>
        <Input
          id="subtitle"
          name="subtitle"
          value={form.subtitle}
          onChange={handleChange}
          placeholder="e.g. Build modern web apps using custom hooks, Redux, and concurrent features"
          maxLength={100}
          className={`bg-secondary-background ${errors.subtitle ? "border-red-500" : ""}`}
        />
        <span className="text-[10px] font-mono text-foreground/60 text-right">{form.subtitle.length}/100</span>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between items-baseline">
          <Label htmlFor="description" className="text-sm font-heading font-bold text-foreground">Description</Label>
          {errors.description && (
            <span className="text-xs text-red-600 font-heading font-bold">{errors.description}</span>
          )}
        </div>
        <textarea
          id="description"
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={4}
          maxLength={200}
          placeholder="Describe what your students will master in this course..."
          className={`w-full rounded-base border-2 border-border px-3 py-2.5 text-sm font-base bg-secondary-background resize-none focus:outline-hidden focus:ring-2 focus:ring-black transition-all ${errors.description ? "border-red-500" : ""}`}
        />
        <span className="text-[10px] font-mono text-foreground/60 text-right">{form.description.length}/200</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-baseline">
            <Label htmlFor="category" className="text-sm font-heading font-bold text-foreground">Category</Label>
            {errors.category && (
              <span className="text-xs text-red-600 font-heading font-bold">{errors.category}</span>
            )}
          </div>
          <Input
            id="category"
            name="category"
            value={form.category}
            onChange={handleChange}
            placeholder="e.g. Web Development"
            maxLength={50}
            className={`bg-secondary-background ${errors.category ? "border-red-500" : ""}`}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="level" className="text-sm font-heading font-bold text-foreground">Difficulty Level</Label>
          <select
            id="level"
            name="level"
            value={form.level}
            onChange={handleChange}
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
            {errors.price && (
              <span className="text-xs text-red-600 font-heading font-bold">{errors.price}</span>
            )}
          </div>
          <Input
            id="price"
            type="number"
            name="price"
            min={0}
            value={form.price}
            onChange={handlePriceChange}
            className={`bg-secondary-background ${errors.price ? "border-red-500" : ""}`}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between items-baseline">
          <Label className="text-sm font-heading font-bold text-foreground">Thumbnail Image File</Label>
          {errors.thumbnail && (
            <span className="text-xs text-red-600 font-heading font-bold">{errors.thumbnail}</span>
          )}
        </div>
        <div
          onClick={() => document.getElementById("thumbnail-upload")?.click()}
          className={`cursor-pointer w-full flex items-center h-11 rounded-base border-2 border-border bg-secondary-background hover:bg-secondary-background/80 transition-colors ${errors.thumbnail ? "border-red-500" : ""}`}
        >
          <input
            id="thumbnail-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleThumbnailChange}
          />
          <span className="text-xs font-heading font-black bg-main text-main-foreground px-3 py-1.5 rounded-base border-2 border-border ml-3 mr-4 shadow-[1px_1px_0px_0px_#000]">
            {uploadingThumbnail ? "Uploading..." : "Choose File"}
          </span>
          <span className="text-xs font-base text-foreground/70 truncate">
            {thumbnailPreview ? "Thumbnail selected" : "No file chosen"}
          </span>
        </div>
        <p className="text-[10px] text-foreground/60">Supported formats: PNG, JPG, or JPEG. Max file size: 5MB.</p>
        
        {thumbnailPreview && (
          <div className="mt-2 relative w-full max-w-sm rounded-base overflow-hidden border-2 border-border aspect-video shadow-shadow">
            <img src={thumbnailPreview} alt="Thumbnail Preview" className="w-full h-full object-cover" />
          </div>
        )}
      </div>

      {generalError && (
        <div className="text-sm font-heading font-bold text-red-600 bg-red-100 border-2 border-red-500 rounded-base px-4 py-2.5 mt-2 shadow-[2px_2px_0px_0px_#ef4444]">
          {generalError}
        </div>
      )}

      <Button
        type="submit"
        disabled={loading || uploadingThumbnail}
        size="lg"
        variant="default"
        className="font-heading font-black h-12 text-base shadow-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none mt-2 cursor-pointer"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Creating Course...
          </>
        ) : (
          "Create Course"
        )}
      </Button>
    </form>
  );
}
