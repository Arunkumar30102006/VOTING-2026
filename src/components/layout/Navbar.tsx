import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { Menu, X, Vote, Shield, Users, Building2, LogOut, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
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

    // Subscribe to auth changes to keep state in sync
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsLoggedIn(!!session);
  };

  const handleNavigation = (path: string) => {
    // If we are in a portal page and trying to go to login/register/home pages
    // AND we are logged in, show confirmation
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
      setIsOpen(false);
    }
  };

  const confirmNavigation = async () => {
    if (pendingPath) {
      if (isLoggedIn) {
        // Optional: Sign out if they confirm leaving the portal to a login page?
        // For now, let's just allow navigation. The user might want to check the homepage without logging out.
        // BUT the user request specifically said "ARE YOUR SURE YOU WANT LOGOUT". 
        // So checking the prompt text implies they might lose session or just context switch.
        // If they go to "/shareholder-login" while logged in as company, it might handle state weirdly 
        // unless we force logout. Let's force logout to be safe if switching contexts.
        await supabase.auth.signOut();
      }
      navigate(pendingPath);
      setPendingPath(null);
      setShowLogoutAlert(false);
      setIsOpen(false);
    }
  };

  const navLinks = [
    { href: "/", label: "Home", icon: Vote },
    { href: "/about", label: "About", icon: Users },
    { href: "/security", label: "Security", icon: ShieldCheck },
    { href: "/contact", label: "Contact", icon: Shield },
    { href: "/company-register", label: "Company Register", icon: Building2 },
    { href: "/shareholder-login", label: "Shareholder Login", icon: Users },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <div
              className="flex items-center gap-3 group cursor-pointer"
              onClick={() => handleNavigation("/")}
            >
              <div className="relative">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-medium group-hover:shadow-glow transition-shadow duration-300">
                  <Vote className="w-5 h-5 md:w-6 md:h-6 text-primary-foreground" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full animate-pulse" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg md:text-xl font-bold text-foreground">
                  E-Vote <span className="text-secondary">India</span>
                </h1>
                <p className="text-[10px] md:text-xs text-muted-foreground -mt-0.5">
                  Secure Shareholder Voting
                </p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-2">
              <ModeToggle />
              {navLinks.map((link) => (
                <Button
                  key={link.href}
                  variant={isActive(link.href) ? "default" : "ghost"}
                  size="sm"
                  className="gap-2"
                  onClick={() => handleNavigation(link.href)}
                >
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </Button>
              ))}
              <Button
                variant="ghost"
                size="sm"
                className="gap-2"
                onClick={() => handleNavigation("/company-login")}
              >
                <Building2 className="w-4 h-4" />
                Company Portal
              </Button>
              <Button
                variant="saffron"
                size="sm"
                className="ml-2 gap-2"
                onClick={() => handleNavigation("/shareholder-login")}
              >
                <Shield className="w-4 h-4" />
                Login to Vote
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center gap-2 md:hidden">
              <ModeToggle />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(!isOpen)}
              >
                {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isOpen && (
            <div className="md:hidden pb-4 animate-fade-in-up">
              <div className="flex flex-col gap-2">
                {navLinks.map((link, index) => (
                  <Button
                    key={link.href}
                    variant={isActive(link.href) ? "default" : "ghost"}
                    className="w-full justify-start gap-3"
                    onClick={() => handleNavigation(link.href)}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <link.icon className="w-5 h-5" />
                    {link.label}
                  </Button>
                ))}
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3"
                  onClick={() => handleNavigation("/company-login")}
                >
                  <Building2 className="w-5 h-5" />
                  Company Portal
                </Button>
                <Button
                  variant="saffron"
                  className="w-full gap-3 mt-2"
                  onClick={() => handleNavigation("/shareholder-login")}
                >
                  <Shield className="w-5 h-5" />
                  Login to Vote
                </Button>
              </div>
            </div>
          )}
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
