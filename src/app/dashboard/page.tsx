
"use client";

import { Overview } from "@/components/app/dashboard/overview";
import { RecentSessions } from "@/components/app/dashboard/recent-sessions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser, useFirestore, useCollection } from "@/firebase";
import { Activity, Target, TrendingUp, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { collection, query, where } from "firebase/firestore";
import { Session } from "@/lib/definitions";
import { subDays, startOfDay, endOfDay } from "date-fns";

function formatDuration(seconds: number) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
}

export default function DashboardPage() {
    const { user, loading: userLoading } = useUser();
    const router = useRouter();
    const firestore = useFirestore();

    useEffect(() => {
        if (!userLoading && !user) {
            router.push('/login');
        }
    }, [user, userLoading, router]);

    const sessionsQuery = useMemo(() => {
        if (!user || !firestore) return null;
        // Fetch sessions from the last 7 days for dashboard calculations
        const oneWeekAgo = subDays(new Date(), 7);
        return query(
            collection(firestore, 'sessions'),
            where('userId', '==', user.uid),
            where('startTime', '>=', oneWeekAgo.toISOString())
        );
    }, [user, firestore]);

    const { data: sessions, loading: sessionsLoading } = useCollection<Session>(sessionsQuery);

    const todayStats = useMemo(() => {
        if (!sessions) return { timeStudied: 0, focusScore: 0 };
        const todayStart = startOfDay(new Date());
        const todaySessions = sessions.filter(s => new Date(s.startTime) >= todayStart);
        
        const timeStudied = todaySessions.reduce((acc, s) => acc + s.duration, 0);
        const focusScore = todaySessions.length > 0
            ? Math.round(todaySessions.reduce((acc, s) => acc + s.focusScore, 0) / todaySessions.length)
            : 0;
            
        return { timeStudied, focusScore };
    }, [sessions]);
    
    // Placeholder for streak calculation - would require more complex logic
    const consistencyStreak = useMemo(() => {
        if (!sessions || sessions.length === 0) return 0;
        
        const dates = [...new Set(sessions.map(s => startOfDay(new Date(s.startTime)).getTime()))].sort((a,b) => b - a);
        if (dates.length === 0) return 0;

        let streak = 0;
        const today = startOfDay(new Date());
        const yesterday = startOfDay(subDays(new Date(), 1));

        // Check if there is a session today or yesterday to start the streak from
        if(dates[0] === today.getTime() || dates[0] === yesterday.getTime()){
            streak = 1;
            let lastDate = new Date(dates[0]);
            for(let i=1; i < dates.length; i++){
                const currentDate = new Date(dates[i]);
                const expectedPreviousDay = startOfDay(subDays(lastDate, 1));
                if(currentDate.getTime() === expectedPreviousDay.getTime()){
                    streak++;
                    lastDate = currentDate;
                } else {
                    break;
                }
            }
        }
        return streak;
    }, [sessions]);


    if (userLoading || sessionsLoading || !user) {
        return (
            <div className="flex-1 space-y-4 p-8 pt-6">
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <div className="text-muted-foreground">Loading dashboard data...</div>
            </div>
        );
    }
    
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
                            <div className="text-2xl font-bold">{formatDuration(todayStats.timeStudied)}</div>
                            <p className="text-xs text-muted-foreground">
                                {sessions && sessions.length > 0 ? `+${Math.round(todayStats.timeStudied / sessions.reduce((acc, s) => acc + s.duration, 1) * 100)}% from last week` : 'No sessions yet today'}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Focus Score (Avg Today)</CardTitle>
                            <Zap className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{todayStats.focusScore}%</div>
                             <p className="text-xs text-muted-foreground">
                                Based on sessions logged today
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Daily Goal</CardTitle>
                            <Target className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">0%</div>
                            <p className="text-xs text-muted-foreground">
                                Set a goal to get started
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Consistency Streak</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{consistencyStreak} Days</div>
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
                            <Overview sessions={sessions} />
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
