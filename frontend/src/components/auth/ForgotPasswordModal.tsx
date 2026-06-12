import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mail, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { apiForgotPassword } from "@/api/userApi";

interface ForgotPasswordModalProps {
  open: boolean;
  defaultEmail?: string;
  onClose: () => void;
}

export function ForgotPasswordModal({
  open,
  defaultEmail = "",
  onClose,
}: ForgotPasswordModalProps) {
  const [email, setEmail] = useState(defaultEmail);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiForgotPassword(email.trim());
      setSent(true);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Something went wrong. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) {
      setSent(false);
      setError(null);
      setEmail(defaultEmail);
      onClose();
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm rounded-2xl p-6">
        <AnimatePresence mode="wait">
          {sent ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center text-center gap-3 py-2"
            >
              <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-green-500" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Check your inbox
                </h2>
                <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                  We sent a reset link to{" "}
                  <span className="font-semibold text-slate-700">{email}</span>.
                  <br />
                  It expires in 10 minutes.
                </p>
              </div>
              <Button
                onClick={() => handleOpenChange(false)}
                className="mt-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-6 cursor-pointer"
              >
                Done
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <DialogHeader className="mb-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center mb-2">
                  <Mail className="w-5 h-5 text-indigo-600" />
                </div>
                <DialogTitle className="text-base font-bold text-slate-900">
                  Forgot your password?
                </DialogTitle>
                <DialogDescription className="text-sm text-slate-500">
                  Enter your email and we'll send you a reset link.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label
                    htmlFor="forgot-email"
                    className="text-sm font-medium text-slate-700"
                  >
                    Email address
                  </Label>
                  <div className="rounded-xl border border-slate-200 flex items-center bg-white overflow-hidden focus-within:ring-2 focus-within:ring-indigo-300 transition-all">
                    <Mail className="w-4 h-4 text-slate-400 ml-3 flex-shrink-0" />
                    <Input
                      id="forgot-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      maxLength={50}
                      className="border-0 shadow-none focus-visible:ring-0 bg-transparent pl-2"
                    />
                  </div>
                </div>

                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2"
                  >
                    {error}
                  </motion.p>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white h-10 rounded-xl font-semibold shadow-md shadow-indigo-100 transition-all cursor-pointer"
                  id="forgot-password-submit"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <ArrowRight className="w-4 h-4 mr-2" />
                  )}
                  {loading ? "Sending…" : "Send reset link"}
                </Button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
