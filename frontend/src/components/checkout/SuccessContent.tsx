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
        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
        <h2 className="text-xl font-bold text-slate-800">Verifying Payment</h2>
        <p className="text-slate-500 text-sm max-w-xs">
          Please wait while we confirm your enrollment transaction with Stripe...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-6 flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center border border-amber-100 mb-2">
          <AlertTriangle className="w-8 h-8 text-amber-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 font-display">Verification Pending</h2>
        <p className="text-slate-600 text-sm leading-relaxed max-w-xs">{error}</p>
        <div className="flex flex-col gap-2.5 w-full mt-6">
          <Button
            onClick={() => navigate("/my-courses")}
            className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl cursor-pointer"
          >
            Go to My Courses
          </Button>
          <Button
            onClick={() => navigate("/")}
            variant="outline"
            className="w-full h-11 border-slate-200 text-slate-600 rounded-xl cursor-pointer"
          >
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-4 flex flex-col items-center text-center">
      <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center border border-emerald-100 mb-4 animate-pulse">
        <CheckCircle2 className="w-8 h-8 text-emerald-500" />
      </div>
      <h2 className="text-2xl font-extrabold text-slate-900 leading-tight mb-2">
        Payment Successful!
      </h2>
      <p className="text-slate-500 text-sm max-w-xs leading-relaxed mb-6">
        Thank you! Your enrollment has been verified and you now have full lifetime access to the course content.
      </p>

      {purchase && (
        <div className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-left flex flex-col gap-2.5 mb-8 text-sm">
          <div className="flex justify-between border-b border-slate-200/60 pb-2">
            <span className="text-slate-400 font-medium">Course</span>
            <span className="text-slate-800 font-bold max-w-[200px] truncate">
              {purchase.course && typeof purchase.course !== "string"
                ? purchase.course.title
                : "Purchased Course"}
            </span>
          </div>
          <div className="flex justify-between border-b border-slate-200/60 pb-2">
            <span className="text-slate-400 font-medium">Transaction ID</span>
            <span className="text-slate-500 font-mono text-xs">{purchase.paymentId || "Pending"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400 font-medium">Amount Paid</span>
            <span className="text-slate-800 font-extrabold">
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
          className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 cursor-pointer"
        >
          Go to Dashboard
          <ArrowRight className="w-4 h-4" />
        </Button>
        <Button
          onClick={() => navigate("/my-courses")}
          variant="outline"
          className="w-full h-12 border-slate-200 text-slate-600 rounded-xl cursor-pointer"
        >
          View Enrolled Courses
        </Button>
      </div>
    </div>
  );
}
