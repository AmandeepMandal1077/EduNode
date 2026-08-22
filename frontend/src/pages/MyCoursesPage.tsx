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
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-heading font-black text-foreground mb-1">My Enrolled Courses</h1>
          <p className="text-sm font-base text-foreground/70">Track and continue your learning progress</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-4 mb-8 items-start sm:items-center justify-between"
        >
          <div className="relative flex items-center w-full sm:max-w-xs">
            <Search className="w-4 h-4 text-foreground/60 absolute left-3 pointer-events-none z-10" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search my courses..."
              className="pl-9 bg-background font-base"
              id="my-courses-search"
            />
          </div>

          <Tabs value={tab} onValueChange={setTab} className="w-auto">
            <TabsList className="bg-secondary-background border-2 border-border rounded-base p-1 h-11 shadow-[2px_2px_0px_0px_#000]">
              <TabsTrigger value="all" className="text-xs px-3">All</TabsTrigger>
              <TabsTrigger value="inprogress" className="text-xs px-3">In Progress</TabsTrigger>
              <TabsTrigger value="completed" className="text-xs px-3">Completed</TabsTrigger>
            </TabsList>
          </Tabs>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-background border-2 border-border rounded-base p-0 overflow-hidden shadow-shadow animate-pulse">
                <div className="h-44 bg-secondary-background border-b-2 border-border mb-4" />
                <div className="p-4">
                  <div className="h-4 bg-secondary-background rounded-base w-3/4 mb-2" />
                  <div className="h-3 bg-secondary-background rounded-base w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-secondary-background border-2 border-border rounded-base p-8 shadow-shadow max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-base bg-main border-2 border-border flex items-center justify-center mx-auto mb-4 shadow-[2px_2px_0px_0px_#000]">
              <BookOpen className="w-8 h-8 text-main-foreground" />
            </div>
            <h3 className="text-xl font-heading font-black text-foreground mb-2">
              {enrolled.length === 0 ? "No courses enrolled yet" : "No courses match your filter"}
            </h3>
            <p className="text-foreground/70 text-sm font-base mb-6">
              {enrolled.length === 0 ? "Explore our catalog and enroll in your first course." : "Try adjusting your search query or switching tabs."}
            </p>
            {enrolled.length === 0 && (
              <Button
                variant="default"
                size="lg"
                onClick={() => navigate("/explore")}
                className="font-heading font-black shadow-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none cursor-pointer"
              >
                Browse All Courses
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
