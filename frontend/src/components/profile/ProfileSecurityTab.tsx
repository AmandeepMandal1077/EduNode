import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Shield, Check, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
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
      className="bento-card flex flex-col gap-6"
    >
      <h2 className="text-lg font-bold text-slate-800">Security</h2>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="security-new-pwd" className="text-sm font-medium text-slate-700">
            New Password
          </Label>
          <div className="relative">
            <Input
              id="security-new-pwd"
              type={showNewPwd ? "text" : "password"}
              value={newPassword}
              maxLength={20}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              className="rounded-xl border-slate-200 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowNewPwd((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              aria-label="Toggle password"
            >
              {showNewPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="security-confirm-pwd" className="text-sm font-medium text-slate-700">
            Confirm Password
          </Label>
          <Input
            id="security-confirm-pwd"
            type="password"
            value={confirmPassword}
            maxLength={20}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repeat new password"
            className="rounded-xl border-slate-200"
          />
        </div>

        {pwError && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {pwError}
          </p>
        )}

        <div className="flex items-center gap-3">
          <Button
            onClick={handleSavePassword}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold cursor-pointer"
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
                className="flex items-center gap-1.5 text-emerald-600 text-sm font-medium"
              >
                <Check className="w-4 h-4" />
                Updated!
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
