import type { ReactNode } from "react";
import { Navbar } from "./Navbar";

interface AppLayoutProps {
  children: ReactNode;
  hideNav?: boolean;
}

export function AppLayout({ children, hideNav = false }: AppLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {!hideNav && <Navbar />}
      <main className="flex-1">{children}</main>
    </div>
  );
}
