import { Loader2, ArrowRight, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PurchaseRecord } from "@/api/purchaseApi";

interface SuccessContentProps {
  loading: boolean;
  error: string | null;
  purchase: PurchaseRecord | null;
  navigate: (path: string) => void;
  handleGoToLearning: () => void;
}

export function SuccessContent({
  loading,
  error,
  purchase,
  navigate,
  handleGoToLearning,
}: SuccessContentProps) {
  if (loading) {
    return (
      <div className="py-12 flex flex-col items-center gap-4">
        <Loader2 className="w-12 h-12 text-foreground animate-spin" />
        <h2 className="text-xl font-heading font-black text-foreground">Verifying Payment</h2>
        <p className="text-foreground/70 text-sm font-base max-w-xs">
          Please wait while we confirm your enrollment transaction...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-6 flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-base bg-red-100 border-2 border-red-500 flex items-center justify-center shadow-[2px_2px_0px_0px_#ef4444] mb-2">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-heading font-black text-foreground">Verification Pending</h2>
        <p className="text-foreground/80 text-sm font-base leading-relaxed max-w-xs">{error}</p>
        <div className="flex flex-col gap-2.5 w-full mt-6">
          <Button
            onClick={() => navigate("/my-courses")}
            variant="default"
            size="lg"
            className="w-full font-heading font-black cursor-pointer shadow-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
          >
            Go to My Courses
          </Button>
          <Button
            onClick={() => navigate("/")}
            variant="neutral"
            size="lg"
            className="w-full font-heading font-bold cursor-pointer"
          >
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-4 flex flex-col items-center text-center">
      <div className="w-16 h-16 rounded-base bg-main border-2 border-border flex items-center justify-center shadow-[3px_3px_0px_0px_#000] mb-4">
        <CheckCircle2 className="w-8 h-8 text-main-foreground" />
      </div>
      <h2 className="text-2xl font-heading font-black text-foreground leading-tight mb-2">
        Payment Successful!
      </h2>
      <p className="text-foreground/70 text-sm font-base max-w-xs leading-relaxed mb-6">
        Thank you! Your enrollment has been verified and you now have lifetime access to the curriculum.
      </p>

      {purchase && (
        <div className="w-full bg-secondary-background border-2 border-border rounded-base p-4 text-left flex flex-col gap-2.5 mb-6 text-sm shadow-[2px_2px_0px_0px_#000]">
          <div className="flex justify-between border-b-2 border-border/20 pb-2">
            <span className="text-foreground/60 font-heading font-bold">Course</span>
            <span className="text-foreground font-heading font-black max-w-[200px] truncate">
              {purchase.course && typeof purchase.course !== "string"
                ? purchase.course.title
                : "Purchased Course"}
            </span>
          </div>
          <div className="flex justify-between border-b-2 border-border/20 pb-2">
            <span className="text-foreground/60 font-heading font-bold">Transaction ID</span>
            <span className="text-foreground font-mono text-xs">{purchase.paymentId || "Pending"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-foreground/60 font-heading font-bold">Amount Paid</span>
            <span className="text-foreground font-heading font-black">
              {purchase.amount > 0
                ? `${purchase.amount} ${purchase.currency.toUpperCase()}`
                : "Free"}
            </span>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 w-full">
        <Button
          onClick={handleGoToLearning}
          variant="default"
          size="lg"
          className="w-full font-heading font-black cursor-pointer shadow-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none flex items-center justify-center gap-2"
        >
          Go to Dashboard
          <ArrowRight className="w-5 h-5" />
        </Button>
        <Button
          onClick={() => navigate("/my-courses")}
          variant="neutral"
          size="lg"
          className="w-full font-heading font-bold cursor-pointer"
        >
          View Enrolled Courses
        </Button>
      </div>
    </div>
  );
}
