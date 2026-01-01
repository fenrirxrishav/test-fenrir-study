import { cn } from "@/lib/utils";

interface TimerDisplayProps {
  time: number;
  subjectName?: string;
}

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

export function TimerDisplay({ time, subjectName }: TimerDisplayProps) {
  return (
    <div className="relative flex h-64 w-64 items-center justify-center rounded-full bg-background p-4 shadow-inner md:h-72 md:w-72">
       <div className="absolute inset-2 rounded-full border-4 border-muted"></div>
       <div className="absolute inset-0 flex items-center justify-center">
            <svg className="h-full w-full -rotate-90 transform">
                {/* This circle is for the progress */}
            </svg>
        </div>

      <div className="z-10 flex flex-col items-center justify-center text-center">
        <span className="font-mono text-6xl font-bold tracking-tighter text-foreground md:text-7xl">
          {formatTime(time)}
        </span>
        <span className="mt-2 truncate text-sm font-medium text-muted-foreground"
         style={{
            maxWidth: '180px'
         }}
        >
          {subjectName}
        </span>
      </div>
    </div>
  );
}
