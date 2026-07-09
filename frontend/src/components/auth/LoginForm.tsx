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
      <div className="flex gap-2 p-1 bg-slate-100/80 border border-slate-200/50 rounded-xl">
        <button
          type="button"
          onClick={() => setRole("student")}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            role === "student"
              ? "bg-white text-indigo-700 shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Sign In as Student
        </button>
        <button
          type="button"
          onClick={() => setRole("instructor")}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            role === "instructor"
              ? "bg-white text-indigo-700 shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Sign In as Instructor
        </button>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="login-email" className="text-sm font-medium text-slate-700">
          Email address
        </Label>
        <div className="input-glow rounded-xl border border-slate-200 flex items-center bg-white overflow-hidden">
          <Mail className="w-4 h-4 text-slate-400 ml-3 flex-shrink-0" />
          <Input
            id="login-email"
            type="email"
            placeholder={role === "instructor" ? DEMO_CREDENTIALS.instructor.email : DEMO_CREDENTIALS.student.email}
            value={email}
            maxLength={50}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="border-0 shadow-none focus-visible:ring-0 bg-transparent pl-2"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between items-center">
          <Label htmlFor="login-password" className="text-sm font-medium text-slate-700">
            Password
          </Label>
          <button
            type="button"
            onClick={onForgotPassword}
            className="text-xs text-indigo-600 hover:underline cursor-pointer"
            tabIndex={-1}
          >
            Forgot password?
          </button>
        </div>
        <div className="input-glow rounded-xl border border-slate-200 flex items-center bg-white overflow-hidden">
          <Lock className="w-4 h-4 text-slate-400 ml-3 flex-shrink-0" />
          <Input
            id="login-password"
            type={showPassword ? "text" : "password"}
            placeholder={role === "instructor" ? DEMO_CREDENTIALS.instructor.password : DEMO_CREDENTIALS.student.password}
            value={password}
            maxLength={32}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="border-0 shadow-none focus-visible:ring-0 bg-transparent pl-2"
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="p-3 text-slate-400 hover:text-slate-600 cursor-pointer"
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
          className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2"
        >
          {error}
        </motion.p>
      )}

      <Button
        type="submit"
        disabled={loading}
        className="bg-indigo-600 hover:bg-indigo-700 text-white h-11 rounded-xl font-semibold shadow-lg shadow-indigo-200 transition-all cursor-pointer"
        id="login-submit-btn"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
        ) : (
          <ArrowRight className="w-4 h-4 mr-2" />
        )}
        {loading ? "Signing in..." : "Sign In"}
      </Button>
    </form>
  );
}
