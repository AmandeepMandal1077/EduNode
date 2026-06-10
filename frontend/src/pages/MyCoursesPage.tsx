import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { BookOpen, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/store";
import { fetchEnrolledCoursesThunk } from "@/store/courseSlice";
import { CourseCard } from "@/components/CourseCard";

export function MyCoursesPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");

  const { enrolledCourses: enrolled, loading } = useSelector((state: RootState) => state.course);

  useEffect(() => {
    dispatch(fetchEnrolledCoursesThunk());
  }, [dispatch]);

  const filtered = enrolled.filter((e) => {
    const matchesQuery =
      !query ||
      e.course.title.toLowerCase().includes(query.toLowerCase()) ||
      e.course.instructor.toLowerCase().includes(query.toLowerCase());
    const matchesTab =
      tab === "all" ||
      (tab === "inprogress" && e.enrollment.progressPercent > 0 && e.enrollment.progressPercent < 100) ||
      (tab === "completed" && e.enrollment.progressPercent === 100) ||
      (tab === "notstarted" && e.enrollment.progressPercent === 0);
    return matchesQuery && matchesTab;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 mb-1">My Courses</h1>
          <p className="text-slate-500">Track and continue your learning journey</p>
        </motion.div>



        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-3 mb-6"
        >
          <div className="input-glow flex items-center gap-2 border border-slate-200 rounded-xl bg-white px-3.5 py-2.5 flex-1 max-w-xs">
            <Search className="w-4 h-4 text-slate-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search my courses..."
              className="border-0 shadow-none focus-visible:ring-0 bg-transparent p-0 h-auto text-sm"
              id="my-courses-search"
            />
          </div>

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="bg-white border border-slate-200 rounded-xl h-10">
              <TabsTrigger value="all" className="rounded-lg text-xs px-3 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">All</TabsTrigger>
              <TabsTrigger value="inprogress" className="rounded-lg text-xs px-3 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">In Progress</TabsTrigger>
              <TabsTrigger value="completed" className="rounded-lg text-xs px-3 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">Completed</TabsTrigger>
            </TabsList>
          </Tabs>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bento-card animate-pulse">
                <div className="h-40 bg-slate-100 rounded-xl mb-4" />
                <div className="h-4 bg-slate-100 rounded w-3/4 mb-2" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-7 h-7 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">
              {enrolled.length === 0 ? "No courses yet" : "No courses match your filter"}
            </h3>
            <p className="text-slate-500 text-sm mb-4">
              {enrolled.length === 0 ? "Start by enrolling in a course." : "Try a different filter or search term."}
            </p>
            {enrolled.length === 0 && (
              <Button onClick={() => navigate("/explore")} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                Browse Courses
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((e, i) => (
              <CourseCard
                key={e.course.id}
                course={e.course}
                enrollment={e.enrollment}
                index={i}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
