import { AnimatePresence } from "motion/react";
import { ArrowLeft, Settings, FileText, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

import { useInstructorCourseManage } from "@/hooks/useInstructorCourseManage";
import { CourseDetailsTab } from "@/components/instructor/CourseDetailsTab";
import { CourseCurriculumTab } from "@/components/instructor/CourseCurriculumTab";
import { CourseAnnouncementsTab } from "@/components/instructor/CourseAnnouncementsTab";

export function InstructorCourseManagePage() {
  const {
    courseId,
    navigate,
    activeTab,
    setActiveTab,
    course,
    setCourse,
    loading,
    loadCourseData,
    togglePublishStatus,
  } = useInstructorCourseManage();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-3 h-3 bg-main border-2 border-border rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (!course || !courseId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center bg-secondary-background border-2 border-border rounded-base p-8 shadow-shadow max-w-sm">
          <p className="text-foreground font-heading font-black mb-4">Course not found.</p>
          <Button onClick={() => navigate("/instructor/courses")} variant="neutral" className="font-heading font-bold">
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <Button
          onClick={() => navigate("/instructor/courses")}
          variant="neutral"
          size="sm"
          className="mb-6 font-heading font-bold cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 bg-secondary-background border-4 border-border rounded-base p-6 shadow-shadow">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-heading font-black text-main-foreground uppercase tracking-wider bg-main px-2.5 py-1 rounded-base border border-border">
                {course.category}
              </span>
              <span className={`text-[10px] font-heading font-black uppercase tracking-wider px-2.5 py-1 rounded-base border border-border ${
                course.isPublished ? "bg-[#10b981] text-black" : "bg-[#ff9900] text-black"
              }`}>
                {course.isPublished ? "Published" : "Draft"}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-heading font-black text-foreground mt-2">{course.title}</h1>
            <p className="text-foreground/70 text-sm font-base mt-1">{course.subtitle}</p>
          </div>
          <Button
            onClick={togglePublishStatus}
            variant={course.isPublished ? "neutral" : "default"}
            size="lg"
            className="font-heading font-black cursor-pointer shadow-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
          >
            {course.isPublished ? "Unpublish Course" : "Publish Course"}
          </Button>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          <nav className="md:w-56 flex-shrink-0 flex md:flex-col gap-2 flex-wrap">
            {[
              { id: "details", label: "Course Details", icon: Settings },
              { id: "lectures", label: "Manage Lectures", icon: FileText },
              { id: "announcements", label: "Announcements", icon: Bell },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2.5 px-3.5 py-3 rounded-base text-sm font-heading font-black transition-all w-full text-left cursor-pointer border-2 ${
                  activeTab === t.id
                    ? "bg-main text-main-foreground border-border shadow-[2px_2px_0px_0px_#000]"
                    : "bg-background text-foreground border-border/30 hover:border-border hover:bg-secondary-background shadow-none"
                }`}
              >
                <t.icon className="w-4 h-4" />
                {t.label}
              </button>
            ))}
          </nav>

          <div className="flex-1 bg-background border-4 border-border shadow-shadow rounded-base p-6 sm:p-8">
            <AnimatePresence mode="wait">
              {activeTab === "details" && <CourseDetailsTab key="details" courseId={courseId} course={course} setCourse={setCourse} />}
              {activeTab === "lectures" && <CourseCurriculumTab key="lectures" courseId={courseId} course={course} loadCourseData={loadCourseData} />}
              {activeTab === "announcements" && <CourseAnnouncementsTab key="announcements" courseId={courseId} />}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
