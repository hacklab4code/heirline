import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { useTheme } from "next-themes";
import { ArrowRight, HeartHandshake, LogOut, Menu, Moon, Sun, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getPublicPlanLabel, normalizePlanKey } from "@/lib/app-shared";

const ThemeToggle = () => {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme !== "light";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative text-neutral-400 hover:bg-white/5 hover:text-white"
      aria-label="Cambia tema"
    >
      <Sun className={`h-5 w-5 transition-all ${isDark ? "scale-0 rotate-90" : "scale-100 rotate-0"}`} />
      <Moon className={`absolute h-5 w-5 transition-all ${isDark ? "scale-100 rotate-0" : "scale-0 -rotate-90"}`} />
    </Button>
  );
};

export const Navbar = ({ isAuthenticated, user, onLogout }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === "/";
  const isAuthScreen = ["/login", "/register"].includes(location.pathname);
  const publicLinks = useMemo(
    () => [
      { label: "Funzionalita", sectionId: "features" },
      { label: "Prezzi", sectionId: "pricing" },
    ],
    [],
  );

  const planBadgeClass = normalizePlanKey(user?.plan) === "elite"
    ? "badge-team"
    : normalizePlanKey(user?.plan) === "gold"
      ? "badge-pro"
      : "badge-otp";

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const goTo = (path) => {
    setMenuOpen(false);
    navigate(path);
  };

  const scrollToSection = (sectionId) => {
    setMenuOpen(false);

    const performScroll = () => {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    if (!isHome) {
      navigate("/");
      window.setTimeout(performScroll, 120);
      return;
    }

    performScroll();
  };

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        className={`navbar ${scrolled ? "scrolled" : ""}`}
        data-testid="navbar"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-3"
              onClick={() => goTo(isAuthenticated ? "/dashboard" : "/")}
              aria-label="Vai alla home di Heirline"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-teal-500/30 bg-gradient-to-br from-teal-500/30 to-teal-600/10">
                <HeartHandshake className="h-5 w-5 text-teal-400" />
              </div>
              <span className="font-display text-xl font-bold tracking-tight text-white">Heirline</span>
            </motion.button>

            <div className="hidden items-center gap-8 md:flex">
              {!isAuthenticated ? publicLinks.map((item) => (
                <button
                  key={item.sectionId}
                  type="button"
                  onClick={() => scrollToSection(item.sectionId)}
                  className="nav-link"
                >
                  {item.label}
                </button>
              )) : null}

              {isAuthenticated ? (
                <div className="flex items-center gap-4">
                  <Button variant="ghost" onClick={() => goTo("/dashboard")} className="text-neutral-300 hover:bg-white/5 hover:text-white">
                    Dashboard
                  </Button>
                  <Badge className={planBadgeClass}>
                    {getPublicPlanLabel(user?.plan).toUpperCase()}
                  </Badge>
                  <ThemeToggle />
                  <Button variant="ghost" onClick={onLogout} className="text-neutral-400 hover:bg-red-500/10 hover:text-red-400" aria-label="Esci">
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <ThemeToggle />
                  {!isAuthScreen ? (
                    <>
                      <Button variant="ghost" onClick={() => goTo("/login")} className="text-neutral-300 hover:bg-white/5 hover:text-white">
                        Accedi
                      </Button>
                      <Button onClick={() => goTo("/register")} className="btn-teal">
                        <span>Inizia ora</span>
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <Button variant="ghost" onClick={() => goTo("/")} className="text-neutral-300 hover:bg-white/5 hover:text-white">
                      Home
                    </Button>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 md:hidden">
              <ThemeToggle />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMenuOpen(true)}
                className="text-white hover:bg-white/5"
                aria-label="Apri menu"
                aria-controls="mobile-menu"
                aria-expanded={menuOpen}
              >
                <Menu className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </div>
      </motion.nav>

      <AnimatePresence>
        {menuOpen ? (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="mobile-menu"
          >
            <motion.button
              type="button"
              initial={{ opacity: 0, rotate: -90 }}
              animate={{ opacity: 1, rotate: 0 }}
              transition={{ delay: 0.1 }}
              className="absolute right-4 top-4 p-2 text-white"
              onClick={() => setMenuOpen(false)}
              aria-label="Chiudi menu"
            >
              <X className="h-6 w-6" />
            </motion.button>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="flex flex-col items-center gap-8"
            >
              {isAuthenticated ? (
                <>
                  <button type="button" onClick={() => goTo("/dashboard")} className="mobile-menu-item">
                    Dashboard
                  </button>
                  <button type="button" onClick={() => { onLogout(); setMenuOpen(false); }} className="mobile-menu-item text-red-400">
                    Esci
                  </button>
                </>
              ) : (
                <>
                  <button type="button" onClick={() => goTo("/login")} className="mobile-menu-item">
                    Accedi
                  </button>
                  <button type="button" onClick={() => goTo("/register")} className="mobile-menu-item">
                    Crea account
                  </button>
                  <button type="button" onClick={() => scrollToSection("features")} className="mobile-menu-item">
                    Funzionalita
                  </button>
                  <button type="button" onClick={() => scrollToSection("pricing")} className="mobile-menu-item text-teal-400">
                    Vedi piani
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
};
