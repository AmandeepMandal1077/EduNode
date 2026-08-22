import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { GraduationCap } from "lucide-react";

import { useLogin } from "@/hooks/useLogin";
import { LoginForm } from "@/components/auth/LoginForm";
import { ForgotPasswordModal } from "@/components/auth/ForgotPasswordModal";
import { DEMO_CREDENTIALS } from "@/constants/auth";

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

  const handleFillCredentials = (type: "student" | "instructor") => {
    const creds = DEMO_CREDENTIALS[type];
    setRole(type);
    setEmail(creds.email);
    setPassword(creds.password);
  };

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

          <h1 className="text-2xl font-heading font-black text-foreground text-center mb-1">
            Welcome Back
          </h1>
          <p className="text-sm font-base text-foreground/70 text-center mb-8">
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
            <div className="flex-1 h-0.5 bg-border" />
            <span className="text-xs font-heading font-bold text-foreground uppercase">or</span>
            <div className="flex-1 h-0.5 bg-border" />
          </div>

          <div className="bg-secondary-background border-2 border-border rounded-base p-4 mb-6 shadow-[2px_2px_0px_0px_#000]">
            <p className="text-xs font-heading font-black text-foreground mb-2.5 text-center">
              💡 Quick Demo Login (Click to Autofill)
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleFillCredentials("student")}
                className="flex flex-col items-center justify-center p-2 rounded-base bg-background border-2 border-border hover:bg-main hover:translate-x-0.5 hover:translate-y-0.5 transition-all cursor-pointer text-foreground shadow-[2px_2px_0px_0px_#000]"
              >
                <span className="font-heading font-black text-[10px] uppercase tracking-wider">Student</span>
                <span className="font-mono text-[9px] mt-0.5 truncate max-w-full">{DEMO_CREDENTIALS.student.email}</span>
              </button>
              <button
                type="button"
                onClick={() => handleFillCredentials("instructor")}
                className="flex flex-col items-center justify-center p-2 rounded-base bg-background border-2 border-border hover:bg-main hover:translate-x-0.5 hover:translate-y-0.5 transition-all cursor-pointer text-foreground shadow-[2px_2px_0px_0px_#000]"
              >
                <span className="font-heading font-black text-[10px] uppercase tracking-wider">Instructor</span>
                <span className="font-mono text-[9px] mt-0.5 truncate max-w-full">{DEMO_CREDENTIALS.instructor.email}</span>
              </button>
            </div>
            <p className="text-[10px] font-base text-foreground/80 text-center mt-2.5">
              Password: <span className="font-mono font-bold bg-main px-1.5 py-0.5 rounded-base border border-border">{DEMO_CREDENTIALS.student.password}</span>
            </p>
          </div>

          <p className="text-center text-sm font-base text-foreground/80">
            Don't have an account?{" "}
            <Link to="/register" className="font-heading font-black text-foreground underline decoration-2 hover:bg-main px-1 rounded-base transition-colors">
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
