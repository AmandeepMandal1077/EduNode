import { motion } from "motion/react";
import { useSuccess } from "@/hooks/useSuccess";
import { SuccessContent } from "@/components/checkout/SuccessContent";

export function SuccessPage() {
  const {
    loading,
    error,
    purchase,
    navigate,
    handleGoToLearning,
  } = useSuccess();

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
        <SuccessContent
          loading={loading}
          error={error}
          purchase={purchase}
          navigate={navigate}
          handleGoToLearning={handleGoToLearning}
        />
      </motion.div>
    </div>
  );
}
