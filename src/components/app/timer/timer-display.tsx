import { cn } from "@/lib/utils";

interface TimerDisplayProps {
  time: number;
  subjectName?: string;
  duration: number;
  timerType: 'countdown' | 'stopwatch';
}

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const STROKE_WIDTH = 10;
const RADIUS = 110; 
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const VIEWBOX_SIZE = RADIUS * 2 + STROKE_WIDTH * 2;


export function TimerDisplay({ time, subjectName, duration, timerType }: TimerDisplayProps) {

  const getProgress = () => {
    if (timerType === 'stopwatch' || duration === 0) {
      return 100;
    }
    return (time / duration) * 100;
  };
  
  const progress = getProgress();
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress / 100);

  return (
    <div className="relative flex h-64 w-64 items-center justify-center rounded-full bg-background p-4 shadow-inner md:h-72 md:w-72">
       <div className="absolute inset-4 rounded-full border-[10px] border-muted/20"></div>
       <div className="absolute inset-0 flex items-center justify-center">
            <svg className="h-full w-full -rotate-90 transform" viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}>
                <circle
                    className={cn(
                      "text-primary transition-all duration-300 ease-linear",
                      timerType === 'stopwatch' && "text-muted-foreground"
                    )}
                    stroke="currentColor"
                    fill="transparent"
                    strokeWidth={STROKE_WIDTH}
                    strokeLinecap="round"
                    cx={VIEWBOX_SIZE / 2}
                    cy={VIEWBOX_SIZE / 2}
                    r={RADIUS}
                    strokeDasharray={CIRCUMFERENCE}
                    strokeDashoffset={timerType === 'countdown' ? strokeDashoffset : 0}
                />
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
