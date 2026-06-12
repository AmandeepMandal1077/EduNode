import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { GraduationCap } from "lucide-react";

import { useLogin } from "@/hooks/useLogin";
import { LoginForm } from "@/components/auth/LoginForm";
import { ForgotPasswordModal } from "@/components/auth/ForgotPasswordModal";

export function LoginPage() {
  const {
    email,
    setEmail,
    password,
    setPassword,
    role,
    setRole,
    loading,
    error,
    handleSubmit,
  } = useLogin();

  const [forgotOpen, setForgotOpen] = useState(false);

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
            Welcome back
          </h1>
          <p className="text-sm text-slate-500 text-center mb-8">
            Sign in to continue your learning journey
          </p>

          <LoginForm
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            role={role}
            setRole={setRole}
            loading={loading}
            error={error}
            handleSubmit={handleSubmit}
            onForgotPassword={() => setForgotOpen(true)}
          />

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-slate-100" />
            <span className="text-xs text-slate-400">or</span>
            <div className="flex-1 h-px bg-slate-100" />
          </div>

          <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 mb-6">
            <p className="text-xs text-indigo-700 text-center">
              <strong>Demo:</strong> Use any email and any password (min 6 chars)
            </p>
          </div>

          <p className="text-center text-sm text-slate-500">
            Don't have an account?{" "}
            <Link to="/register" className="text-indigo-600 font-semibold hover:underline">
              Sign up free
            </Link>
          </p>
        </div>
      </motion.div>

      <ForgotPasswordModal
        open={forgotOpen}
        defaultEmail={email}
        onClose={() => setForgotOpen(false)}
      />
    </div>
  );
}


