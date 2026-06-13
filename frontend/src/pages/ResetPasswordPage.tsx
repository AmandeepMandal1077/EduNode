import { useState, useEffect } from "react";
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
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{
        background: "linear-gradient(135deg, #eef2ff 0%, #f0fdf4 50%, #faf5ff 100%)",
      }}
    >

      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/4 -left-32 w-72 h-72 rounded-full blur-3xl opacity-40"
          style={{ background: "#c7d2fe" }}
        />
        <div
          className="absolute bottom-1/4 -right-32 w-72 h-72 rounded-full blur-3xl opacity-30"
          style={{ background: "#ddd6fe" }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative w-full max-w-md"
      >
        <div className="glass rounded-3xl shadow-2xl p-8 sm:p-10">

          <div className="flex items-center justify-center gap-2.5 mb-8">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-slate-800 tracking-tight">
              Edu<span className="text-indigo-600">Node</span>
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
                <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
                  <AlertCircle className="w-7 h-7 text-red-500" />
                </div>
                <div>
                  <h1 className="text-xl font-extrabold text-slate-900">Invalid reset link</h1>
                  <p className="text-sm text-slate-500 mt-1">
                    This link is missing required information. Please request a new password reset.
                  </p>
                </div>
                <Link
                  to="/login"
                  className="mt-1 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:underline"
                >
                  Back to sign in
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
                <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7 text-green-500" />
                </div>
                <div>
                  <h1 className="text-xl font-extrabold text-slate-900">Password updated!</h1>
                  <p className="text-sm text-slate-500 mt-1">
                    Your password has been reset. Redirecting you to sign in…
                  </p>
                </div>
                <Link
                  to="/login"
                  className="mt-1 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:underline"
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
                <h1 className="text-2xl font-extrabold text-slate-900 text-center mb-1">
                  Set new password
                </h1>
                <p className="text-sm text-slate-500 text-center mb-8">
                  Choose a strong password for{" "}
                  <span className="font-medium text-slate-700">{email}</span>
                </p>

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="rp-new" className="text-sm font-medium text-slate-700">
                      New Password
                    </Label>
                    <div className="input-glow rounded-xl border border-slate-200 flex items-center bg-white overflow-hidden">
                      <Lock className="w-4 h-4 text-slate-400 ml-3 flex-shrink-0" />
                      <Input
                        id="rp-new"
                        type={showPwd ? "text" : "password"}
                        placeholder="Minimum 8 characters"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        maxLength={20}
                        className="border-0 shadow-none focus-visible:ring-0 bg-transparent pl-2"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPwd((s) => !s)}
                        className="p-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                        aria-label={showPwd ? "Hide password" : "Show password"}
                      >
                        {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>


                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="rp-confirm" className="text-sm font-medium text-slate-700">
                      Confirm Password
                    </Label>
                    <div className="input-glow rounded-xl border border-slate-200 flex items-center bg-white overflow-hidden">
                      <Lock className="w-4 h-4 text-slate-400 ml-3 flex-shrink-0" />
                      <Input
                        id="rp-confirm"
                        type="password"
                        placeholder="Repeat new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        maxLength={20}
                        className="border-0 shadow-none focus-visible:ring-0 bg-transparent pl-2"
                      />
                    </div>
                  </div>


                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2"
                    >
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      {error}
                    </motion.div>
                  )}

                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white h-11 rounded-xl font-semibold shadow-lg shadow-indigo-200 transition-all cursor-pointer"
                    id="reset-password-submit"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <ArrowRight className="w-4 h-4 mr-2" />
                    )}
                    {loading ? "Resetting…" : "Reset Password"}
                  </Button>
                </form>

                <p className="text-center text-sm text-slate-500 mt-6">
                  Remembered it?{" "}
                  <Link to="/login" className="text-indigo-600 font-semibold hover:underline">
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
