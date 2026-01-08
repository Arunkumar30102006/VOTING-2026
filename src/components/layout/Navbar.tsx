import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { Menu, X, Vote, Shield, Users, Building2 } from "lucide-react";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { href: "/", label: "Home", icon: Vote },
    { href: "/company-register", label: "Company Registration", icon: Building2 },
    { href: "/shareholder-login", label: "Shareholder Login", icon: Users },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
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
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            <ModeToggle />
            {navLinks.map((link) => (
              <Link key={link.href} to={link.href}>
                <Button
                  variant={isActive(link.href) ? "default" : "ghost"}
                  size="sm"
                  className="gap-2"
                >
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </Button>
              </Link>
            ))}
            <Link to="/company-login">
              <Button variant="ghost" size="sm" className="gap-2">
                <Building2 className="w-4 h-4" />
                Company Portal
              </Button>
            </Link>
            <Link to="/shareholder-login">
              <Button variant="saffron" size="sm" className="ml-2 gap-2">
                <Shield className="w-4 h-4" />
                Login to Vote
              </Button>
            </Link>
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
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setIsOpen(false)}
                  style={{ animationDelay: `${index * 100}ms` }}
                  className="animate-fade-in-up opacity-0"
                >
                  <Button
                    variant={isActive(link.href) ? "default" : "ghost"}
                    className="w-full justify-start gap-3"
                  >
                    <link.icon className="w-5 h-5" />
                    {link.label}
                  </Button>
                </Link>
              ))}
              <Link to="/company-login" onClick={() => setIsOpen(false)}>
                <Button variant="ghost" className="w-full justify-start gap-3">
                  <Building2 className="w-5 h-5" />
                  Company Portal
                </Button>
              </Link>
              <Link to="/shareholder-login" onClick={() => setIsOpen(false)}>
                <Button variant="saffron" className="w-full gap-3 mt-2">
                  <Shield className="w-5 h-5" />
                  Login to Vote
                </Button>
              </Link>
            </div>
          </div>
        )
        }
      </div >
    </nav >
  );
};

export default Navbar;
