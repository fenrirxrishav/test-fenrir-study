"use client";

import { Avatar } from "@/components/ui/avatar";
import { useCollection, useFirestore, useUser } from "@/firebase";
import { Subject, Session } from "@/lib/definitions";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";

export function RecentSessions() {
    const { user } = useUser();
    const firestore = useFirestore();
    const [recentSessions, setRecentSessions] = useState<Session[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!user || !firestore) {
                setLoading(false);
                return;
            };
            setLoading(true);

            try {
                // Fetch recent sessions
                const sessionsQuery = query(
                    collection(firestore, 'sessions'), 
                    where('userId', '==', user.uid), 
                    orderBy('startTime', 'desc'), 
                    limit(5)
                );
                const sessionSnap = await getDocs(sessionsQuery);
                const sessions = sessionSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Session));
                setRecentSessions(sessions);

                // Fetch associated subjects
                if (sessions.length > 0) {
                    const subjectIds = [...new Set(sessions.map(s => s.subjectId))];
                    const subjectsQuery = query(collection(firestore, 'subjects'), where('__name__', 'in', subjectIds));
                    const subjectSnap = await getDocs(subjectsQuery);
                    const subjectMap = subjectSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subject));
                    setSubjects(subjectMap);
                }
            } catch (error) {
                console.error("Error fetching recent sessions and subjects:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();

    }, [user, firestore]);
    
    const getSubjectById = (id: string) => subjects?.find(s => s.id === id);

    if (loading) {
        return <div>Loading recent sessions...</div>
    }

    if (!recentSessions || recentSessions.length === 0) {
        return <p className="text-sm text-muted-foreground">No recent sessions.</p>
    }

    return (
        <div className="space-y-8">
            {recentSessions.map(session => {
                const subject = getSubjectById(session.subjectId);
                return (
                    <div key={session.id} className="flex items-center">
                        <Avatar className="h-9 w-9">
                            <div className="flex h-full w-full items-center justify-center rounded-full" style={{backgroundColor: subject?.color || '#ccc'}}>
                               <span className="text-xs font-medium text-white">{subject?.name ? subject.name.substring(0,2) : '?'}</span>
                            </div>
                        </Avatar>
                        <div className="ml-4 space-y-1">
                            <p className="text-sm font-medium leading-none">{subject?.name || 'Unknown Subject'}</p>
                            <p className="text-sm text-muted-foreground">{new Date(session.startTime).toLocaleDateString()}</p>
                        </div>
                        <div className="ml-auto font-medium">+{Math.round(session.duration / 60)} min</div>
                    </div>
                )
            })}
        </div>
    );
}
