import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import {
  Shield,
  Lock,
  Vote,
  ArrowRight,
  Eye,
  EyeOff,
  User,
  KeyRound
} from "lucide-react";
import { toast } from "sonner";

const ShareholderLogin = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    userId: "",
    password: "",
  });
  const [loginStep, setLoginStep] = useState<"CREDENTIALS" | "OTP">("CREDENTIALS");
  const [otp, setOtp] = useState("");
  const [maskedPhone, setMaskedPhone] = useState("");
  const [shareholderId, setShareholderId] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const navigate = useNavigate();

  const hashPassword = async (password: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (loginStep === "CREDENTIALS") {
        await handleCredentialsSubmit();
      } else {
        await handleOtpSubmit();
      }
    } catch (err) {
      console.error("Login exception:", err);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCredentialsSubmit = async () => {
    const passwordHash = await hashPassword(formData.password);

    const { data, error } = await supabase
      .from("shareholders")
      .select("*")
      .eq("login_id", formData.userId)
      .eq("password_hash", passwordHash)
      .maybeSingle();

    if (error) {
      toast.error("An error occurred during login");
      console.error("Login error:", error);
      return;
    }

    if (data) {
      if (data.is_credential_used) {
        toast.error("This credential has already been used.", {
          description: "If you believe this is an error, please contact support."
        });
        return;
      }

      const phone = data.phone;
      if (!phone) {
        toast.error("No mobile number registered for this shareholder.", {
          description: "Please contact support to update your contact details."
        });
        return;
      }

      // Store ID for next step
      setShareholderId(data.id);

      // Mask Phone
      const last4 = phone.slice(-4);
      setMaskedPhone(`******${last4}`);

      // Trigger OTP
      try {
        const { error: fnError } = await supabase.functions.invoke("send-sms-otp", {
          body: { shareholder_id: data.id, phone: phone },
        });

        if (fnError) {
          throw fnError;
        }

        toast.success("Credentials Verified", {
          description: `OTP sent to register mobile number ending in ${last4}`,
        });
        setLoginStep("OTP");
      } catch (err: any) {
        console.error("Failed to send OTP:", err);
        toast.error("Failed to send OTP", {
          description: err.message || "Please check your internet connection or try again later.",
        });
      }
    } else {
      toast.error("Invalid User ID or Password");
    }
  };

  const handleOtpSubmit = async () => {
    // Verify OTP
    // 1. Fetch user to get current OTP hash and expiry
    const { data, error } = await supabase
      .from("shareholders")
      .select("otp_code, otp_expiry, id")
      .eq("id", shareholderId)
      .single();

    if (error || !data) {
      toast.error("Verification failed. Please try logging in again.");
      setLoginStep("CREDENTIALS");
      return;
    }

    // 2. Check Expiry
    if (!data.otp_expiry || new Date(data.otp_expiry) < new Date()) {
      toast.error("OTP has expired.", {
        description: "Please go back and login again to receive a new OTP."
      });
      return;
    }

    // 3. Hash input OTP and compare
    const inputHash = await hashPassword(otp); // Using same hashing function (SHA-256)

    if (inputHash === data.otp_code) {
      // Success!
      // Mark credential as used AND clear OTP
      await supabase
        .from("shareholders")
        .update({
          is_credential_used: true,
          otp_code: null,
          otp_expiry: null
        })
        .eq("id", shareholderId);

      localStorage.setItem("shareholderId", shareholderId);

      toast.success("Login successful!", {
        description: "Redirecting to voting dashboard...",
      });

      setTimeout(() => {
        navigate("/voting-dashboard");
      }, 1000);
    } else {
      toast.error("Invalid OTP. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            {/* Left Side - Info */}
            <div className="text-center lg:text-left order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 border border-secondary/20 text-secondary text-sm font-medium mb-6">
                <Vote className="w-4 h-4" />
                <span>Shareholder Portal</span>
              </div>

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6 leading-tight">
                Cast Your Vote{" "}
                <span className="bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">
                  Securely
                </span>
              </h1>

              <p className="text-lg text-muted-foreground mb-8">
                Use your unique credentials sent to your registered email to
                access the voting portal. Your vote matters!
              </p>

              {/* Security Features */}
              <div className="space-y-4">
                {[
                  { icon: Lock, title: "End-to-End Encrypted", desc: "Your vote is protected from submission to counting" },
                  { icon: Shield, title: "One-Time Credentials", desc: "Credentials are automatically invalidated after voting" },
                  { icon: Eye, title: "Audit Trail", desc: "Complete transparency with tamper-proof logs" },
                ].map((feature) => (
                  <div key={feature.title} className="flex items-start gap-4 p-4 rounded-xl bg-card border border-border/50 shadow-soft">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="order-1 lg:order-2">
              <Card className="shadow-large border-border/50 relative overflow-hidden">
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-secondary/10 to-transparent rounded-bl-full" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-primary/10 to-transparent rounded-tr-full" />

                <CardHeader className="text-center relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-4 shadow-medium animate-pulse-glow">
                    <Vote className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <CardTitle className="text-2xl">Shareholder Login</CardTitle>
                  <CardDescription>
                    Enter your credentials to access voting portal
                  </CardDescription>
                </CardHeader>

                <CardContent className="relative z-10">
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {loginStep === "CREDENTIALS" && (
                      <div className="space-y-5">
                        <div className="space-y-2">
                          <Label htmlFor="userId">User ID</Label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <Input
                              id="userId"
                              name="userId"
                              value={formData.userId}
                              onChange={handleInputChange}
                              placeholder="Enter your User ID"
                              className="pl-11"
                              required
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Your User ID was sent to your registered email
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="password">Password</Label>
                          <div className="relative">
                            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <Input
                              id="password"
                              name="password"
                              type={showPassword ? "text" : "password"}
                              value={formData.password}
                              onChange={handleInputChange}
                              placeholder="Enter your password"
                              className="pl-11 pr-11"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {showPassword ? (
                                <EyeOff className="w-5 h-5" />
                              ) : (
                                <Eye className="w-5 h-5" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Security Notice */}
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-accent/10 border border-accent/20">
                          <Shield className="w-4 h-4 text-accent flex-shrink-0" />
                          <p className="text-xs text-muted-foreground">
                            This is a secure 256-bit encrypted connection
                          </p>
                        </div>
                      </div>
                    )}

                    {loginStep === "CREDENTIALS" ? (
                      <Button
                        type="submit"
                        variant="hero"
                        size="lg"
                        className="w-full gap-2"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          <>
                            Proceed to Verify
                            <ArrowRight className="w-5 h-5" />
                          </>
                        )}
                      </Button>
                    ) : (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="otp">One-Time Password (OTP)</Label>
                          <Input
                            id="otp"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            placeholder="Enter 6-digit OTP"
                            className="text-center text-2xl tracking-widest"
                            maxLength={6}
                            autoFocus
                            required
                          />
                          <p className="text-xs text-center text-muted-foreground">
                            Sent to {maskedPhone}
                          </p>
                        </div>

                        <Button
                          type="submit"
                          variant="hero"
                          size="lg"
                          className="w-full gap-2"
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <>
                              <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                              Verifying OTP...
                            </>
                          ) : (
                            <>
                              Secure Login
                              <Lock className="w-5 h-5" />
                            </>
                          )}
                        </Button>

                        <button
                          type="button"
                          onClick={() => {
                            setLoginStep("CREDENTIALS");
                            setOtp("");
                          }}
                          className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Back to Credentials
                        </button>
                      </div>
                    )}
                  </form>

                  {/* Help Link */}
                  <div className="mt-6 text-center">
                    <p className="text-sm text-muted-foreground">
                      Haven't received your credentials?{" "}
                      <a href="#" className="text-primary font-medium hover:underline">
                        Contact Support
                      </a>
                    </p>
                  </div>

                  {/* Company Login Link */}
                  <div className="mt-4 pt-4 border-t border-border text-center">
                    <p className="text-sm text-muted-foreground">
                      Are you a company administrator?{" "}
                      <Link to="/company-register" className="text-secondary font-medium hover:underline">
                        Register your company
                      </Link>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ShareholderLogin;
