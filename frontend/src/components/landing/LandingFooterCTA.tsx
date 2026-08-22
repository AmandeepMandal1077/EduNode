import { ArrowRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedSection } from "./AnimatedSection";

interface LandingFooterCTAProps {
  navigate: (path: string) => void;
}

export function LandingFooterCTA({ navigate }: LandingFooterCTAProps) {
  return (
    <>
      <AnimatedSection>
        <section className="py-20 px-4 bg-main border-b-4 border-border relative overflow-hidden">
          <div className="relative max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-5xl font-heading font-black text-main-foreground mb-4">
              Ready to Upgrade Your Future?
            </h2>
            <p className="text-main-foreground/90 font-base text-lg mb-8 max-w-xl mx-auto">
              Join 500,000+ engineers, creators, and leaders learning in-demand skills today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                variant="neutral"
                onClick={() => navigate("/register")}
                className="px-8 py-6 text-base font-heading font-black shadow-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none cursor-pointer"
                id="cta-section-register"
              >
                Create Free Account
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="noShadow"
                onClick={() => navigate("/explore")}
                className="bg-background text-foreground border-2 border-border px-8 py-6 text-base font-heading font-black hover:bg-background/90 cursor-pointer"
                id="cta-section-explore"
              >
                <Clock className="w-5 h-5 mr-2" />
                Browse Free Courses
              </Button>
            </div>
          </div>
        </section>
      </AnimatedSection>

      <footer className="bg-black text-white py-10 px-4 text-center font-heading font-bold text-sm border-t-2 border-black">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="bg-main text-black px-2 py-0.5 border-2 border-white rounded-base text-xs font-black">
              EDUNODE
            </span>
            <p className="text-xs text-white/70">&copy; 2025 EduNode. Built with modern architecture for learners everywhere.</p>
          </div>
          <div className="flex gap-4 text-xs">
            <span className="text-white/60 hover:text-white cursor-pointer">Terms</span>
            <span className="text-white/60 hover:text-white cursor-pointer">Privacy</span>
            <span className="text-white/60 hover:text-white cursor-pointer">Support</span>
          </div>
        </div>
      </footer>
    </>
  );
}
