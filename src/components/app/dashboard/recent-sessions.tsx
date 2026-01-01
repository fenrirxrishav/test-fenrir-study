import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getSubjectById, mockSessions } from "@/lib/data";

export function RecentSessions() {
    const recentSessions = mockSessions.slice(0, 5);

    return (
        <div className="space-y-8">
            {recentSessions.map(session => {
                const subject = getSubjectById(session.subjectId);
                return (
                    <div key={session.id} className="flex items-center">
                        <Avatar className="h-9 w-9">
                            <div className="flex h-full w-full items-center justify-center rounded-full" style={{backgroundColor: subject?.color || '#ccc'}}>
                               <span className="text-xs font-medium text-white">{subject?.name.substring(0,2)}</span>
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
