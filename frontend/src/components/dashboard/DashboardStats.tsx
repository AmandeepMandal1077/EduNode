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
      <motion.div variants={cardVariants} className="md:col-span-2 xl:col-span-2 bento-card flex flex-col items-center justify-center gap-3 text-center">
        <div className="flex items-center gap-2 w-full">
          <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center">
            <BarChart2 className="w-4 h-4 text-teal-600" />
          </div>
          <span className="text-sm font-semibold text-slate-700">Overall Progress</span>
        </div>
        <CircularProgress value={totalProgress} size={88} label="avg" />
        <p className="text-xs text-slate-500">{enrolledCount} course{enrolledCount !== 1 ? "s" : ""} enrolled</p>
      </motion.div>

      <motion.div variants={cardVariants} className="md:col-span-2 bento-card flex flex-col gap-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <span className="text-sm font-semibold text-slate-700">Your Stats</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: BookOpen, value: enrolledCount, label: "Enrolled", color: "text-indigo-600", bg: "bg-indigo-50" },
            { icon: Award, value: completedCount, label: "Completed", color: "text-amber-600", bg: "bg-amber-50" },
          ].map((stat) => (
            <div key={stat.label} className={`rounded-xl p-3 ${stat.bg} flex flex-col gap-1`}>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
              <span className={`text-xl font-extrabold ${stat.color}`}>{stat.value}</span>
              <span className="text-xs text-slate-500">{stat.label}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </>
  );
}
