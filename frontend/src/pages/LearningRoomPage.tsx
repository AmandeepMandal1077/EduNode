import { useState } from "react";
import { FileText, MessageSquare, Loader2, BookOpen, X, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AIChatFAB } from "@/components/AIChatFAB";

import { useLearningRoom } from "@/hooks/useLearningRoom";
import { VideoSection } from "@/components/learning-room/VideoSection";
import { LectureListSidebar } from "@/components/learning-room/LectureListSidebar";
import { CommentsSection } from "@/components/learning-room/CommentsSection";
import { AnnouncementsTab } from "@/components/learning-room/AnnouncementsTab";
import { LearningRoomTopBar } from "@/components/learning-room/LearningRoomTopBar";

export function LearningRoomPage() {
  const {
    courseId,
    currentLecture,
    loading,
    activeTab,
    setActiveTab,
    currentUser,
    course,
    completedIds,
    announcements,
    announcementsLoading,
    handleProgress,
    handleToggleCompletion,
    prevLecture,
    nextLecture,
    navigateTo,
    navigate,
  } = useLearningRoom();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-foreground animate-spin" />
      </div>
    );
  }

  if (!course || !currentLecture || !courseId) {
    return (
      <div className="h-screen bg-background flex flex-col items-center justify-center gap-4 text-foreground p-4">
        <p className="font-heading font-black text-xl">Lecture not found.</p>
        <Button onClick={() => navigate("/my-courses")} variant="neutral" className="font-heading font-bold">
          Back to My Courses
        </Button>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background text-foreground flex flex-col overflow-hidden">
      <LearningRoomTopBar
        course={course}
        currentLecture={currentLecture}
        prevLecture={prevLecture}
        nextLecture={nextLecture}
        navigateTo={navigateTo}
        navigate={navigate}
        setSidebarOpen={setSidebarOpen}
      />

      <div className="max-w-screen-2xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0 overflow-hidden">
        <div className="lg:col-span-9 h-full overflow-y-auto pr-2 custom-scrollbar">
          <div className="flex flex-col gap-6 pb-12">
            <VideoSection
              currentLecture={currentLecture}
              courseId={courseId}
              completedIds={completedIds}
              handleProgress={handleProgress}
              handleToggleCompletion={handleToggleCompletion}
            />

            <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col flex-shrink-0">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col pb-12">
                <TabsList className="bg-secondary-background border-2 border-border rounded-base p-1 h-12 shadow-[2px_2px_0px_0px_#000] w-full justify-start shrink-0">
                  <TabsTrigger
                    value="overview"
                    className="font-heading font-bold px-4 text-xs sm:text-sm cursor-pointer"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger
                    value="qa"
                    className="font-heading font-bold px-4 text-xs sm:text-sm cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Q&A Discussion
                  </TabsTrigger>
                  <TabsTrigger
                    value="announcements"
                    className="font-heading font-bold px-4 text-xs sm:text-sm cursor-pointer"
                  >
                    <Bell className="w-4 h-4 mr-2" />
                    Announcements
                  </TabsTrigger>
                </TabsList>

                <div className="pt-6 flex-1">
                  {activeTab === "overview" && (
                    <div className="space-y-4 bg-background border-2 border-border rounded-base p-6 shadow-shadow">
                      <h2 className="text-xl font-heading font-black text-foreground">About This Lecture</h2>
                      <p className="text-foreground/80 font-base leading-relaxed whitespace-pre-wrap break-words text-sm">
                        {currentLecture.description || "No description provided for this lecture."}
                      </p>
                    </div>
                  )}
                  {activeTab === "qa" && (
                    <CommentsSection currentLecture={currentLecture} currentUser={currentUser} activeTab={activeTab} />
                  )}
                  {activeTab === "announcements" && (
                    <AnnouncementsTab announcements={announcements} announcementsLoading={announcementsLoading} />
                  )}
                </div>
              </Tabs>
            </div>
          </div>
        </div>

        <div className="hidden lg:flex lg:col-span-3 h-full bg-background border-4 border-border rounded-base flex-col shadow-shadow overflow-hidden min-h-0">
          <div className="p-4 border-b-2 border-border bg-secondary-background flex items-center justify-between shrink-0">
            <h2 className="font-heading font-black text-foreground flex items-center gap-2 text-sm">
              <BookOpen className="w-4 h-4 text-foreground" />
              Course Syllabus
            </h2>
          </div>
          <LectureListSidebar
            course={course}
            currentLecture={currentLecture}
            completedIds={completedIds}
            navigateTo={navigateTo}
            handleToggleCompletion={handleToggleCompletion}
          />
        </div>
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <div className="absolute top-0 right-0 h-full w-[85%] max-w-sm bg-background border-l-4 border-border shadow-shadow flex flex-col slide-in-from-right-full animate-in duration-200">
            <div className="p-4 border-b-2 border-border bg-secondary-background flex items-center justify-between shrink-0">
              <h2 className="font-heading font-black text-foreground flex items-center gap-2 text-sm">
                <BookOpen className="w-4 h-4 text-foreground" />
                Course Syllabus
              </h2>
              <Button variant="neutral" size="icon" onClick={() => setSidebarOpen(false)} className="rounded-base cursor-pointer h-8 w-8">
                <X className="w-4 h-4" />
              </Button>
            </div>
            <LectureListSidebar
              course={course}
              currentLecture={currentLecture}
              completedIds={completedIds}
              navigateTo={(lec) => { navigateTo(lec); setSidebarOpen(false); }}
              handleToggleCompletion={handleToggleCompletion}
            />
          </div>
        </div>
      )}
      <AIChatFAB courseId={courseId!} lectureId={currentLecture.id} />
    </div>
  );
}
