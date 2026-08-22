import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Camera, Save, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { updateUser } from "@/services/userService";
import { requestAndUpload, waitForUploadReady } from "@/services/mediaService";
import { getErrorMessage } from "@/utils/getErrorMessage";
import type { User } from "@/types";
import debug from "@/utils/debug";

interface ProfileGeneralTabProps {
  user: User | null;
  setUser: (u: User) => void;
}

export function ProfileGeneralTab({ user, setUser }: ProfileGeneralTabProps) {
  const [formName, setFormName] = useState("");
  const [formBio, setFormBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [nameError, setNameError] = useState("");
  const [generalError, setGeneralError] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (user) {
      setFormName(user.name);
      setFormBio(user.bio || "");
    }
  }, [user]);

  const handleSaveGeneral = async () => {
    setNameError("");
    setGeneralError("");

    let hasError = false;
    if (!formName.trim()) {
      setNameError("Name cannot be empty.");
      hasError = true;
    } else if (formName.length > 50) {
      setNameError("Name cannot exceed 50 characters.");
      hasError = true;
    }

    if (formBio.length > 250) {
      setGeneralError("Bio cannot exceed 250 characters.");
      hasError = true;
    }

    if (hasError) return;

    try {
      setSaving(true);
      const updated = await updateUser({ name: formName, bio: formBio });
      setUser(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      debug(err);
      setGeneralError("Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      key="general"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="bg-background border-4 border-border rounded-base p-6 sm:p-8 shadow-shadow flex flex-col gap-6"
    >
      <h2 className="text-xl font-heading font-black text-foreground">General Information</h2>

      <div className="flex items-center gap-4">
        <div
          className="w-16 h-16 rounded-base border-2 border-border bg-main text-main-foreground flex items-center justify-center text-xl font-heading font-black flex-shrink-0 overflow-hidden shadow-[2px_2px_0px_0px_#000]"
        >
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt={formName} className="w-full h-full object-cover" />
          ) : (
            formName?.slice(0, 2).toUpperCase() ?? "U"
          )}
        </div>
        <div>
          <Button 
            variant="neutral" 
            size="sm" 
            className="font-heading font-bold cursor-pointer"
            onClick={() => {
              if (!uploadingAvatar) {
                document.getElementById("avatar-upload")?.click();
              }
            }}
            disabled={uploadingAvatar}
          >
            {uploadingAvatar ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Camera className="w-3.5 h-3.5 mr-1.5" />}
            {uploadingAvatar ? "Uploading..." : "Change Photo"}
          </Button>
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file || !user) return;
              try {
                setUploadingAvatar(true);
                const { uploadSessionId } = await requestAndUpload(
                  "avatar",
                  user.id,
                  file
                );
                const statusObj = await waitForUploadReady(uploadSessionId);
                if (statusObj.status === "READY" || statusObj.status === "UPLOADED") {
                  setUser({ ...user, avatarUrl: statusObj.finalUrl });
                } else {
                  setGeneralError(`Upload failed with status: ${statusObj.status}`);
                }
              } catch (err: unknown) {
                debug(err);
                setGeneralError(getErrorMessage(err));
              } finally {
                setUploadingAvatar(false);
                e.target.value = "";
              }
            }}
          />
          <p className="text-xs font-base text-foreground/60 mt-1">PNG, JPG or GIF. Max 5MB.</p>
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="profile-name" className="text-sm font-heading font-bold text-foreground">Full Name</Label>
          {nameError && (
            <p className="text-xs text-red-600 font-heading font-bold" id="profile-name-error">
              {nameError}
            </p>
          )}
          <Input
            id="profile-name"
            value={formName}
            maxLength={50}
            onChange={(e) => {
              setFormName(e.target.value);
              if (nameError) setNameError("");
            }}
            className={`bg-secondary-background ${
              nameError ? "border-red-500" : ""
            }`}
          />
        </div>
        <div className="flex flex-col gap-1.5 justify-center">
          <p className="text-sm font-heading font-bold text-foreground">Email Address</p>
          <p className="text-sm font-mono text-foreground/70">
            {user?.email ?? "Loading..."}
          </p>
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="profile-bio" className="text-sm font-heading font-bold text-foreground">Bio</Label>
          <textarea
            id="profile-bio"
            value={formBio}
            onChange={(e) => setFormBio(e.target.value)}
            rows={3}
            maxLength={250}
            className="w-full rounded-base border-2 border-border px-3 py-2.5 text-sm font-base bg-secondary-background resize-none focus:outline-hidden focus:ring-2 focus:ring-black transition-all"
            placeholder="Tell us about yourself..."
          />
          <span className="text-[10px] font-mono text-foreground/60 text-right block mt-0.5">{formBio.length}/250</span>
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <p className="text-sm font-heading font-bold text-foreground">Member Since</p>
          <p className="text-sm font-base text-foreground/70">
            {user ? new Date(user.joinedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "Loading..."}
          </p>
        </div>
      </div>

      {generalError && (
        <p className="text-sm text-red-600 font-heading font-bold bg-red-100 border-2 border-red-500 rounded-base px-4 py-2.5 shadow-[2px_2px_0px_0px_#ef4444]">
          {generalError}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button
          onClick={handleSaveGeneral}
          disabled={saving}
          size="lg"
          variant="default"
          className="font-heading font-black shadow-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none cursor-pointer"
          id="profile-save-btn"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          {saving ? "Saving..." : "Save Changes"}
        </Button>
        <AnimatePresence>
          {saved && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1.5 bg-main text-main-foreground border-2 border-border px-3 py-1.5 rounded-base text-sm font-heading font-bold shadow-[2px_2px_0px_0px_#000]"
            >
              <Check className="w-4 h-4" />
              Saved!
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
