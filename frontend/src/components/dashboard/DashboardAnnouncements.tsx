import { motion } from "motion/react";
import type { Variants } from "motion/react";
import { Bell, ChevronRight } from "lucide-react";
import type { DashboardAnnouncement } from "@/hooks/useDashboard";

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

    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

export function DashboardAnnouncements({
  announcements,
  cardVariants,
  navigate,
}: DashboardAnnouncementsProps) {
  return (
    <motion.div
      variants={cardVariants}
      className="md:col-span-2 xl:col-span-4 bg-background border-2 border-border rounded-base p-6 shadow-shadow flex flex-col gap-4"
    >
      <div className="flex items-center gap-2.5 mb-1">
        <div className="w-9 h-9 rounded-base bg-main border-2 border-border flex items-center justify-center shadow-[2px_2px_0px_0px_#000]">
          <Bell className="w-4 h-4 text-main-foreground" />
        </div>
        <span className="text-base font-heading font-black text-foreground">
          Course Announcements
        </span>
      </div>
      {announcements.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
          <p className="text-foreground/60 font-heading font-bold text-sm">
            No announcements from your courses yet.
          </p>
        </div>
      ) : (
        <div className="max-h-[280px] overflow-y-auto custom-scrollbar">
          <div className="flex flex-col gap-3 pr-2">
            {announcements.map((ann) => (
              <div
                key={ann.id}
                onClick={() =>
                  navigate(
                    `/learn/${ann.courseId}/lecture/${ann.lastLectureId}`,
                  )
                }
                className="flex flex-col gap-1.5 p-3 rounded-base border-2 border-transparent hover:border-border hover:bg-secondary-background cursor-pointer transition-all group shadow-none hover:shadow-[2px_2px_0px_0px_#000]"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-heading font-black bg-main px-2 py-0.5 border border-border rounded-base text-main-foreground uppercase tracking-wider">
                    {ann.courseTitle}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-foreground/60">
                    {formatTimeAgo(ann.time)}
                  </span>
                </div>

                <div className="flex items-start gap-2 pt-1">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-base text-foreground group-hover:font-medium leading-relaxed line-clamp-3 break-all whitespace-pre-wrap">
                      {ann.message}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-foreground/40 group-hover:text-foreground flex-shrink-0 transition-colors mt-0.5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
