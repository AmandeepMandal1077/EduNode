import { motion } from "motion/react";
import { Star } from "lucide-react";
import { AnimatedSection } from "./AnimatedSection";

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

export function LandingTestimonials() {
  return (
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
  );
}
