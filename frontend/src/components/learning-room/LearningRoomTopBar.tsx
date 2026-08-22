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
    <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b-4 border-border bg-secondary-background flex-shrink-0 z-10">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={() => navigate("/my-courses")}
          className="text-foreground bg-background border-2 border-border p-1.5 rounded-base shadow-[2px_2px_0px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer flex-shrink-0"
          aria-label="Back to my courses"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="min-w-0">
          <p className="text-xs font-heading font-bold text-foreground/70 truncate max-w-[200px] sm:max-w-xs">{course?.title}</p>
          <p className="text-sm font-heading font-black text-foreground truncate max-w-[220px] sm:max-w-sm">{currentLecture?.title}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <Button
          size="sm"
          variant="neutral"
          disabled={!prevLecture}
          onClick={() => prevLecture && navigateTo(prevLecture)}
          className="font-heading font-bold text-xs h-9 px-3 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Prev
        </Button>
        <Button
          size="sm"
          variant="neutral"
          disabled={!nextLecture}
          onClick={() => nextLecture && navigateTo(nextLecture)}
          className="font-heading font-bold text-xs h-9 px-3 cursor-pointer"
        >
          Next
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>

        <Button
          variant="neutral"
          size="icon"
          className="lg:hidden ml-1 h-9 w-9"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
