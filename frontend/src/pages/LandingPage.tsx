import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CourseCard } from "@/components/CourseCard";
import { getFeaturedCourses } from "@/services/courseService";
import type { Course } from "@/types";

import { LandingHero } from "@/components/landing/LandingHero";
import { LandingStats } from "@/components/landing/LandingStats";
import { LandingFeatures } from "@/components/landing/LandingFeatures";
import { LandingTestimonials } from "@/components/landing/LandingTestimonials";
import { LandingFooterCTA } from "@/components/landing/LandingFooterCTA";
import { AnimatedSection } from "@/components/landing/AnimatedSection";

export function LandingPage() {
  const navigate = useNavigate();
  const [featured, setFeatured] = useState<Course[]>([]);

  useEffect(() => {
    getFeaturedCourses().then(setFeatured);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingHero navigate={navigate} />

      <LandingStats />

      <LandingFeatures />

      {featured.length > 0 && (
        <AnimatedSection>
          <section className="py-20 px-4 bg-background border-b-4 border-border">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <span className="text-xs font-heading font-black uppercase tracking-widest bg-main text-main-foreground border-2 border-border px-3 py-1 inline-block shadow-[2px_2px_0px_0px_#000] rounded-base mb-2">
                    HAND-PICKED
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-heading font-black text-foreground">Featured Courses</h2>
                </div>
                <Button
                  variant="neutral"
                  size="sm"
                  asChild
                  className="hidden sm:inline-flex font-heading font-bold"
                >
                  <Link to="/explore">
                    View all courses
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {featured.slice(0, 6).map((course, i) => (
                  <CourseCard key={course.id} course={course} index={i} />
                ))}
              </div>
            </div>
          </section>
        </AnimatedSection>
      )}

      <LandingTestimonials />

      <LandingFooterCTA navigate={navigate} />
    </div>
  );
}
