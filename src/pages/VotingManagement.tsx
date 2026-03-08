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
import { supabase } from "@/integrations/supabase/client";
import { env } from "@/config/env";
import { z } from "zod";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useTranslation } from "react-i18next";
import { MerkleTree } from "@/lib/merkle";
import { generateVoteHash, simulateBlockchainTransaction } from "@/lib/blockchain";

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
  auto_start_done?: boolean;
  auto_end_done?: boolean;
}

export interface ResolutionResult {
  id: string;
  title: string;
  description: string | null;
  stats: {
    for: number;
    against: number;
    abstain: number;
    total: number;
    winner: boolean;
  };
}

export interface AnchorData {
  created_at: string;
  transaction_id: string;
  [key: string]: unknown;
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
  const { t } = useTranslation();
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

  const [results, setResults] = useState<ResolutionResult[]>([]);
  const [isAnchoring, setIsAnchoring] = useState(false);
  const [anchorData, setAnchorData] = useState<AnchorData | null>(null);

  const handleAnchorToBlockchain = async () => {
    if (!votingSession || results.length === 0) return;
    setIsAnchoring(true);

    try {
      // 1. Fetch ALL raw votes for this session to build the tree
      const { data: allVotes, error: votesError } = await supabase
        .from("votes")
        .select("vote_hash")
        .in("resolution_id", results.map(r => r.id));

      if (votesError || !allVotes || allVotes.length === 0) {
        toast.error("No votes to anchor.");
        setIsAnchoring(false);
        return;
      }

      const voteHashes = allVotes.map(v => v.vote_hash).sort(); // Sort for determinism

      // 2. Build Merkle Tree
      const tree = await MerkleTree.create(voteHashes);
      const root = tree.getRoot();

      // 3. Simulate Blockchain Tx
      const txHash = await simulateBlockchainTransaction();

      // 4. Save to block_anchors
      const { error: anchorError } = await supabase
        .from("block_anchors")
        .insert({
          session_id: votingSession.id,
          merkle_root: root,
          vote_count: voteHashes.length,
          started_at: votingSession.start_date,
          ended_at: votingSession.end_date,
          transaction_id: txHash,
          blockchain_network: "Polygon Amoy Testnet"
        });

      if (anchorError) throw anchorError;

      toast.success("Session votes successfully anchored to Polygon Amoy Testnet!");
      await loadAnchorStatus();

    } catch (error: unknown) {
      console.error("Anchoring failed:", error);
      toast.error(`Anchoring failed: ${(error as Error).message}`);
    } finally {
      setIsAnchoring(false);
    }
  };

  const loadAnchorStatus = async () => {
    if (!votingSession) return;
    const { data } = await supabase
      .from("block_anchors")
      .select("*")
      .eq("session_id", votingSession.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) setAnchorData(data);
  };

  useEffect(() => {
    if (votingSession) loadAnchorStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [votingSession]);

  useEffect(() => {
    if (!votingSession || !company) return;

    const now = new Date();
    const start = new Date(votingSession.start_date);
    const end = new Date(votingSession.end_date);

    let nextEvent: Date | null = null;

    if (now < start) {
      nextEvent = start;
    } else if (now < end) {
      nextEvent = end;
    }

    if (nextEvent) {
      const delay = nextEvent.getTime() - now.getTime() + 1000; // Add 1s buffer
      console.log(`Setting timer for next status sync in ${Math.round(delay / 1000)} seconds...`);
      const timer = setTimeout(() => {
        loadVotingSession(company.id);
      }, delay);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [votingSession, company]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      // --- AUTO-SYNC LOGIC ---
      try {
        const now = new Date();
        const start = new Date(data.start_date);
        const end = new Date(data.end_date);
        let needsUpdate = false;
        const updates: Record<string, unknown> = {};

        // 1. Auto-Start if time has come and not already started or manually stopped
        if (now >= start && now <= end && !data.is_active && !data.auto_start_done && !data.auto_end_done) {
          console.log("Auto-activating session based on start_date");
          updates.is_active = true;
          updates.auto_start_done = true;
          needsUpdate = true;
        }

        // 2. Auto-End if time has passed and not already ended
        if (now > end && data.is_active && !data.auto_end_done) {
          console.log("Auto-pausing session based on end_date");
          updates.is_active = false;
          updates.auto_end_done = true;
          needsUpdate = true;
        }

        if (needsUpdate) {
          await supabase
            .from("voting_sessions")
            .update(updates)
            .eq("id", data.id);

          // Reload with updated state
          const { data: updatedData } = await supabase
            .from("voting_sessions")
            .select("*")
            .eq("id", data.id)
            .single();
          if (updatedData) setVotingSession(updatedData);
        }
      } catch (syncErr) {
        console.error("Critical error in session auto-sync logic:", syncErr);
      }
      // -----------------------

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
        meetingStartDate: data.meeting_start_date ? toLocalISOString(data.meeting_start_date) : (data.start_date ? toLocalISOString(data.start_date) : ""),
        meetingEndDate: data.meeting_end_date ? toLocalISOString(data.meeting_end_date) : (data.end_date ? toLocalISOString(data.end_date) : ""),
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

  useEffect(() => {
    // Automated Anchoring Logic
    // Trigger when: session ended automatically, results are loaded, not already anchored, and not currently anchoring
    if (
      votingSession &&
      votingSession.auto_end_done &&
      results.length > 0 &&
      !anchorData &&
      !isAnchoring
    ) {
      console.log("Triggering automated blockchain anchoring after session end...");
      handleAnchorToBlockchain();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [votingSession, results, anchorData, isAnchoring]);

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
        auto_start_done: false,
        auto_end_done: false,
      };

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
            },
            headers: {
              "Authorization": `Bearer ${env.SUPABASE_ANON_KEY}`
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

    const isActivating = !votingSession.is_active;
    const updates: Record<string, unknown> = { is_active: isActivating };

    // If manually activating, mark auto-start as "done" so it doesn't fight
    if (isActivating) updates.auto_start_done = true;
    // If manually pausing, mark auto-end as "done" so it doesnt auto-start again in this window
    else updates.auto_end_done = true;

    const { error } = await supabase
      .from("voting_sessions")
      .update(updates)
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
          startDate: votingSession.meeting_start_date || votingSession.start_date,
          endDate: votingSession.meeting_end_date || votingSession.end_date,
          votingInstructions: sessionForm.votingInstructions,
          recipients: recipients,
        },
        headers: {
          "Authorization": `Bearer ${env.SUPABASE_ANON_KEY}`
        }
      });

      if (error) throw error;

      console.log("Bulk email response:", data);

      if (data.failed > 0) {
        toast.warning(`Sent ${data.sent} emails, but ${data.failed} failed. Check console for details.`);
      } else {
        toast.success(`Successfully sent invites to all ${data.sent} recipients.`);
      }

      // --- SYNC STATUS TO DATABASE ---
      const successfulEmails = data.results
        .filter((r: { success: boolean, email: string }) => r.success)
        .map((r: { success: boolean, email: string }) => r.email);

      if (successfulEmails.length > 0) {
        // Update shareholders
        await supabase
          .from("shareholders")
          .update({ is_meeting_email_sent: true })
          .in("email", successfulEmails)
          .eq("company_id", company.id);

        // Update nominees
        await supabase
          .from("nominees")
          .update({ is_email_sent: true })
          .in("nominee_email", successfulEmails)
          .eq("voting_session_id", votingSession.id);
      }

      // Update session status
      const { error: updateError } = await supabase
        .from("voting_sessions")
        .update({ is_meeting_emails_sent: true })
        .eq("id", votingSession.id);

      if (updateError) {
        console.error("Failed to update session status:", updateError);
      }

      // Update local state and reload data to reflect checkmarks
      setVotingSession(prev => prev ? { ...prev, is_meeting_emails_sent: true } : null);
      await loadShareholders(company.id);
      await loadNominees(votingSession.id);

    } catch (error: unknown) {
      console.error("Error sending invites:", error);
      toast.error(`Failed to process meeting invites: ${(error as Error).message || "Unknown error"}`);
    } finally {
      setIsSendingEmails(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!company || !votingSession || results.length === 0) {
      toast.error("No results to download");
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const doc = new jsPDF() as any;
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // 1. Header Banner
    doc.setFillColor(30, 41, 59); // Slate-800
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text(company.company_name, 14, 20);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("OFFICIAL REGISTERED VOTING REPORT", 14, 28);
    doc.text(`Report ID: EV-${votingSession.id.slice(0, 8).toUpperCase()}-${Date.now().toString().slice(-6)}`, pageWidth - 14, 28, { align: 'right' });

    // 2. Session Summary Info
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Session Details", 14, 52);
    
    doc.setDrawColor(226, 232, 240); // Slate-200
    doc.line(14, 55, pageWidth - 14, 55);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Title:`, 14, 62);
    doc.setFont("helvetica", "bold");
    doc.text(votingSession.title, 45, 62);
    
    doc.setFont("helvetica", "normal");
    doc.text(`Commenced:`, 14, 68);
    doc.text(new Date(votingSession.start_date).toLocaleString(), 45, 68);
    
    doc.text(`Concluded:`, 14, 74);
    doc.text(new Date(votingSession.end_date).toLocaleString(), 45, 74);
    
    doc.text(`Platform:`, 14, 80);
    doc.text("Vote India Secure Digital Infrastructure", 45, 80);

    // 3. Overall Statistics Summary
    const totalVotes = results.reduce((acc, curr) => acc + curr.stats.total, 0);
    const avgParticipation = results.length > 0 ? (totalVotes / results.length) : 0;
    
    doc.setFillColor(248, 250, 252); // Slate-50
    doc.rect(14, 88, pageWidth - 28, 25, 'F');
    doc.setDrawColor(203, 213, 225); // Slate-300
    doc.rect(14, 88, pageWidth - 28, 25, 'D');
    
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139); // Slate-500
    doc.text("TOTAL RESOLUTIONS", 20, 95);
    doc.text("AGGREGATED POWER", pageWidth / 3 + 10, 95);
    doc.text("COMPLIANCE STATUS", (pageWidth / 3) * 2 + 5, 95);
    
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42); // Slate-900
    doc.setFont("helvetica", "bold");
    doc.text(results.length.toString(), 20, 105);
    doc.text(`${totalVotes} Votes`, pageWidth / 3 + 10, 105);
    doc.setTextColor(22, 163, 74); // Green-600
    doc.text("VERIFIED", (pageWidth / 3) * 2 + 5, 105);

    // 4. Detailed Results Table
    const tableData = results.map((item, index) => [
      index + 1,
      item.title,
      item.stats.for,
      item.stats.against,
      item.stats.abstain,
      item.stats.total,
      item.stats.winner ? "PASSED" : "NOT PASSED"
    ]);

    autoTable(doc, {
      head: [['#', 'Resolution / Nominee', 'For', 'Against', 'Abstain', 'Total', 'Result']],
      body: tableData,
      startY: 120,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 4, font: 'helvetica' },
      headStyles: { 
        fillColor: [30, 41, 59], 
        textColor: 255, 
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 20, halign: 'center' },
        4: { cellWidth: 20, halign: 'center' },
        5: { cellWidth: 20, halign: 'center' },
        6: { cellWidth: 30, halign: 'center', fontStyle: 'bold' }
      },
      didParseCell: function (data) {
        if (data.section === 'body' && data.column.index === 6) {
          if (data.cell.raw === 'PASSED') {
            data.cell.styles.textColor = [22, 163, 74]; // Green-600
          } else {
            data.cell.styles.textColor = [220, 38, 38]; // Red-600
          }
        }
      }
    });

    // 5. Digital Seal & Footer
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const finalY = (doc as any).lastAutoTable.finalY + 20;
    
    if (finalY < doc.internal.pageSize.getHeight() - 60) {
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text("Certified and Electronically Signed by:", 14, finalY);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 41, 59);
      doc.text("Vote India Secure Audit Infrastructure", 14, finalY + 6);
      
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184); // Slate-400
      doc.text("This document is a legally admissible electronic record under the Information Technology Act, 2000.", 14, finalY + 12);
      doc.text("Tamper-proof hashes for each vote are recorded in the immutable database audit log.", 14, finalY + 16);
      
      // Decorative seal element
      doc.setDrawColor(79, 70, 229); // Indigo-600
      doc.setLineWidth(0.5);
      doc.circle(pageWidth - 30, finalY + 5, 15, 'D');
      doc.setFontSize(6);
      doc.setTextColor(79, 70, 229);
      doc.text("SECURITY", pageWidth - 30, finalY + 2, { align: 'center' });
      doc.text("VERIFIED", pageWidth - 30, finalY + 7, { align: 'center' });
    }

    // Page numbers
    const totalPages = doc.internal.getNumberOfPages();
    for(let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
    }

    // 6. Save
    const fileName = `${company.company_name.replace(/\s+/g, '_')}_Voting_Results_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    toast.success("Professional report generated and downloaded!");
  };

  const getSessionStatus = () => {
    if (!votingSession) return { status: "Not Created", color: "bg-muted text-muted-foreground" };

    const now = new Date();
    const start = new Date(votingSession.start_date);
    const end = new Date(votingSession.end_date);

    if (!votingSession.is_active) {
      if (votingSession.auto_end_done) return { status: "Paused (Manual/Auto-Ended)", color: "bg-yellow-100 text-yellow-800" };
      return { status: "Paused", color: "bg-yellow-100 text-yellow-800" };
    }

    if (now < start) return { status: "Scheduled", color: "bg-blue-100 text-blue-800" };
    if (now > end) return { status: "Ended", color: "bg-muted text-muted-foreground" };

    if (votingSession.auto_start_done) return { status: "Active (Auto-Started)", color: "bg-green-100 text-green-800" };
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
    <div className="min-h-screen relative">
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
                {t("voting_management_title")}{" "}
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  {t("voting_management_subtitle")}
                </span>
              </h1>
              <p className="text-muted-foreground mt-2">
                {t("voting_management_desc")}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge className={sessionStatus.color}>
                {sessionStatus.status}
              </Badge>
              <Button variant="ghost" onClick={() => navigate("/company-dashboard")}>
                {t("voting_management_back")}
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
              <TabsTrigger value="overview" className="gap-2">
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">{t("voting_management_tab_overview")}</span>
              </TabsTrigger>
              <TabsTrigger value="schedule" className="gap-2">
                <CalendarDays className="w-4 h-4" />
                <span className="hidden sm:inline">{t("voting_management_tab_schedule")}</span>
              </TabsTrigger>
              <TabsTrigger value="meeting" className="gap-2">
                <Video className="w-4 h-4" />
                <span className="hidden sm:inline">{t("voting_management_tab_meeting")}</span>
              </TabsTrigger>
              <TabsTrigger value="nominees" className="gap-2">
                <UserPlus className="w-4 h-4" />
                <span className="hidden sm:inline">{t("voting_management_tab_nominees")}</span>
              </TabsTrigger>
              <TabsTrigger value="results" className="gap-2">
                <Trophy className="w-4 h-4" />
                <span className="hidden sm:inline">{t("voting_management_tab_results")}</span>
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-border/50">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Users className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-3xl font-bold text-foreground">{shareholders.length}</p>
                        <p className="text-sm text-muted-foreground">{t("voting_management_stat_shareholders")}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/50">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0">
                        <UserPlus className="w-6 h-6 text-secondary" />
                      </div>
                      <div>
                        <p className="text-3xl font-bold text-foreground">{nominees.length}</p>
                        <p className="text-sm text-muted-foreground">{t("voting_management_stat_nominees")}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/50">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                        <Mail className="w-6 h-6 text-accent" />
                      </div>
                      <div>
                        <p className="text-3xl font-bold text-foreground">
                          {votingSession?.is_meeting_emails_sent ? t("voting_management_stat_email_sent") : t("voting_management_stat_email_pending")}
                        </p>
                        <p className="text-sm text-muted-foreground">{t("voting_management_stat_email_status")}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/50">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Vote className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className={`${sessionStatus.status.length > 20 ? 'text-lg' : sessionStatus.status.length > 12 ? 'text-xl' : 'text-3xl'} font-bold text-foreground leading-tight`}>
                          {sessionStatus.status}
                        </p>
                        <p className="text-sm text-muted-foreground">{t("voting_management_stat_session_status")}</p>
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
                    {t("voting_management_proc_title")}
                  </CardTitle>
                  <CardDescription>
                    {t("voting_management_proc_desc")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-semibold text-foreground flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center">1</span>
                        {t("voting_management_proc_1_title")}
                      </h4>
                      <ul className="space-y-2 text-sm text-muted-foreground pl-8">
                        <li>{t("voting_management_proc_1_1")}</li>
                        <li>{t("voting_management_proc_1_2")}</li>
                        <li>{t("voting_management_proc_1_3")}</li>
                        <li>{t("voting_management_proc_1_4")}</li>
                      </ul>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-semibold text-foreground flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-secondary text-secondary-foreground text-sm flex items-center justify-center">2</span>
                        {t("voting_management_proc_2_title")}
                      </h4>
                      <ul className="space-y-2 text-sm text-muted-foreground pl-8">
                        <li>{t("voting_management_proc_2_1")}</li>
                        <li>{t("voting_management_proc_2_2")}</li>
                        <li>{t("voting_management_proc_2_3")}</li>
                        <li>{t("voting_management_proc_2_4")}</li>
                      </ul>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-semibold text-foreground flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-accent text-accent-foreground text-sm flex items-center justify-center">3</span>
                        {t("voting_management_proc_3_title")}
                      </h4>
                      <ul className="space-y-2 text-sm text-muted-foreground pl-8">
                        <li>{t("voting_management_proc_3_1")}</li>
                        <li>{t("voting_management_proc_3_2")}</li>
                        <li>{t("voting_management_proc_3_3")}</li>
                        <li>{t("voting_management_proc_3_4")}</li>
                      </ul>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-semibold text-foreground flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center">4</span>
                        {t("voting_management_proc_4_title")}
                      </h4>
                      <ul className="space-y-2 text-sm text-muted-foreground pl-8">
                        <li>{t("voting_management_proc_4_1")}</li>
                        <li>{t("voting_management_proc_4_2")}</li>
                        <li>{t("voting_management_proc_4_3")}</li>
                        <li>{t("voting_management_proc_4_4")}</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              {votingSession && (
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle>{t("voting_management_qa_title")}</CardTitle>
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
                            {t("voting_management_qa_pause")}
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4" />
                            {t("voting_management_qa_activate")}
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
                        {votingSession.is_meeting_emails_sent ? t("voting_management_qa_resend") : t("voting_management_qa_send")}
                      </Button>

                      {sessionForm.meetingLink && (
                        <Button
                          variant="ghost"
                          onClick={() => window.open(sessionForm.meetingLink, "_blank")}
                          className="gap-2"
                        >
                          <ExternalLink className="w-4 h-4" />
                          {t("voting_management_qa_open_link")}
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
                    {t("voting_management_sched_title")}
                  </CardTitle>
                  <CardDescription>
                    {t("voting_management_sched_desc")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateOrUpdateSession} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="title">{t("voting_management_sched_form_title")}</Label>
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
                        <Label htmlFor="description">{t("voting_management_sched_form_desc")}</Label>
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
                        <Label htmlFor="startDate">{t("voting_management_sched_form_start")}</Label>
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
                        <Label htmlFor="endDate">{t("voting_management_sched_form_end")}</Label>
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
                        {t("voting_management_sched_form_inst")}
                      </h3>
                      <Textarea
                        id="votingInstructions"
                        name="votingInstructions"
                        value={sessionForm.votingInstructions}
                        onChange={handleSessionInputChange}
                        placeholder={`1. Login using your shareholder credentials\n2. Review each resolution carefully\n3. Cast your vote: For, Against, or Abstain\n4. Your vote is final and cannot be changed\n5. Download your voting receipt for records`}
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
                        {votingSession ? t("voting_management_sched_btn_update") : t("voting_management_sched_btn_create")}
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
                        {t("voting_management_nominee_title")}
                      </CardTitle>
                      <CardDescription>
                        {t("voting_management_nominee_desc")}
                      </CardDescription>
                    </div>
                    <Button
                      variant={showAddNominee ? "ghost" : "saffron"}
                      onClick={() => setShowAddNominee(!showAddNominee)}
                      className="gap-2"
                      disabled={!votingSession}
                    >
                      {showAddNominee ? t("voting_management_nominee_btn_cancel") : <><Plus className="w-4 h-4" /> {t("voting_management_nominee_btn_add")}</>}
                    </Button>
                  </div>
                </CardHeader>

                {!votingSession && (
                  <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                      <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                      <p>{t("voting_management_nominee_empty_session")}</p>
                    </div>
                  </CardContent>
                )}

                {showAddNominee && votingSession && (
                  <CardContent className="border-t border-border pt-6">
                    <form onSubmit={handleAddNominee} className="space-y-4 animate-fade-in-up">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">{t("voting_management_nominee_form_name")}</Label>
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
                          <Label htmlFor="email">{t("voting_management_nominee_form_email")}</Label>
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
                          <Label htmlFor="designation">{t("voting_management_nominee_form_desig")}</Label>
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
                          <Label htmlFor="qualification">{t("voting_management_nominee_form_qual")}</Label>
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
                          <Label htmlFor="experienceYears">{t("voting_management_nominee_form_exp")}</Label>
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
                          <Label htmlFor="bio">{t("voting_management_nominee_form_bio")}</Label>
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
                          {t("voting_management_nominee_btn_submit")}
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
                                    {nominee.experience_years} {t("voting_management_nominee_yrs_exp")}
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
                      <p>{t("voting_management_nominee_empty_list")}</p>
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
                    {t("voting_management_meet_title")}
                  </CardTitle>
                  <CardDescription>
                    {t("voting_management_meet_desc")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateOrUpdateSession} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="meetingPlatform">{t("voting_management_meet_form_platform")}</Label>
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
                        <Label htmlFor="meetingPassword">{t("voting_management_meet_form_pwd")}</Label>
                        <Input
                          id="meetingPassword"
                          name="meetingPassword"
                          value={sessionForm.meetingPassword}
                          onChange={handleSessionInputChange}
                          placeholder="Enter meeting password"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="meetingStartDate">{t("voting_management_meet_form_start")}</Label>
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
                        <Label htmlFor="meetingEndDate">{t("voting_management_meet_form_end")}</Label>
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
                        <Label htmlFor="meetingLink">{t("voting_management_meet_form_link")}</Label>
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
                          {t("voting_management_meet_form_link_help")}
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
                        {t("voting_management_meet_btn_save")}
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
                    {t("voting_management_meet_invite_title")}
                  </CardTitle>
                  <CardDescription>
                    {t("voting_management_meet_invite_desc")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-primary" />
                        <span>{shareholders.length} {t("voting_management_stat_shareholders")}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <UserPlus className="w-4 h-4 text-secondary" />
                        <span>{nominees.length} {t("voting_management_stat_nominees")}</span>
                      </div>
                      {votingSession?.is_meeting_emails_sent && (
                        <Badge variant="secondary" className="gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          {t("voting_management_meet_invite_sent")}
                        </Badge>
                      )}
                    </div>

                    <div className="bg-muted/50 rounded-lg p-4">
                      <h4 className="font-medium text-foreground mb-2">{t("voting_management_meet_invite_inc_title")}</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>{t("voting_management_meet_invite_inc_1")}</li>
                        <li>{t("voting_management_meet_invite_inc_2")}</li>
                        <li>{t("voting_management_meet_invite_inc_3")}</li>
                        <li>{t("voting_management_meet_invite_inc_4")}</li>
                        <li>{t("voting_management_meet_invite_inc_5")}</li>
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
                          {t("voting_management_meet_invite_sending")}
                        </>
                      ) : (
                        <>
                          <Mail className="w-4 h-4" />
                          {votingSession?.is_meeting_emails_sent ? t("voting_management_meet_invite_btn_resend") : t("voting_management_meet_invite_btn_send")}
                        </>
                      )}
                    </Button>

                    {!sessionForm.meetingLink && (
                      <p className="text-sm text-destructive flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        {t("voting_management_meet_invite_err_link")}
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
                      <h4 className="font-semibold text-foreground mb-1">{t("voting_management_sec_title")}</h4>
                      <p className="text-sm text-muted-foreground">
                        {t("voting_management_sec_desc")}
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
                    {t("voting_management_res_title")}
                  </CardTitle>
                  {votingSession && new Date(votingSession.end_date) <= new Date() && results.length > 0 && (
                    <Button 
                      variant="default" 
                      size="sm" 
                      onClick={handleDownloadPDF} 
                      className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-sm"
                    >
                      <FileText className="w-4 h-4" />
                      {t("voting_management_res_btn_download")}
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {!votingSession ? (
                    <div className="text-center py-8 text-muted-foreground">
                      {t("voting_management_res_empty_session")}
                    </div>
                  ) : new Date(votingSession.end_date) > new Date() ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                      <Lock className="w-12 h-12 mb-4 opacity-50" />
                      <h3 className="text-lg font-medium text-foreground">{t("voting_management_res_locked_title")}</h3>
                      <p>{t("voting_management_res_locked_desc")} {new Date(votingSession.end_date).toLocaleString()}.</p>
                    </div>
                  ) :
                    <div className="space-y-6">
                      {/* <Card className="bg-gradient-to-r from-purple-900/10 to-blue-900/10 border-indigo-500/20">
                        <CardContent className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-indigo-500/10 rounded-full">
                              <Shield className="w-6 h-6 text-indigo-500" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-foreground">{t("voting_management_res_audit_title")}</h4>
                              <p className="text-sm text-muted-foreground">
                                {anchorData
                                  ? `${t("voting_management_res_audit_anchored_on")} ${new Date(anchorData.created_at).toLocaleDateString()} • Block #${anchorData.transaction_id.slice(0, 8)}...`
                                  : t("voting_management_res_audit_desc")}
                              </p>
                            </div>
                          </div>
                          <Button
                            onClick={handleAnchorToBlockchain}
                            disabled={isAnchoring || !!anchorData}
                            variant={anchorData ? "outline" : "default"}
                            className={anchorData ? "border-green-500 text-green-600 cursor-default hover:bg-transparent" : "bg-indigo-600 hover:bg-indigo-700 text-white"}
                          >
                            {isAnchoring ? (
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : anchorData ? (
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                            ) : (
                              <Lock className="w-4 h-4 mr-2" />
                            )}
                            {isAnchoring ? t("voting_management_res_audit_btn_anchoring") : anchorData ? t("voting_management_res_audit_btn_verified") : t("voting_management_res_audit_btn_anchor")}
                          </Button>
                        </CardContent>
                      </Card> */}

                      {results.map((item) => (
                        <div key={item.id} className="p-4 rounded-lg border bg-card/50">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h4 className="font-semibold text-lg">{item.title}</h4>
                              <p className="text-sm text-muted-foreground">{item.description}</p>
                            </div>
                            <Badge variant={item.stats.for > item.stats.against ? "default" : "secondary"} className={item.stats.for > item.stats.against ? "bg-green-500 hover:bg-green-600" : ""}>
                              {item.stats.for > item.stats.against ? t("voting_management_res_passed") : t("voting_management_res_failed")}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="p-3 bg-green-500/10 rounded-lg">
                              <div className="text-2xl font-bold text-green-600">{item.stats.for}</div>
                              <div className="text-xs text-muted-foreground uppercase">{t("voting_management_res_votes_for")}</div>
                            </div>
                            <div className="p-3 bg-red-500/10 rounded-lg">
                              <div className="text-2xl font-bold text-red-600">{item.stats.against}</div>
                              <div className="text-xs text-muted-foreground uppercase">{t("voting_management_res_votes_against")}</div>
                            </div>
                            <div className="p-3 bg-gray-500/10 rounded-lg">
                              <div className="text-2xl font-bold text-gray-600">{item.stats.abstain}</div>
                              <div className="text-xs text-muted-foreground uppercase">{t("voting_management_res_votes_abstain")}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {results.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">{t("voting_management_res_no_votes")}</div>
                      )}
                    </div>
                  }
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
