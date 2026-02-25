import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Building2, Mail, Lock, ArrowRight, Shield, Eye, EyeOff, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const CompanyLogin = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      const validatedData = loginSchema.parse(formData);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: validatedData.email,
        password: validatedData.password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast.error("Invalid email or password");
        } else {
          toast.error(error.message);
        }
        setIsLoading(false);
        return;
      }

      if (data.user) {
        // Check if user is a company admin
        const { data: adminData, error: adminError } = await supabase
          .from("company_admins")
          .select("company_id")
          .eq("user_id", data.user.id)
          .maybeSingle();

        if (adminError || !adminData) {
          toast.error("You are not registered as a company administrator");
          await supabase.auth.signOut();
          setIsLoading(false);
          return;
        }

        toast.success("Login successful!");
        navigate("/company-dashboard");
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: { email?: string; password?: string } = {};
        err.errors.forEach((error) => {
          if (error.path[0]) {
            fieldErrors[error.path[0] as "email" | "password"] = error.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        const isFetchError = err instanceof TypeError && (err.message.includes("Failed to fetch") || err.message.includes("network error"));
        if (isFetchError) {
          const targetUrl = import.meta.env.VITE_SUPABASE_URL;
          toast.error("Network connection error. Please check your internet or if you are behind a restrictive firewall/VPN.", {
            description: `URL: ${targetUrl}. Detail: ${err.message}. ${JSON.stringify(err)}`,
            duration: 15000,
          });
          console.error("Fetch Error:", err, "Target URL:", targetUrl);
        } else {
          toast.error(`Error: ${err.message || 'Unknown error'}`);
          console.error("Login Error:", err);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSystemRefresh = async () => {
    toast.loading("Clearing system cache...");

    try {
      // Clear all storage
      localStorage.clear();
      sessionStorage.clear();

      // Unregister all service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
      }

      // Clear cache storage if available
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        for (const cacheName of cacheNames) {
          await caches.delete(cacheName);
        }
      }

      toast.success("System refreshed! Reloading...");
      setTimeout(() => {
        window.location.href = window.location.pathname + '?refresh=' + Date.now();
      }, 1000);
    } catch (error) {
      console.error("Refresh error:", error);
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen relative">
      <Navbar />

      <main className="pt-24 pb-16 min-h-[calc(100vh-200px)] flex items-center">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-medium mb-6 shadow-sm">
                <Building2 className="w-4 h-4 text-orange-400" />
                <span>Company Portal</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                Company{" "}
                <span className="bg-gradient-to-r from-orange-400 to-amber-200 bg-clip-text text-transparent">
                  Login
                </span>
              </h1>
              <p className="text-muted-foreground">
                Access your company dashboard to manage shareholders
              </p>
            </div>

            {/* Login Card */}
            <Card className="shadow-large border-white/10 bg-card/10 backdrop-blur-md animate-fade-in-up">
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-xl flex items-center justify-center gap-2">
                  <Shield className="w-5 h-5 text-orange-400" />
                  Secure Login
                </CardTitle>
                <CardDescription>
                  Enter your company admin credentials
                </CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="admin@company.com"
                        className={`pl-11 ${errors.email ? "border-destructive" : ""}`}
                        required
                        disabled={isLoading}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="••••••••"
                        className={`pl-11 pr-11 ${errors.password ? "border-destructive" : ""}`}
                        required
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-sm text-destructive">{errors.password}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    variant="hero"
                    className="w-full gap-2"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    ) : (
                      <>
                        Sign In
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </form>

                <div className="mt-6 pt-6 border-t border-border text-center">
                  <p className="text-sm text-muted-foreground">
                    Don't have an account?{" "}
                    <Link to="/company-register" className="text-primary hover:underline font-medium">
                      Register your company
                    </Link>
                  </p>
                </div>

                <div className="mt-8 pt-6 border-t border-white/10 text-center">
                  <p className="text-sm text-muted-foreground mb-4">
                    Having trouble connecting on mobile?
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSystemRefresh}
                    className="gap-2 border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Force System Refresh
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Security Notice */}
            <div className="mt-6 flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10 animate-fade-in-up shadow-sm" style={{ animationDelay: "0.2s" }}>
              <Shield className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-white">Enterprise-Grade Security</p>
                <p className="text-xs text-white/70">
                  Your login is protected with end-to-end encryption and secure session management.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CompanyLogin;