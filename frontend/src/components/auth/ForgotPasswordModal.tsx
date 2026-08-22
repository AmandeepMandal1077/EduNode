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
      <DialogContent className="sm:max-w-sm rounded-base p-6 border-4 border-border bg-background shadow-shadow">
        <AnimatePresence mode="wait">
          {sent ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center text-center gap-3 py-2"
            >
              <div className="w-14 h-14 rounded-base bg-main border-2 border-border flex items-center justify-center shadow-[3px_3px_0px_0px_#000]">
                <CheckCircle2 className="w-8 h-8 text-main-foreground" />
              </div>
              <div>
                <h2 className="text-lg font-heading font-black text-foreground">
                  Check Your Inbox
                </h2>
                <p className="text-sm font-base text-foreground/80 mt-1 leading-relaxed">
                  We sent a reset link to{" "}
                  <span className="font-heading font-bold text-foreground bg-main/30 px-1 border border-border rounded-base">{email}</span>.
                  <br />
                  It expires in 10 minutes.
                </p>
              </div>
              <Button
                variant="default"
                onClick={() => handleOpenChange(false)}
                className="mt-2 font-heading font-black px-6 cursor-pointer"
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
                <div className="w-11 h-11 rounded-base bg-main border-2 border-border flex items-center justify-center mb-2 shadow-[2px_2px_0px_0px_#000]">
                  <Mail className="w-5 h-5 text-main-foreground" />
                </div>
                <DialogTitle className="text-xl font-heading font-black text-foreground">
                  Forgot Your Password?
                </DialogTitle>
                <DialogDescription className="text-sm font-base text-foreground/70">
                  Enter your email and we'll send you a password reset link.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label
                    htmlFor="forgot-email"
                    className="text-sm font-heading font-bold text-foreground"
                  >
                    Email Address
                  </Label>
                  <div className="relative flex items-center">
                    <Mail className="w-4 h-4 text-foreground/60 absolute left-3 pointer-events-none z-10" />
                    <Input
                      id="forgot-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      maxLength={50}
                      className="pl-9 bg-background"
                    />
                  </div>
                </div>

                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm font-heading font-bold text-red-600 bg-red-100 border-2 border-red-500 rounded-base px-3 py-2 shadow-[2px_2px_0px_0px_#ef4444]"
                  >
                    {error}
                  </motion.p>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  variant="default"
                  className="h-11 font-heading font-black text-sm shadow-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none cursor-pointer mt-1"
                  id="forgot-password-submit"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <ArrowRight className="w-4 h-4 mr-2" />
                  )}
                  {loading ? "Sending…" : "Send Reset Link"}
                </Button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
