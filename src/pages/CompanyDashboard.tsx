import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import {
  Building2,
  Users,
  Mail,
  Phone,
  Plus,
  Send,
  Shield,
  LogOut,
  Loader2,
  CheckCircle2,
  Hash,
  Trash2,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { sendEmail } from "@/lib/email";
import { votingApi } from "@/services/api/voting";
import { DashboardFeedback } from "@/components/company/DashboardFeedback";
import { DocumentSummarizer } from "@/components/ai/DocumentSummarizer";
import { SentimentWidget } from "@/components/ai/SentimentWidget";
import { AIAnalysisDemo } from "@/components/company/AIAnalysisDemo";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea"; // Ensure we have this or import it
import { Sparkles, FileText, BrainCircuit } from "lucide-react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { AdminVotingResults } from "@/components/company/AdminVotingResults";

const shareholderSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Please enter a valid email address").max(255),
  phone: z.string().optional(),
  sharesHeld: z.number().min(1, "Shares must be at least 1"),
});

interface Shareholder {
  id: string;
  shareholder_name: string;
  email: string;
  phone: string | null;
  shares_held: number;
  login_id: string;
  is_credential_used: boolean;
  credential_created_at: string;
}

interface Company {
  id: string;
  company_name: string;
  cin_number: string;
  registered_address: string;
  contact_email: string;
  contact_phone: string;
}

const CompanyDashboard = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingShareholder, setIsAddingShareholder] = useState(false);
  const [isSendingCredentials, setIsSendingCredentials] = useState<string | null>(null);
  const [isDeletingCompany, setIsDeletingCompany] = useState(false);
  const [company, setCompany] = useState<Company | null>(null);
  const [shareholders, setShareholders] = useState<Shareholder[]>([]);
  const [activeTab, setActiveTab] = useState("shareholders");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    sharesHeld: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      navigate("/company-login");
      return;
    }

    // Get company admin info
    const { data: adminData, error: adminError } = await supabase
      .from("company_admins")
      .select("company_id")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (adminError || !adminData) {
      toast.error("Access denied. Not a company administrator.");
      await supabase.auth.signOut();
      navigate("/company-login");
      return;
    }

    // Get company details
    const { data: companyData, error: companyError } = await supabase
      .from("companies")
      .select("id, company_name, cin_number, registered_address, contact_email, contact_phone")
      .eq("id", adminData.company_id)
      .maybeSingle();

    if (companyError || !companyData) {
      toast.error("Could not load company data");
      setIsLoading(false);
      return;
    }

    setCompany(companyData);
    await loadShareholders(companyData.id);

    // Fetch Active Session for Results
    try {
      const activeSession = await votingApi.getActiveSession(companyData.id);
      if (activeSession) {
        setSessionId(activeSession.id);
      }
    } catch (e) {
      console.error("Failed to fetch active session", e);
    }

    setIsLoading(false);
  };

  const loadShareholders = async (companyId: string) => {
    const { data, error } = await supabase
      .from("shareholders")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load shareholders");
      return;
    }

    setShareholders(data || []);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const generateSecureCredentials = () => {
    // Generate numeric login ID (8 digits)
    const loginId = Math.floor(10000000 + Math.random() * 90000000).toString();

    // Generate secure alphanumeric password (12 characters)
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return { loginId, password };
  };

  const hashPassword = async (password: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  };

  const handleAddShareholder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingShareholder(true);
    setErrors({});

    try {
      const validatedData = shareholderSchema.parse({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim() || undefined,
        sharesHeld: parseInt(formData.sharesHeld) || 0,
      });

      if (!company) {
        toast.error("Company not found");
        setIsAddingShareholder(false);
        return;
      }

      // Generate secure credentials
      const { loginId, password } = generateSecureCredentials();
      const passwordHash = await hashPassword(password);

      // Insert shareholder
      const { data: newShareholder, error } = await supabase
        .from("shareholders")
        .insert({
          company_id: company.id,
          shareholder_name: validatedData.name,
          email: validatedData.email,
          phone: validatedData.phone || null,
          shares_held: validatedData.sharesHeld,
          login_id: loginId,
          password_hash: passwordHash,
        })
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          toast.error("A shareholder with this login ID already exists");
        } else {
          toast.error("Failed to add shareholder");
        }
        setIsAddingShareholder(false);
        return;
      }

      // Send credentials via Supabase Edge Function
      try {
        const { error: emailError } = await supabase.functions.invoke('send-shareholder-credentials', {
          body: {
            shareholderEmail: validatedData.email,
            shareholderName: validatedData.name,
            companyName: company.company_name,
            loginId: loginId,
            password: password,
          },
          headers: {
            "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
          }
        });

        if (emailError) throw emailError;

        toast.success("Shareholder added and credentials sent via email!");
      } catch (emailError: any) {
        console.error("Email failed:", emailError);
        const msg = emailError.message || "";

        // Graceful fallback is less needed now, but good to keep the manual method option if email fails completely
        toast.success("Shareholder added! IMPORTANT: Save these credentials:", {
          description: `User ID: ${loginId} | Password: ${password}`,
          duration: 30000,
          action: {
            label: "Copy",
            onClick: () => navigator.clipboard.writeText(`ID: ${loginId}\nPassword: ${password}`)
          }
        });
        toast.warning("Email sending service encountered an issue. Please manually share the credentials.");
      }

      // Reset form and reload
      setFormData({ name: "", email: "", phone: "", sharesHeld: "" });
      setShowAddForm(false);
      await loadShareholders(company.id);

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
      setIsAddingShareholder(false);
    }
  };

  const handleResendCredentials = async (shareholder: Shareholder) => {
    setIsSendingCredentials(shareholder.id);

    try {
      // Generate new credentials
      const { loginId, password } = generateSecureCredentials();
      const passwordHash = await hashPassword(password);

      // Update shareholder with new credentials
      const { error: updateError } = await supabase
        .from("shareholders")
        .update({
          login_id: loginId,
          password_hash: passwordHash,
          is_credential_used: false,
          credential_created_at: new Date().toISOString(),
        })
        .eq("id", shareholder.id);

      if (updateError) {
        toast.error("Failed to regenerate credentials");
        return;
      }

      // Send new credentials via Supabase Edge Function
      const { error: emailError } = await supabase.functions.invoke('send-shareholder-credentials', {
        body: {
          shareholderEmail: shareholder.email,
          shareholderName: shareholder.shareholder_name,
          companyName: company?.company_name,
          loginId: loginId,
          password: password,
        },
        headers: {
          "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
        }
      });

      if (emailError) throw emailError;

      toast.success("New credentials sent successfully!");
      if (company) await loadShareholders(company.id);

    } catch (error: any) {
      console.error("Resend failed:", error);
      toast.error(`Email failed: ${error.message || "Unknown error"}`);
    } finally {
      setIsSendingCredentials(null);
    }
  };

  const handleDeleteShareholder = async (id: string) => {
    if (!confirm("Are you sure you want to delete this shareholder?")) return;

    const { error } = await supabase
      .from("shareholders")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete shareholder");
      return;
    }

    toast.success("Shareholder deleted");
    if (company) await loadShareholders(company.id);
  };

  // OTP States
  const [otpSent, setOtpSent] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [showDeregisterDialog, setShowDeregisterDialog] = useState(false);

  const handleSendDeregisterOtp = async () => {
    if (!company) return;

    setIsSendingCredentials("deregister"); // Reuse loading state
    try {
      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(otp);

      // Get admin email (from current session/user context or query)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error("User email not found");

      // Use the updated Supabase Function that now handles OTPs
      const { error: emailError } = await supabase.functions.invoke('send-shareholder-credentials', {
        body: {
          type: 'otp',
          email: user.email,
          companyName: company.company_name,
          otp: otp
        },
        headers: {
          "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
        }
      });

      if (emailError) throw emailError;

      toast.success("OTP sent to your registered email");
      setOtpSent(true);
    } catch (error: any) {
      console.error("Failed to send OTP:", error);
      toast.error(`Failed to send verification email: ${error.message}`);
    } finally {
      setIsSendingCredentials(null);
    }
  };

  const handleVerifyAndDeregister = async () => {
    if (enteredOtp !== generatedOtp) {
      toast.error("Invalid OTP. Please try again.");
      return;
    }

    if (!company) return;

    setIsDeletingCompany(true);
    try {
      // 1. Delete Shareholders (Manual Cascade just in case)
      await supabase.from("shareholders").delete().eq("company_id", company.id);

      // 2. Delete Company Admin entry & User Role
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("company_admins").delete().eq("user_id", user.id);
        await supabase.from("user_roles").delete().eq("user_id", user.id);
      }

      // 3. Delete Company
      const { error } = await supabase
        .from("companies")
        .delete()
        .eq("id", company.id);

      if (error) {
        throw error;
      }

      // 4. Delete Auth User (New Step: Allow reuse of email)
      const { error: deleteAccError } = await supabase.functions.invoke("delete-account");
      if (deleteAccError) {
        console.error("Auth deletion failed:", deleteAccError);
        toast.warning("Company data deleted, but account reset had minor issues. Please contact support if re-registration fails.");
      } else {
        toast.success("Account fully reset. You can now re-register.");
      }

      toast.success("Company deregistered successfully");
      await supabase.auth.signOut();
      navigate("/");
    } catch (error: any) {
      console.error("Deregister failed:", error);
      toast.error(error.message || "Failed to deregister company");
    } finally {
      setIsDeletingCompany(false);
      setShowDeregisterDialog(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/company-login");
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen relative">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-4">
                <Building2 className="w-4 h-4" />
                <span>Company Dashboard</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                Welcome,{" "}
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  {company?.company_name}
                </span>
              </h1>
              <p className="text-muted-foreground mt-2">
                Manage your shareholders and send voting credentials
              </p>
            </div>
            <div className="flex gap-3 self-start">
              <Button variant="saffron" onClick={() => navigate("/voting-management")} className="gap-2">
                <Shield className="w-4 h-4" />
                Manage Voting
              </Button>
              <Button variant="ghost" onClick={handleLogout} className="gap-2">
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </div>

          {/* AI Tools Section - NEW */}
          <div className="mb-8">
            {/* AI Power Suite Link */}
            <div className="mb-8">
              <Card className="border-purple-500/20 bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/10 dark:to-gray-900 overflow-hidden relative group cursor-pointer hover:shadow-lg transition-all" onClick={() => navigate("/ai-power-suite")}>
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Sparkles className="w-32 h-32 text-purple-600" />
                </div>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <Sparkles className="w-6 h-6 text-purple-600" />
                    <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                      AI Power Suite
                    </span>
                  </CardTitle>
                  <CardDescription>
                    Advanced AI tools to streamline your corporate governance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-purple-700 dark:text-purple-300">
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30">
                      <FileText className="w-4 h-4" /> Document Summarizer
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30">
                      <BrainCircuit className="w-4 h-4" /> Sentiment Analysis
                    </div>
                  </div>
                  <Button className="mt-6 bg-purple-600 hover:bg-purple-700 text-white gap-2">
                    Open AI Suite <Sparkles className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>



          {/* Company Profile Card - Added Request */}
          <Card className="mb-8 border-white/10 bg-card/10 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Building2 className="w-5 h-5 text-primary" />
                Company Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Company Name</p>
                  <p className="font-semibold text-foreground">{company?.company_name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">CIN Number</p>
                  <p className="font-mono text-foreground bg-background/50 px-2 py-1 rounded w-fit border border-border">{company?.cin_number || "N/A"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Registered Email</p>
                  <p className="text-foreground">{company?.contact_email}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Contact Phone</p>
                  <p className="text-foreground">{company?.contact_phone || "N/A"}</p>
                </div>
                <div className="space-y-1 md:col-span-2">
                  <p className="text-sm font-medium text-muted-foreground">Registered Address</p>
                  <p className="text-foreground">{company?.registered_address}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards - Always Visible or maybe specific to tab? Let's keep them visible for now or just standard dashboard */}

          <Tabs defaultValue="shareholders" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
              <TabsTrigger value="shareholders" className="gap-2"><Users className="w-4 h-4" /> Shareholders</TabsTrigger>
              <TabsTrigger value="results" className="gap-2"><FileText className="w-4 h-4" /> Results & Reports</TabsTrigger>
            </TabsList>

            <TabsContent value="shareholders" className="space-y-6 animate-fade-in-up">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="border-white/10 bg-card/10 backdrop-blur-md">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Users className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-3xl font-bold text-foreground">{shareholders.length}</p>
                        <p className="text-sm text-muted-foreground">Total Shareholders</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-white/10 bg-card/10 backdrop-blur-md">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-accent" />
                      </div>
                      <div>
                        <p className="text-3xl font-bold text-foreground">
                          {shareholders.filter(s => s.is_credential_used).length}
                        </p>
                        <p className="text-sm text-muted-foreground">Credentials Used</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-white/10 bg-card/10 backdrop-blur-md">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                        <Hash className="w-6 h-6 text-secondary" />
                      </div>
                      <div>
                        <p className="text-3xl font-bold text-foreground">
                          {shareholders.reduce((acc, s) => acc + s.shares_held, 0).toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground">Total Shares</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Add Shareholder Section */}
              <Card className="mb-8 border-white/10 bg-card/10 backdrop-blur-md shadow-large">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary" />
                        Shareholder Management
                      </CardTitle>
                      <CardDescription>
                        Add shareholders and send them secure login credentials via email
                      </CardDescription>
                    </div>
                    <Button
                      variant={showAddForm ? "ghost" : "saffron"}
                      onClick={() => setShowAddForm(!showAddForm)}
                      className="gap-2"
                    >
                      {showAddForm ? "Cancel" : <><Plus className="w-4 h-4" /> Add Shareholder</>}
                    </Button>
                  </div>
                </CardHeader>

                {showAddForm && (
                  <CardContent className="border-t border-white/10 pt-6">
                    <form onSubmit={handleAddShareholder} className="space-y-4 animate-fade-in-up">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Shareholder Name *</Label>
                          <Input
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            placeholder="Full Name"
                            className={errors.name ? "border-destructive bg-black/20 border-white/10" : "bg-black/20 border-white/10"}
                            required
                            disabled={isAddingShareholder}
                          />
                          {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="email">Email Address *</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <Input
                              id="email"
                              name="email"
                              type="email"
                              value={formData.email}
                              onChange={handleInputChange}
                              placeholder="shareholder@email.com"
                              className={`pl-11 bg-black/20 border-white/10 ${errors.email ? "border-destructive" : ""}`}
                              required
                              disabled={isAddingShareholder}
                            />
                          </div>
                          {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone Number</Label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <Input
                              id="phone"
                              name="phone"
                              value={formData.phone}
                              onChange={handleInputChange}
                              placeholder="+91 9876543210"
                              className="pl-11 bg-black/20 border-white/10"
                              disabled={isAddingShareholder}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="sharesHeld">Number of Shares *</Label>
                          <Input
                            id="sharesHeld"
                            name="sharesHeld"
                            type="number"
                            value={formData.sharesHeld}
                            onChange={handleInputChange}
                            placeholder="1000"
                            min="1"
                            className={errors.sharesHeld ? "border-destructive bg-black/20 border-white/10" : "bg-black/20 border-white/10"}
                            required
                            disabled={isAddingShareholder}
                          />
                          {errors.sharesHeld && <p className="text-sm text-destructive">{errors.sharesHeld}</p>}
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-4 rounded-xl bg-accent/10 border border-accent/20">
                        <Shield className="w-5 h-5 text-accent mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-foreground">Secure Credential Generation</p>
                          <p className="text-xs text-muted-foreground">
                            Auto-generated unique User ID and password will be sent to the shareholder's email.
                            Credentials are hashed and stored securely.
                          </p>
                        </div>
                      </div>

                      <Button type="submit" variant="hero" className="gap-2" disabled={isAddingShareholder}>
                        {isAddingShareholder ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                        Add & Send Credentials
                      </Button>
                    </form>
                  </CardContent>
                )}
              </Card>

              {/* Shareholders List */}
              <Card className="border-white/10 bg-card/10 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-xl">Registered Shareholders</CardTitle>
                  <CardDescription>
                    View and manage all shareholders with their credential status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {shareholders.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                      <p className="text-muted-foreground">No shareholders added yet</p>
                      <p className="text-sm text-muted-foreground/80">Click "Add Shareholder" to get started</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Name</th>
                            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Email</th>
                            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Shares</th>
                            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Login ID</th>
                            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                            <th className="text-right py-3 px-4 font-medium text-muted-foreground">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {shareholders.map((shareholder) => (
                            <tr key={shareholder.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                              <td className="py-4 px-4 font-medium text-foreground">{shareholder.shareholder_name}</td>
                              <td className="py-4 px-4 text-muted-foreground">{shareholder.email}</td>
                              <td className="py-4 px-4 text-muted-foreground">{shareholder.shares_held.toLocaleString()}</td>
                              <td className="py-4 px-4">
                                <code className="px-2 py-1 rounded bg-muted text-sm">{shareholder.login_id}</code>
                              </td>
                              <td className="py-4 px-4">
                                {shareholder.is_credential_used ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-medium">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Active
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-600 text-xs font-medium">
                                    Pending
                                  </span>
                                )}
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleResendCredentials(shareholder)}
                                    disabled={isSendingCredentials === shareholder.id}
                                    className="gap-1"
                                  >
                                    {isSendingCredentials === shareholder.id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <RefreshCw className="w-4 h-4" />
                                    )}
                                    Resend
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteShareholder(shareholder.id)}
                                    className="text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="results">
              {/* Note: In a real app we'd need to pass the selected Session ID. 
                    For MVP, we will fetch the Active session inside the component or just pass a known one if we had state for it.
                    Ideally, we should likely fetch the active session in CompanyDashboard parent state.
                    We did fetch 'companyData' but not 'session'. Let's assume there's one active session or we'll fetch it in the component for now.
                    Wait, let's properly fetch the session in the Dashboard to pass it down.
                    For now, passing the company ID and letting the child component utilize it or fetching active session there is better separation?
                    Actually, AdminVotingResults took `sessionId`. We don't have it in state here yet.
                    Let's quickly fetch active session ID here or modify AdminVotingResults to take CompanyID and find active session.
                    AdminVotingResults takes `sessionId`.
                    Let's update AdminVotingResults to optionally take companyId and find active session, OR fetch it here.
                    Fetching it here is cleaner.
                */}
              {/* Placeholder for now until we add session fetching logic */}
              <div className="p-8 text-center border border-dashed border-white/10 rounded-xl">
                <p className="text-muted-foreground mb-4">Select an active session to view results.</p>
                {/* We need to implement session selection or auto-select active */}
                <AdminVotingResults sessionId={sessionId || ""} companyName={company?.company_name || ""} />
                {/* The component will just return empty/loading if no session ID. We need to fix this. */}
              </div>
            </TabsContent>
          </Tabs>

          {/* Feedback Section */}
          <div className="mb-8">
            <DashboardFeedback
              email={company?.contact_email || ""}
              companyName={company?.company_name || ""}
            />
          </div>

          {/* Danger Zone */}
          <Card className="mt-8 border-destructive/20 shadow-none bg-destructive/5">
            <CardHeader>
              <CardTitle className="text-xl text-destructive flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Danger Zone
              </CardTitle>
              <CardDescription className="text-destructive/80">
                Irreversible actions for your company account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border border-destructive/20 rounded-lg bg-background">
                <div>
                  <h4 className="font-medium text-foreground">Deregister Company</h4>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete your company account and all associated data. This action cannot be undone.
                  </p>
                </div>

                <AlertDialog open={showDeregisterDialog} onOpenChange={(open) => {
                  setShowDeregisterDialog(open);
                  if (!open) {
                    setOtpSent(false);
                    setEnteredOtp("");
                    setGeneratedOtp("");
                  }
                }}>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={isDeletingCompany}>
                      {isDeletingCompany ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Trash2 className="w-4 h-4 mr-2" />
                      )}
                      Deregister
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    {!otpSent ? (
                      <>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your company account,
                            all shareholder data, and voting records from our servers.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <Button
                            variant="destructive"
                            onClick={handleSendDeregisterOtp}
                            disabled={isSendingCredentials === "deregister"}
                          >
                            {isSendingCredentials === "deregister" ? (
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                              <Send className="w-4 h-4 mr-2" />
                            )}
                            Send OTP to Verify
                          </Button>
                        </AlertDialogFooter>
                      </>
                    ) : (
                      <>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Enter Verification Code</AlertDialogTitle>
                          <AlertDialogDescription>
                            We have sent a 6-digit verification code to your registered email.
                            Please enter it below to confirm deletion.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="py-4">
                          <Label htmlFor="otp" className="mb-2 block">Verification Code</Label>
                          <Input
                            id="otp"
                            placeholder="Enter 6-digit code"
                            value={enteredOtp}
                            onChange={(e) => setEnteredOtp(e.target.value)}
                            className="text-center text-lg tracking-widest"
                            maxLength={6}
                          />
                        </div>
                        <AlertDialogFooter>
                          <Button variant="ghost" onClick={() => setShowDeregisterDialog(false)}>
                            Cancel
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={handleVerifyAndDeregister}
                            disabled={isDeletingCompany || enteredOtp.length !== 6}
                          >
                            {isDeletingCompany ? (
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                              <Trash2 className="w-4 h-4 mr-2" />
                            )}
                            Verify & Deregister
                          </Button>
                        </AlertDialogFooter>
                      </>
                    )}
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </div >
      </main >

      <Footer />
    </div >
  );
};

export default CompanyDashboard;