
'use client';

import { motion } from 'framer-motion';

interface AnalogFaceProps {
  time: number;
  subjectName?: string;
  mode: 'pomodoro' | 'stopwatch';
  totalDuration: number;
}

const formatTime = (totalSeconds: number) => {
  const roundedSeconds = Math.floor(totalSeconds);
  const seconds = roundedSeconds % 60;
  const minutes = Math.floor(roundedSeconds / 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

export function AnalogFace({ time, subjectName, mode, totalDuration }: AnalogFaceProps) {
    let angle = 0;
    if (mode === 'pomodoro' && totalDuration > 0) {
        const progress = (totalDuration - time) / totalDuration;
        angle = progress * 360;
    } else { // stopwatch
        angle = (time % 60) * 6; // 360 / 60 = 6 degrees per second
    }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative select-none">
        {/* Clock face markings */}
        <div className="absolute w-full h-full">
             {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="absolute w-full h-full" style={{ transform: `rotate(${i * 30}deg)` }}>
                    <div className="absolute top-[5%] left-1/2 -translate-x-1/2 h-2 w-[2px] bg-muted-foreground/30 rounded-full"></div>
                </div>
            ))}
        </div>

        {/* Hand */}
        <motion.div
            className="absolute top-1/2 left-1/2 w-1 h-1/2 origin-bottom"
            initial={false}
            animate={{ rotate: angle }}
            transition={{ duration: 1, ease: 'linear' }}
        >
            <div className="w-full h-[60%] bg-primary rounded-t-full"></div>
        </motion.div>

        {/* Center dot */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full border-4 border-background"></div>
       
        <div className="z-10 text-center">
            <span className="font-mono font-bold text-6xl text-foreground tracking-tighter">
                {formatTime(time)}
            </span>
             <p className="mt-1 text-base font-medium text-muted-foreground truncate max-w-full px-4 text-center">
                {subjectName || "No Subject"}
            </p>
        </div>
    </div>
  );
}
