import { motion } from "motion/react";
import { PlayCircle, MessageSquare, BarChart2, Layers, Award, Zap } from "lucide-react";
import { AnimatedSection } from "./AnimatedSection";

const FEATURES = [
  {
    icon: PlayCircle,
    title: "Immersive Video Learning",
    description: "Crystal-clear HD video lectures with intelligent playback controls, smart bookmarking, and timeline heatmaps showing exactly where students spend the most time.",
    size: "col-span-2 row-span-1",
    accent: "#6366f1",
    bg: "from-indigo-50 to-violet-50",
  },
  {
    icon: MessageSquare,
    title: "AI Study Assistant",
    description: "Get instant answers, concept explanations, and personalized study plans from your AI tutor — available 24/7 inside every lecture.",
    size: "col-span-1 row-span-1",
    accent: "#7c3aed",
    bg: "from-violet-50 to-purple-50",
  },
  {
    icon: BarChart2,
    title: "Detailed Progress Analytics",
    description: "Track your learning streak, time invested, and mastery level per topic with beautiful real-time dashboards.",
    size: "col-span-1 row-span-1",
    accent: "#0d9488",
    bg: "from-teal-50 to-emerald-50",
  },
  {
    icon: Layers,
    title: "Structured Curriculum",
    description: "Courses are organized into modular syllabi so you always know exactly what's next.",
    size: "col-span-1 row-span-1",
    accent: "#d97706",
    bg: "from-amber-50 to-orange-50",
  },
  {
    icon: Award,
    title: "Verified Certificates",
    description: "Earn shareable certificates upon completion — recognized by 500+ hiring partners.",
    size: "col-span-1 row-span-1",
    accent: "#dc2626",
    bg: "from-rose-50 to-pink-50",
  },
  {
    icon: Zap,
    title: "Learn at Your Pace",
    description: "Lifetime access to all course content. Pick up exactly where you left off on any device.",
    size: "col-span-1 row-span-1",
    accent: "#0284c7",
    bg: "from-sky-50 to-blue-50",
  },
];

export function LandingFeatures() {
  return (
    <AnimatedSection>
      <section className="py-20 px-4 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-indigo-600 mb-2">WHY EDUNODE</p>
            <h2 className="text-4xl font-extrabold text-slate-900">
              Everything you need to learn faster
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: i * 0.07, duration: 0.45 }}
                whileHover={{ scale: 1.02, y: -3 }}
                className={`bento-card bg-gradient-to-br ${f.bg} border-0 ${
                  f.size === "col-span-2 row-span-1" ? "md:col-span-2" : ""
                }`}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: `${f.accent}20` }}
                >
                  <f.icon className="w-5 h-5" style={{ color: f.accent }} />
                </div>
                <h3 className="text-base font-bold text-slate-800 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{f.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </AnimatedSection>
  );
}
