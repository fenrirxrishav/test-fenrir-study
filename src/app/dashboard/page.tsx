import { Overview } from "@/components/app/dashboard/overview";
import { RecentSessions } from "@/components/app/dashboard/recent-sessions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Target, TrendingUp, Zap } from "lucide-react";

export default function DashboardPage() {
    return (
        <div className="flex-col md:flex">
            <div className="flex-1 space-y-4 p-8 pt-6">
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Time Studied (Today)</CardTitle>
                            <Activity className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">1h 15m</div>
                            <p className="text-xs text-muted-foreground">
                                vs. 45m yesterday
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Focus Score (Avg)</CardTitle>
                            <Zap className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">92%</div>
                            <p className="text-xs text-muted-foreground">
                                +3% from last week
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Daily Goal</CardTitle>
                            <Target className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">75%</div>
                            <p className="text-xs text-muted-foreground">
                                1h 30m / 2h goal
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Consistency Streak</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">5 Days</div>
                            <p className="text-xs text-muted-foreground">
                                Keep it up!
                            </p>
                        </CardContent>
                    </Card>
                </div>
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-7">
                    <Card className="col-span-1 lg:col-span-4">
                        <CardHeader>
                            <CardTitle>Weekly Overview</CardTitle>
                        </CardHeader>
                        <CardContent className="pl-2">
                            <Overview />
                        </CardContent>
                    </Card>
                    <Card className="col-span-1 lg:col-span-3">
                        <CardHeader>
                            <CardTitle>Recent Sessions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <RecentSessions />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
