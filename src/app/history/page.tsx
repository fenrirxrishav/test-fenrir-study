"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { useUser, useCollection, useFirestore } from "@/firebase";
import { useRouter } from "next/navigation";
import { collection, query, where } from "firebase/firestore";
import { Subject, Session } from "@/lib/definitions";

function formatDuration(seconds: number) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    let result = '';
    if (h > 0) result += `${h}h `;
    if (m > 0) result += `${m}m `;
    if (s > 0 || (h === 0 && m === 0)) result += `${s}s`;
    return result.trim();
}

export default function HistoryPage() {
    const { user, loading: userLoading } = useUser();
    const router = useRouter();
    const firestore = useFirestore();

    const subjectsQuery = user ? query(collection(firestore, 'subjects'), where('userId', '==', user.uid)) : null;
    const { data: subjects, loading: subjectsLoading } = useCollection<Subject>(subjectsQuery);

    const sessionsQuery = user ? query(collection(firestore, 'sessions'), where('userId', '==', user.uid)) : null;
    const { data: sessions, loading: sessionsLoading } = useCollection<Session>(sessionsQuery);

    useEffect(() => {
        if (!userLoading && !user) {
            router.push('/login');
        }
    }, [user, userLoading, router]);

    const getSubjectById = (id: string) => subjects?.find(s => s.id === id);

    if (userLoading || subjectsLoading || sessionsLoading || !user) {
        return <div>Loading...</div>
    }

    return (
        <div className="container mx-auto p-4 md:p-8">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold tracking-tight">Session History</h1>
            </div>
            <Card>
                <CardContent className="mt-6">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Subject</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Duration</TableHead>
                                <TableHead>Focus Score</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sessions && sessions.length > 0 ? (
                                sessions.map((session) => {
                                    const subject = getSubjectById(session.subjectId);
                                    return (
                                        <TableRow key={session.id}>
                                            <TableCell className="font-medium flex items-center gap-2">
                                                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: subject?.color }}></div>
                                                {subject?.name || 'Unknown'}
                                            </TableCell>
                                            <TableCell>{new Date(session.startTime).toLocaleDateString()}</TableCell>
                                            <TableCell>{formatDuration(session.duration)}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{session.focusScore}%</Badge>
                                            </TableCell>
                                            <TableCell className="capitalize">{session.status}</TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <span className="sr-only">Open menu</span>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuItem>Edit</DropdownMenuItem>
                                                        <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center">No sessions recorded yet.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
