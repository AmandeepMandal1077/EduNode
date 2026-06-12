import { XCircle, ArrowLeft, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CancelContentProps {
  handleBrowseCourses: () => void;
  handleGoBack: () => void;
}

export function CancelContent({
  handleBrowseCourses,
  handleGoBack,
}: CancelContentProps) {
  return (
    <>
      <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center border border-rose-100 mb-6 mx-auto">
        <XCircle className="w-8 h-8 text-rose-500" />
      </div>

      <h2 className="text-2xl font-extrabold text-slate-900 leading-tight mb-2">
        Payment Cancelled
      </h2>
      
      <p className="text-slate-500 text-sm max-w-xs leading-relaxed mb-8 mx-auto">
        Your transaction was not completed, and your card was not charged. You can resume your checkout at any time.
      </p>

      <div className="flex flex-col gap-3 w-full">
        <Button
          onClick={handleBrowseCourses}
          className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer"
        >
          <ShoppingBag className="w-4 h-4" />
          Browse Other Courses
        </Button>
        <Button
          onClick={handleGoBack}
          variant="outline"
          className="w-full h-12 border-slate-200 text-slate-600 rounded-xl flex items-center justify-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Go Back
        </Button>
      </div>
    </>
  );
}
