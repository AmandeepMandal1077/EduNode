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
      <div className="w-16 h-16 rounded-base bg-red-100 border-2 border-red-500 flex items-center justify-center shadow-[3px_3px_0px_0px_#ef4444] mb-6 mx-auto">
        <XCircle className="w-8 h-8 text-red-600" />
      </div>

      <h2 className="text-2xl font-heading font-black text-foreground leading-tight mb-2">
        Payment Cancelled
      </h2>
      
      <p className="text-foreground/70 text-sm font-base max-w-xs leading-relaxed mb-8 mx-auto">
        Your transaction was not completed, and your card was not charged. You can resume your checkout at any time.
      </p>

      <div className="flex flex-col gap-3 w-full">
        <Button
          onClick={handleBrowseCourses}
          variant="default"
          size="lg"
          className="w-full font-heading font-black shadow-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none flex items-center justify-center gap-2 cursor-pointer"
        >
          <ShoppingBag className="w-5 h-5" />
          Browse Other Courses
        </Button>
        <Button
          onClick={handleGoBack}
          variant="neutral"
          size="lg"
          className="w-full font-heading font-bold flex items-center justify-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
          Go Back
        </Button>
      </div>
    </>
  );
}
