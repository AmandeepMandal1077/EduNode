import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { GraduationCap } from "lucide-react";

import { useRegister } from "@/hooks/useRegister";
import { RegisterForm } from "@/components/auth/RegisterForm";

export function RegisterPage() {
  const {
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
  } = useRegister();

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

          <RegisterForm
            name={name}
            setName={setName}
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            role={role}
            setRole={setRole}
            loading={loading}
            error={error}
            handleSubmit={handleSubmit}
          />

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
