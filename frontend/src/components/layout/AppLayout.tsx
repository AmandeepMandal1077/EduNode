import type { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { SmoothScrollProvider } from "@/components/smooth-scroll-area";

interface AppLayoutProps {
  children: ReactNode;
  hideNav?: boolean;
}

export function AppLayout({ children, hideNav = false }: AppLayoutProps) {
  return (
    <SmoothScrollProvider>
      <div className="min-h-screen flex flex-col bg-slate-50">
        {!hideNav && <Navbar />}
        <main className="flex-1">{children}</main>
      </div>
    </SmoothScrollProvider>
  );
}
