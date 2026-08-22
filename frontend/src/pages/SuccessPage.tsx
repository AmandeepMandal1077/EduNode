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
    <div className="min-h-screen bg-secondary-background hero-gradient flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md bg-background border-4 border-border rounded-base p-8 text-center shadow-shadow relative z-10"
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
