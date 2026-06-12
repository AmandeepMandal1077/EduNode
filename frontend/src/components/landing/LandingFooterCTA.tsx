import { ArrowRight, Clock } from "lucide-react";
import { AnimatedSection } from "./AnimatedSection";

interface LandingFooterCTAProps {
  navigate: (path: string) => void;
}

export function LandingFooterCTA({ navigate }: LandingFooterCTAProps) {
  return (
    <>
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

      <footer className="bg-slate-900 text-slate-400 py-8 px-4 text-center text-sm">
        <p>&copy; 2024 EduNode. Built with passion for learners everywhere.</p>
      </footer>
    </>
  );
}
