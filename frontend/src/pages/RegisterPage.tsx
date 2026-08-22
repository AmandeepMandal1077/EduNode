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
            Create Your Account
          </h1>
          <p className="text-sm font-base text-foreground/70 text-center mb-8">
            Start your learning journey today — it's completely free
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

          <p className="text-center text-sm font-base text-foreground/80 mt-6">
            Already have an account?{" "}
            <Link to="/login" className="font-heading font-black text-foreground underline decoration-2 hover:bg-main px-1 rounded-base transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
