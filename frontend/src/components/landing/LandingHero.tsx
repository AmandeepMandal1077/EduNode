import { motion } from "motion/react";
import { TrendingUp, ArrowRight, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LandingHeroProps {
  navigate: (path: string) => void;
}

export function LandingHero({ navigate }: LandingHeroProps) {
  return (
    <section className="relative overflow-hidden hero-gradient pt-16 pb-24 px-4 border-b-4 border-border">
      <div className="relative max-w-6xl mx-auto text-center">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="inline-flex items-center gap-2 bg-main text-main-foreground text-xs font-heading font-black px-4 py-2 rounded-base mb-6 border-2 border-border shadow-[3px_3px_0px_0px_#000]">
            <TrendingUp className="w-4 h-4" />
            OVER 500,000 STUDENTS ALREADY LEARNING
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl sm:text-6xl md:text-7xl font-heading font-black text-foreground leading-[1.1] tracking-tight mb-6"
        >
          Master Real Skills That
          <br />
          <span className="bg-main text-main-foreground px-3 py-1 border-4 border-border shadow-[4px_4px_0px_0px_#000] inline-block mt-2 rounded-base">
            Matter in 2025
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-base sm:text-xl text-foreground/80 max-w-2xl mx-auto mb-10 leading-relaxed font-base"
        >
          Expert-taught courses in engineering, AI, design, and architecture. Learn at your own pace with a context-aware AI assistant by your side.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Button
            size="lg"
            variant="default"
            onClick={() => navigate("/explore")}
            className="px-8 py-6 text-base font-heading font-black cursor-pointer shadow-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
            id="hero-cta-explore"
          >
            Start Learning Free
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <Button
            size="lg"
            variant="neutral"
            onClick={() => navigate("/explore")}
            className="px-8 py-6 text-base font-heading font-black cursor-pointer shadow-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
            id="hero-cta-browse"
          >
            <PlayCircle className="w-5 h-5 mr-2" />
            Browse All Courses
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 48 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto"
        >
          {[
            { label: "Continue Watching", sub: "React Hooks Deep Dive", progress: 45, badgeBg: "bg-main" },
            { label: "Next Up", sub: "Redux Toolkit Architecture", progress: 0, badgeBg: "bg-[#ff9900]" },
            { label: "Completed", sub: "Next.js Full-Stack Mastery", progress: 100, badgeBg: "bg-[#10b981]" },
          ].map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="bg-background border-2 border-border rounded-base p-4 text-left shadow-shadow"
            >
              <span className={`text-[10px] font-heading font-black uppercase px-2 py-0.5 rounded-base border-2 border-border ${card.badgeBg} text-black inline-block mb-1.5 shadow-[1px_1px_0px_0px_#000]`}>
                {card.label}
              </span>
              <p className="text-xs font-heading font-bold text-foreground truncate">{card.sub}</p>
              {card.progress > 0 && (
                <div className="mt-2.5 h-2.5 bg-secondary-background rounded-base border-2 border-border overflow-hidden">
                  <div className="h-full bg-main border-r-2 border-border transition-all" style={{ width: `${card.progress}%` }} />
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
