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
          <h1 className="text-xl font-bold text-slate-800">
            {loading ? "Searching..." : `${courses.length} course${courses.length !== 1 ? "s" : ""} found`}
          </h1>
          {hasFilters && !loading && (
            <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-100 text-xs">
              Filtered
            </Badge>
          )}
        </motion.div>
      </div>


      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="bento-card p-0 overflow-hidden animate-pulse"
            >
              <div className="h-44 bg-slate-100" />
              <div className="p-4 flex flex-col gap-2">
                <div className="h-3 bg-slate-100 rounded w-1/3" />
                <div className="h-4 bg-slate-100 rounded w-3/4" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-24">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Search className="w-7 h-7 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">No courses found</h3>
          <p className="text-slate-500 text-sm">Try different keywords or remove some filters.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {courses.slice((currentPage - 1) * 12, currentPage * 12).map((course, i) => (
              <CourseCard key={course.id} course={course} index={i} />
            ))}
          </div>


          {courses.length > 12 && (
            <div className="flex justify-center items-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded-xl border-slate-200 text-slate-600 font-medium h-9 px-3 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Prev
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.ceil(courses.length / 12) }).map((_, idx) => {
                  const pageNum = idx + 1;
                  const isActive = pageNum === currentPage;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-semibold transition-all cursor-pointer ${
                        isActive
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent hover:border-slate-200"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(Math.ceil(courses.length / 12), p + 1))}
                disabled={currentPage === Math.ceil(courses.length / 12)}
                className="rounded-xl border-slate-200 text-slate-600 font-medium h-9 px-3 cursor-pointer"
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
