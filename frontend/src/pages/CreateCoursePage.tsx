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
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <Button
          onClick={() => navigate("/instructor/courses")}
          variant="neutral"
          size="sm"
          className="mb-6 font-heading font-bold cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Courses
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-background rounded-base border-4 border-border shadow-shadow p-6 sm:p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-base bg-main border-2 border-border flex items-center justify-center shadow-[2px_2px_0px_0px_#000]">
              <PlusCircle className="w-6 h-6 text-main-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-heading font-black text-foreground">Create New Course</h1>
              <p className="text-foreground/70 text-sm font-base">Draft your course information and upload a thumbnail.</p>
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
