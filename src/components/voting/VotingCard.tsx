import { memo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Shield, ExternalLink, Lock, ThumbsUp, ThumbsDown, Minus, Info } from "lucide-react";
import { getExplorerLink } from "@/lib/blockchain";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { VotingItem } from "@/types/voting";

interface VotingCardProps {
    item: VotingItem;
    index: number;
    onVote: (itemId: string, voteType: "for" | "against" | "abstain") => void;
}

const VotingCard = memo(({ item, index, onVote }: VotingCardProps) => {
    const [showConfirm, setShowConfirm] = useState(false);
    const [selectedVoteType, setSelectedVoteType] = useState<"for" | "against" | "abstain" | null>(null);

    const initiateVote = (type: "for" | "against" | "abstain") => {
        setSelectedVoteType(type);
        setShowConfirm(true);
    };

    const confirmVote = () => {
        if (selectedVoteType) {
            onVote(item.id, selectedVoteType);
            setShowConfirm(false);
        }
    };

    return (
        <>
            <Card
                className={`border-border/50 shadow-soft transition-all duration-300 ${item.voted ? "bg-muted/30" : "hover:shadow-medium hover:border-primary/20"
                    }`}
            >
                <CardHeader className="pb-4">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 w-full">
                            <div
                                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${item.voted
                                    ? "bg-accent/20 text-accent"
                                    : "bg-primary/10 text-primary"
                                    }`}
                            >
                                {item.voted ? (
                                    <CheckCircle2 className="w-5 h-5" />
                                ) : (
                                    <span className="font-bold font-mono">{index + 1}</span>
                                )}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted border border-border text-muted-foreground uppercase tracking-wider font-medium">
                                        {item.category}
                                    </span>
                                    {item.voted && (
                                        <div className="flex items-center gap-2">
                                            <span
                                                className={`text-xs px-2 py-0.5 rounded-full border ${item.vote === "FOR"
                                                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                                                    : item.vote === "AGAINST"
                                                        ? "bg-red-500/10 border-red-500/20 text-red-500"
                                                        : "bg-yellow-500/10 border-yellow-500/20 text-yellow-500"
                                                    }`}
                                            >
                                                {item.vote === "FOR"
                                                    ? "Voted FOR"
                                                    : item.vote === "AGAINST"
                                                        ? "Voted AGAINST"
                                                        : "ABSTAINED"}
                                            </span>

                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <button className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors focus:outline-none">
                                                        <Shield className="w-3 h-3" />
                                                        View Receipt
                                                    </button>
                                                </DialogTrigger>
                                                <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl border-white/10">
                                                    <DialogHeader>
                                                        <DialogTitle className="flex items-center gap-2 text-xl">
                                                            <div className="p-2 rounded-full bg-accent/20">
                                                                <CheckCircle2 className="w-5 h-5 text-accent" />
                                                            </div>
                                                            Digital Vote Receipt
                                                        </DialogTitle>
                                                        <DialogDescription>
                                                            Official record of your vote for corporate audit.
                                                        </DialogDescription>
                                                    </DialogHeader>

                                                    <div className="space-y-4 py-4">
                                                        <div className="p-4 rounded-lg bg-muted/40 border border-border space-y-3">
                                                            <div className="flex justify-between items-start">
                                                                <span className="text-sm text-muted-foreground">Resolution</span>
                                                                <span className="text-sm font-medium text-right w-2/3">{item.title}</span>
                                                            </div>
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-sm text-muted-foreground">Your Decision</span>
                                                                <span className={`text-sm font-bold uppercase ${item.vote === 'FOR' ? 'text-emerald-500' : item.vote === 'AGAINST' ? 'text-red-500' : 'text-yellow-500'}`}>
                                                                    {item.vote}
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-sm text-muted-foreground">Timestamp</span>
                                                                <span className="text-sm font-mono text-muted-foreground">{new Date().toLocaleString()}</span>
                                                                {/* Note: Ideally this comes from the DB record */}
                                                            </div>
                                                        </div>

                                                        <div className="space-y-1.5">
                                                            <div className="flex items-center justify-between">
                                                                <Label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                                                                    Cryptographic Hash (SHA-256)
                                                                </Label>
                                                                <TooltipProvider>
                                                                    <Tooltip>
                                                                        <TooltipTrigger>
                                                                            <Info className="w-3 h-3 text-muted-foreground" />
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>
                                                                            <p>This hash anchors your vote to the database immutably.</p>
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                </TooltipProvider>
                                                            </div>
                                                            <div className="p-3 bg-black/20 font-mono text-[10px] break-all rounded-md border border-border/50 select-all text-primary/80">
                                                                {item.voteHash || "Generating Hash..."}
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-2">
                                                            <Lock className="w-3 h-3" />
                                                            <span>Secured by Immutable Ledger & RLS</span>
                                                        </div>
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                        </div>
                                    )}
                                </div>
                                <CardTitle className="text-lg leading-tight">{item.title}</CardTitle>
                                <CardDescription className="mt-2 line-clamp-2">{item.description}</CardDescription>
                            </div>
                        </div>
                    </div>
                </CardHeader>

                {!item.voted && (
                    <CardContent className="pt-0">
                        <div className="flex flex-wrap gap-3 pt-4 border-t border-border/50">
                            <Button
                                variant="default"
                                className="gap-2 flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white"
                                onClick={() => initiateVote("for")}
                            >
                                <ThumbsUp className="w-4 h-4" />
                                Vote For
                            </Button>
                            <Button
                                variant="destructive"
                                className="gap-2 flex-1 sm:flex-none"
                                onClick={() => initiateVote("against")}
                            >
                                <ThumbsDown className="w-4 h-4" />
                                Vote Against
                            </Button>
                            <Button
                                variant="outline"
                                className="gap-2 flex-1 sm:flex-none"
                                onClick={() => initiateVote("abstain")}
                            >
                                <Minus className="w-4 h-4" />
                                Abstain
                            </Button>
                        </div>
                    </CardContent>
                )}
            </Card>

            {/* Confirmation Alert Dialog */}
            <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Your Vote</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to vote <strong className="uppercase text-primary">{selectedVoteType}</strong> for this resolution?
                            <br /><br />
                            This action cannot be undone. Your vote will be cryptographically signed and recorded permanently.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmVote}
                            className={selectedVoteType === 'for' ? 'bg-emerald-600 hover:bg-emerald-700' : selectedVoteType === 'against' ? 'bg-red-600 hover:bg-red-700' : ''}
                        >
                            Confirm Vote
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
});

export default VotingCard;
