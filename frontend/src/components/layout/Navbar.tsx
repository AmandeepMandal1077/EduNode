import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  GraduationCap,
  Menu,
  X,
  LogOut,
  User,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Explore", href: "/explore" },
  { label: "My Courses", href: "/my-courses", auth: true },
  { label: "Dashboard", href: "/dashboard", auth: true },
];

export function Navbar() {
  const { authenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    if (userMenuOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [userMenuOpen]);

  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <motion.header
      initial={{ y: -64, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={cn(
        "sticky top-0 z-40 w-full transition-all duration-300 border-b-4 border-border bg-secondary-background"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-8">
        <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-9 h-9 rounded-base bg-main border-2 border-border flex items-center justify-center shadow-[2px_2px_0px_0px_#000]">
            <GraduationCap className="w-5 h-5 text-main-foreground" />
          </div>
          <span className="font-heading font-black text-xl text-foreground tracking-tight">
            Edu<span className="bg-main px-1 py-0.5 border-2 border-border rounded-base ml-0.5 text-main-foreground shadow-[2px_2px_0px_0px_#000]">Node</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-2">
          {NAV_LINKS.filter((l) => !l.auth || authenticated).map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={cn(
                "px-3.5 py-1.5 rounded-base text-sm font-heading font-bold transition-all border-2",
                location.pathname === link.href
                  ? "bg-main text-main-foreground border-border shadow-[2px_2px_0px_0px_#000]"
                  : "border-transparent text-foreground hover:border-border hover:bg-main/30"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex-1" />

        <div className="flex items-center gap-2.5">
          <ThemeToggle />

          {authenticated ? (
            <>
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setUserMenuOpen((o) => !o)}
                  className="flex items-center gap-2 p-1 rounded-base border-2 border-border bg-background shadow-[2px_2px_0px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer"
                  aria-label="User menu"
                  aria-expanded={userMenuOpen}
                >
                  <Avatar className="w-7 h-7">
                    <AvatarImage src={user?.avatarUrl || ""} alt={user?.name || "User"} className="object-cover" />
                    <AvatarFallback>
                      {user?.name?.slice(0, 2).toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-heading font-bold text-foreground max-w-[100px] truncate hidden sm:inline">
                    {user?.name?.split(" ")[0]}
                  </span>
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 text-foreground transition-transform mr-1",
                      userMenuOpen && "rotate-180"
                    )}
                  />
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-56 bg-background rounded-base border-2 border-border shadow-shadow overflow-hidden py-1 z-50"
                    >
                      <div className="px-4 py-3 border-b-2 border-border bg-secondary-background">
                        <p className="text-sm font-heading font-bold text-foreground">{user?.name}</p>
                        <p className="text-xs font-base text-foreground/70 truncate">{user?.email}</p>
                      </div>
                      {[
                        ...(user?.role === "instructor" || user?.role === "admin"
                          ? [{ icon: GraduationCap, label: "Instructor Courses", href: "/instructor/courses" }]
                          : []),
                        { icon: User, label: "Profile", href: "/profile" },
                      ].map((item) => (
                        <Link
                          key={item.href}
                          to={item.href}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm font-heading font-bold text-foreground hover:bg-main hover:text-main-foreground transition-colors border-b border-border/20 last:border-0"
                        >
                          <item.icon className="w-4 h-4" />
                          {item.label}
                        </Link>
                      ))}
                      <div className="border-t-2 border-border mt-1">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-heading font-bold text-red-600 hover:bg-red-500 hover:text-white transition-colors cursor-pointer"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <>
              <Button variant="neutral" size="sm" asChild className="hidden sm:inline-flex font-heading font-bold">
                <Link to="/login">Sign In</Link>
              </Button>
              <Button
                variant="default"
                size="sm"
                asChild
                className="font-heading font-bold"
              >
                <Link to="/register">Get Started</Link>
              </Button>
            </>
          )}

          <button
            className="md:hidden p-2 rounded-base border-2 border-border bg-background shadow-[2px_2px_0px_0px_#000] text-foreground hover:bg-main hover:text-main-foreground cursor-pointer"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden bg-secondary-background border-t-2 border-border px-4 pb-4"
          >
            <nav className="flex flex-col gap-2 pt-3">
              {NAV_LINKS.filter((l) => !l.auth || authenticated).map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    "px-3 py-2 rounded-base text-sm font-heading font-bold border-2 transition-all",
                    location.pathname === link.href
                      ? "bg-main text-main-foreground border-border shadow-[2px_2px_0px_0px_#000]"
                      : "border-transparent text-foreground hover:bg-main/30"
                  )}
                >
                  {link.label}
                </Link>
              ))}
              {!authenticated && (
                <div className="flex gap-2 pt-2">
                  <Button variant="neutral" size="sm" asChild className="flex-1 font-heading font-bold">
                    <Link to="/login">Sign In</Link>
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    asChild
                    className="flex-1 font-heading font-bold"
                  >
                    <Link to="/register">Get Started</Link>
                  </Button>
                </div>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
