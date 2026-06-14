import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Camera, Save, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { updateUser } from "@/services/userService";
import type { User } from "@/types";

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
      console.error(err);
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
      className="bento-card flex flex-col gap-6"
    >
      <h2 className="text-lg font-bold text-slate-800">General Information</h2>


      <div className="flex items-center gap-4">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold text-white flex-shrink-0 overflow-hidden"
          style={{ background: "linear-gradient(135deg, #6366f1, #7c3aed)" }}
        >
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt={formName} className="w-full h-full object-cover" />
          ) : (
            formName?.slice(0, 2).toUpperCase() ?? "U"
          )}
        </div>
        <div>
          <Button variant="outline" size="sm" className="border-slate-200 rounded-lg text-sm">
            <Camera className="w-3.5 h-3.5 mr-1.5" />
            Change photo
          </Button>
          <p className="text-xs text-slate-400 mt-1">PNG, JPG or GIF. Max 5MB.</p>
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="profile-name" className="text-sm font-medium text-slate-700">Full Name</Label>
          {nameError && (
            <p className="text-xs text-rose-600 font-medium" id="profile-name-error">
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
            className={`rounded-xl border-slate-200 ${
              nameError ? "border-rose-500 focus-visible:ring-rose-500/20" : ""
            }`}
          />
        </div>
        <div className="flex flex-col gap-1.5 justify-center">
          <p className="text-sm font-medium text-slate-700">Email Address</p>
          <p className="text-sm text-slate-500">
            {user?.email ?? "Loading..."}
          </p>
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="profile-bio" className="text-sm font-medium text-slate-700">Bio</Label>
          <textarea
            id="profile-bio"
            value={formBio}
            onChange={(e) => setFormBio(e.target.value)}
            rows={3}
            maxLength={250}
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors"
            placeholder="Tell us about yourself..."
          />
          <span className="text-[10px] text-slate-400 text-right block mt-0.5">{formBio.length}/250</span>
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <p className="text-sm font-medium text-slate-700">Member Since</p>
          <p className="text-sm text-slate-500">
            {user ? new Date(user.joinedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "Loading..."}
          </p>
        </div>
      </div>

      {generalError && (
        <p className="text-sm text-rose-600 font-medium bg-rose-50 border border-rose-100 rounded-xl px-4 py-2.5">
          {generalError}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button
          onClick={handleSaveGeneral}
          disabled={saving}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold"
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
              className="flex items-center gap-1.5 text-emerald-600 text-sm font-medium"
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
