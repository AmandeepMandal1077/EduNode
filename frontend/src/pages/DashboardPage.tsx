import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import type { Variants } from "motion/react";

import { useDashboard } from "@/hooks/useDashboard";
import { DashboardContinueWatching } from "@/components/dashboard/DashboardContinueWatching";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { DashboardAnnouncements } from "@/components/dashboard/DashboardAnnouncements";
import { DashboardCourseList } from "@/components/dashboard/DashboardCourseList";

export function DashboardPage() {
  const navigate = useNavigate();
  const { enrolled, user, announcements, loading } = useDashboard();

  const continueItem = enrolled.find((e) => e.enrollment.progressPercent < 100 && e.enrollment.progressPercent > 0) ?? enrolled[0];

  const totalProgress = enrolled.length
    ? Math.round(enrolled.reduce((a, e) => a + e.enrollment.progressPercent, 0) / enrolled.length)
    : 0;

  const completedCourses = enrolled.filter((e) => e.enrollment.progressPercent === 100).length;

  const containerVariants: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08 } },
  };
  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div key={i} className="w-2 h-2 bg-indigo-400 rounded-full" animate={{ y: [0, -8, 0] }} transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <p className="text-sm text-slate-500 mb-1">
            Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"},
          </p>
          <h1 className="text-3xl font-extrabold text-slate-900">
            {user?.name?.split(" ")[0] ?? "Learner"}
          </h1>
          <p className="text-slate-500 mt-1 text-sm">You're on a roll — keep going!</p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 auto-rows-auto"
        >
          <DashboardContinueWatching
            continueItem={continueItem}
            cardVariants={cardVariants}
            navigate={navigate}
          />

          <DashboardStats
            totalProgress={totalProgress}
            enrolledCount={enrolled.length}
            completedCount={completedCourses}
            cardVariants={cardVariants}
          />

          <DashboardAnnouncements
            announcements={announcements}
            cardVariants={cardVariants}
            navigate={navigate}
          />
        </motion.div>

        <DashboardCourseList enrolled={enrolled} navigate={navigate} />
      </div>
    </div>
  );
}
