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
      <div className="max-w-4xl mx-auto w-full aspect-video rounded-base overflow-hidden border-4 border-border bg-black shadow-shadow relative flex-shrink-0">
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
          <h1 className="text-2xl sm:text-3xl font-heading font-black text-foreground break-words">{currentLecture.title}</h1>
          <p className="text-xs font-mono font-bold text-foreground/70 mt-1">{currentLecture.duration}</p>
        </div>
        <Button
          onClick={(e) => handleToggleCompletion(e, currentLecture.id, currentLecture.durationSeconds)}
          variant={isCurrentlyCompleted ? "neutral" : "default"}
          size="lg"
          className="flex-shrink-0 h-11 px-6 font-heading font-black cursor-pointer shadow-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
        >
          {isCurrentlyCompleted ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Completed
            </>
          ) : (
            "Mark as Completed"
          )}
        </Button>
      </div>
    </>
  );
}
