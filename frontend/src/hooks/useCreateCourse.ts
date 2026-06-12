import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createCourse } from "@/services/courseService";
import { openCloudinaryWidget } from "@/services/mediaService";
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
  const [thumbnailUrl, setThumbnailUrl] = useState<string>("");
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

    if (!thumbnailUrl) {
      errs.thumbnail = "Thumbnail is required.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleThumbnailUpload = async () => {
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
    } catch (err: unknown) {
      setGeneralError(getErrorMessage(err, "Failed to upload image"));
    } finally {
      setUploadingThumbnail(false);
    }
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
    } catch (err: unknown) {
      setGeneralError(getErrorMessage(err, "Failed to create course. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return {
    form,
    loading,
    thumbnailUrl,
    uploadingThumbnail,
    errors,
    generalError,
    handleChange,
    handlePriceChange,
    handleThumbnailUpload,
    handleSubmit,
    navigate,
  };
}
