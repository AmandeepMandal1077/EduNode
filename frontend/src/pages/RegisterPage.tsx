import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { GraduationCap, Mail, Lock, User, Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/store";
import { registerThunk, clearError } from "@/store/authSlice";

export function RegisterPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [showPassword, setShowPassword] = useState(false);

  const { loading, error } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await dispatch(registerThunk({ name, email, password, role }));
    if (registerThunk.fulfilled.match(result)) {
      navigate("/dashboard");
    }
  };

  const passwordStrength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
  const strengthLabel = ["", "Weak", "Good", "Strong"];
  const strengthColor = ["", "#ef4444", "#f59e0b", "#10b981"];

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: "linear-gradient(135deg, #eef2ff 0%, #f0fdf4 50%, #faf5ff 100%)" }}
    >
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-72 h-72 rounded-full blur-3xl opacity-40" style={{ background: "#c7d2fe" }} />
        <div className="absolute bottom-1/4 -right-32 w-72 h-72 rounded-full blur-3xl opacity-30" style={{ background: "#ddd6fe" }} />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
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

          <h1 className="text-2xl font-extrabold text-slate-900 text-center mb-1">
            Create your account
          </h1>
          <p className="text-sm text-slate-500 text-center mb-8">
            Start your learning journey today — it's free
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Role Selection Tabs */}
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

            {/* Name */}
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

            {/* Email */}
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

            {/* Password */}
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
                  className="p-3 text-slate-400 hover:text-slate-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {/* Strength bar */}
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
              className="bg-indigo-600 hover:bg-indigo-700 text-white h-11 rounded-xl font-semibold shadow-lg shadow-indigo-200 mt-1"
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

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-indigo-600 font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
