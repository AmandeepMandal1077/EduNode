import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import type { Variants } from "motion/react";
import {
  Play,
  Flame,
  TrendingUp,
  BookOpen,
  Clock,
  Bell,
  ChevronRight,
  Award,
  BarChart2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CircularProgress } from "@/components/CircularProgress";
import { getEnrolledCourses, getCourseAnnouncements } from "@/services/courseService";
import { getCurrentUser } from "@/services/userService";
import type { Course, Enrollment, User } from "@/types";

interface EnrolledCourse {
  course: Course;
  enrollment: Enrollment;
}

function formatTimeAgo(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}


export function DashboardPage() {
  const navigate = useNavigate();
  const [enrolled, setEnrolled] = useState<EnrolledCourse[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getEnrolledCourses(), getCurrentUser()]).then(async ([courses, u]) => {
      setEnrolled(courses);
      setUser(u);

      if (courses.length > 0) {
        try {
          const promises = courses.map(async (item) => {
            const list = await getCourseAnnouncements(item.course.id);
            return list.map((ann) => ({
              id: ann._id,
              courseId: item.course.id,
              lastLectureId: item.enrollment.lastLectureId || "",
              courseTitle: item.course.title,
              message: ann.message,
              time: ann.sentAt,
            }));
          });

          const allNested = await Promise.all(promises);
          const flat = allNested.flat();
          // Sort by date descending (newest first)
          flat.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
          setAnnouncements(flat);
        } catch (err) {
          console.error("Failed to fetch announcements:", err);
        }
      }

      setLoading(false);
    });
  }, []);

  const continueItem = enrolled.find((e) => e.enrollment.progressPercent < 100 && e.enrollment.progressPercent > 0)
    ?? enrolled[0];

  const totalProgress = enrolled.length
    ? Math.round(enrolled.reduce((a, e) => a + e.enrollment.progressPercent, 0) / enrolled.length)
    : 0;

  const completedCourses = enrolled.filter((e) => e.enrollment.progressPercent === 100).length;

  const containerVariants: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08 } },
  };
  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex gap-2">
          {[0,1,2].map((i) => (
            <motion.div key={i} className="w-2 h-2 bg-indigo-400 rounded-full" animate={{ y: [0, -8, 0] }} transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Welcome header */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <p className="text-sm text-slate-500 mb-1">Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"},</p>
          <h1 className="text-3xl font-extrabold text-slate-900">
            {user?.name?.split(" ")[0] ?? "Learner"}
          </h1>
          <p className="text-slate-500 mt-1 text-sm">You're on a roll — keep going!</p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 auto-rows-auto"
        >
          {/* 2x2 Continue Watching */}
          <motion.div
            variants={cardVariants}
            className="md:col-span-2 xl:col-span-2 xl:row-span-2 bento-card flex flex-col gap-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <Play className="w-4 h-4 text-indigo-600" />
                </div>
                <span className="text-sm font-semibold text-slate-700">Continue Watching</span>
              </div>
              {continueItem && (
                <Badge variant="secondary" className="text-xs bg-indigo-50 text-indigo-600 border-0">
                  {continueItem.enrollment.progressPercent}% done
                </Badge>
              )}
            </div>

            {continueItem ? (
              <>
                {/* Thumbnail */}
                <div
                  className="w-full rounded-xl overflow-hidden relative flex items-center justify-center bg-slate-100"
                  style={{ aspectRatio: "16/9" }}
                >
                  {continueItem.course.thumbnail ? (
                    <img
                      src={continueItem.course.thumbnail}
                      alt={continueItem.course.title}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center relative overflow-hidden"
                      style={{ background: `linear-gradient(135deg, ${continueItem.course.thumbnailAccent}dd, ${continueItem.course.thumbnailAccent}88)` }}
                    >
                      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)", backgroundSize: "30px 30px" }} />
                      <div className="relative z-10 w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center border border-white/30">
                        <BookOpen className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <p className="text-xs text-slate-500 mb-0.5">{continueItem.course.category}</p>
                  <h3 className="font-bold text-slate-800 text-base leading-snug mb-1">{continueItem.course.title}</h3>
                  <p className="text-xs text-slate-500">
                    Next: <span className="text-slate-700 font-medium">
                      {continueItem.course.modules
                        .flatMap((m) => m.lectures)
                        .find((l) => l.id === continueItem.enrollment.lastLectureId)?.title ?? "First lecture"}
                    </span>
                  </p>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                    <span>Progress</span>
                    <span className="font-semibold text-indigo-600">{continueItem.enrollment.progressPercent}%</span>
                  </div>
                  <Progress value={continueItem.enrollment.progressPercent} className="h-2" />
                </div>

                <Button
                  onClick={() => navigate(`/learn/${continueItem.course.id}/lecture/${continueItem.enrollment.lastLectureId}`)}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold"
                  id="dashboard-resume-btn"
                >
                  <Play className="w-4 h-4 mr-2 fill-white" />
                  Resume Learning
                </Button>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 py-8">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-slate-400" />
                </div>
                <p className="text-slate-600 text-sm">No courses in progress yet.</p>
                <Button
                  onClick={() => navigate("/explore")}
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  Explore Courses
                </Button>
              </div>
            )}
          </motion.div>

          {/* Overall Progress */}
          <motion.div variants={cardVariants} className="md:col-span-2 xl:col-span-2 bento-card flex flex-col items-center justify-center gap-3 text-center">
            <div className="flex items-center gap-2 w-full">
              <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center">
                <BarChart2 className="w-4 h-4 text-teal-600" />
              </div>
              <span className="text-sm font-semibold text-slate-700">Overall Progress</span>
            </div>
            <CircularProgress value={totalProgress} size={88} label="avg" />
            <p className="text-xs text-slate-500">{enrolled.length} course{enrolled.length !== 1 ? "s" : ""} enrolled</p>
          </motion.div>

          {/* Quick stats */}
          <motion.div variants={cardVariants} className="md:col-span-2 bento-card flex flex-col gap-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
              </div>
              <span className="text-sm font-semibold text-slate-700">Your Stats</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: BookOpen, value: enrolled.length, label: "Enrolled", color: "text-indigo-600", bg: "bg-indigo-50" },
                { icon: Award, value: completedCourses, label: "Completed", color: "text-amber-600", bg: "bg-amber-50" },
              ].map((stat) => (
                <div key={stat.label} className={`rounded-xl p-3 ${stat.bg} flex flex-col gap-1`}>
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                  <span className={`text-xl font-extrabold ${stat.color}`}>{stat.value}</span>
                  <span className="text-xs text-slate-500">{stat.label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Announcements */}
          <motion.div variants={cardVariants} className="md:col-span-2 xl:col-span-4 bento-card flex flex-col gap-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
                <Bell className="w-4 h-4 text-violet-600" />
              </div>
              <span className="text-sm font-semibold text-slate-700">Announcements</span>
            </div>
            {announcements.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
                <p className="text-slate-500 text-sm">No announcements from your courses yet.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3 max-h-[280px] overflow-y-auto pr-1 scrollbar-thin" style={{ overscrollBehavior: "contain" }}>
                {announcements.map((ann) => (
                  <div
                    key={ann.id}
                    onClick={() => navigate(`/learn/${ann.courseId}/lecture/${ann.lastLectureId}`)}
                    className="flex flex-col gap-1 p-2 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors group"
                  >
                    {/* Header: Course Title & Time */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-wider">
                        {ann.courseTitle}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {formatTimeAgo(ann.time)}
                      </span>
                    </div>

                    {/* Body: Announcement, indented to the right */}
                    <div className="pl-3.5 flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-600 group-hover:text-indigo-700 transition-colors leading-relaxed line-clamp-3 break-all whitespace-pre-wrap">
                          {ann.message}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 flex-shrink-0 transition-colors mt-0.5" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>

        {/* My Courses preview */}
        {enrolled.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800">My Courses</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/my-courses")}
                className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50"
              >
                View all
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {enrolled.map((e, i) => (
                <motion.div
                  key={e.course.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  onClick={() => navigate(`/learn/${e.course.id}/lecture/${e.enrollment.lastLectureId}`)}
                  className="bento-card bento-card-interactive flex gap-3 p-3"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden bg-slate-100"
                  >
                    {e.course.thumbnail ? (
                      <img
                        src={e.course.thumbnail}
                        alt={e.course.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center"
                        style={{ background: `${e.course.thumbnailAccent}22` }}
                      >
                        <BookOpen className="w-5 h-5" style={{ color: e.course.thumbnailAccent }} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{e.course.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Progress value={e.enrollment.progressPercent} className="h-1.5 flex-1" />
                      <span className="text-xs font-semibold text-indigo-600 flex-shrink-0">{e.enrollment.progressPercent}%</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
