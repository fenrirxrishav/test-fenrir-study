"use client";

import { Avatar } from "@/components/ui/avatar";
import { useCollection, useFirestore, useUser } from "@/firebase";
import { Subject, Session } from "@/lib/definitions";
import { collection, query, where, orderBy, limit } from "firebase/firestore";

export function RecentSessions() {
    const { user } = useUser();
    const firestore = useFirestore();

    const sessionsQuery = user 
        ? query(collection(firestore, 'sessions'), where('userId', '==', user.uid), orderBy('startTime', 'desc'), limit(5)) 
        : null;
    const { data: recentSessions, loading: sessionsLoading } = useCollection<Session>(sessionsQuery);

    const subjectIds = recentSessions?.map(s => s.subjectId) || [];
    const subjectsQuery = subjectIds.length > 0 ? query(collection(firestore, 'subjects'), where('id', 'in', subjectIds)) : null;
    const { data: subjects, loading: subjectsLoading } = useCollection<Subject>(subjectsQuery);

    const getSubjectById = (id: string) => subjects?.find(s => s.id === id);

    if (sessionsLoading || subjectsLoading) {
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
                            <p className="text-sm font-medium leading-none">{subject?.name}</p>
                            <p className="text-sm text-muted-foreground">{new Date(session.startTime).toLocaleDateString()}</p>
                        </div>
                        <div className="ml-auto font-medium">+{Math.round(session.duration / 60)} min</div>
                    </div>
                )
            })}
        </div>
    );
}
