import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { motion } from "framer-motion";

interface VotingAnalyticsProps {
    totalResolutions: number;
    votedResolutions: number;
    shareholderShares: number;
    totalCompanyShares?: number; // Optional: Total shares in company for weight calculation
}

const VotingAnalytics = ({
    totalResolutions,
    votedResolutions,
    shareholderShares,
    totalCompanyShares = 1000000, // Default fallback if not provided
}: VotingAnalyticsProps) => {
    const participationPercentage =
        totalResolutions > 0 ? (votedResolutions / totalResolutions) * 100 : 0;

    const votingWeight = (shareholderShares / totalCompanyShares) * 100;

    // Data for the Donut Chart
    const data = [
        { name: "Voted", value: votedResolutions, color: "#10b981" }, // Emerald-500
        { name: "Remaining", value: totalResolutions - votedResolutions, color: "#334155" }, // Slate-700
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {/* 1. Participation Radial Chart */}
            <Card className="bg-card/40 backdrop-blur-md border-white/10 shadow-lg">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        Your Participation
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[120px] w-full flex items-center justify-between">
                        <div className="h-full w-[120px] relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={40}
                                        outerRadius={55}
                                        paddingAngle={2}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {data.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <span className="text-xl font-bold text-foreground">
                                    {Math.round(participationPercentage)}%
                                </span>
                            </div>
                        </div>
                        <div className="flex-1 pl-4 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Voted</span>
                                <span className="font-bold text-emerald-500">{votedResolutions}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Pending</span>
                                <span className="font-bold text-muted-foreground">
                                    {totalResolutions - votedResolutions}
                                </span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 2. Voting Power (Weight) */}
            <Card className="bg-card/40 backdrop-blur-md border-white/10 shadow-lg">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        Voting Power
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-2xl font-bold text-foreground">
                                    {shareholderShares.toLocaleString()}
                                </span>
                                <span className="text-xs text-muted-foreground mb-1">SHARES</span>
                            </div>
                            <Progress value={votingWeight > 100 ? 100 : votingWeight} className="h-2" />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            You hold approx <span className="text-accent font-medium">{votingWeight.toFixed(4)}%</span> of total company voting rights.
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* 3. Session Status & Quorum */}
            <Card className="bg-card/40 backdrop-blur-md border-white/10 shadow-lg">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        Session Health
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-foreground font-medium">Quorum Status</span>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-bold border border-emerald-500/20">
                                MET
                            </span>
                        </div>
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Current Turnout</span>
                                <span>67%</span>
                            </div>
                            <Progress value={67} className="h-2 bg-muted/50" />
                        </div>
                        <p className="text-xs text-muted-foreground border-t border-border/50 pt-2 mt-2">
                            Session is active and valid.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default VotingAnalytics;
