import { Plus, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InstructorEmptyStateProps {
  navigate: (path: string) => void;
}

export function InstructorEmptyState({ navigate }: InstructorEmptyStateProps) {
  return (
    <div className="text-center py-20 bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
      <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
        <BookOpen className="w-8 h-8 text-indigo-600" />
      </div>
      <h3 className="text-lg font-bold text-slate-800 mb-2">No courses created yet</h3>
      <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">
        Share your knowledge with the world. Create your first online course in just a few clicks.
      </p>
      <Button
        onClick={() => navigate("/instructor/courses/create")}
        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold cursor-pointer"
      >
        <Plus className="w-4 h-4 mr-2" />
        Create Your First Course
      </Button>
    </div>
  );
}
