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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (!course || !courseId) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <p className="text-slate-600 font-medium mb-4">Course not found.</p>
          <Button onClick={() => navigate("/instructor/courses")} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl">
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <Button
          onClick={() => navigate("/instructor/courses")}
          variant="ghost"
          size="sm"
          className="mb-6 text-slate-600 hover:text-slate-900 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2.5 py-1 rounded-full">
                {course.category}
              </span>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                course.isPublished ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
              }`}>
                {course.isPublished ? "Published" : "Draft"}
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 mt-2">{course.title}</h1>
            <p className="text-slate-500 text-sm mt-1">{course.subtitle}</p>
          </div>
          <Button
            onClick={togglePublishStatus}
            className={`rounded-xl font-semibold px-4 py-2 text-sm shadow-sm transition-all cursor-pointer ${
              course.isPublished
                ? "bg-slate-200 hover:bg-slate-300 text-slate-700"
                : "bg-indigo-600 hover:bg-indigo-700 text-white"
            }`}
          >
            {course.isPublished ? "Unpublish Course" : "Publish Course"}
          </Button>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          <nav className="md:w-56 flex-shrink-0 flex md:flex-col gap-1 flex-wrap">
            {[
              { id: "details", label: "Course Details", icon: Settings },
              { id: "lectures", label: "Manage Lectures", icon: FileText },
              { id: "announcements", label: "Announcements", icon: Bell },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2.5 px-3.5 py-3 rounded-xl text-sm font-semibold transition-colors w-full text-left cursor-pointer ${
                  activeTab === t.id
                    ? "bg-indigo-50 text-indigo-700 shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <t.icon className="w-4 h-4" />
                {t.label}
              </button>
            ))}
          </nav>

          <div className="flex-1 bg-white border border-slate-200 shadow-sm rounded-2xl p-6 sm:p-8">
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
