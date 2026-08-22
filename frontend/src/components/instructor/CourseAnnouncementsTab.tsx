import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Loader2, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { getCourseAnnouncements } from "@/services/courseService";
import { postAnnouncement, type BackendAnnouncement } from "@/api/courseApi";
import { getErrorMessage } from "@/utils/getErrorMessage";
import debug from "@/utils/debug";

interface CourseAnnouncementsTabProps {
  courseId: string;
}

export function CourseAnnouncementsTab({
  courseId,
}: CourseAnnouncementsTabProps) {
  const [announcements, setAnnouncements] = useState<BackendAnnouncement[]>([]);
  const [announcementMsg, setAnnouncementMsg] = useState("");
  const [postingAnn, setPostingAnn] = useState(false);
  const [annError, setAnnError] = useState("");

  useEffect(() => {
    getCourseAnnouncements(courseId).then(setAnnouncements).catch(debug);
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
      debug(err);
      setAnnError(getErrorMessage(err, "Failed to publish announcement."));
    } finally {
      setPostingAnn(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="flex flex-col gap-6"
    >
      <h2 className="text-xl font-heading font-black text-foreground mb-2">Announcements</h2>

      <form onSubmit={handlePostAnnouncement} className="flex flex-col gap-3">
        <Label
          htmlFor="announcement"
          className="text-sm font-heading font-bold text-foreground"
        >
          New Announcement Message
        </Label>
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
          className="w-full rounded-base border-2 border-border px-3 py-2.5 text-sm font-base bg-secondary-background resize-none focus:outline-hidden focus:ring-2 focus:ring-black transition-all"
        />
        <span className="text-[10px] font-mono text-foreground/60 text-right block">
          {announcementMsg.length}/500
        </span>
        {annError && (
          <p className="text-xs text-red-600 font-heading font-bold">{annError}</p>
        )}
        <Button
          type="submit"
          disabled={postingAnn}
          variant="default"
          size="lg"
          className="font-heading font-black shadow-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none ml-auto cursor-pointer"
        >
          {postingAnn ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Bell className="w-4 h-4 mr-2" />
          )}
          {postingAnn ? "Broadcasting..." : "Publish Announcement"}
        </Button>
      </form>

      <Separator />

      <div>
        <h3 className="font-heading font-black text-lg text-foreground mb-4">Broadcast History</h3>
        {announcements.length === 0 ? (
          <div className="text-center py-8 bg-secondary-background border-2 border-border rounded-base shadow-shadow">
            <p className="text-foreground/70 font-heading font-bold text-sm">
              No announcements broadcasted yet.
            </p>
          </div>
        ) : (
          <div className="h-[280px] sm:h-[320px] md:h-[420px] border-2 border-border rounded-base bg-secondary-background p-2 overflow-y-auto custom-scrollbar">
            <div className="flex flex-col gap-3">
              {announcements.map((ann) => (
                <div
                  key={ann._id}
                  className="p-4 bg-background border-2 border-border rounded-base shadow-[2px_2px_0px_0px_#000] flex flex-col gap-2"
                >
                  <p className="text-sm text-foreground font-base leading-relaxed whitespace-pre-wrap break-all">
                    {ann.message}
                  </p>
                  <span className="text-[10px] font-mono font-bold text-foreground/60 self-end">
                    {new Date(ann.sentAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
