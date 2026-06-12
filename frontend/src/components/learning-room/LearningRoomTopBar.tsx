import { ChevronLeft, ChevronRight, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Course, Lecture } from "@/types";

interface LearningRoomTopBarProps {
  course: Course;
  currentLecture: Lecture;
  prevLecture: Lecture | null;
  nextLecture: Lecture | null;
  navigateTo: (lec: Lecture) => void;
  navigate: (path: string) => void;
  setSidebarOpen: (val: boolean) => void;
}

export function LearningRoomTopBar({
  course,
  currentLecture,
  prevLecture,
  nextLecture,
  navigateTo,
  navigate,
  setSidebarOpen,
}: LearningRoomTopBarProps) {
  return (
    <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 bg-white flex-shrink-0 z-10">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/my-courses")}
          className="text-slate-500 hover:text-slate-800 transition-colors p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
          aria-label="Back to my courses"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="hidden sm:block">
          <p className="text-xs text-slate-400 truncate max-w-xs">{course.title}</p>
          <p className="text-sm font-bold text-slate-800 truncate max-w-sm">{currentLecture.title}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="ghost"
          disabled={!prevLecture}
          onClick={() => prevLecture && navigateTo(prevLecture)}
          className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 text-xs h-8 px-3 rounded-lg cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Prev
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={!nextLecture}
          onClick={() => nextLecture && navigateTo(nextLecture)}
          className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 text-xs h-8 px-3 rounded-lg cursor-pointer"
        >
          Next
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="lg:hidden ml-2 rounded-xl"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
