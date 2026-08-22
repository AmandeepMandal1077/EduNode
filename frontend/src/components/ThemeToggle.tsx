import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`p-2 rounded-base border-2 border-border bg-background text-foreground shadow-[2px_2px_0px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer flex items-center justify-center h-9 w-9 flex-shrink-0 ${
        className || ""
      }`}
      aria-label="Toggle theme"
      title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
      id="theme-toggle-btn"
    >
      {theme === "dark" ? (
        <Sun className="w-4 h-4 text-main fill-main stroke-border stroke-[1.5]" />
      ) : (
        <Moon className="w-4 h-4 text-foreground fill-foreground/20" />
      )}
    </button>
  );
}
