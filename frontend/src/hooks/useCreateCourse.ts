import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createCourse } from "@/services/courseService";
import { requestAndUpload } from "@/services/mediaService";
import { getErrorMessage } from "@/utils/getErrorMessage";

export function useCreateCourse() {
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
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>("");
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);

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

    if (!thumbnailFile) {
      errs.thumbnail = "Thumbnail is required.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      setThumbnailPreview(URL.createObjectURL(file));
      if (errors.thumbnail) {
        setErrors((errs) => {
          const copy = { ...errs };
          delete copy.thumbnail;
          return copy;
        });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError("");

    if (!validate()) return;

    try {
      setLoading(true);
      setUploadingThumbnail(true);
      const course = await createCourse({
        title: form.title,
        subtitle: form.subtitle,
        description: form.description,
        category: form.category,
        level: form.level,
        price: Number(form.price),
        thumbnail: "https://via.placeholder.com/800x450?text=Uploading...",
      });
      
      if (thumbnailFile) {
        // We do not await waitForUploadReady so the user isn't blocked on the UI
        // The Lambda will confirm upload and update the course document
        await requestAndUpload("course-image", course.id, thumbnailFile);
      }
      
      navigate("/instructor/courses");
    } catch (err: unknown) {
      setGeneralError(getErrorMessage(err, "Failed to create course. Please try again."));
    } finally {
      setLoading(false);
      setUploadingThumbnail(false);
    }
  };

  return {
    form,
    loading,
    thumbnailFile,
    thumbnailPreview,
    uploadingThumbnail,
    errors,
    generalError,
    handleChange,
    handlePriceChange,
    handleThumbnailChange,
    handleSubmit,
    navigate,
  };
}
