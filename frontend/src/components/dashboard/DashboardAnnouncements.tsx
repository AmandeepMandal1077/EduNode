import { motion } from "motion/react";
import type { Variants } from "motion/react";
import { Bell, ChevronRight } from "lucide-react";
import type { DashboardAnnouncement } from "@/hooks/useDashboard";
import ScrollArea from "@/components/shadix-ui/components/smooth-scroll-area/scroll-area";

interface DashboardAnnouncementsProps {
  announcements: DashboardAnnouncement[];
  cardVariants: Variants;
  navigate: (path: string) => void;
}

function formatTimeAgo(dateStr: string): string {
  try {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "";
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

export function DashboardAnnouncements({ announcements, cardVariants, navigate }: DashboardAnnouncementsProps) {
  return (
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
        <ScrollArea className="max-h-[280px]">
          <div className="flex flex-col gap-3">
            {announcements.map((ann) => (
              <div
                key={ann.id}
                onClick={() => navigate(`/learn/${ann.courseId}/lecture/${ann.lastLectureId}`)}
                className="flex flex-col gap-1 p-2 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-wider">
                    {ann.courseTitle}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {formatTimeAgo(ann.time)}
                  </span>
                </div>

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
        </ScrollArea>
      )}
    </motion.div>
  );
}
