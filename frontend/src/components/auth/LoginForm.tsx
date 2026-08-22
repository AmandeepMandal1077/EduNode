import { useState } from "react";
import { motion } from "motion/react";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEMO_CREDENTIALS } from "@/constants/auth";

interface LoginFormProps {
  email: string;
  setEmail: (e: string) => void;
  password: string;
  setPassword: (p: string) => void;
  role: string;
  setRole: (r: string) => void;
  loading: boolean;
  error: string | null;
  handleSubmit: (e: React.FormEvent) => void;
  onForgotPassword: () => void;
}

export function LoginForm({
  email,
  setEmail,
  password,
  setPassword,
  role,
  setRole,
  loading,
  error,
  handleSubmit,
  onForgotPassword,
}: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex gap-2 p-1 bg-secondary-background border-2 border-border rounded-base shadow-[2px_2px_0px_0px_#000]">
        <button
          type="button"
          onClick={() => setRole("student")}
          className={`flex-1 py-2 text-xs font-heading font-black rounded-base transition-all cursor-pointer border-2 ${
            role === "student"
              ? "bg-main text-main-foreground border-border shadow-[2px_2px_0px_0px_#000]"
              : "border-transparent text-foreground hover:bg-main/30"
          }`}
        >
          Sign In as Student
        </button>
        <button
          type="button"
          onClick={() => setRole("instructor")}
          className={`flex-1 py-2 text-xs font-heading font-black rounded-base transition-all cursor-pointer border-2 ${
            role === "instructor"
              ? "bg-main text-main-foreground border-border shadow-[2px_2px_0px_0px_#000]"
              : "border-transparent text-foreground hover:bg-main/30"
          }`}
        >
          Sign In as Instructor
        </button>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="login-email" className="text-sm font-heading font-bold text-foreground">
          Email Address
        </Label>
        <div className="relative flex items-center">
          <Mail className="w-4 h-4 text-foreground/60 absolute left-3 pointer-events-none z-10" />
          <Input
            id="login-email"
            type="email"
            placeholder={role === "instructor" ? DEMO_CREDENTIALS.instructor.email : DEMO_CREDENTIALS.student.email}
            value={email}
            maxLength={50}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="pl-9 bg-background"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between items-center">
          <Label htmlFor="login-password" className="text-sm font-heading font-bold text-foreground">
            Password
          </Label>
          <button
            type="button"
            onClick={onForgotPassword}
            className="text-xs font-heading font-bold text-foreground underline decoration-2 hover:bg-main/40 px-1 rounded-base cursor-pointer"
            tabIndex={-1}
          >
            Forgot password?
          </button>
        </div>
        <div className="relative flex items-center">
          <Lock className="w-4 h-4 text-foreground/60 absolute left-3 pointer-events-none z-10" />
          <Input
            id="login-password"
            type={showPassword ? "text" : "password"}
            placeholder={role === "instructor" ? DEMO_CREDENTIALS.instructor.password : DEMO_CREDENTIALS.student.password}
            value={password}
            maxLength={32}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="pl-9 pr-10 bg-background"
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="absolute right-2.5 p-1 text-foreground/60 hover:text-foreground cursor-pointer z-10"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
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
        size="lg"
        variant="default"
        className="w-full font-heading font-black text-base h-12 shadow-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none cursor-pointer mt-1"
        id="login-submit-btn"
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
        ) : (
          <ArrowRight className="w-5 h-5 mr-2" />
        )}
        {loading ? "Signing in..." : "Sign In"}
      </Button>
    </form>
  );
}
