import { useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
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
  AlertCircle,
  LogOut,
  ChevronRight,
  Menu,
  Video
} from "lucide-react";
import { toast } from "sonner";
import { SEO } from "@/components/layout/SEO";
import { generateVoteHash } from "@/lib/blockchain";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import VotingCard from "@/components/voting/VotingCard";
import VotingAnalytics from "@/components/dashboard/VotingAnalytics";
import VotingCardSkeleton from "@/components/voting/VotingCardSkeleton";
import { votingApi } from "@/services/api/voting";
import { VotingItem, VoteType, VoteRecord } from "@/types/voting";

const VotingDashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const shareholderId = localStorage.getItem("shareholderId");

  // 1. Fetch Shareholder Details
  const { data: shareholder, isLoading: loadingShareholder } = useQuery({
    queryKey: ["shareholder", shareholderId],
    queryFn: () => {
      if (!shareholderId) throw new Error("No shareholder ID");
      return votingApi.getShareholder(shareholderId);
    },
    enabled: !!shareholderId,
  });

  // 2. Fetch Active Session (Dependent on Shareholder)
  const { data: session, isLoading: loadingSession } = useQuery({
    queryKey: ["session", shareholder?.company_id],
    queryFn: () => votingApi.getActiveSession(shareholder!.company_id),
    enabled: !!shareholder?.company_id,
  });

  // 3. Parallel Fetch: Resolutions & Existing Votes
  const { data: resolutions, isLoading: loadingResolutions } = useQuery({
    queryKey: ["resolutions", session?.id],
    queryFn: () => votingApi.getResolutions(session!.id),
    enabled: !!session?.id,
  });

  const { data: existingVotes, isLoading: loadingVotes } = useQuery({
    queryKey: ["votes", shareholderId],
    queryFn: () => votingApi.getShareholderVotes(shareholderId!),
    enabled: !!shareholderId,
  });

  const isLoading = loadingShareholder || loadingSession || loadingResolutions || loadingVotes;

  // Process Data for UI
  const votingItems: VotingItem[] = resolutions?.map((res) => {
    const voteRecord = existingVotes?.find((v) => v.resolution_id === res.id);
    let voteValue: VoteType | null = null;

    if (voteRecord) {
      // Normalize existing vote value
      const val = voteRecord.vote_value.toUpperCase();
      if (val === "FOR") voteValue = "FOR";
      else if (val === "AGAINST") voteValue = "AGAINST";
      else if (val === "ABSTAIN") voteValue = "ABSTAIN";
    }

    return {
      id: res.id,
      title: res.title,
      description: res.description || "",
      category: res.resolution_type === "director_election" ? "Director Election" : "Resolution",
      voted: !!voteRecord,
      vote: voteValue,
      voteHash: voteRecord?.vote_hash,
    };
  }) || [];

  const totalVoted = votingItems.filter((item) => item.voted).length;

  const isSessionExpired = session?.end_date ? new Date() > new Date(session.end_date) : false;

  const handleVote = useCallback(async (itemId: string, voteType: "for" | "against" | "abstain") => {
    if (isSessionExpired) {
      toast.error("Voting Session Closed", {
        description: "The voting period has ended. You cannot cast new votes.",
      });
      return;
    }

    const upperVoteType = voteType.toUpperCase() as VoteType;

    // Enforce "Vote for Only One" rule for Director Elections
    const currentItem = votingItems.find(i => i.id === itemId);
    if (currentItem?.category === "Director Election" && upperVoteType === "FOR") {
      const alreadyVotedFor = votingItems.find(i =>
        i.category === "Director Election" &&
        i.vote === "FOR" &&
        i.id !== itemId
      );

      if (alreadyVotedFor) {
        toast.error("Single Vote Restriction", {
          description: "You can only vote FOR one candidate in Director Elections.",
        });
        return;
      }
    }

    if (!shareholderId) return;

    // Generate Immutable Audit Hash
    const timestamp = new Date().toISOString();
    const voteHash = await generateVoteHash(shareholderId, itemId, voteType, timestamp);

    // Optimistic Update Object
    const newVote: VoteRecord = {
      id: "temp-optimistic-id", // Temporary ID
      resolution_id: itemId,
      vote_value: upperVoteType,
      vote_hash: voteHash,
      created_at: timestamp,
    };

    // Update Cache Immediately
    queryClient.setQueryData(["votes", shareholderId], (old: VoteRecord[] | undefined) => [...(old || []), newVote]);

    try {
      await votingApi.castVote(shareholderId, itemId, upperVoteType, voteHash);

      toast.success("Vote securely recorded!", {
        description: `Your vote has been cryptographically hashed.`,
      });
    } catch (e: any) {
      console.error("Error recording vote:", e);
      toast.error(`Vote Failed: ${e.message}`);
      // Revert Optimistic Update
      queryClient.setQueryData(["votes", shareholderId], (old: VoteRecord[] | undefined) =>
        old?.filter((v) => v.vote_hash !== voteHash) || []
      );
    }
  }, [isSessionExpired, votingItems, shareholderId, queryClient]);




  if (!shareholderId) {
    navigate("/shareholder-login");
    return null;
  }

  return (
    <div className="min-h-screen bg-background relative selection:bg-primary/20">
      <SEO
        title="Voting Dashboard - Cast Your Secure Vote"
        description="Active voting session. Cast your vote securely on the immutable ledger."
        canonical="/voting-dashboard"
      />
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">

          {/* Sticky Header / Breadcrumbs */}
          <div className="sticky top-20 z-30 -mx-4 px-4 py-4 bg-background/80 backdrop-blur-md border-b border-white/5 mb-8 transition-all">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Link to="/" className="hover:text-primary transition-colors">Home</Link>
                <ChevronRight className="w-4 h-4" />
                <span className="text-foreground font-medium truncate max-w-[200px]">{shareholder?.companies?.company_name}</span>
                <ChevronRight className="w-4 h-4" />
                <span className="text-foreground">Voting Dashboard</span>
              </div>

              <div className="flex items-center gap-4">
                <div className="hidden md:block text-right">
                  <p className="text-sm font-bold text-foreground">{shareholder?.shareholder_name}</p>
                  <p className="text-xs text-muted-foreground">{shareholder?.shares_held?.toLocaleString()} Shares</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    localStorage.removeItem("shareholderId");
                    queryClient.clear();
                    navigate("/shareholder-login");
                  }}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>

          {/* Meeting Details Section */}
          {!isLoading && session?.meeting_link && (
            <div className="mb-8 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              <Card className="border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-900/10">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        {session.meeting_platform === 'zoom' ? <Video className="w-6 h-6" /> : <Calendar className="w-6 h-6" />}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-foreground mb-1">
                          {session.meeting_platform === 'physical' ? 'Physical Venue' : 'Live Video Conference'}
                        </h3>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          {session.meeting_start_date && (
                            <p className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              {new Date(session.meeting_start_date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                            </p>
                          )}
                          {session.meeting_password && (
                            <p className="flex items-center gap-2">
                              <Shield className="w-4 h-4" />
                              Password: <span className="font-mono bg-background px-1 rounded">{session.meeting_password}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <Button
                      size="lg"
                      className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20"
                      onClick={() => window.open(session.meeting_link!, '_blank')}
                    >
                      <Video className="w-4 h-4 mr-2" />
                      Join Meeting Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* New Analytics Section */}
          {!isLoading && (
            <div className="animate-fade-in-up">
              <VotingAnalytics
                totalResolutions={votingItems.length}
                votedResolutions={totalVoted}
                shareholderShares={shareholder?.shares_held || 0}
              />
            </div>
          )}

          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="h-[180px] rounded-xl bg-card/40 border border-white/5 animate-pulse" />
              <div className="h-[180px] rounded-xl bg-card/40 border border-white/5 animate-pulse" />
              <div className="h-[180px] rounded-xl bg-card/40 border border-white/5 animate-pulse" />
            </div>
          )}

          {/* Voting Items Grid */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Vote className="w-6 h-6 text-primary" />
                Resolutions
              </h2>
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Secure Connection
              </div>
            </div>

            <div className="space-y-4">
              {isLoading ? (
                // Skeleton Loaders
                <>
                  <VotingCardSkeleton />
                  <VotingCardSkeleton />
                  <VotingCardSkeleton />
                </>
              ) : (
                votingItems.map((item, index) => (
                  <div key={item.id} className="animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
                    <VotingCard
                      item={item}
                      index={index}
                      onVote={handleVote}
                    />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Submit All Votes - Success Message */}
          {!isLoading && totalVoted === votingItems.length && votingItems.length > 0 && (
            <div className="mt-8 p-6 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-accent/10 border border-emerald-500/20 animate-scale-in">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center shadow-glow">
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-lg">Voting Complete</h3>
                    <p className="text-sm text-muted-foreground">
                      All your votes have been cast, encrypted, and recorded on the immutable ledger.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Session Footer Info */}
          <div className="mt-12 text-center text-sm text-muted-foreground pb-8">
            <p>Session ID: {session?.id}</p>
            <p>All timestamps are recorded in UTC. Voting is governed by company bylaws.</p>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default VotingDashboard;
