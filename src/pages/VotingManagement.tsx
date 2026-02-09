import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import {
  CalendarDays,
  Clock,
  Users,
  UserPlus,
  Video,
  Link as LinkIcon,
  Send,
  Play,
  Pause,
  CheckCircle2,
  AlertCircle,
  FileText,
  Mail,
  Loader2,
  Plus,
  Trash2,
  Building2,
  Vote,
  Shield,
  Info,
  ExternalLink,
  Trophy,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { sendEmail } from "@/lib/email";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import LoadingSpinner from "@/components/ui/LoadingSpinner";

const nomineeSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Please enter a valid email address").max(255),
  designation: z.string().optional(),
  qualification: z.string().optional(),
  experienceYears: z.number().min(0).optional(),
  bio: z.string().max(500).optional(),
});

const sessionSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200),
  description: z.string().optional(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  meetingStartDate: z.string().optional(),
  meetingEndDate: z.string().optional(),
  meetingLink: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  meetingPassword: z.string().optional(),
  meetingPlatform: z.string().optional(),
  votingInstructions: z.string().optional(),
});

interface Nominee {
  id: string;
  nominee_name: string;
  nominee_email: string;
  designation: string | null;
  qualification: string | null;
  experience_years: number | null;
  bio: string | null;
  is_email_sent: boolean;
  created_at: string;
}

interface VotingSession {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  is_active: boolean;
  meeting_link: string | null;
  meeting_password: string | null;
  meeting_platform: string | null;
  voting_instructions: string | null;
  is_meeting_emails_sent: boolean;
  meeting_start_date: string | null;
  meeting_end_date: string | null;
}

interface Company {
  id: string;
  company_name: string;
}

interface Shareholder {
  id: string;
  shareholder_name: string;
  email: string;
  shares_held: number;
}

const VotingManagement = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingEmails, setIsSendingEmails] = useState(false);
  const [company, setCompany] = useState<Company | null>(null);
  const [votingSession, setVotingSession] = useState<VotingSession | null>(null);
  const [nominees, setNominees] = useState<Nominee[]>([]);
  const [shareholders, setShareholders] = useState<Shareholder[]>([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [showAddNominee, setShowAddNominee] = useState(false);
  const [isAddingNominee, setIsAddingNominee] = useState(false);

  const [sessionForm, setSessionForm] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    meetingLink: "",
    meetingPassword: "",
    meetingPlatform: "zoom",
    meetingStartDate: "",
    meetingEndDate: "",
    votingInstructions: "",
  });

  const [nomineeForm, setNomineeForm] = useState({
    name: "",
    email: "",
    designation: "",
    qualification: "",
    experienceYears: "",
    bio: "",
  });

  const [results, setResults] = useState<any[]>([]);

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
      navigate("/company-login");
      return;
    }

    // Get company details
    const { data: companyData, error: companyError } = await supabase
      .from("companies")
      .select("id, company_name")
      .eq("id", adminData.company_id)
      .maybeSingle();

    if (companyError || !companyData) {
      toast.error("Could not load company data");
      setIsLoading(false);
      return;
    }

    setCompany(companyData);
    await loadVotingSession(companyData.id);
    await loadShareholders(companyData.id);
    setIsLoading(false);
  };

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const loadVotingSession = async (companyId: string) => {
    const { data, error } = await supabase
      .from("voting_sessions")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Error loading voting session:", error);
      return;
    }

    if (data) {
      setVotingSession(data);

      // Helper to format Date to "YYYY-MM-DDThh:mm" using local time
      const toLocalISOString = (dateStr: string) => {
        const date = new Date(dateStr);
        const offsetMs = date.getTimezoneOffset() * 60000;
        const localDate = new Date(date.getTime() - offsetMs);
        return localDate.toISOString().slice(0, 16);
      };

      setSessionForm({
        title: data.title || "",
        description: data.description || "",
        startDate: data.start_date ? toLocalISOString(data.start_date) : "",
        endDate: data.end_date ? toLocalISOString(data.end_date) : "",
        meetingLink: data.meeting_link || "",
        meetingPassword: data.meeting_password || "",
        meetingPlatform: data.meeting_platform || "zoom",
        meetingStartDate: (data as any).meeting_start_date ? toLocalISOString((data as any).meeting_start_date) : (data.start_date ? toLocalISOString(data.start_date) : ""),
        meetingEndDate: (data as any).meeting_end_date ? toLocalISOString((data as any).meeting_end_date) : (data.end_date ? toLocalISOString(data.end_date) : ""),
        votingInstructions: data.voting_instructions || "",
      });
      await loadNominees(data.id);
    }
  };

  const loadNominees = async (sessionId: string) => {
    const { data, error } = await supabase
      .from("nominees")
      .select("*")
      .eq("voting_session_id", sessionId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading nominees:", error);
      return;
    }

    setNominees(data || []);
  };

  const loadResults = async (sessionId: string) => {
    // 1. Fetch all resolutions and nominees
    const { data: resolutions } = await supabase.from("resolutions").select("*").eq("voting_session_id", sessionId);
    const { data: votes } = await supabase.from("votes").select("*").in("resolution_id", resolutions?.map(r => r.id) || []);

    if (!resolutions || !votes) return;

    // 2. Aggregate votes
    const resultsData = resolutions.map(res => {
      const resVotes = votes.filter(v => v.resolution_id === res.id);
      const forVotes = resVotes.filter(v => v.vote_value === "FOR").length;
      const againstVotes = resVotes.filter(v => v.vote_value === "AGAINST").length;
      const abstainVotes = resVotes.filter(v => v.vote_value === "ABSTAIN").length;

      return {
        ...res,
        stats: {
          for: forVotes,
          against: againstVotes,
          abstain: abstainVotes,
          total: resVotes.length,
          winner: forVotes > againstVotes // Simple logic for "Passed"
        }
      };
    });

    setResults(resultsData);
  };

  useEffect(() => {
    if (votingSession) {
      const endDate = new Date(votingSession.end_date);
      if (new Date() > endDate) {
        loadResults(votingSession.id);
      }
    }
  }, [votingSession]);

  const loadShareholders = async (companyId: string) => {
    const { data, error } = await supabase
      .from("shareholders")
      .select("id, shareholder_name, email, shares_held")
      .eq("company_id", companyId);

    if (error) {
      console.error("Error loading shareholders:", error);
      return;
    }

    setShareholders(data || []);
  };

  const handleSessionInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSessionForm(prev => ({ ...prev, [name]: value }));
  };

  const handleNomineeInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNomineeForm(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateOrUpdateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const validatedData = sessionSchema.parse({
        ...sessionForm,
        meetingLink: sessionForm.meetingLink || undefined,
        meetingStartDate: sessionForm.meetingStartDate || undefined,
        meetingEndDate: sessionForm.meetingEndDate || undefined,
      });

      if (new Date(validatedData.endDate) <= new Date(validatedData.startDate)) {
        toast.error("End date must be after start date");
        setIsSaving(false);
        return;
      }

      if (!company) {
        toast.error("Company not found");
        setIsSaving(false);
        return;
      }

      const sessionData = {
        company_id: company.id,
        title: validatedData.title,
        description: validatedData.description || null,
        start_date: new Date(validatedData.startDate).toISOString(),
        end_date: new Date(validatedData.endDate).toISOString(),
        meeting_link: validatedData.meetingLink || null,
        meeting_password: validatedData.meetingPassword || null,
        meeting_platform: validatedData.meetingPlatform || "zoom",
        meeting_start_date: validatedData.meetingStartDate ? new Date(validatedData.meetingStartDate).toISOString() : null,
        meeting_end_date: validatedData.meetingEndDate ? new Date(validatedData.meetingEndDate).toISOString() : null,
        voting_instructions: validatedData.votingInstructions || null,
      } as any;

      if (votingSession) {
        // Update existing session
        const { error } = await supabase
          .from("voting_sessions")
          .update(sessionData)
          .eq("id", votingSession.id);

        if (error) throw error;
        toast.success("Voting session updated successfully");
      } else {
        // Create new session
        const { data, error } = await supabase
          .from("voting_sessions")
          .insert(sessionData)
          .select()
          .single();

        if (error) throw error;
        setVotingSession(data);
        toast.success("Voting session created successfully");
      }

      await loadVotingSession(company.id);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
      } else {
        console.error("Error saving session:", err);
        toast.error("Failed to save voting session");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddNominee = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingNominee(true);

    try {
      if (!votingSession || !company) {
        toast.error("Please create a voting session first");
        setIsAddingNominee(false);
        return;
      }

      const validatedData = nomineeSchema.parse({
        name: nomineeForm.name.trim(),
        email: nomineeForm.email.trim().toLowerCase(),
        designation: nomineeForm.designation.trim() || undefined,
        qualification: nomineeForm.qualification.trim() || undefined,
        experienceYears: nomineeForm.experienceYears ? parseInt(nomineeForm.experienceYears) : undefined,
        bio: nomineeForm.bio.trim() || undefined,
      });

      const { data: nomineeData, error } = await supabase
        .from("nominees")
        .insert({
          voting_session_id: votingSession.id,
          company_id: company.id,
          nominee_name: validatedData.name,
          nominee_email: validatedData.email,
          designation: validatedData.designation || null,
          qualification: validatedData.qualification || null,
          experience_years: validatedData.experienceYears || null,
          bio: validatedData.bio || null,
        })
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          toast.error("A nominee with this email already exists");
        } else {
          throw error;
        }
        setIsAddingNominee(false);
        return;
      }

      // Auto-create resolution for this nominee
      const resolutionTitle = `Appointment of ${validatedData.name} as ${validatedData.designation || "Director"}`;
      const resolutionDesc = `To appoint ${validatedData.name}${validatedData.qualification ? `, ${validatedData.qualification}` : ""}${validatedData.experienceYears ? ` with ${validatedData.experienceYears} years of experience` : ""} as ${validatedData.designation || "Director"}.`;

      const { error: resError } = await supabase
        .from("resolutions")
        .insert({
          voting_session_id: votingSession.id,
          title: resolutionTitle,
          description: resolutionDesc,
          resolution_type: "director_election"
        });

      if (resError) {
        console.error("Error creating resolution for nominee:", resError);
        toast.warning("Nominee added but voting resolution could not be created automatically.");
      } else {
        // Send Notification Email to Nominee
        try {
          await supabase.functions.invoke("send-nomination-email", {
            body: {
              name: validatedData.name,
              email: validatedData.email,
              designation: validatedData.designation,
              companyName: company.company_name,
              qualification: validatedData.qualification,
              bio: validatedData.bio,
            }
          });
          toast.success("Nominee added, resolution created, and notification email sent!");
        } catch (emailError) {
          console.error("Failed to send notification email:", emailError);
          toast.success("Nominee added and resolution created (Email notification failed)");
        }
      }

      setNomineeForm({
        name: "",
        email: "",
        designation: "",
        qualification: "",
        experienceYears: "",
        bio: "",
      });
      setShowAddNominee(false);
      await loadNominees(votingSession.id);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
      } else {
        console.error("Error adding nominee:", err);
        toast.error("Failed to add nominee");
      }
    } finally {
      setIsAddingNominee(false);
    }
  };



  useEffect(() => {
    // This useEffect is already present at the top of the file.
    // The instruction seems to imply it was removed, but it's here.
    // Keeping the existing one and not adding a duplicate.
  }, []); // Placeholder for the instruction's `useEffect`

  const handleDeleteNominee = async (nomineeId: string) => {
    // if (!confirm("Are you sure you want to remove this nominee?")) return;
    console.log("Attempting to delete nominee:", nomineeId);

    // 1. Fetch nominee details first to get name for cleanup
    const { data: nominee, error: fetchError } = await supabase
      .from("nominees")
      .select("nominee_name, designation, voting_session_id")
      .eq("id", nomineeId)
      .single();

    if (fetchError) {
      console.error("Error fetching nominee before delete:", fetchError);
    }

    const { error: deleteError } = await supabase
      .from("nominees")
      .delete()
      .eq("id", nomineeId);

    if (deleteError) {
      console.error("Delete failed:", deleteError);
      toast.error(`Failed to remove nominee: ${deleteError.message || deleteError.details}`);
      return;
    }

    // 2. Try to cleanup the resolution
    if (nominee) {
      const resolutionTitle = `Appointment of ${nominee.nominee_name} as ${nominee.designation || "Director"}`;
      const { error: resError } = await supabase
        .from("resolutions")
        .delete()
        .eq("voting_session_id", nominee.voting_session_id)
        .eq("title", resolutionTitle);

      if (resError) console.error("Could not auto-delete resolution:", resError);
    }

    toast.success("Nominee removed successfully");

    // Refresh list
    if (votingSession) {
      await loadNominees(votingSession.id);
    } else if (nominee) {
      // Fallback if votingSession state is missing but we have the ID from fetch
      await loadNominees(nominee.voting_session_id);
    }
  };

  const handleToggleSessionActive = async () => {
    if (!votingSession) return;

    const { error } = await supabase
      .from("voting_sessions")
      .update({ is_active: !votingSession.is_active })
      .eq("id", votingSession.id);

    if (error) {
      toast.error("Failed to update session status");
      return;
    }

    toast.success(votingSession.is_active ? "Voting session paused" : "Voting session activated");
    if (company) await loadVotingSession(company.id);
  };

  const handleSendMeetingInvites = async () => {
    if (!votingSession || !company) {
      toast.error("Please create a voting session first");
      return;
    }

    if (!sessionForm.meetingLink) {
      toast.error("Please add a meeting link first");
      return;
    }

    if (shareholders.length === 0 && nominees.length === 0) {
      toast.error("No shareholders or nominees to send invites to");
      return;
    }

    setIsSendingEmails(true);

    try {
      toast.info(`Sending invites to ${shareholders.length} shareholders and ${nominees.length} nominees...`);

      // Prepare payload
      const recipients = [
        ...shareholders.map(s => ({
          email: s.email,
          name: s.shareholder_name,
          type: "shareholder" as const,
          shares: s.shares_held
        })),
        ...nominees.map(n => ({
          email: n.nominee_email,
          name: n.nominee_name,
          type: "nominee" as const
        }))
      ];

      console.log("Recipients Payload:", JSON.stringify(recipients, null, 2));

      if (recipients.length === 0) {
        toast.error("No recipients found (0 shareholders, 0 nominees).");
        setIsSendingEmails(false);
        return;
      }

      // Invoke Supabase Function
      const { data, error } = await supabase.functions.invoke('send-meeting-invites', {
        body: {
          votingSessionId: votingSession.id,
          companyName: company.company_name,
          meetingTitle: votingSession.title,
          meetingLink: sessionForm.meetingLink,
          meetingPassword: sessionForm.meetingPassword,
          meetingPlatform: sessionForm.meetingPlatform,
          startDate: (votingSession as any).meeting_start_date || votingSession.start_date,
          endDate: (votingSession as any).meeting_end_date || votingSession.end_date,
          votingInstructions: sessionForm.votingInstructions,
          recipients: recipients,
        }
      });

      if (error) throw error;

      console.log("Bulk email response:", data);

      if (data.failed > 0) {
        toast.warning(`Sent ${data.sent} emails, but ${data.failed} failed. Check console.`);
      } else {
        toast.success(`Successfully sent invites to all ${data.sent} recipients.`);
      }

      // Update session status
      const { error: updateError } = await supabase
        .from("voting_sessions")
        .update({ is_meeting_emails_sent: true })
        .eq("id", votingSession.id);

      if (updateError) console.error("Failed to update session status:", updateError);

      // Update local state
      setVotingSession(prev => prev ? { ...prev, is_meeting_emails_sent: true } : null);

    } catch (error: any) {
      console.error("Error sending invites:", error);
      toast.error(`Failed to process meeting invites: ${error.message || "Unknown error"}`);
    } finally {
      setIsSendingEmails(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!company || !votingSession || results.length === 0) {
      toast.error("No results to download");
      return;
    }

    const doc = new jsPDF();

    // 1. Header
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text(company.company_name, 14, 22);

    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text("Voting Session Results", 14, 30);
    doc.text(`Session: ${votingSession.title}`, 14, 36);
    doc.text(`Date Generated: ${new Date().toLocaleString()}`, 14, 42);

    // 2. Data Preparation for Table
    const tableData = results.map((item, index) => [
      index + 1,
      item.title,
      item.description || "N/A",
      item.stats.for,
      item.stats.against,
      item.stats.abstain,
      item.stats.winner ? "PASSED" : "NOT PASSED"
    ]);

    // 3. AutoTable
    autoTable(doc, {
      head: [['#', 'Resolution / Nominee', 'Details', 'For', 'Against', 'Abstain', 'Result']],
      body: tableData,
      startY: 50,
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [79, 70, 229], textColor: 255 }, // Indigo-600 like color
      alternateRowStyles: { fillColor: [245, 247, 250] },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 40 },
        2: { cellWidth: 50 },
        3: { cellWidth: 20, halign: 'center' },
        4: { cellWidth: 20, halign: 'center' },
        5: { cellWidth: 20, halign: 'center' },
        6: { cellWidth: 25, halign: 'center', fontStyle: 'bold' }
      },
      didParseCell: function (data) {
        if (data.section === 'body' && data.column.index === 6) {
          if (data.cell.raw === 'PASSED') {
            data.cell.styles.textColor = [22, 163, 74]; // Green
          } else {
            data.cell.styles.textColor = [220, 38, 38]; // Red
          }
        }
      }
    });

    // 4. Footer
    const finalY = (doc as any).lastAutoTable.finalY || 50;
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text("Generated by Vote India Secure Platform", 14, finalY + 10);

    // 5. Save
    doc.save(`voting_results_${votingSession.id.slice(0, 8)}.pdf`);
    toast.success("PDF downloaded successfully!");
  };

  const getSessionStatus = () => {
    if (!votingSession) return { status: "Not Created", color: "bg-muted text-muted-foreground" };

    const now = new Date();
    const start = new Date(votingSession.start_date);
    const end = new Date(votingSession.end_date);

    if (!votingSession.is_active) return { status: "Paused", color: "bg-yellow-100 text-yellow-800" };
    if (now < start) return { status: "Scheduled", color: "bg-blue-100 text-blue-800" };
    if (now > end) return { status: "Ended", color: "bg-muted text-muted-foreground" };
    return { status: "Active", color: "bg-green-100 text-green-800" };
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const sessionStatus = getSessionStatus();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-4">
                <Vote className="w-4 h-4" />
                <span>Voting Management</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                AGM & Voting{" "}
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Configuration
                </span>
              </h1>
              <p className="text-muted-foreground mt-2">
                Configure voting sessions, nominate candidates, and manage meeting invites
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge className={sessionStatus.color}>
                {sessionStatus.status}
              </Badge>
              <Button variant="ghost" onClick={() => navigate("/company-dashboard")}>
                Back to Dashboard
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
              <TabsTrigger value="overview" className="gap-2">
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="schedule" className="gap-2">
                <CalendarDays className="w-4 h-4" />
                <span className="hidden sm:inline">Schedule</span>
              </TabsTrigger>
              <TabsTrigger value="meeting" className="gap-2">
                <Video className="w-4 h-4" />
                <span className="hidden sm:inline">Meeting</span>
              </TabsTrigger>
              <TabsTrigger value="nominees" className="gap-2">
                <UserPlus className="w-4 h-4" />
                <span className="hidden sm:inline">Nominees</span>
              </TabsTrigger>
              <TabsTrigger value="results" className="gap-2">
                <Trophy className="w-4 h-4" />
                <span className="hidden sm:inline">Results</span>
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-border/50">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Users className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-3xl font-bold text-foreground">{shareholders.length}</p>
                        <p className="text-sm text-muted-foreground">Shareholders</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/50">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                        <UserPlus className="w-6 h-6 text-secondary" />
                      </div>
                      <div>
                        <p className="text-3xl font-bold text-foreground">{nominees.length}</p>
                        <p className="text-sm text-muted-foreground">Nominees</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/50">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                        <Mail className="w-6 h-6 text-accent" />
                      </div>
                      <div>
                        <p className="text-3xl font-bold text-foreground">
                          {votingSession?.is_meeting_emails_sent ? "Sent" : "Pending"}
                        </p>
                        <p className="text-sm text-muted-foreground">Email Status</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/50">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Vote className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-3xl font-bold text-foreground">{sessionStatus.status}</p>
                        <p className="text-sm text-muted-foreground">Session Status</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Voting Procedure Info */}
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="w-5 h-5 text-primary" />
                    Corporate Voting Procedure
                  </CardTitle>
                  <CardDescription>
                    Standard AGM voting process as per corporate governance guidelines
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-semibold text-foreground flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center">1</span>
                        Pre-Meeting Phase
                      </h4>
                      <ul className="space-y-2 text-sm text-muted-foreground pl-8">
                        <li>• Create voting session with start/end dates</li>
                        <li>• Add nominee candidates for voting</li>
                        <li>• Configure online meeting details</li>
                        <li>• Send meeting invites to all stakeholders</li>
                      </ul>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-semibold text-foreground flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-secondary text-secondary-foreground text-sm flex items-center justify-center">2</span>
                        During Meeting
                      </h4>
                      <ul className="space-y-2 text-sm text-muted-foreground pl-8">
                        <li>• Shareholders join via meeting link</li>
                        <li>• Present resolutions and nominees</li>
                        <li>• Allow Q&A session</li>
                        <li>• Open voting window</li>
                      </ul>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-semibold text-foreground flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-accent text-accent-foreground text-sm flex items-center justify-center">3</span>
                        Voting Process
                      </h4>
                      <ul className="space-y-2 text-sm text-muted-foreground pl-8">
                        <li>• Shareholders cast votes (For/Against/Abstain)</li>
                        <li>• One vote per resolution</li>
                        <li>• Votes weighted by shareholding</li>
                        <li>• Real-time vote tracking</li>
                      </ul>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-semibold text-foreground flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center">4</span>
                        Post-Voting
                      </h4>
                      <ul className="space-y-2 text-sm text-muted-foreground pl-8">
                        <li>• Announce voting results</li>
                        <li>• Generate voting receipts</li>
                        <li>• Archive session data</li>
                        <li>• Compliance documentation</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              {votingSession && (
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-3">
                      <Button
                        variant={votingSession.is_active ? "outline" : "saffron"}
                        onClick={handleToggleSessionActive}
                        className="gap-2"
                      >
                        {votingSession.is_active ? (
                          <>
                            <Pause className="w-4 h-4" />
                            Pause Voting
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4" />
                            Activate Voting
                          </>
                        )}
                      </Button>

                      <Button
                        variant="outline"
                        onClick={handleSendMeetingInvites}
                        disabled={isSendingEmails || !sessionForm.meetingLink}
                        className="gap-2"
                      >
                        {isSendingEmails ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                        {votingSession.is_meeting_emails_sent ? "Resend Invites" : "Send Meeting Invites"}
                      </Button>

                      {sessionForm.meetingLink && (
                        <Button
                          variant="ghost"
                          onClick={() => window.open(sessionForm.meetingLink, "_blank")}
                          className="gap-2"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Open Meeting Link
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Schedule Tab */}
            <TabsContent value="schedule" className="space-y-6">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-primary" />
                    Voting Session Details
                  </CardTitle>
                  <CardDescription>
                    Configure the voting period and meeting schedule
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateOrUpdateSession} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="title">Session Title *</Label>
                        <Input
                          id="title"
                          name="title"
                          value={sessionForm.title}
                          onChange={handleSessionInputChange}
                          placeholder="e.g., Annual General Meeting 2024"
                          required
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          name="description"
                          value={sessionForm.description}
                          onChange={handleSessionInputChange}
                          placeholder="Brief description of the meeting agenda..."
                          rows={3}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="startDate">Start Date & Time *</Label>
                        <div className="relative">
                          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                          <Input
                            id="startDate"
                            name="startDate"
                            type="datetime-local"
                            value={sessionForm.startDate}
                            onChange={handleSessionInputChange}
                            className="pl-11"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="endDate">End Date & Time *</Label>
                        <div className="relative">
                          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                          <Input
                            id="endDate"
                            name="endDate"
                            type="datetime-local"
                            value={sessionForm.endDate}
                            onChange={handleSessionInputChange}
                            className="pl-11"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h3 className="font-semibold text-foreground flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Voting Instructions
                      </h3>
                      <Textarea
                        id="votingInstructions"
                        name="votingInstructions"
                        value={sessionForm.votingInstructions}
                        onChange={handleSessionInputChange}
                        placeholder={`1. Login using your shareholder credentials
2. Review each resolution carefully
3. Cast your vote: For, Against, or Abstain
4. Your vote is final and cannot be changed
5. Download your voting receipt for records`}
                        rows={6}
                      />
                    </div>

                    <div className="flex justify-end gap-3">
                      <Button type="submit" variant="saffron" disabled={isSaving} className="gap-2">
                        {isSaving ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4" />
                        )}
                        {votingSession ? "Update Session" : "Create Session"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Nominees Tab */}
            <TabsContent value="nominees" className="space-y-6">
              <Card className="border-border/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <UserPlus className="w-5 h-5 text-primary" />
                        Nominee Candidates
                      </CardTitle>
                      <CardDescription>
                        Add candidates for director/position voting
                      </CardDescription>
                    </div>
                    <Button
                      variant={showAddNominee ? "ghost" : "saffron"}
                      onClick={() => setShowAddNominee(!showAddNominee)}
                      className="gap-2"
                      disabled={!votingSession}
                    >
                      {showAddNominee ? "Cancel" : <><Plus className="w-4 h-4" /> Add Nominee</>}
                    </Button>
                  </div>
                </CardHeader>

                {!votingSession && (
                  <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                      <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                      <p>Please create a voting session first in the Schedule tab</p>
                    </div>
                  </CardContent>
                )}

                {showAddNominee && votingSession && (
                  <CardContent className="border-t border-border pt-6">
                    <form onSubmit={handleAddNominee} className="space-y-4 animate-fade-in-up">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Nominee Name *</Label>
                          <Input
                            id="name"
                            name="name"
                            value={nomineeForm.name}
                            onChange={handleNomineeInputChange}
                            placeholder="Full Name"
                            required
                            disabled={isAddingNominee}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="email">Email Address *</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <Input
                              id="email"
                              name="email"
                              type="email"
                              value={nomineeForm.email}
                              onChange={handleNomineeInputChange}
                              placeholder="nominee@email.com"
                              className="pl-11"
                              required
                              disabled={isAddingNominee}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="designation">Designation</Label>
                          <Input
                            id="designation"
                            name="designation"
                            value={nomineeForm.designation}
                            onChange={handleNomineeInputChange}
                            placeholder="e.g., Independent Director"
                            disabled={isAddingNominee}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="qualification">Qualification</Label>
                          <Input
                            id="qualification"
                            name="qualification"
                            value={nomineeForm.qualification}
                            onChange={handleNomineeInputChange}
                            placeholder="e.g., MBA, CA, CS"
                            disabled={isAddingNominee}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="experienceYears">Years of Experience</Label>
                          <Input
                            id="experienceYears"
                            name="experienceYears"
                            type="number"
                            value={nomineeForm.experienceYears}
                            onChange={handleNomineeInputChange}
                            placeholder="15"
                            min="0"
                            disabled={isAddingNominee}
                          />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="bio">Brief Bio</Label>
                          <Textarea
                            id="bio"
                            name="bio"
                            value={nomineeForm.bio}
                            onChange={handleNomineeInputChange}
                            placeholder="Brief background and qualifications..."
                            rows={3}
                            disabled={isAddingNominee}
                          />
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Button type="submit" variant="saffron" disabled={isAddingNominee} className="gap-2">
                          {isAddingNominee ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Plus className="w-4 h-4" />
                          )}
                          Add Nominee
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                )}

                {votingSession && nominees.length > 0 && (
                  <CardContent className={showAddNominee ? "" : "border-t border-border"}>
                    <div className="space-y-4">
                      {nominees.map((nominee) => (
                        <div
                          key={nominee.id}
                          className="flex items-start justify-between p-4 rounded-lg bg-muted/50 border border-border/50"
                        >
                          <div className="flex gap-4">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-lg font-bold text-primary">
                                {nominee.nominee_name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <h4 className="font-semibold text-foreground">{nominee.nominee_name}</h4>
                              <p className="text-sm text-muted-foreground">{nominee.nominee_email}</p>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {nominee.designation && (
                                  <Badge variant="secondary" className="text-xs">
                                    {nominee.designation}
                                  </Badge>
                                )}
                                {nominee.qualification && (
                                  <Badge variant="outline" className="text-xs">
                                    {nominee.qualification}
                                  </Badge>
                                )}
                                {nominee.experience_years && (
                                  <Badge variant="outline" className="text-xs">
                                    {nominee.experience_years} yrs exp
                                  </Badge>
                                )}
                              </div>
                              {nominee.bio && (
                                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                  {nominee.bio}
                                </p>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteNominee(nominee.id)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}

                {votingSession && nominees.length === 0 && !showAddNominee && (
                  <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                      <UserPlus className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                      <p>No nominees added yet. Click "Add Nominee" to get started.</p>
                    </div>
                  </CardContent>
                )}
              </Card>
            </TabsContent>

            {/* Meeting Tab */}
            <TabsContent value="meeting" className="space-y-6">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="w-5 h-5 text-primary" />
                    Online Meeting Configuration
                  </CardTitle>
                  <CardDescription>
                    Set up the virtual meeting for shareholders and nominees
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateOrUpdateSession} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="meetingPlatform">Meeting Platform</Label>
                        <Select
                          value={sessionForm.meetingPlatform}
                          onValueChange={(value) => setSessionForm(prev => ({ ...prev, meetingPlatform: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select platform" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="zoom">Zoom</SelectItem>
                            <SelectItem value="meet">Google Meet</SelectItem>
                            <SelectItem value="teams">Microsoft Teams</SelectItem>
                            <SelectItem value="webex">Cisco Webex</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="meetingPassword">Meeting Password (Optional)</Label>
                        <Input
                          id="meetingPassword"
                          name="meetingPassword"
                          value={sessionForm.meetingPassword}
                          onChange={handleSessionInputChange}
                          placeholder="Enter meeting password"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="meetingStartDate">Meeting Start Date & Time</Label>
                        <div className="relative">
                          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                          <Input
                            id="meetingStartDate"
                            name="meetingStartDate"
                            type="datetime-local"
                            value={sessionForm.meetingStartDate}
                            onChange={handleSessionInputChange}
                            className="pl-11"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="meetingEndDate">Meeting End Date & Time</Label>
                        <div className="relative">
                          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                          <Input
                            id="meetingEndDate"
                            name="meetingEndDate"
                            type="datetime-local"
                            value={sessionForm.meetingEndDate}
                            onChange={handleSessionInputChange}
                            className="pl-11"
                          />
                        </div>
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="meetingLink">Meeting Link *</Label>
                        <div className="relative">
                          <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                          <Input
                            id="meetingLink"
                            name="meetingLink"
                            value={sessionForm.meetingLink}
                            onChange={handleSessionInputChange}
                            placeholder="https://zoom.us/j/123456789"
                            className="pl-11"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          This link will be sent to all shareholders and nominees
                        </p>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex justify-end gap-3">
                      <Button type="submit" variant="saffron" disabled={isSaving} className="gap-2">
                        {isSaving ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4" />
                        )}
                        Save Meeting Details
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Send Invites Card */}
              <Card className="border-border/50 border-2 border-dashed">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="w-5 h-5 text-secondary" />
                    Send Meeting Invitations
                  </CardTitle>
                  <CardDescription>
                    Email meeting details to all shareholders and nominees
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-primary" />
                        <span>{shareholders.length} Shareholders</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <UserPlus className="w-4 h-4 text-secondary" />
                        <span>{nominees.length} Nominees</span>
                      </div>
                      {votingSession?.is_meeting_emails_sent && (
                        <Badge variant="secondary" className="gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Invites Sent
                        </Badge>
                      )}
                    </div>

                    <div className="bg-muted/50 rounded-lg p-4">
                      <h4 className="font-medium text-foreground mb-2">Email will include:</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Meeting title and agenda</li>
                        <li>• Start and end date/time (IST)</li>
                        <li>• Meeting link and password</li>
                        <li>• Voting instructions</li>
                        <li>• Important notes for participants</li>
                      </ul>
                    </div>

                    <Button
                      onClick={handleSendMeetingInvites}
                      variant="saffron"
                      disabled={isSendingEmails || !sessionForm.meetingLink || !votingSession}
                      className="w-full gap-2"
                    >
                      {isSendingEmails ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Sending Invites...
                        </>
                      ) : (
                        <>
                          <Mail className="w-4 h-4" />
                          {votingSession?.is_meeting_emails_sent ? "Resend All Invites" : "Send Invites to All"}
                        </>
                      )}
                    </Button>

                    {!sessionForm.meetingLink && (
                      <p className="text-sm text-destructive flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Please add a meeting link before sending invites
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Security Notice */}
              <Card className="border-accent/30 bg-accent/5">
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <Shield className="w-8 h-8 text-accent flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">Security & Compliance</h4>
                      <p className="text-sm text-muted-foreground">
                        All voting data is encrypted and securely stored. Meeting invitations are sent with unique identifiers for audit purposes. Votes are final and cannot be modified once submitted, ensuring the integrity of the corporate voting process.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="results" className="space-y-6">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-primary" />
                    Voting Results
                  </CardTitle>
                  {votingSession && new Date(votingSession.end_date) <= new Date() && results.length > 0 && (
                    <Button variant="outline" size="sm" onClick={handleDownloadPDF} className="gap-2">
                      <FileText className="w-4 h-4" />
                      Download PDF
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {!votingSession ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Please create a voting session first.
                    </div>
                  ) : new Date(votingSession.end_date) > new Date() ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                      <Lock className="w-12 h-12 mb-4 opacity-50" />
                      <h3 className="text-lg font-medium text-foreground">Results Locked</h3>
                      <p>Voting results will be available after the session ends on {new Date(votingSession.end_date).toLocaleString()}.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {results.map((item) => (
                        <div key={item.id} className="p-4 rounded-lg border bg-card/50">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h4 className="font-semibold text-lg">{item.title}</h4>
                              <p className="text-sm text-muted-foreground">{item.description}</p>
                            </div>
                            <Badge variant={item.stats.for > item.stats.against ? "default" : "secondary"} className={item.stats.for > item.stats.against ? "bg-green-500 hover:bg-green-600" : ""}>
                              {item.stats.for > item.stats.against ? "PASSED / LEADING" : "NOT PASSED"}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="p-3 bg-green-500/10 rounded-lg">
                              <div className="text-2xl font-bold text-green-600">{item.stats.for}</div>
                              <div className="text-xs text-muted-foreground uppercase">Votes For</div>
                            </div>
                            <div className="p-3 bg-red-500/10 rounded-lg">
                              <div className="text-2xl font-bold text-red-600">{item.stats.against}</div>
                              <div className="text-xs text-muted-foreground uppercase">Votes Against</div>
                            </div>
                            <div className="p-3 bg-gray-500/10 rounded-lg">
                              <div className="text-2xl font-bold text-gray-600">{item.stats.abstain}</div>
                              <div className="text-xs text-muted-foreground uppercase">Abstain</div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {results.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">No resolutions or votes found.</div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default VotingManagement;
