import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface BentoCardProps {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
  onClick?: () => void;
  delay?: number;
}

export function BentoCard({ children, className, interactive = false, onClick, delay = 0 }: BentoCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={interactive ? { scale: 1.02, y: -2 } : undefined}
      onClick={onClick}
      className={cn(
        "bento-card",
        interactive && "bento-card-interactive",
        className
      )}
    >
      {children}
    </motion.div>
  );
}
