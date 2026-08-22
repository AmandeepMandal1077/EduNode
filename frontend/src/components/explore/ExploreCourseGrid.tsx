import { motion } from "motion/react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CourseCard } from "@/components/CourseCard";
import type { Course } from "@/types";

interface ExploreCourseGridProps {
  courses: Course[];
  loading: boolean;
  hasFilters: boolean;
  currentPage: number;
  setCurrentPage: (p: number | ((prev: number) => number)) => void;
}

export function ExploreCourseGrid({
  courses,
  loading,
  hasFilters,
  currentPage,
  setCurrentPage,
}: ExploreCourseGridProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <motion.div
          key={courses.length}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-3"
        >
          <h1 className="text-2xl font-heading font-black text-foreground">
            {loading ? "Searching..." : `${courses.length} course${courses.length !== 1 ? "s" : ""} found`}
          </h1>
          {hasFilters && !loading && (
            <Badge variant="default" className="text-xs font-heading font-black">
              FILTERED
            </Badge>
          )}
        </motion.div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="bg-background border-2 border-border rounded-base p-0 overflow-hidden shadow-shadow animate-pulse"
            >
              <div className="h-44 bg-secondary-background border-b-2 border-border" />
              <div className="p-4 flex flex-col gap-2">
                <div className="h-3 bg-secondary-background rounded-base w-1/3" />
                <div className="h-4 bg-secondary-background rounded-base w-3/4" />
                <div className="h-3 bg-secondary-background rounded-base w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-24 bg-secondary-background border-2 border-border rounded-base shadow-shadow max-w-lg mx-auto p-8">
          <div className="w-16 h-16 rounded-base bg-main border-2 border-border flex items-center justify-center mx-auto mb-4 shadow-[2px_2px_0px_0px_#000]">
            <Search className="w-8 h-8 text-main-foreground" />
          </div>
          <h3 className="text-xl font-heading font-black text-foreground mb-2">No courses found</h3>
          <p className="text-foreground/70 text-sm font-base">Try adjusting your search terms or clearing active filters.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {courses.slice((currentPage - 1) * 12, currentPage * 12).map((course, i) => (
              <CourseCard key={course.id} course={course} index={i} />
            ))}
          </div>

          {courses.length > 12 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <Button
                variant="neutral"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="font-heading font-bold cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Prev
              </Button>
              
              <div className="flex items-center gap-1.5">
                {Array.from({ length: Math.ceil(courses.length / 12) }).map((_, idx) => {
                  const pageNum = idx + 1;
                  const isActive = pageNum === currentPage;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-9 h-9 rounded-base flex items-center justify-center text-sm font-heading font-black transition-all cursor-pointer border-2 border-border ${
                        isActive
                          ? "bg-main text-main-foreground shadow-[2px_2px_0px_0px_#000]"
                          : "bg-background text-foreground hover:bg-main/30 shadow-none"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <Button
                variant="neutral"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(Math.ceil(courses.length / 12), p + 1))}
                disabled={currentPage === Math.ceil(courses.length / 12)}
                className="font-heading font-bold cursor-pointer"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
