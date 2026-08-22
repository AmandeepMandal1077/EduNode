import { useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  GraduationCap,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiResetPassword } from "@/api/userApi";

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token") ?? "";
  const email = searchParams.get("email") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLinkValid = Boolean(token && email);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword.length > 20) {
      setError("Password cannot exceed 20 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await apiResetPassword({ email, token, newPassword });
      setSuccess(true);

      setTimeout(() => navigate("/login"), 3000);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Something went wrong. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 hero-gradient bg-secondary-background">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative w-full max-w-md"
      >
        <div className="bg-background border-4 border-border rounded-base shadow-shadow p-8 sm:p-10">
          <div className="flex items-center justify-center gap-2.5 mb-8">
            <div className="w-11 h-11 rounded-base bg-main border-2 border-border flex items-center justify-center shadow-[3px_3px_0px_0px_#000]">
              <GraduationCap className="w-6 h-6 text-main-foreground" />
            </div>
            <span className="font-heading font-black text-2xl text-foreground tracking-tight">
              Edu<span className="bg-main px-1.5 py-0.5 border-2 border-border rounded-base ml-1 text-main-foreground shadow-[2px_2px_0px_0px_#000]">Node</span>
            </span>
          </div>

          <AnimatePresence mode="wait">
            {!isLinkValid && (
              <motion.div
                key="invalid"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center text-center gap-4"
              >
                <div className="w-14 h-14 rounded-base bg-red-100 border-2 border-red-500 flex items-center justify-center shadow-[3px_3px_0px_0px_#ef4444]">
                  <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <div>
                  <h1 className="text-xl font-heading font-black text-foreground">Invalid Reset Link</h1>
                  <p className="text-sm font-base text-foreground/70 mt-1">
                    This link is missing required information. Please request a new password reset.
                  </p>
                </div>
                <Link
                  to="/login"
                  className="mt-1 font-heading font-bold text-foreground underline decoration-2 hover:bg-main px-2 py-1 rounded-base"
                >
                  Back to Sign In
                </Link>
              </motion.div>
            )}

            {isLinkValid && success && (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center text-center gap-4"
              >
                <div className="w-14 h-14 rounded-base bg-main border-2 border-border flex items-center justify-center shadow-[3px_3px_0px_0px_#000]">
                  <CheckCircle2 className="w-8 h-8 text-main-foreground" />
                </div>
                <div>
                  <h1 className="text-xl font-heading font-black text-foreground">Password Updated!</h1>
                  <p className="text-sm font-base text-foreground/70 mt-1">
                    Your password has been reset. Redirecting you to sign in…
                  </p>
                </div>
                <Link
                  to="/login"
                  className="mt-1 font-heading font-bold text-foreground underline decoration-2 hover:bg-main px-2 py-1 rounded-base"
                >
                  Sign in now
                </Link>
              </motion.div>
            )}

            {isLinkValid && !success && (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <h1 className="text-2xl font-heading font-black text-foreground text-center mb-1">
                  Set New Password
                </h1>
                <p className="text-sm font-base text-foreground/70 text-center mb-8">
                  Choose a strong password for{" "}
                  <span className="font-heading font-bold bg-main/30 px-1 border border-border rounded-base">{email}</span>
                </p>

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="rp-new" className="text-sm font-heading font-bold text-foreground">
                      New Password
                    </Label>
                    <div className="relative flex items-center">
                      <Lock className="w-4 h-4 text-foreground/60 absolute left-3 pointer-events-none z-10" />
                      <Input
                        id="rp-new"
                        type={showPwd ? "text" : "password"}
                        placeholder="Minimum 8 characters"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        maxLength={20}
                        className="pl-9 pr-10 bg-background"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPwd((s) => !s)}
                        className="absolute right-2.5 p-1 text-foreground/60 hover:text-foreground cursor-pointer z-10"
                        aria-label={showPwd ? "Hide password" : "Show password"}
                      >
                        {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="rp-confirm" className="text-sm font-heading font-bold text-foreground">
                      Confirm Password
                    </Label>
                    <div className="relative flex items-center">
                      <Lock className="w-4 h-4 text-foreground/60 absolute left-3 pointer-events-none z-10" />
                      <Input
                        id="rp-confirm"
                        type="password"
                        placeholder="Repeat new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        maxLength={20}
                        className="pl-9 bg-background"
                      />
                    </div>
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start gap-2 text-sm font-heading font-bold text-red-600 bg-red-100 border-2 border-red-500 rounded-base px-3 py-2 shadow-[2px_2px_0px_0px_#ef4444]"
                    >
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      {error}
                    </motion.div>
                  )}

                  <Button
                    type="submit"
                    disabled={loading}
                    variant="default"
                    size="lg"
                    className="w-full font-heading font-black text-base h-12 shadow-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none cursor-pointer"
                    id="reset-password-submit"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    ) : (
                      <ArrowRight className="w-5 h-5 mr-2" />
                    )}
                    {loading ? "Resetting…" : "Reset Password"}
                  </Button>
                </form>

                <p className="text-center text-sm font-base text-foreground/80 mt-6">
                  Remembered it?{" "}
                  <Link to="/login" className="font-heading font-black text-foreground underline decoration-2 hover:bg-main px-1 rounded-base transition-colors">
                    Sign in
                  </Link>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
