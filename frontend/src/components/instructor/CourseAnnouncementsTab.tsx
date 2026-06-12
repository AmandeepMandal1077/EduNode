import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Loader2, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { getCourseAnnouncements } from "@/services/courseService";
import { postAnnouncement, type BackendAnnouncement } from "@/api/courseApi";
import { getErrorMessage } from "@/utils/getErrorMessage";
import ScrollArea from "@/components/shadix-ui/components/smooth-scroll-area/scroll-area";

interface CourseAnnouncementsTabProps {
  courseId: string;
}

export function CourseAnnouncementsTab({ courseId }: CourseAnnouncementsTabProps) {
  const [announcements, setAnnouncements] = useState<BackendAnnouncement[]>([]);
  const [announcementMsg, setAnnouncementMsg] = useState("");
  const [postingAnn, setPostingAnn] = useState(false);
  const [annError, setAnnError] = useState("");

  useEffect(() => {
    getCourseAnnouncements(courseId).then(setAnnouncements).catch(console.error);
  }, [courseId]);

  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setAnnError("");
    if (!announcementMsg.trim()) {
      setAnnError("Announcement message cannot be empty.");
      return;
    }
    if (announcementMsg.length > 500) {
      setAnnError("Announcement cannot exceed 500 characters.");
      return;
    }

    try {
      setPostingAnn(true);
      await postAnnouncement(courseId, announcementMsg);
      setAnnouncementMsg("");
      const annData = await getCourseAnnouncements(courseId);
      setAnnouncements(annData);
    } catch (err: unknown) {
      console.error(err);
      setAnnError(getErrorMessage(err, "Failed to publish announcement."));
    } finally {
      setPostingAnn(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="flex flex-col gap-6">
      <h2 className="text-lg font-bold text-slate-900 mb-2">Announcements</h2>

      <form onSubmit={handlePostAnnouncement} className="flex flex-col gap-3">
        <Label htmlFor="announcement" className="text-sm font-medium text-slate-700">New Announcement Message</Label>
        <textarea
          id="announcement"
          value={announcementMsg}
          maxLength={500}
          onChange={(e) => {
            setAnnouncementMsg(e.target.value);
            if (annError) setAnnError("");
          }}
          placeholder="Write announcement message here to broadcast to all enrolled students..."
          rows={3}
          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors"
        />
        <span className="text-[10px] text-slate-400 text-right block">{announcementMsg.length}/500</span>
        {annError && <p className="text-xs text-rose-600 font-semibold">{annError}</p>}
        <Button type="submit" disabled={postingAnn} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold ml-auto">
          {postingAnn ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Bell className="w-4 h-4 mr-2" />}
          {postingAnn ? "Broadcasting..." : "Publish Announcement"}
        </Button>
      </form>

      <Separator />

      <div>
        <h3 className="font-bold text-slate-800 mb-4">Broadcast History</h3>
        {announcements.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
            <p className="text-slate-500 text-sm">No announcements broadcasted yet.</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[320px] border border-slate-100 rounded-xl bg-slate-50/50">
            <div className="flex flex-col gap-3 p-2">
              {announcements.map((ann) => (
                <div key={ann._id} className="p-4 bg-indigo-50/50 border border-indigo-100/50 rounded-xl flex flex-col gap-2">
                  <p className="text-sm text-slate-700 font-medium leading-relaxed whitespace-pre-wrap break-all">
                    {ann.message}
                  </p>
                  <span className="text-[10px] text-slate-400 font-medium self-end">
                    {new Date(ann.sentAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </motion.div>
  );
}
