import { motion } from "motion/react";
import { PlayCircle, MessageSquare, BarChart2, Layers, Award, Zap } from "lucide-react";
import { AnimatedSection } from "./AnimatedSection";

const FEATURES = [
  {
    icon: PlayCircle,
    title: "Immersive Video Learning",
    description: "Crystal-clear HD video lectures with intelligent playback controls, smart bookmarking, and timeline heatmaps showing exactly where students spend the most time.",
    size: "col-span-2 row-span-1",
    tag: "CORE EXPERIENCE",
  },
  {
    icon: MessageSquare,
    title: "AI Study Assistant",
    description: "Get instant answers, concept explanations, and personalized study plans from your AI tutor — available 24/7 inside every lecture.",
    size: "col-span-1 row-span-1",
    tag: "RAG POWERED",
  },
  {
    icon: BarChart2,
    title: "Detailed Progress Analytics",
    description: "Track your learning streak, time invested, and mastery level per topic with beautiful real-time dashboards.",
    size: "col-span-1 row-span-1",
    tag: "ANALYTICS",
  },
  {
    icon: Layers,
    title: "Structured Curriculum",
    description: "Courses are organized into modular syllabi with clear progress checkpoints so you always know exactly what's next.",
    size: "col-span-1 row-span-1",
    tag: "CURRICULUM",
  },
  {
    icon: Award,
    title: "Verified Certificates",
    description: "Earn verifiable certificates upon completion — share directly to LinkedIn and hiring partners worldwide.",
    size: "col-span-1 row-span-1",
    tag: "CREDENTIALS",
  },
  {
    icon: Zap,
    title: "Learn at Your Pace",
    description: "Lifetime access to all course content. Pick up exactly where you left off across desktop and mobile devices.",
    size: "col-span-1 row-span-1",
    tag: "FLEXIBLE",
  },
];

export function LandingFeatures() {
  return (
    <AnimatedSection>
      <section className="py-20 px-4 bg-secondary-background border-b-4 border-border">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-heading font-black uppercase tracking-widest bg-main text-main-foreground border-2 border-border px-3 py-1 inline-block shadow-[2px_2px_0px_0px_#000] rounded-base mb-3">
              WHY EDUNODE
            </span>
            <h2 className="text-3xl sm:text-5xl font-heading font-black text-foreground">
              Everything You Need to Learn Faster
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: i * 0.07, duration: 0.4 }}
                className={`bg-background border-2 border-border rounded-base p-6 shadow-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex flex-col justify-between ${
                  f.size === "col-span-2 row-span-1" ? "md:col-span-2" : ""
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-base bg-main border-2 border-border flex items-center justify-center shadow-[2px_2px_0px_0px_#000]">
                      <f.icon className="w-6 h-6 text-main-foreground" />
                    </div>
                    <span className="text-[10px] font-heading font-black uppercase px-2 py-0.5 rounded-base border-2 border-border bg-secondary-background">
                      {f.tag}
                    </span>
                  </div>
                  <h3 className="text-xl font-heading font-black text-foreground mb-2">{f.title}</h3>
                  <p className="text-sm font-base text-foreground/80 leading-relaxed">{f.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </AnimatedSection>
  );
}
