import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CourseCard } from "@/components/CourseCard";
import { useDebounce } from "@/hooks/useDebounce";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/store";
import { fetchCategoriesThunk, searchCoursesThunk } from "@/store/courseSlice";

const PRICE_FILTERS = [
  { value: "all", label: "All Prices" },
  { value: "free", label: "Free" },
  { value: "under50", label: "Under $50" },
  { value: "under100", label: "Under $100" },
  { value: "paid", label: "Paid" },
];

const LEVEL_FILTERS = ["All Levels", "Beginner", "Intermediate", "Advanced"];

export function ExplorePage() {
  const dispatch = useDispatch<AppDispatch>();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const [category, setCategory] = useState("all");
  const [price, setPrice] = useState("all");
  const [level, setLevel] = useState("All Levels");
  const [currentPage, setCurrentPage] = useState(1);

  const { courses: rawCourses, categories, loading } = useSelector((state: RootState) => state.course);

  useEffect(() => {
    dispatch(fetchCategoriesThunk());
  }, [dispatch]);

  useEffect(() => {
    dispatch(
      searchCoursesThunk({
        query: debouncedQuery,
        category: category === "all" ? undefined : category,
        priceFilter: price === "all" ? undefined : price,
      })
    );
  }, [dispatch, debouncedQuery, category, price]);

  const courses = level !== "All Levels"
    ? rawCourses.filter((c) => c.level === level)
    : rawCourses;

  const hasFilters = query || category !== "all" || price !== "all" || level !== "All Levels";

  useEffect(() => {
    setCurrentPage(1);
  }, [query, category, price, level]);

  const clearFilters = () => {
    setQuery("");
    setCategory("all");
    setPrice("all");
    setLevel("All Levels");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header bar */}
      <div className="bg-white border-b border-slate-200 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
            {/* Search */}
            <div className="input-glow flex-1 flex items-center gap-2.5 border border-slate-200 rounded-xl bg-white px-3.5 py-2.5">
              <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <Input
                id="explore-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search courses, topics, or instructors..."
                className="border-0 shadow-none focus-visible:ring-0 bg-transparent p-0 h-auto text-sm"
              />
              {query && (
                <button onClick={() => setQuery("")} className="text-slate-400 hover:text-slate-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              <SlidersHorizontal className="w-4 h-4 text-slate-400 hidden sm:block" />

              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-44 rounded-xl border-slate-200 text-sm h-10" id="explore-category-filter">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c.toLowerCase()}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={price} onValueChange={setPrice}>
                <SelectTrigger className="w-36 rounded-xl border-slate-200 text-sm h-10" id="explore-price-filter">
                  <SelectValue placeholder="Price" />
                </SelectTrigger>
                <SelectContent>
                  {PRICE_FILTERS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger className="w-40 rounded-xl border-slate-200 text-sm h-10" id="explore-level-filter">
                  <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent>
                  {LEVEL_FILTERS.map((l) => (
                    <SelectItem key={l} value={l}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-medium px-2"
                >
                  <X className="w-3.5 h-3.5" />
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Result count */}
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

        {/* Grid */}
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

            {/* Pagination Controls */}
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
    </div>
  );
}
