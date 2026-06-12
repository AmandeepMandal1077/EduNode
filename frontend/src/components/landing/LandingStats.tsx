import { motion } from "motion/react";
import { Users, BookOpen, Award, Star } from "lucide-react";
import { AnimatedSection } from "./AnimatedSection";

const STATS = [
  { icon: Users, value: "500K+", label: "Active Students" },
  { icon: BookOpen, value: "1,200+", label: "Expert Courses" },
  { icon: Award, value: "95%", label: "Completion Rate" },
  { icon: Star, value: "4.8/5", label: "Average Rating" },
];

export function LandingStats() {
  return (
    <AnimatedSection>
      <section className="py-16 px-4 border-y border-slate-100 bg-white">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="text-center"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center mx-auto mb-3">
                <stat.icon className="w-5 h-5 text-indigo-600" />
              </div>
              <p className="text-3xl font-extrabold text-slate-900">{stat.value}</p>
              <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </AnimatedSection>
  );
}
