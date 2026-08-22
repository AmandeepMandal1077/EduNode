import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Shield, Check, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiChangePassword } from "@/api/userApi";

export function ProfileSecurityTab() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSaved, setPwSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSavePassword = async () => {
    setPwError("");
    if (!newPassword || newPassword.length < 8) {
      setPwError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword.length > 20) {
      setPwError("Password cannot exceed 20 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await apiChangePassword({ password: newPassword });
      setPwSaved(true);
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPwSaved(false), 2500);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to update password. Please try again.";
      setPwError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      key="security"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="bg-background border-4 border-border rounded-base p-6 sm:p-8 shadow-shadow flex flex-col gap-6"
    >
      <h2 className="text-xl font-heading font-black text-foreground">Security & Password</h2>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="security-new-pwd" className="text-sm font-heading font-bold text-foreground">
            New Password
          </Label>
          <div className="relative flex items-center">
            <Input
              id="security-new-pwd"
              type={showNewPwd ? "text" : "password"}
              value={newPassword}
              maxLength={20}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              className="bg-secondary-background pr-10"
            />
            <button
              type="button"
              onClick={() => setShowNewPwd((s) => !s)}
              className="absolute right-3 text-foreground/60 hover:text-foreground cursor-pointer z-10"
              aria-label="Toggle password"
            >
              {showNewPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="security-confirm-pwd" className="text-sm font-heading font-bold text-foreground">
            Confirm Password
          </Label>
          <Input
            id="security-confirm-pwd"
            type="password"
            value={confirmPassword}
            maxLength={20}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repeat new password"
            className="bg-secondary-background"
          />
        </div>

        {pwError && (
          <p className="text-sm font-heading font-bold text-red-600 bg-red-100 border-2 border-red-500 rounded-base px-3 py-2 shadow-[2px_2px_0px_0px_#ef4444]">
            {pwError}
          </p>
        )}

        <div className="flex items-center gap-3 mt-2">
          <Button
            onClick={handleSavePassword}
            disabled={loading}
            size="lg"
            variant="default"
            className="font-heading font-black shadow-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none cursor-pointer"
            id="security-save-btn"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Shield className="w-4 h-4 mr-2" />
            )}
            {loading ? "Updating…" : "Update Password"}
          </Button>
          <AnimatePresence>
            {pwSaved && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1.5 bg-main text-main-foreground border-2 border-border px-3 py-1.5 rounded-base text-sm font-heading font-bold shadow-[2px_2px_0px_0px_#000]"
              >
                <Check className="w-4 h-4" />
                Password Updated!
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
