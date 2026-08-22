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
    text: "The Python ML course is the most comprehensive I've seen. The brutalist dashboard keeps me motivated to maintain my daily streak.",
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
      <section className="py-20 px-4 bg-background border-b-4 border-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-heading font-black uppercase tracking-widest bg-main text-main-foreground border-2 border-border px-3 py-1 inline-block shadow-[2px_2px_0px_0px_#000] rounded-base mb-3">
              TESTIMONIALS
            </span>
            <h2 className="text-3xl sm:text-4xl font-heading font-black text-foreground">
              Loved by Learners Worldwide
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-secondary-background border-2 border-border rounded-base p-6 shadow-shadow flex flex-col justify-between hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
              >
                <div>
                  <div className="flex items-center gap-1 mb-4">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Star key={j} className="w-4 h-4 text-amber-500 fill-amber-500" />
                    ))}
                  </div>
                  <p className="text-sm font-base text-foreground leading-relaxed mb-6">"{t.text}"</p>
                </div>
                <div className="flex items-center gap-3 pt-4 border-t-2 border-border">
                  <div className="w-10 h-10 rounded-base bg-main border-2 border-border flex items-center justify-center text-xs font-heading font-black text-main-foreground shadow-[2px_2px_0px_0px_#000]">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-heading font-black text-foreground">{t.name}</p>
                    <p className="text-xs font-base text-foreground/70">{t.role}</p>
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
