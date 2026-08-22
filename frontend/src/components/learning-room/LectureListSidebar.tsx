import { Check, Play, Lock } from "lucide-react";
import type { Course, Lecture } from "@/types";

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
  const modules = course.modules || [];

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar">
      {modules.length === 0 ? (
        <div className="py-8 text-center text-xs text-foreground/60 font-heading font-bold">
          No lectures available yet.
        </div>
      ) : (
        modules.map((mod, mIdx) => (
          <div key={mod.id || mIdx} className="mb-4">
            <h3 className="text-xs font-heading font-black text-foreground uppercase tracking-wider mb-2 px-1">
              Section {mIdx + 1}: {mod.title}
            </h3>
            <div className="flex flex-col gap-1.5">
              {(mod.lectures || []).map((lec, lIdx) => {
                const isCurrent = currentLecture?.id === lec.id;
                const isCompleted = completedIds.has(lec.id);
                const isLocked = !lec.isPreview && !course.isPublished;

                return (
                  <button
                    key={lec.id}
                    onClick={() => navigateTo(lec)}
                    className={`w-full text-left px-3 py-2.5 rounded-base transition-all flex items-start gap-2.5 group relative cursor-pointer border-2 ${
                      isCurrent
                        ? "bg-main text-main-foreground border-border shadow-[2px_2px_0px_0px_#000]"
                        : "bg-background text-foreground hover:bg-secondary-background border-border/30 hover:border-border"
                    }`}
                  >
                    <div className="mt-0.5 flex-shrink-0 relative z-10">
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleCompletion(e, lec.id, lec.durationSeconds);
                        }}
                        className={`w-5 h-5 rounded-base border-2 border-border flex items-center justify-center transition-colors cursor-pointer ${
                          isCompleted
                            ? "bg-black text-white"
                            : isCurrent
                            ? "bg-background text-foreground"
                            : "bg-background hover:bg-main"
                        }`}
                      >
                        {isCompleted && <Check className="w-3 h-3 text-white stroke-[3]" />}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 pr-1">
                      <p
                        className={`text-xs leading-snug break-words ${
                          isCurrent
                            ? "font-heading font-black text-main-foreground"
                            : "font-base text-foreground font-medium"
                        }`}
                      >
                        {mIdx + 1}.{lIdx + 1} {lec.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1 opacity-80">
                        {isLocked ? (
                          <Lock className="w-3 h-3 text-foreground" />
                        ) : (
                          <Play
                            className={`w-3 h-3 ${isCurrent ? "text-main-foreground fill-current" : "text-foreground fill-current"}`}
                          />
                        )}
                        <span className="text-[10px] font-mono font-bold">{lec.duration}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
