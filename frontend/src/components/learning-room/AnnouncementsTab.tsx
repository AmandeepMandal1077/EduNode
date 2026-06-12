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
          <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
        </div>
      ) : announcements.length === 0 ? (
        <div className="py-12 text-center bg-slate-50 border border-slate-100 rounded-2xl">
          <Bell className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No announcements yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {announcements.map((ann) => (
            <div key={ann.id} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap break-words text-sm">
                {ann.message}
              </p>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                <span>By Instructor</span>
                <span>{new Date(ann.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
