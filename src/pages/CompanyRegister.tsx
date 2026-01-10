import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/layout/Navbar";

import Footer from "@/components/layout/Footer";
import {
  Building2,
  Mail,
  Phone,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Shield,
  Users,
  Lock,
  Eye,
  EyeOff,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const step1Schema = z.object({
  companyName: z.string().min(2, "Company name is required").max(200),
  cin: z.string().min(10, "Valid CIN is required").max(25),
  registeredAddress: z.string().min(5, "Address is required").max(500),
  city: z.string().min(2, "City is required").max(100),
  state: z.string().min(2, "State is required").max(100),
  pincode: z.string().regex(/^\d{6}$/, "Valid 6-digit PIN code required"),
});

const step2Schema = z.object({
  contactName: z.string().min(2, "Name is required").max(100),
  contactEmail: z.string().email("Valid email required").max(255),
  contactPhone: z.string().min(10, "Valid phone number required").max(15),
  designation: z.string().min(2, "Designation is required").max(100),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type Step = 1 | 2 | 3;

const CompanyRegister = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Ensure clean state on mount
  useEffect(() => {
    supabase.auth.signOut();
  }, []);

  const [formData, setFormData] = useState({
    companyName: "",
    cin: "",
    registeredAddress: "",
    city: "",
    state: "",
    pincode: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    designation: "",
    password: "",
    confirmPassword: "",
    otp: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const validateStep1 = () => {
    try {
      step1Schema.parse({
        companyName: formData.companyName.trim(),
        cin: formData.cin.trim(),
        registeredAddress: formData.registeredAddress.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        pincode: formData.pincode.trim(),
      });
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        err.errors.forEach((error) => {
          if (error.path[0]) {
            fieldErrors[error.path[0] as string] = error.message;
          }
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const nextStep = async () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2) {
      // Validate step 2 before sending OTP
      try {
        step2Schema.parse({
          contactName: formData.contactName.trim(),
          contactEmail: formData.contactEmail.trim().toLowerCase(),
          contactPhone: formData.contactPhone.trim(),
          designation: formData.designation.trim(),
          password: formData.password,
          confirmPassword: formData.confirmPassword,
        });

        // Send OTP
        setIsLoading(true);
        const res = await fetch(
          "https://tpfvvuuumfuvbqkackwk.supabase.co/functions/v1/send-email-otp",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY
            },
            body: JSON.stringify({
              email: formData.contactEmail,
              name: formData.contactName
            })
          }
        );

        const data = await res.json();

        if (!res.ok || !data.success) {
          toast.error(data.message || "Failed to send verification code.");
          setIsLoading(false);
          return;
        }

        toast.success("Verification code sent to your email.");
        setStep(3);
      } catch (err) {
        if (err instanceof z.ZodError) {
          const fieldErrors: Record<string, string> = {};
          err.errors.forEach((error) => {
            if (error.path[0]) {
              fieldErrors[error.path[0] as string] = error.message;
            }
          });
          setErrors(fieldErrors);
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  const prevStep = () => {
    if (step > 1) setStep((step - 1) as any);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      // Step 3 already implies previous validation, but let's verify OTP
      if (step === 3) {
        const res = await fetch(
          "https://tpfvvuuumfuvbqkackwk.supabase.co/functions/v1/verify-email-otp",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY
            },
            body: JSON.stringify({
              email: formData.contactEmail,
              code: formData.otp
            })
          }
        );

        const verifyData = await res.json();

        if (!res.ok || !verifyData.success) {
          toast.error(verifyData.message || "Invalid Verification Code");
          setIsLoading(false);
          return;
        }
      }

      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.contactEmail.trim().toLowerCase(),
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/company-dashboard`,
        },
      });

      if (authError) {
        if (authError.message.includes("already registered")) {
          toast.error("This email is already registered. Please login instead.");
        } else {
          toast.error(authError.message);
        }
        setIsLoading(false);
        return;
      }

      if (!authData.user) {
        toast.error("Failed to create account");
        setIsLoading(false);
        return;
      }

      // 2. Create company record
      const companyId = crypto.randomUUID();

      const { error: companyError } = await supabase
        .from("companies")
        .insert({
          id: companyId,
          company_name: formData.companyName.trim(),
          cin_number: formData.cin.trim().toUpperCase(),
          registered_address: `${formData.registeredAddress.trim()}, ${formData.city.trim()}, ${formData.state.trim()} - ${formData.pincode.trim()}`,
          contact_email: formData.contactEmail.trim().toLowerCase(),
          contact_phone: formData.contactPhone.trim(),
        });

      if (companyError) {
        console.error("Company creation error:", companyError);
        if (companyError.code === "23505") {
          toast.error("A company with this CIN is already registered");
        } else {
          toast.error("Failed to register company. Please try again.");
        }
        // Sign out the user since registration failed
        await supabase.auth.signOut();
        setIsLoading(false);
        return;
      }

      // 3. Create company_admin record
      const { error: adminError } = await supabase
        .from("company_admins")
        .insert({
          user_id: authData.user.id,
          company_id: companyId,
          full_name: formData.contactName.trim(),
        });

      if (adminError) {
        console.error("Admin record creation error:", adminError);
        toast.error("Failed to set up admin access");
        setIsLoading(false);
        return;
      }

      // 4. Create user role
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({
          user_id: authData.user.id,
          role: "company_admin",
        });

      if (roleError) {
        console.error("Role creation error:", roleError);
      }

      // 5. Send Welcome Email
      // Note: We don't block navigation on this, just log if it fails
      supabase.functions.invoke("send-welcome-email", {
        body: {
          email: formData.contactEmail,
          companyName: formData.companyName,
          cin: formData.cin,
          adminName: formData.contactName,
          address: `${formData.registeredAddress}, ${formData.city}, ${formData.state} - ${formData.pincode}`,
          phone: formData.contactPhone
        }
      }).then(({ error }) => {
        if (error) console.error("Failed to send welcome email:", error);
      });

      toast.success("Company registered successfully!");
      navigate("/company-dashboard");

    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        err.errors.forEach((error) => {
          if (error.path[0]) {
            fieldErrors[error.path[0] as string] = error.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        toast.error("An unexpected error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const stepInfo = [
    { number: 1, title: "Company Details", icon: Building2 },
    { number: 2, title: "Admin Account", icon: Users },
    { number: 3, title: "Verification", icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
              <Building2 className="w-4 h-4" />
              <span>Company Registration</span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Register Your{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Company
              </span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Set up your company for secure e-voting in just a few minutes
            </p>
          </div>

          {/* Progress Steps */}
          <div className="max-w-md mx-auto mb-12">
            <div className="flex items-center justify-between">
              {stepInfo.map((info, index) => (
                <div key={info.number} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${step >= info.number
                        ? "bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-medium"
                        : "bg-muted text-muted-foreground"
                        }`}
                    >
                      {step > info.number ? (
                        <CheckCircle2 className="w-6 h-6" />
                      ) : (
                        <info.icon className="w-5 h-5" />
                      )}
                    </div>
                    <span className={`text-sm mt-2 font-medium ${step >= info.number ? "text-foreground" : "text-muted-foreground"
                      }`}>
                      {info.title}
                    </span>
                  </div>
                  {index < stepInfo.length - 1 && (
                    <div className={`hidden sm:block w-24 lg:w-32 h-1 mx-4 rounded-full transition-all duration-300 ${step > info.number ? "bg-gradient-to-r from-primary to-secondary" : "bg-muted"
                      }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          <Card className="max-w-2xl mx-auto shadow-large border-border/50">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl">
                {step === 1 && "Company Details"}
                {step === 2 && "Admin Account Setup"}
                {step === 3 && "Email Verification"}
              </CardTitle>
              <CardDescription>
                {step === 1 && "Enter your company's official details"}
                {step === 2 && "Create your company admin account"}
                {step === 3 && "Enter the OTP sent to your email"}
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} autoComplete="off">
                {/* Step 1: Company Details */}
                {step === 1 && (
                  <div className="space-y-4 animate-fade-in-up">
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Company Name *</Label>
                      <Input
                        id="companyName"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleInputChange}
                        placeholder="e.g., Tata Consultancy Services Ltd."
                        className={errors.companyName ? "border-destructive" : ""}
                        required
                      />
                      {errors.companyName && <p className="text-sm text-destructive">{errors.companyName}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cin">Corporate Identification Number (CIN) *</Label>
                      <Input
                        id="cin"
                        name="cin"
                        value={formData.cin}
                        onChange={handleInputChange}
                        placeholder="e.g., L22210TN1995PLC028771"
                        className={errors.cin ? "border-destructive" : ""}
                        required
                      />
                      {errors.cin && <p className="text-sm text-destructive">{errors.cin}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="registeredAddress">Registered Address *</Label>
                      <Input
                        id="registeredAddress"
                        name="registeredAddress"
                        value={formData.registeredAddress}
                        onChange={handleInputChange}
                        placeholder="Building, Street, Area"
                        className={errors.registeredAddress ? "border-destructive" : ""}
                        required
                      />
                      {errors.registeredAddress && <p className="text-sm text-destructive">{errors.registeredAddress}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">City *</Label>
                        <Input
                          id="city"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          placeholder="Mumbai"
                          className={errors.city ? "border-destructive" : ""}
                          required
                        />
                        {errors.city && <p className="text-sm text-destructive">{errors.city}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">State *</Label>
                        <Input
                          id="state"
                          name="state"
                          value={formData.state}
                          onChange={handleInputChange}
                          placeholder="Maharashtra"
                          className={errors.state ? "border-destructive" : ""}
                          required
                        />
                        {errors.state && <p className="text-sm text-destructive">{errors.state}</p>}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pincode">PIN Code *</Label>
                      <Input
                        id="pincode"
                        name="pincode"
                        value={formData.pincode}
                        onChange={handleInputChange}
                        placeholder="400001"
                        className={errors.pincode ? "border-destructive" : ""}
                        required
                      />
                      {errors.pincode && <p className="text-sm text-destructive">{errors.pincode}</p>}
                    </div>
                  </div>
                )}

                {/* Step 2: Admin Account */}
                {step === 2 && (
                  <div className="space-y-4 animate-fade-in-up">
                    <div className="space-y-2">
                      <Label htmlFor="contactName">Your Full Name *</Label>
                      <div className="relative">
                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          id="contactName"
                          name="contactName"
                          value={formData.contactName}
                          onChange={handleInputChange}
                          placeholder="Full Name"
                          className={`pl-11 ${errors.contactName ? "border-destructive" : ""}`}
                          required
                          disabled={isLoading}
                        />
                      </div>
                      {errors.contactName && <p className="text-sm text-destructive">{errors.contactName}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="designation">Designation *</Label>
                      <Input
                        id="designation"
                        name="designation"
                        value={formData.designation}
                        onChange={handleInputChange}
                        placeholder="e.g., Company Secretary"
                        className={errors.designation ? "border-destructive" : ""}
                        required
                        disabled={isLoading}
                      />
                      {errors.designation && <p className="text-sm text-destructive">{errors.designation}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contactEmail">Email Address *</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          id="contactEmail"
                          name="contactEmail"
                          type="email"
                          value={formData.contactEmail}
                          onChange={handleInputChange}
                          placeholder="admin@company.com"
                          className={`pl-11 ${errors.contactEmail ? "border-destructive" : ""}`}
                          required
                          disabled={isLoading}
                        />
                      </div>
                      {errors.contactEmail && <p className="text-sm text-destructive">{errors.contactEmail}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contactPhone">Phone Number *</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          id="contactPhone"
                          name="contactPhone"
                          type="tel"
                          value={formData.contactPhone}
                          onChange={handleInputChange}
                          placeholder="+91 9876543210"
                          className={`pl-11 ${errors.contactPhone ? "border-destructive" : ""}`}
                          required
                          disabled={isLoading}
                          autoComplete="off"
                        />
                      </div>
                      {errors.contactPhone && <p className="text-sm text-destructive">{errors.contactPhone}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Create Password *</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          id="password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          value={formData.password}
                          onChange={handleInputChange}
                          placeholder="Minimum 8 characters"
                          className={`pl-11 pr-11 ${errors.password ? "border-destructive" : ""}`}
                          required
                          disabled={isLoading}
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password *</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          id="confirmPassword"
                          name="confirmPassword"
                          type={showPassword ? "text" : "password"}
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          placeholder="Re-enter your password"
                          className={`pl-11 ${errors.confirmPassword ? "border-destructive" : ""}`}
                          required
                          disabled={isLoading}
                          autoComplete="new-password"
                        />
                      </div>
                      {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
                    </div>

                    {/* Security Notice */}
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-accent/10 border border-accent/20">
                      <Shield className="w-5 h-5 text-accent mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Secure Registration</p>
                        <p className="text-xs text-muted-foreground">
                          Your password is encrypted and stored securely. You'll use this to access your company dashboard.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Verification */}
                {step === 3 && (
                  <div className="space-y-6 animate-fade-in-up">
                    <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10 text-center space-y-4">
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Mail className="w-8 h-8 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">Check your Email</h3>
                        <p className="text-muted-foreground mt-1">
                          We've sent a 6-digit verification code to
                          <br />
                          <span className="font-medium text-foreground">{formData.contactEmail}</span>
                        </p>
                      </div>

                      <div className="max-w-xs mx-auto space-y-2 text-left">
                        <Label htmlFor="otp" className="text-center block">Verification Code</Label>
                        <Input
                          id="otp"
                          name="otp"
                          type="text"
                          maxLength={6}
                          value={formData.otp}
                          onChange={handleInputChange}
                          placeholder="000000"
                          className="text-center text-2xl tracking-[0.5em] font-mono h-14"
                          autoComplete="one-time-code"
                          required
                        />
                        <p className="text-xs text-muted-foreground text-center">
                          Code expires in 10 minutes
                        </p>
                      </div>
                    </div>

                    {/* Security Badge - Requested by User */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="flex items-start gap-3 p-4 rounded-xl bg-accent/5 border border-accent/20">
                        <Shield className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-foreground">Bank-Grade Security</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Your vote and company data are protected with 256-bit encryption and immutable audit logs.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-4 rounded-xl bg-saffron/10 border border-saffron/20">
                        <Lock className="w-5 h-5 text-saffron shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-foreground">Verified & Compliance</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Fully compliant with MCA (Ministry of Corporate Affairs) e-voting regulations.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-8 pt-6 border-t border-border">
                  {step > 1 ? (
                    <Button type="button" variant="ghost" onClick={prevStep} className="gap-2" disabled={isLoading}>
                      <ArrowLeft className="w-4 h-4" />
                      Previous
                    </Button>
                  ) : (
                    <Link to="/">
                      <Button type="button" variant="ghost" className="gap-2">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Home
                      </Button>
                    </Link>
                  )}

                  {step < 3 ? (
                    <Button type="button" variant="saffron" onClick={nextStep} className="gap-2" disabled={isLoading}>
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                      {step === 2 ? "Verify Email" : "Next Step"}
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button type="submit" variant="hero" className="gap-2" disabled={isLoading}>
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      Complete Registration
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>


          {/* Login Link */}
          <div className="text-center mt-6">
            <p className="text-muted-foreground">
              Already registered?{" "}
              <Link to="/company-login" className="text-primary hover:underline font-medium">
                Login to your dashboard
              </Link>
            </p>
          </div>
        </div>
      </main >

      <Footer />
    </div >
  );
};

export default CompanyRegister;