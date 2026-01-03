
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';

type UseTimerProps = {
  initialDuration: number;
  onEnd: (sessionData: { duration: number; pauseCount: number, startTime: number | null }) => void;
  timerType?: 'countdown' | 'stopwatch';
  timerId: string; // Unique ID for localStorage
};

type StoredTimerState = {
    // The absolute timestamp when the timer *truly* began. This is not adjusted for pauses.
    sessionStartTime: number; 
    // The absolute timestamp when the timer was last (re)started. This is adjusted for pauses.
    activeStartTime: number; 
    pauseCount: number;
    initialDuration: number;
    timerType: 'countdown' | 'stopwatch';
    isPaused: boolean;
    // When paused, this stores the time already elapsed *before* this pause started.
    accumulatedElapsed: number; 
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

  const handleTick = useCallback(() => {
    const storedState = getStoredState(timerId);
    if (!storedState || storedState.isPaused) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    const elapsedSinceActiveStart = Math.floor((Date.now() - storedState.activeStartTime) / 1000);
    const totalElapsed = storedState.accumulatedElapsed + elapsedSinceActiveStart;

    if (storedState.timerType === 'countdown') {
      const newTime = storedState.initialDuration - totalElapsed;
      setTime(newTime > 0 ? newTime : 0);
      
      if (newTime <= 0) {
        onEndRef.current({ 
            duration: storedState.initialDuration, 
            pauseCount: storedState.pauseCount, 
            startTime: storedState.sessionStartTime
        });
        setStoredState(timerId, null);
        setTime(initialDuration);
        setIsActive(false);
        setIsPaused(false);
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    } else { // Stopwatch
      setTime(totalElapsed);
    }
  }, [timerId, initialDuration]);

  // Effect to initialize state from localStorage on mount
  useEffect(() => {
    const storedState = getStoredState(timerId);
    if (storedState) {
        setIsActive(true);
        setIsPaused(storedState.isPaused);
        
        if (storedState.isPaused) {
            const elapsedOnPause = storedState.accumulatedElapsed;
            if (storedState.timerType === 'countdown') {
                 setTime(storedState.initialDuration - elapsedOnPause);
            } else {
                 setTime(elapsedOnPause);
            }
        } else {
             handleTick(); // Calculate current time immediately
             if (intervalRef.current) clearInterval(intervalRef.current);
             intervalRef.current = setInterval(handleTick, 1000);
        }
    } else {
        setTime(initialDuration);
        setIsActive(false);
        setIsPaused(false);
    }

    // This cleanup is crucial for SPA navigation
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [timerId, initialDuration, handleTick]);


  const start = useCallback(() => {
    const storedState = getStoredState(timerId);
    const now = Date.now();

    if (storedState && storedState.isPaused) {
        // Resuming from a paused state
        const newState = {
          ...storedState,
          isPaused: false,
          activeStartTime: now, // Start a new "active" period
        };
        setStoredState(timerId, newState);
    } else {
        // Starting fresh
        const newState: StoredTimerState = {
            sessionStartTime: now,
            activeStartTime: now,
            pauseCount: 0,
            initialDuration: timerType === 'countdown' ? initialDuration : 0,
            timerType: timerType,
            isPaused: false,
            accumulatedElapsed: 0,
        };
        setStoredState(timerId, newState);
    }
    
    setIsActive(true);
    setIsPaused(false);
    handleTick();
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(handleTick, 1000);
  }, [timerId, initialDuration, timerType, handleTick]);

  const pause = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    const storedState = getStoredState(timerId);
    if (!storedState || !isActive || storedState.isPaused) return;

    const elapsedSinceActiveStart = Math.floor((Date.now() - storedState.activeStartTime) / 1000);

    setStoredState(timerId, {
        ...storedState,
        isPaused: true,
        pauseCount: storedState.pauseCount + 1,
        accumulatedElapsed: storedState.accumulatedElapsed + elapsedSinceActiveStart,
    });
    setIsPaused(true);
    handleTick(); // one last tick to update the display to the exact pause time
  }, [timerId, isActive, handleTick]);

  const reset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    const storedState = getStoredState(timerId);
    if (storedState) {
        // Calculate final duration based on state before reset
        let finalElapsed = storedState.accumulatedElapsed;
        if (!storedState.isPaused) {
            const elapsedSinceActiveStart = Math.floor((Date.now() - storedState.activeStartTime) / 1000);
            finalElapsed += elapsedSinceActiveStart;
        }

        const studiedDuration = (storedState.timerType === 'countdown')
            ? Math.min(finalElapsed, storedState.initialDuration)
            : finalElapsed;

        if (studiedDuration > 5) {
            onEndRef.current({ 
                duration: studiedDuration, 
                pauseCount: storedState.pauseCount, 
                startTime: storedState.sessionStartTime,
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
