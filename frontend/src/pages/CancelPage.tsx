import { motion } from "motion/react";
import { useCancel } from "@/hooks/useCancel";
import { CancelContent } from "@/components/checkout/CancelContent";

export function CancelPage() {
  const { handleBrowseCourses, handleGoBack } = useCancel();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md bg-white border border-slate-100 rounded-3xl p-8 text-center shadow-xl"
      >
        <CancelContent
          handleBrowseCourses={handleBrowseCourses}
          handleGoBack={handleGoBack}
        />
      </motion.div>
    </div>
  );
}
