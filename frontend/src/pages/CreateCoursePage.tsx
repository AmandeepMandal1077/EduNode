import { motion } from "motion/react";
import { PlusCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCreateCourse } from "@/hooks/useCreateCourse";
import { CreateCourseForm } from "@/components/instructor/CreateCourseForm";

export function CreateCoursePage() {
  const {
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
    navigate,
  } = useCreateCourse();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <Button
          onClick={() => navigate("/instructor/courses")}
          variant="ghost"
          size="sm"
          className="mb-6 text-slate-600 hover:text-slate-900 cursor-pointer"
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

          <CreateCourseForm
            form={form}
            loading={loading}
            thumbnailPreview={thumbnailPreview}
            uploadingThumbnail={uploadingThumbnail}
            errors={errors}
            generalError={generalError}
            handleChange={handleChange}
            handlePriceChange={handlePriceChange}
            handleThumbnailChange={handleThumbnailChange}
            handleSubmit={handleSubmit}
          />
        </motion.div>
      </div>
    </div>
  );
}
