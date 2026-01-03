
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';

type UseTimerProps = {
  initialDuration: number;
  onEnd: (sessionData: { duration: number; pauseCount: number, startTime: number | null }) => void;
  timerType?: 'countdown' | 'stopwatch';
  timerId: string; // Unique ID for localStorage
};

type StoredTimerState = {
    startTime: number; // The absolute timestamp when the timer started (or was last un-paused)
    pauseCount: number;
    initialDuration: number;
    timerType: 'countdown' | 'stopwatch';
    isPaused: boolean;
    // When paused, this stores the time already elapsed. When un-pausing, this value is subtracted
    // from the new start time to get the correct total elapsed duration.
    accumulatedPauseTime: number; 
    // The absolute timestamp when the timer was last paused. Used to calculate accumulated pause time.
    pauseTime: number | null; 
};

// Helper functions to interact with localStorage
const getStoredState = (timerId: string): StoredTimerState | null => {
    try {
        if (typeof window === 'undefined') return null;
        const stored = localStorage.getItem(timerId);
        if (!stored) return null;
        return JSON.parse(stored) as StoredTimerState;
    } catch {
        return null;
    }
};

const setStoredState = (timerId: string, state: StoredTimerState | null) => {
    if (typeof window === 'undefined') return;
    if (!state) {
        localStorage.removeItem(timerId);
    } else {
        localStorage.setItem(timerId, JSON.stringify(state));
    }
};


export function useTimer({
  initialDuration,
  onEnd,
  timerType = 'countdown',
  timerId,
}: UseTimerProps) {
  const [time, setTime] = useState(initialDuration);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const onEndRef = useRef(onEnd);

  // Keep onEnd callback fresh without causing re-renders
  useEffect(() => {
    onEndRef.current = onEnd;
  }, [onEnd]);

  // The main tick function - this is the heart of the timer
  const handleTick = useCallback(() => {
    const storedState = getStoredState(timerId);
    if (!storedState || storedState.isPaused) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    const elapsed = Math.floor((Date.now() - storedState.startTime) / 1000);

    if (storedState.timerType === 'countdown') {
      const newTime = storedState.initialDuration - elapsed;
      setTime(newTime);
      if (newTime <= 0) {
        // Timer ended, call onEnd and reset
        const studiedDuration = storedState.initialDuration;
        onEndRef.current({ 
            duration: studiedDuration, 
            pauseCount: storedState.pauseCount, 
            startTime: storedState.startTime - storedState.accumulatedPauseTime
        });
        setStoredState(timerId, null);
        setTime(initialDuration); // Reset display time
        setIsActive(false);
        setIsPaused(false);
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    } else { // Stopwatch
      setTime(elapsed);
    }
  }, [timerId, initialDuration]);

  // Effect to initialize state from localStorage on mount
  useEffect(() => {
    const storedState = getStoredState(timerId);
    if (storedState) {
        setIsActive(true);
        setIsPaused(storedState.isPaused);
        
        if (storedState.isPaused) {
             const elapsedOnPause = Math.floor(((storedState.pauseTime || storedState.startTime) - storedState.startTime) / 1000);
             if (storedState.timerType === 'countdown') {
                 setTime(storedState.initialDuration - elapsedOnPause);
             } else {
                 setTime(elapsedOnPause);
             }
        } else {
             handleTick(); // Calculate current time immediately
             intervalRef.current = setInterval(handleTick, 1000);
        }
    } else {
        setTime(initialDuration);
        setIsActive(false);
        setIsPaused(false);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timerId, initialDuration, handleTick]);


  const start = useCallback(() => {
    let stateToStore: StoredTimerState;
    const storedState = getStoredState(timerId);
    const now = Date.now();

    if (storedState && storedState.isPaused) {
        // Resuming from a paused state
        const pauseDuration = now - (storedState.pauseTime || now);
        stateToStore = {
          ...storedState,
          startTime: storedState.startTime + pauseDuration, // Adjust start time to account for pause
          isPaused: false,
          pauseTime: null,
        };
    } else {
        // Starting fresh
        stateToStore = {
            startTime: now,
            pauseCount: 0,
            initialDuration: timerType === 'countdown' ? initialDuration : 0,
            timerType: timerType,
            isPaused: false,
            accumulatedPauseTime: 0,
            pauseTime: null,
        };
    }
    
    setStoredState(timerId, stateToStore);
    setIsActive(true);
    setIsPaused(false);
    handleTick(); // Immediate tick to update UI
    intervalRef.current = setInterval(handleTick, 1000);
  }, [timerId, initialDuration, timerType, handleTick]);

  const pause = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    const storedState = getStoredState(timerId);
    if (!storedState || !isActive) return;

    setStoredState(timerId, {
        ...storedState,
        isPaused: true,
        pauseTime: Date.now(),
        pauseCount: storedState.pauseCount + 1,
    });
    setIsPaused(true);
    // UI time is already updated by handleTick clearing, no need to setTime here
  }, [timerId, isActive]);

  const reset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    const storedState = getStoredState(timerId);
    if (storedState) {
        const endTime = storedState.isPaused ? storedState.pauseTime : Date.now();
        const elapsed = Math.floor(((endTime || Date.now()) - storedState.startTime) / 1000);
        
        let studiedDuration;
        if(storedState.timerType === 'countdown'){
            studiedDuration = Math.min(elapsed, storedState.initialDuration);
        } else {
             studiedDuration = elapsed;
        }

        // Only save session if it's longer than a few seconds
        if (studiedDuration > 5) {
            onEndRef.current({ 
                duration: studiedDuration, 
                pauseCount: storedState.pauseCount, 
                startTime: storedState.startTime - storedState.accumulatedPauseTime,
            });
        }
    }
    
    setStoredState(timerId, null);
    setIsActive(false);
    setIsPaused(false);
    setTime(initialDuration);
  }, [timerId, initialDuration]);

  return { time, isActive, isPaused, start, pause, reset };
}
