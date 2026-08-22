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
      <section className="py-14 px-4 border-b-4 border-border bg-background">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="p-5 bg-secondary-background border-2 border-border rounded-base shadow-shadow text-center hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
            >
              <div className="w-12 h-12 rounded-base bg-main border-2 border-border flex items-center justify-center mx-auto mb-3 shadow-[2px_2px_0px_0px_#000]">
                <stat.icon className="w-6 h-6 text-main-foreground" />
              </div>
              <p className="text-3xl sm:text-4xl font-heading font-black text-foreground tracking-tight">{stat.value}</p>
              <p className="text-xs sm:text-sm font-heading font-bold text-foreground/70 mt-1 uppercase tracking-wider">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </AnimatedSection>
  );
}
