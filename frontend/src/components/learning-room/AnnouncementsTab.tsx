import { Bell, Loader2 } from "lucide-react";
import type { BackendAnnouncement } from "@/api/courseApi";

interface AnnouncementsTabProps {
  announcements: BackendAnnouncement[];
  announcementsLoading: boolean;
}

export function AnnouncementsTab({ announcements, announcementsLoading }: AnnouncementsTabProps) {
  return (
    <div className="space-y-4">
      {announcementsLoading ? (
        <div className="py-12 flex justify-center">
          <Loader2 className="w-6 h-6 text-foreground animate-spin" />
        </div>
      ) : announcements.length === 0 ? (
        <div className="py-12 text-center bg-secondary-background border-2 border-border rounded-base p-6 shadow-shadow">
          <div className="w-12 h-12 rounded-base bg-main border-2 border-border flex items-center justify-center mx-auto mb-3 shadow-[2px_2px_0px_0px_#000]">
            <Bell className="w-6 h-6 text-main-foreground" />
          </div>
          <p className="text-foreground font-heading font-bold text-base">No announcements yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {announcements.map((ann) => (
            <div key={ann._id} className="bg-background border-2 border-border p-5 rounded-base shadow-shadow">
              <p className="text-foreground font-base leading-relaxed whitespace-pre-wrap break-words text-sm">
                {ann.message}
              </p>
              <div className="mt-3 pt-3 border-t-2 border-border/20 flex items-center justify-between text-xs font-heading font-bold text-foreground/70">
                <span className="bg-main px-2 py-0.5 border border-border rounded-base text-main-foreground">Instructor</span>
                <span className="font-mono">{new Date(ann.sentAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
