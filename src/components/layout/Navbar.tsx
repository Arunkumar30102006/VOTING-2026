import { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
// import { ModeToggle } from "@/components/mode-toggle";
import { Vote, Shield, Users, Building2, LogOut, ShieldCheck, Home } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import PillNav, { PillNavItem } from "@/components/ui/PillNav";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Check if current page is a protected portal
  const isPortalPage = location.pathname.includes("/company-dashboard") ||
    location.pathname.includes("/voting-management") ||
    location.pathname.includes("/voting-dashboard") ||
    location.pathname.includes("/ai-power-suite");

  useEffect(() => {
    checkAuth();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsLoggedIn(!!session);
  };

  const handleNavigation = useCallback((path: string) => {
    if (isPortalPage && isLoggedIn && (
      path === "/" ||
      path === "/company-register" ||
      path === "/shareholder-login" ||
      path === "/company-login"
    )) {
      setPendingPath(path);
      setShowLogoutAlert(true);
    } else {
      navigate(path);
    }
  }, [isPortalPage, isLoggedIn, navigate]);

  const confirmNavigation = async () => {
    if (pendingPath) {
      if (isLoggedIn) {
        await supabase.auth.signOut();
      }
      navigate(pendingPath);
      setPendingPath(null);
      setShowLogoutAlert(false);
    }
  };

  // Define Links - Reordered based on design to prioritize Home
  const navItems: PillNavItem[] = useMemo(() => [
    { label: "Home", href: "/", icon: <Home className="w-4 h-4" /> },
    { label: "About", href: "/about", icon: <Users className="w-4 h-4" /> },
    { label: "Security", href: "/security", icon: <ShieldCheck className="w-4 h-4" /> },
    { label: "Contact", href: "/contact", icon: <Shield className="w-4 h-4" /> },
    { label: "Company\u00A0Register", href: "/company-register", icon: <Building2 className="w-4 h-4" /> },
    { label: "Company\u00A0Portal", href: "/company-login", icon: <Building2 className="w-4 h-4" /> },
    { label: "Shareholder\u00A0Login", href: "/shareholder-login", icon: <Users className="w-4 h-4" /> },
  ].map(item => ({
    ...item,
    onClick: (e) => {
      e.preventDefault();
      handleNavigation(item.href);
    }
  })), [handleNavigation]);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 h-20 bg-black/40 backdrop-blur-xl border-b border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] transition-all duration-300">
        <div className="w-full h-full px-4 md:px-8 grid grid-cols-[auto_1fr_auto] items-center relative">

          {/* Left: Logo & Mode Toggle */}
          <div className="flex items-center gap-6 z-20 justify-self-start">
            <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
              <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Vote className="w-5 h-5 text-white" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#020817]"></div>
              </div>
              <div className="hidden 2xl:flex flex-col">
                <span className="text-xl font-bold tracking-tight text-white leading-none">
                  E-Vote <span className="text-blue-500">India</span>
                </span>
                <span className="text-[10px] font-medium text-slate-400 tracking-wide uppercase">
                  Secure Shareholder Voting
                </span>
              </div>
            </Link>
          </div>

          {/* Center: Link Pills - Grid Centered */}
          <div className="hidden md:flex justify-center items-center z-10 w-full">
            <PillNav
              items={navItems}
              activeHref={location.pathname}
              baseColor="transparent"
              pillColor="#1d4ed8"
              pillTextColor="#ffffff"
              textColor="#ffffff"
              hoveredPillTextColor="#ffffff"
            />
          </div>

          {/* Right: Empty for balance */}
          <div className="hidden md:flex items-center z-20 justify-self-end w-24">
            {/* Empty */}
          </div>

          {/* Mobile Menu Trigger (Visible only on mobile) */}
          <div className="md:hidden flex items-center gap-2 justify-self-end col-start-3">
            <PillNav
              items={navItems}
              activeHref={location.pathname}
              pillColor="#1d4ed8"
              pillTextColor="#fff"
              textColor="#fff"
            />
          </div>

        </div>
      </nav>

      <AlertDialog open={showLogoutAlert} onOpenChange={setShowLogoutAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave Company Portal?</AlertDialogTitle>
            <AlertDialogDescription>
              You are currently logged in. Navigating away will log you out of your current session.
              Are you sure you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingPath(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmNavigation} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              <LogOut className="w-4 h-4 mr-2" />
              Logout & Leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default Navbar;
