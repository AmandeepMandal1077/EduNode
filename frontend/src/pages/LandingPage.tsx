import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useInView } from "motion/react";
import {
  ArrowRight,
  PlayCircle,
  BarChart2,
  MessageSquare,
  Layers,
  Award,
  Users,
  Clock,
  Star,
  Zap,
  BookOpen,
  TrendingUp,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CourseCard } from "@/components/CourseCard";
import { getFeaturedCourses } from "@/services/courseService";
import type { Course } from "@/types";

const STATS = [
  { icon: Users, value: "500K+", label: "Active Students" },
  { icon: BookOpen, value: "1,200+", label: "Expert Courses" },
  { icon: Award, value: "95%", label: "Completion Rate" },
  { icon: Star, value: "4.8/5", label: "Average Rating" },
];

const FEATURES = [
  {
    icon: PlayCircle,
    title: "Immersive Video Learning",
    description:
      "Crystal-clear HD video lectures with intelligent playback controls, smart bookmarking, and timeline heatmaps showing exactly where students spend the most time.",
    size: "col-span-2 row-span-1",
    accent: "#6366f1",
    bg: "from-indigo-50 to-violet-50",
  },
  {
    icon: MessageSquare,
    title: "AI Study Assistant",
    description:
      "Get instant answers, concept explanations, and personalized study plans from your AI tutor — available 24/7 inside every lecture.",
    size: "col-span-1 row-span-1",
    accent: "#7c3aed",
    bg: "from-violet-50 to-purple-50",
  },
  {
    icon: BarChart2,
    title: "Detailed Progress Analytics",
    description:
      "Track your learning streak, time invested, and mastery level per topic with beautiful real-time dashboards.",
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

const TESTIMONIALS = [
  {
    name: "Priya Menon",
    role: "Frontend Engineer at Razorpay",
    text: "EduNode's React course got me interview-ready in 6 weeks. The AI chat made complex hooks concepts click instantly.",
    rating: 5,
    avatar: "PM",
  },
  {
    name: "David Okafor",
    role: "Data Scientist at Flipkart",
    text: "The Python ML course is the most comprehensive I've seen. The bento dashboard keeps me motivated to maintain my streak.",
    rating: 5,
    avatar: "DO",
  },
  {
    name: "Lena Brandt",
    role: "DevOps Lead at BMW",
    text: "Went from zero to AWS certified in 3 months. The structured syllabus and video quality are unmatched.",
    rating: 5,
    avatar: "LB",
  },
];

function AnimatedSection({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function LandingPage() {
  const navigate = useNavigate();
  const [featured, setFeatured] = useState<Course[]>([]);

  useEffect(() => {
    getFeaturedCourses().then(setFeatured);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden hero-gradient pt-20 pb-28 px-4">
        {/* Background decoration */}
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
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
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
            Expert-taught courses in programming, design, data science, and business. Learn at
            your own pace with an AI study assistant by your side.
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
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 text-base font-semibold rounded-xl shadow-lg shadow-indigo-200 h-auto"
              id="hero-cta-explore"
            >
              Start Learning Free
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/explore")}
              className="px-8 py-4 text-base font-semibold rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 h-auto"
              id="hero-cta-browse"
            >
              <PlayCircle className="w-4 h-4 mr-2 text-indigo-600" />
              Browse Courses
            </Button>
          </motion.div>

          {/* Hero bento preview cards */}
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
                <p className="text-xs font-medium mb-1" style={{ color: card.accent }}>
                  {card.label}
                </p>
                <p className="text-xs font-semibold text-slate-700 truncate">{card.sub}</p>
                {card.progress > 0 && (
                  <div className="mt-2 h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${card.progress}%`, background: card.accent }}
                    />
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== STATS ===== */}
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

      {/* ===== FEATURES BENTO ===== */}
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

      {/* ===== FEATURED COURSES ===== */}
      {featured.length > 0 && (
        <AnimatedSection>
          <section className="py-20 px-4 bg-white">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <p className="text-sm font-semibold text-indigo-600 mb-1">HAND-PICKED</p>
                  <h2 className="text-3xl font-extrabold text-slate-900">Featured Courses</h2>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="hidden sm:flex border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                >
                  <Link to="/explore">
                    View all courses
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {featured.slice(0, 6).map((course, i) => (
                  <CourseCard key={course.id} course={course} index={i} />
                ))}
              </div>
            </div>
          </section>
        </AnimatedSection>
      )}

      {/* ===== TESTIMONIALS ===== */}
      <AnimatedSection>
        <section className="py-20 px-4 bg-slate-50">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-sm font-semibold text-indigo-600 mb-2">TESTIMONIALS</p>
              <h2 className="text-3xl font-extrabold text-slate-900">
                Loved by learners worldwide
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {TESTIMONIALS.map((t, i) => (
                <motion.div
                  key={t.name}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bento-card"
                >
                  <div className="flex items-center gap-0.5 mb-3">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Star key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed mb-4">"{t.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700">
                      {t.avatar}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{t.name}</p>
                      <p className="text-xs text-slate-500">{t.role}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* ===== CTA FOOTER STRIP ===== */}
      <AnimatedSection>
        <section className="py-20 px-4 bg-indigo-600 relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "radial-gradient(circle at 30% 50%, white 1px, transparent 1px), radial-gradient(circle at 70% 50%, white 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />
          <div className="relative max-w-3xl mx-auto text-center">
            <h2 className="text-4xl font-extrabold text-white mb-4">
              Ready to transform your career?
            </h2>
            <p className="text-indigo-200 text-lg mb-8">
              Join 500,000+ learners already building the future.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => navigate("/register")}
                className="bg-white text-indigo-700 hover:bg-indigo-50 font-semibold px-8 py-4 rounded-xl transition-colors flex items-center justify-center text-base shadow-md cursor-pointer"
                id="cta-section-register"
              >
                Create Free Account
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
              <button
                onClick={() => navigate("/explore")}
                className="bg-white/10 border border-white/40 text-white hover:bg-white/20 px-8 py-4 rounded-xl font-semibold backdrop-blur-sm transition-colors flex items-center justify-center text-base cursor-pointer"
                id="cta-section-explore"
              >
                <Clock className="w-4 h-4 mr-2" />
                Browse Free Courses
              </button>
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 px-4 text-center text-sm">
        <p>
          &copy; 2024 EduNode. Built with passion for learners everywhere.
        </p>
      </footer>
    </div>
  );
}
