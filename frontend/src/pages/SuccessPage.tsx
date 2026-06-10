import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { CheckCircle2, Loader2, ArrowRight, BookOpen, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { verifyCheckoutSession, type PurchaseRecord } from "@/api/purchaseApi";

export function SuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get("session_id");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purchase, setPurchase] = useState<PurchaseRecord | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setError("No session ID found in the URL.");
      setLoading(false);
      return;
    }

    async function verifyPayment() {
      try {
        setLoading(true);
        setError(null);
        const res = await verifyCheckoutSession(sessionId!);
        
        // The backend returns { success: true } or verification data
        // Let's check the structure returned
        if (res) {
          if (res.paid) {
            setPurchase(res.purchase || null);
          } else {
            setError("Stripe payment session has not been paid yet. If you completed payment, it might take a few moments to process.");
          }
        } else {
          throw new Error("Could not verify session.");
        }
      } catch (err: any) {
        console.error("Verification error:", err);
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to verify your payment status. Please contact support if your account was charged."
        );
      } finally {
        setLoading(false);
      }
    }

    verifyPayment();
  }, [sessionId]);

  const handleGoToLearning = () => {
    if (purchase && purchase.course) {
      const courseId = typeof purchase.course === "string" ? purchase.course : purchase.course._id;
      navigate(`/dashboard`);
    } else {
      navigate("/my-courses");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #10b981, transparent)" }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md bg-white border border-slate-100 rounded-3xl p-8 text-center shadow-xl relative z-10"
      >
        {loading ? (
          <div className="py-12 flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
            <h2 className="text-xl font-bold text-slate-800">Verifying Payment</h2>
            <p className="text-slate-500 text-sm max-w-xs">
              Please wait while we confirm your enrollment transaction with Stripe...
            </p>
          </div>
        ) : error ? (
          <div className="py-6 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center border border-amber-100 mb-2">
              <AlertTriangle className="w-8 h-8 text-amber-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 font-display">Verification Pending</h2>
            <p className="text-slate-600 text-sm leading-relaxed max-w-xs">{error}</p>
            <div className="flex flex-col gap-2.5 w-full mt-6">
              <Button
                onClick={() => navigate("/my-courses")}
                className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl"
              >
                Go to My Courses
              </Button>
              <Button
                onClick={() => navigate("/")}
                variant="outline"
                className="w-full h-11 border-slate-200 text-slate-600 rounded-xl"
              >
                Back to Home
              </Button>
            </div>
          </div>
        ) : (
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
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-lg shadow-emerald-100 flex items-center justify-center gap-2"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => navigate("/my-courses")}
                variant="outline"
                className="w-full h-12 border-slate-200 text-slate-600 rounded-xl"
              >
                View Enrolled Courses
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
