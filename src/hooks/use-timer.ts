"use client";

import { useState, useEffect, useCallback, useRef } from 'react';

type UseTimerProps = {
  initialDuration: number;
  onEnd: (sessionData: { duration: number; pauseCount: number, startTime: number | null }) => void;
  timerType?: 'countdown' | 'stopwatch';
};

export function useTimer({
  initialDuration,
  onEnd,
  timerType = 'countdown',
}: UseTimerProps) {
  const [duration, setDuration] = useState(initialDuration);
  const [time, setTime] = useState(initialDuration);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [pauseCount, setPauseCount] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    // Reset timer when initial duration changes (e.g., mode switch)
    setTime(initialDuration);
    setDuration(initialDuration);
  }, [initialDuration, timerType]);
  
  useEffect(() => {
    if (isActive && !isPaused) {
      intervalRef.current = setInterval(() => {
        if (timerType === 'countdown') {
          setTime((prevTime) => {
            if (prevTime <= 1) {
              clearInterval(intervalRef.current!);
              setIsActive(false);
              onEnd({ duration: duration, pauseCount, startTime: startTimeRef.current });
              return 0;
            }
            return prevTime - 1;
          });
        } else { // Stopwatch
          setTime((prevTime) => prevTime + 1);
        }
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, isPaused, duration, pauseCount, onEnd, timerType]);
  
  const start = useCallback(() => {
    setIsActive(true);
    setIsPaused(false);
    if (!startTimeRef.current) {
        startTimeRef.current = Date.now();
    }
  }, []);

  const pause = useCallback(() => {
    setIsPaused(true);
    if(isActive) {
        setPauseCount((p) => p + 1);
    }
  }, [isActive]);

  const reset = useCallback((newDuration?: number) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    if (isActive) {
        const studiedDuration = timerType === 'countdown' ? duration - time : time;
        if (studiedDuration > 0) {
            onEnd({ duration: studiedDuration, pauseCount, startTime: startTimeRef.current });
        }
    }

    const finalDuration = newDuration ?? (timerType === 'countdown' ? initialDuration : 0);

    setIsActive(false);
    setIsPaused(false);
    setPauseCount(0);
    setTime(finalDuration);
    if(timerType === 'countdown') {
        setDuration(finalDuration);
    }
    startTimeRef.current = null;
  }, [duration, time, isActive, pauseCount, onEnd, timerType, initialDuration]);

  return { time, isActive, isPaused, start, pause, reset, duration };
}
