import { useState } from "react";
import { motion } from "motion/react";
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface RegisterFormProps {
  name: string;
  setName: (n: string) => void;
  email: string;
  setEmail: (e: string) => void;
  password: string;
  setPassword: (p: string) => void;
  role: string;
  setRole: (r: string) => void;
  loading: boolean;
  error: string | null;
  handleSubmit: (e: React.FormEvent) => void;
}

export function RegisterForm({
  name,
  setName,
  email,
  setEmail,
  password,
  setPassword,
  role,
  setRole,
  loading,
  error,
  handleSubmit,
}: RegisterFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  const passwordStrength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
  const strengthLabel = ["", "Weak", "Good", "Strong"];
  const strengthColor = ["", "#ef4444", "#f59e0b", "#10b981"];

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
          Register as Student
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
          Register as Instructor
        </button>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="register-name" className="text-sm font-medium text-slate-700">
          Full name
        </Label>
        <div className="input-glow rounded-xl border border-slate-200 flex items-center bg-white overflow-hidden">
          <User className="w-4 h-4 text-slate-400 ml-3 flex-shrink-0" />
          <Input
            id="register-name"
            type="text"
            placeholder="Amandeep Mandal"
            value={name}
            maxLength={50}
            onChange={(e) => setName(e.target.value)}
            required
            className="border-0 shadow-none focus-visible:ring-0 bg-transparent pl-2"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="register-email" className="text-sm font-medium text-slate-700">
          Email address
        </Label>
        <div className="input-glow rounded-xl border border-slate-200 flex items-center bg-white overflow-hidden">
          <Mail className="w-4 h-4 text-slate-400 ml-3 flex-shrink-0" />
          <Input
            id="register-email"
            type="email"
            placeholder="you@example.com"
            value={email}
            maxLength={50}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="border-0 shadow-none focus-visible:ring-0 bg-transparent pl-2"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="register-password" className="text-sm font-medium text-slate-700">
          Password
        </Label>
        <div className="input-glow rounded-xl border border-slate-200 flex items-center bg-white overflow-hidden">
          <Lock className="w-4 h-4 text-slate-400 ml-3 flex-shrink-0" />
          <Input
            id="register-password"
            type={showPassword ? "text" : "password"}
            placeholder="Minimum 8 characters"
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
        
        {password.length > 0 && (
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 flex gap-1">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className="h-1 flex-1 rounded-full transition-all duration-300"
                  style={{
                    background: s <= passwordStrength ? strengthColor[passwordStrength] : "#e2e8f0",
                  }}
                />
              ))}
            </div>
            <span className="text-xs font-medium" style={{ color: strengthColor[passwordStrength] }}>
              {strengthLabel[passwordStrength]}
            </span>
          </div>
        )}
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
        className="bg-indigo-600 hover:bg-indigo-700 text-white h-11 rounded-xl font-semibold shadow-lg shadow-indigo-200 mt-1 cursor-pointer"
        id="register-submit-btn"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
        ) : (
          <ArrowRight className="w-4 h-4 mr-2" />
        )}
        {loading ? "Creating account..." : "Create Account"}
      </Button>
    </form>
  );
}
