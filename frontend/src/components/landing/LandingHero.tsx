import { motion } from "motion/react";
import { TrendingUp, ArrowRight, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LandingHeroProps {
  navigate: (path: string) => void;
}

export function LandingHero({ navigate }: LandingHeroProps) {
  return (
    <section className="relative overflow-hidden hero-gradient pt-20 pb-28 px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full opacity-30"
          style={{ background: "radial-gradient(circle, #c7d2fe, transparent)" }}
        />
        <div
          className="absolute -bottom-20 -left-20 w-[400px] h-[400px] rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #a5b4fc, transparent)" }}
        />
      </div>

      <div className="relative max-w-6xl mx-auto text-center">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 text-xs font-semibold px-3.5 py-1.5 rounded-full mb-6 border border-indigo-200">
            <TrendingUp className="w-3 h-3" />
            Over 500,000 students already learning
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-slate-900 leading-[1.1] tracking-tight mb-6"
        >
          Master Skills That
          <br />
          <span className="gradient-text">Matter in 2024</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Expert-taught courses in programming, design, data science, and business. Learn at your own pace with an AI study assistant by your side.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <Button
            size="lg"
            onClick={() => navigate("/explore")}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 text-base font-semibold rounded-xl shadow-lg shadow-indigo-200 h-auto cursor-pointer"
            id="hero-cta-explore"
          >
            Start Learning Free
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate("/explore")}
            className="px-8 py-4 text-base font-semibold rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 h-auto cursor-pointer"
            id="hero-cta-browse"
          >
            <PlayCircle className="w-4 h-4 mr-2 text-indigo-600" />
            Browse Courses
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 48 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-16 grid grid-cols-3 gap-3 max-w-3xl mx-auto"
        >
          {[
            { label: "Continue Watching", sub: "React Hooks Deep Dive", progress: 45, accent: "#6366f1" },
            { label: "Next Up", sub: "Redux Toolkit Basics", progress: 0, accent: "#7c3aed" },
            { label: "Completed", sub: "Next.js App Router", progress: 100, accent: "#0d9488" },
          ].map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + i * 0.1 }}
              className="bento-card text-left py-3 px-4"
            >
              <p className="text-xs font-medium mb-1" style={{ color: card.accent }}>{card.label}</p>
              <p className="text-xs font-semibold text-slate-700 truncate">{card.sub}</p>
              {card.progress > 0 && (
                <div className="mt-2 h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${card.progress}%`, background: card.accent }} />
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
