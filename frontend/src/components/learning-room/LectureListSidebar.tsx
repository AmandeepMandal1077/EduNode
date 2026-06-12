import { Check, Play, Lock } from "lucide-react";
import type { Course, Lecture } from "@/types";
import ScrollArea from "@/components/shadix-ui/components/smooth-scroll-area/scroll-area";

interface LectureListSidebarProps {
  course: Course;
  currentLecture: Lecture;
  completedIds: Set<string>;
  navigateTo: (lec: Lecture) => void;
  handleToggleCompletion: (e: React.MouseEvent, lecId: string, durationSecs: number) => void;
}

export function LectureListSidebar({
  course,
  currentLecture,
  completedIds,
  navigateTo,
  handleToggleCompletion,
}: LectureListSidebarProps) {
  return (
    <ScrollArea className="flex-1">
      <div className="p-4 space-y-4">
        {course.modules.map((mod, mIdx) => (
          <div key={mod.id} className="mb-4">
            <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-3 px-2">
              Section {mIdx + 1}: {mod.title}
            </h3>
            <div className="flex flex-col gap-1.5">
              {mod.lectures.map((lec, lIdx) => {
                const isCurrent = currentLecture.id === lec.id;
                const isCompleted = completedIds.has(lec.id);
                const isLocked = !lec.isPreview && !course.isPublished; // Adjust locking logic as needed based on enrollments in real app

                return (
                  <button
                    key={lec.id}
                    onClick={() => navigateTo(lec)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-start gap-3 group relative cursor-pointer ${isCurrent
                        ? "bg-indigo-50 border border-indigo-100 shadow-sm"
                        : "hover:bg-slate-100 border border-transparent"
                      }`}
                  >
                    <div className="mt-0.5 flex-shrink-0 relative z-10">
                      <button
                        onClick={(e) => handleToggleCompletion(e, lec.id, lec.durationSeconds)}
                        className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors cursor-pointer ${isCompleted
                            ? "bg-emerald-500 border-emerald-500"
                            : "border-slate-300 hover:border-indigo-400 group-hover:bg-white"
                          }`}
                      >
                        {isCompleted && <Check className="w-3 h-3 text-white stroke-[3]" />}
                      </button>
                    </div>
                    <div className="flex-1 min-w-0 pr-2">
                      <p
                        className={`text-sm leading-snug break-words ${isCurrent
                            ? "font-bold text-indigo-900"
                            : "font-medium text-slate-700 group-hover:text-slate-900"
                          }`}
                      >
                        {mIdx + 1}.{lIdx + 1} {lec.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 opacity-70">
                        {isLocked ? (
                          <Lock className="w-3 h-3 text-slate-500" />
                        ) : (
                          <Play
                            className={`w-3 h-3 ${isCurrent ? "text-indigo-600 fill-indigo-600" : "text-slate-400 fill-slate-400"}`}
                          />
                        )}
                        <span className="text-[10px] font-semibold text-slate-500">{lec.duration}</span>
                      </div>
                    </div>
                    {isCurrent && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-500 rounded-r-full" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
