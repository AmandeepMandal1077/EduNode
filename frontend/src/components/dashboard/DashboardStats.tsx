import { motion } from "motion/react";
import type { Variants } from "motion/react";
import { TrendingUp, BookOpen, Award, BarChart2 } from "lucide-react";
import { CircularProgress } from "@/components/CircularProgress";

interface DashboardStatsProps {
  totalProgress: number;
  enrolledCount: number;
  completedCount: number;
  cardVariants: Variants;
}

export function DashboardStats({ totalProgress, enrolledCount, completedCount, cardVariants }: DashboardStatsProps) {
  return (
    <>
      <motion.div variants={cardVariants} className="md:col-span-2 xl:col-span-2 bg-background border-2 border-border rounded-base p-6 shadow-shadow flex flex-col items-center justify-center gap-4 text-center">
        <div className="flex items-center gap-2.5 w-full">
          <div className="w-9 h-9 rounded-base bg-main border-2 border-border flex items-center justify-center shadow-[2px_2px_0px_0px_#000]">
            <BarChart2 className="w-4 h-4 text-main-foreground" />
          </div>
          <span className="text-base font-heading font-black text-foreground">Overall Progress</span>
        </div>
        <CircularProgress value={totalProgress} size={96} label="avg" />
        <p className="text-xs font-heading font-bold text-foreground/70">{enrolledCount} course{enrolledCount !== 1 ? "s" : ""} enrolled</p>
      </motion.div>

      <motion.div variants={cardVariants} className="md:col-span-2 bg-background border-2 border-border rounded-base p-6 shadow-shadow flex flex-col gap-4">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-9 h-9 rounded-base bg-main border-2 border-border flex items-center justify-center shadow-[2px_2px_0px_0px_#000]">
            <TrendingUp className="w-4 h-4 text-main-foreground" />
          </div>
          <span className="text-base font-heading font-black text-foreground">Your Learning Stats</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[
            { icon: BookOpen, value: enrolledCount, label: "Enrolled", bg: "bg-secondary-background" },
            { icon: Award, value: completedCount, label: "Completed", bg: "bg-main" },
          ].map((stat) => (
            <div key={stat.label} className={`rounded-base p-4 ${stat.bg} border-2 border-border flex flex-col gap-1 shadow-[2px_2px_0px_0px_#000]`}>
              <stat.icon className="w-5 h-5 text-foreground" />
              <span className="text-2xl sm:text-3xl font-heading font-black text-foreground tracking-tight">{stat.value}</span>
              <span className="text-xs font-heading font-bold uppercase tracking-wider text-foreground/70">{stat.label}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </>
  );
}
