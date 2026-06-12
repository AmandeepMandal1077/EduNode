import { useState } from "react";
import { FileText, MessageSquare, Loader2, BookOpen, X, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AIChatFAB } from "@/components/AIChatFAB";
import { ScrollArea } from "@/components/smooth-scroll-area";

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
      <div className="h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!course || !currentLecture || !courseId) {
    return (
      <div className="h-screen bg-slate-50 flex flex-col items-center justify-center gap-4 text-slate-800">
        <p className="font-semibold text-slate-650">Lecture not found.</p>
        <Button onClick={() => navigate("/my-courses")} variant="outline" className="rounded-xl border-slate-200">
          Back to My Courses
        </Button>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-50 flex flex-col overflow-hidden">
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
        <ScrollArea className="lg:col-span-9 h-full">
          <div className="flex flex-col gap-6 pr-1 pb-8">
            <VideoSection
              currentLecture={currentLecture}
              courseId={courseId}
              completedIds={completedIds}
              handleProgress={handleProgress}
              handleToggleCompletion={handleToggleCompletion}
            />

            <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col flex-shrink-0">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col pb-12">
                <TabsList className="bg-transparent border-y border-slate-200 rounded-none w-full justify-start h-auto p-0 flex-wrap gap-4 shrink-0">
                  <TabsTrigger
                    value="overview"
                    className="data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 rounded-none bg-transparent shadow-none font-semibold text-slate-500 h-full py-3 px-4 transition-colors -my-[1px]"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger
                    value="qa"
                    className="data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 rounded-none bg-transparent shadow-none font-semibold text-slate-500 h-full py-3 px-4 transition-colors -my-[1px]"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Q&A
                  </TabsTrigger>
                  <TabsTrigger
                    value="announcements"
                    className="data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 rounded-none bg-transparent shadow-none font-semibold text-slate-500 h-full py-3 px-4 transition-colors -my-[1px]"
                  >
                    <Bell className="w-4 h-4 mr-2" />
                    Announcements
                  </TabsTrigger>
                </TabsList>

                <div className="pt-6 flex-1 h-full min-h-[300px]">
                  {activeTab === "overview" && (
                    <div className="space-y-6">
                      <h2 className="text-xl font-bold text-slate-800">About this lecture</h2>
                      <p className="text-slate-600 leading-relaxed whitespace-pre-wrap break-words text-sm">
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
        </ScrollArea>

        <div className="hidden lg:flex lg:col-span-3 h-full bg-white border border-slate-200 rounded-2xl flex-col shadow-sm overflow-hidden min-h-0">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0">
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-500" />
              Course Content
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
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="absolute top-0 right-0 h-full w-[85%] max-w-sm bg-white shadow-2xl flex flex-col slide-in-from-right-full animate-in duration-300">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h2 className="font-bold text-slate-800 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-500" />
                Course Content
              </h2>
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)} className="rounded-xl cursor-pointer">
                <X className="w-5 h-5" />
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
      <AIChatFAB courseId={courseId!} />
    </div>
  );
}
