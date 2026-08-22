import { Plus, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InstructorEmptyStateProps {
  navigate: (path: string) => void;
}

export function InstructorEmptyState({ navigate }: InstructorEmptyStateProps) {
  return (
    <div className="text-center py-20 bg-secondary-background border-2 border-border rounded-base shadow-shadow p-8 max-w-lg mx-auto">
      <div className="w-16 h-16 rounded-base bg-main border-2 border-border flex items-center justify-center mx-auto mb-4 shadow-[2px_2px_0px_0px_#000]">
        <BookOpen className="w-8 h-8 text-main-foreground" />
      </div>
      <h3 className="text-xl font-heading font-black text-foreground mb-2">No courses created yet</h3>
      <p className="text-foreground/70 text-sm font-base mb-6 max-w-sm mx-auto">
        Share your expertise with thousands of learners. Create your first course in just a few minutes.
      </p>
      <Button
        variant="default"
        size="lg"
        onClick={() => navigate("/instructor/courses/create")}
        className="font-heading font-black shadow-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none cursor-pointer"
      >
        <Plus className="w-5 h-5 mr-2" />
        Create Your First Course
      </Button>
    </div>
  );
}
