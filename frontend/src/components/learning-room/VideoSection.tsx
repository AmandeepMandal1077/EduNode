import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VideoPlayer } from "@/components/VideoPlayer";
import type { Lecture } from "@/types";

interface VideoSectionProps {
  currentLecture: Lecture;
  courseId: string;
  completedIds: Set<string>;
  handleProgress: (watched: number) => void;
  handleToggleCompletion: (e: React.MouseEvent, lecId: string, durationSecs: number) => void;
}

export function VideoSection({
  currentLecture,
  courseId,
  completedIds,
  handleProgress,
  handleToggleCompletion,
}: VideoSectionProps) {
  const isCurrentlyCompleted = completedIds.has(currentLecture.id);

  return (
    <>
      <div className="max-w-4xl mx-auto w-full aspect-video rounded-2xl overflow-hidden border border-slate-200 bg-black shadow-sm relative flex-shrink-0">
        <VideoPlayer
          key={currentLecture.id}
          src={currentLecture.videoUrl}
          title={currentLecture.title}
          courseId={courseId}
          lectureId={currentLecture.id}
          duration={currentLecture.durationSeconds}
          onProgress={handleProgress}
          className="h-full w-full"
        />

      </div>


      <div className="max-w-4xl mx-auto w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 pb-6 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 break-words">{currentLecture.title}</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">{currentLecture.duration}</p>
        </div>
        <Button
          onClick={(e) => handleToggleCompletion(e, currentLecture.id, currentLecture.durationSeconds)}
          variant={isCurrentlyCompleted ? "outline" : "default"}
          className={`flex-shrink-0 h-11 px-5 rounded-xl font-bold transition-all shadow-sm ${
            isCurrentlyCompleted
              ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:text-emerald-800"
              : "bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md"
          }`}
        >
          {isCurrentlyCompleted ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Completed
            </>
          ) : (
            "Mark as completed"
          )}
        </Button>
      </div>
    </>
  );
}
