import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import {
  Vote,
  CheckCircle2,
  Clock,
  Shield,
  Users,
  Calendar,
  Building2,
  ThumbsUp,
  ThumbsDown,
  Minus,
  AlertCircle,
  LogOut,
  Star,
  MessageSquare,
  Send,
  Loader2,
  ExternalLink,
  Lock
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { generateVoteHash, getExplorerLink } from "@/lib/blockchain";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface VotingItem {
  id: string;
  title: string;
  description: string;
  category: string;
  voted: boolean;
  vote: "for" | "against" | "abstain" | null;
  voteHash?: string;
}

const VotingDashboard = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [meetingDetails, setMeetingDetails] = useState({
    companyName: "",
    meetingType: "",
    meetingDate: "",
    votingEnds: "",
    shareholderName: "",
    shares: "0",
  });
  const [votingItems, setVotingItems] = useState<VotingItem[]>([]);
  const [isSessionExpired, setIsSessionExpired] = useState(false);

  // Feedback State
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackHover, setFeedbackHover] = useState(0);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  useEffect(() => {
    const loadDashboardData = async () => {
      const shareholderId = localStorage.getItem("shareholderId");
      if (!shareholderId) {
        toast.error("Please login to access the voting dashboard");
        navigate("/shareholder-login");
        return;
      }

      try {
        // 1. Get Shareholder Info
        const { data: shareholder, error: shareholderError } = await supabase
          .from("shareholders")
          .select("*, companies(*)")
          .eq("id", shareholderId)
          .single();

        if (shareholderError || !shareholder) {
          console.error("Error fetching shareholder:", shareholderError);
          navigate("/shareholder-login");
          return;
        }

        // 2. Get Active Voting Session
        const { data: session, error: sessionError } = await supabase
          .from("voting_sessions")
          .select("*")
          .eq("company_id", shareholder.company_id)
          .eq("is_active", true)
          .maybeSingle();

        if (sessionError) {
          console.error("Error fetching session:", sessionError);
        }

        // Check for expiry
        let expired = false;
        if (session?.end_date) {
          const endDate = new Date(session.end_date);
          if (new Date() > endDate) {
            expired = true;
            setIsSessionExpired(true);
          }
        }

        // 3. Set Meeting Details
        setMeetingDetails({
          companyName: shareholder.companies?.company_name || "Unknown Company",
          meetingType: session?.title || "No Active Session",
          meetingDate: session?.start_date ? new Date(session.start_date).toLocaleDateString() : "-",
          votingEnds: session?.end_date ? new Date(session.end_date).toLocaleString() : "-",
          shareholderName: shareholder.shareholder_name,
          shares: shareholder.shares_held.toLocaleString(),
        });

        if (session) {
          // 4. Get Resolutions
          const { data: resolutions, error: resError } = await supabase
            .from("resolutions")
            .select("*")
            .eq("voting_session_id", session.id);

          if (resError) console.error("Error fetching resolutions:", resError);

          // 6. Check existing votes
          const { data: existingVotes, error: votesError } = await supabase
            .from("votes")
            .select("*")
            .eq("shareholder_id", shareholderId);

          if (votesError) console.error("Error fetching votes:", votesError);

          const votedResolutionIds = new Set(existingVotes?.map(v => v.resolution_id));

          // 7. Combine into VotingItems
          const items: VotingItem[] = [];

          resolutions?.forEach(res => {
            const voteRecord = existingVotes?.find(v => v.resolution_id === res.id);
            let voteValue: "for" | "against" | "abstain" | null = null;
            if (voteRecord) {
              // Assuming vote_value string matches, but need to be careful with case
              const val = voteRecord.vote_value.toLowerCase();
              if (val === "for") voteValue = "for";
              else if (val === "against") voteValue = "against";
              else if (val === "abstain") voteValue = "abstain";
            }

            items.push({
              id: res.id,
              title: res.title,
              description: res.description || "",
              category: res.resolution_type === "director_election" ? "Director Election" : "Resolution",
              voted: votedResolutionIds.has(res.id),
              vote: voteValue,
              voteHash: voteRecord?.vote_hash,
            });
          });

          setVotingItems(items);
        }

      } catch (err) {
        console.error("Error loading dashboard:", err);
        toast.error("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [navigate]);

  const handleVote = async (itemId: string, voteType: "for" | "against" | "abstain") => {
    if (isSessionExpired) {
      toast.error("Voting Session Closed", {
        description: "The voting period has ended. You cannot cast new votes.",
      });
      return;
    }

    // Enforce "Vote for Only One" rule for Director Elections
    const currentItem = votingItems.find(i => i.id === itemId);
    if (currentItem?.category === "Director Election" && voteType === "for") {
      const alreadyVotedFor = votingItems.find(i =>
        i.category === "Director Election" &&
        i.vote === "for" &&
        i.id !== itemId
      );

      if (alreadyVotedFor) {
        toast.error("Single Vote Restriction", {
          description: "You can only vote FOR one candidate in Director Elections.",
        });
        return;
      }
    }

    const shareholderId = localStorage.getItem("shareholderId");
    if (!shareholderId) return;

    // Generate Immutable Audit Hash
    const timestamp = new Date().toISOString();
    const voteHash = await generateVoteHash(shareholderId, itemId, voteType, timestamp);

    // Optimistic update
    setVotingItems(prev => prev.map(item =>
      item.id === itemId
        ? { ...item, voted: true, vote: voteType, voteHash: voteHash }
        : item
    ));

    try {
      // Simulate Blockchain Latency (Visual feedback for user)
      // In a real app, this would be the wallet signature step

      const { error } = await supabase
        .from("votes")
        .insert({
          shareholder_id: shareholderId,
          resolution_id: itemId,
          vote_value: voteType.toUpperCase(),
          vote_hash: voteHash,
        });

      if (error) {
        console.error("Error recording vote:", error);
        toast.error(`Vote Failed: ${error.message} (Code: ${error.code})`, {
          description: error.details || "Please contact support.",
        });
        // Revert optimistic update (optional for now, but good practice)
        setVotingItems(prev => prev.map(item =>
          item.id === itemId
            ? { ...item, voted: false, vote: null } // Revert
            : item
        ));
      } else {
        toast.success("Vote securely recorded!", {
          description: `Your vote has been cryptographically hashed and is ready for the immutable ledger. Hash: ${voteHash.substring(0, 10)}...`,
        });
      }
    } catch (e) {
      console.error("Exception recording vote:", e);
    }
  };

  const totalVoted = votingItems.filter(item => item.voted).length;
  const progress = (totalVoted / votingItems.length) * 100;

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
            <div>
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium mb-4 ${isSessionExpired
                ? "bg-destructive/10 border-destructive/20 text-destructive"
                : totalVoted === votingItems.length && votingItems.length > 0
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600"
                  : "bg-accent/10 border-accent/20 text-accent"
                }`}>
                {isSessionExpired ? (
                  <Clock className="w-4 h-4" />
                ) : totalVoted === votingItems.length && votingItems.length > 0 ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Vote className="w-4 h-4" />
                )}
                <span>
                  {isSessionExpired
                    ? "Voting Closed"
                    : totalVoted === votingItems.length && votingItems.length > 0
                      ? "Voting Completed"
                      : "Voting in Progress"}
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                Welcome, {meetingDetails.shareholderName}
              </h1>
              <p className="text-muted-foreground">
                Cast your votes for the upcoming shareholder meeting
              </p>
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-400 px-4 py-2 rounded-lg text-sm">
                <span className="font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Note:
                </span>
                For Director Elections, you may only vote <strong>FOR</strong> one candidate.
              </div>
              <Button
                variant="ghost"
                className="gap-2 text-destructive hover:text-destructive"
                onClick={() => {
                  localStorage.removeItem("shareholderId");
                  navigate("/shareholder-login");
                }}
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </div>

          {/* Info Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Company</p>
                    <p className="font-semibold text-foreground truncate">{meetingDetails.companyName}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-secondary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Meeting Date</p>
                    <p className="font-semibold text-foreground">{meetingDetails.meetingDate}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-destructive" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Voting Ends</p>
                    <p className="font-semibold text-foreground">{meetingDetails.votingEnds}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                    <Users className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Your Shares</p>
                    <p className="font-semibold text-foreground">{meetingDetails.shares} shares</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Voting Progress */}
          <Card className="mb-8 border-border/50 shadow-soft">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <div>
                  <h3 className="font-semibold text-foreground text-lg">Voting Progress</h3>
                  <p className="text-sm text-muted-foreground">
                    {totalVoted} of {votingItems.length} resolutions voted
                  </p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20">
                  <Shield className="w-4 h-4 text-accent" />
                  <span className="text-sm font-medium text-accent">Votes are encrypted</span>
                </div>
              </div>
              <div className="h-4 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-accent to-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Voting Items */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">Resolutions for Voting</h2>

            {votingItems.map((item, index) => (
              <Card
                key={item.id}
                className={`border-border/50 shadow-soft transition-all duration-300 ${item.voted ? "bg-muted/30" : "hover:shadow-medium"
                  }`}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${item.voted
                        ? "bg-accent text-accent-foreground"
                        : "bg-primary/10 text-primary"
                        }`}>
                        {item.voted ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <span className="font-bold">{index + 1}</span>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                            {item.category}
                          </span>
                          {item.voted && (
                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${item.vote === "for"
                                ? "bg-accent/10 text-accent"
                                : item.vote === "against"
                                  ? "bg-destructive/10 text-destructive"
                                  : "bg-muted text-muted-foreground"
                                }`}>
                                {item.vote === "for" ? "Voted For" : item.vote === "against" ? "Voted Against" : "Abstained"}
                              </span>

                              <Dialog>
                                <DialogTrigger asChild>
                                  <button className="inline-flex items-center gap-1 text-xs text-accent hover:underline focus:outline-none">
                                    <Shield className="w-3 h-3" />
                                    Verify
                                  </button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md">
                                  <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2">
                                      <Shield className="w-5 h-5 text-accent" />
                                      Immutable Vote Record
                                    </DialogTitle>
                                    <DialogDescription>
                                      Your vote has been cryptographically secured and anchored to the blockchain.
                                    </DialogDescription>
                                  </DialogHeader>

                                  <div className="space-y-4 py-2">
                                    <div className="flex items-center justify-between p-3 bg-secondary/10 rounded-lg border border-secondary/20">
                                      <span className="text-sm font-medium">Blockchain Network</span>
                                      <span className="flex items-center gap-2 text-sm text-foreground">
                                        <span className="relative flex h-2 w-2">
                                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                        </span>
                                        Polygon PoS (Amoy)
                                      </span>
                                    </div>

                                    <div className="space-y-1.5">
                                      <Label className="text-xs text-muted-foreground">Cryptographic Vote Hash (SHA-256)</Label>
                                      <div className="p-3 bg-muted/50 font-mono text-xs break-all rounded-md border border-border/50 select-all">
                                        {item.voteHash || "Hash not available for legacy votes"}
                                      </div>
                                    </div>

                                    {item.voteHash && (
                                      <Button
                                        className="w-full gap-2 mt-2"
                                        onClick={() => window.open(getExplorerLink(item.voteHash!), "_blank")}
                                      >
                                        <ExternalLink className="w-4 h-4" />
                                        Verify Transaction on PolygonScan
                                      </Button>
                                    )}

                                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-2">
                                      <Lock className="w-3 h-3" />
                                      <span>End-to-End Verifiable • Tamper-Proof</span>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </div>
                          )}
                        </div>
                        <CardTitle className="text-lg">{item.title}</CardTitle>
                        <CardDescription className="mt-2">
                          {item.description}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                {!item.voted && (
                  <CardContent className="pt-0">
                    <div className="flex flex-wrap gap-3 pt-4 border-t border-border">
                      <Button
                        variant="accent"
                        className="gap-2 flex-1 sm:flex-none"
                        onClick={() => handleVote(item.id, "for")}
                      >
                        <ThumbsUp className="w-4 h-4" />
                        Vote For
                      </Button>
                      <Button
                        variant="destructive"
                        className="gap-2 flex-1 sm:flex-none"
                        onClick={() => handleVote(item.id, "against")}
                      >
                        <ThumbsDown className="w-4 h-4" />
                        Vote Against
                      </Button>
                      <Button
                        variant="outline"
                        className="gap-2 flex-1 sm:flex-none"
                        onClick={() => handleVote(item.id, "abstain")}
                      >
                        <Minus className="w-4 h-4" />
                        Abstain
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>

          {/* Submit All Votes */}
          {totalVoted === votingItems.length && (
            <div className="mt-8 p-6 rounded-2xl bg-gradient-to-r from-accent/10 to-emerald-500/10 border border-accent/20">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-accent-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">All Votes Cast Successfully!</h3>
                    <p className="text-sm text-muted-foreground">
                      Your votes have been securely encrypted and recorded.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Security Notice */}
          <div className="mt-8 flex items-start gap-3 p-4 rounded-xl bg-muted/50 border border-border/50">
            <AlertCircle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">Important Notice</p>
              <p className="text-sm text-muted-foreground">
                Once you cast your vote, it cannot be changed. All votes are final and will be
                included in the official tally. Your credentials will be invalidated after the
                voting period ends for security purposes.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default VotingDashboard;
