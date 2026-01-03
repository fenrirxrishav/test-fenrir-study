
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';

type UseTimerProps = {
  initialDuration: number;
  onEnd: (sessionData: { duration: number; pauseCount: number, startTime: number | null }) => void;
  timerType?: 'countdown' | 'stopwatch';
  timerId: string; // Unique ID for localStorage
};

type StoredTimerState = {
    startTime: number;
    pauseCount: number;
    initialDuration: number;
    timerType: 'countdown' | 'stopwatch';
    isPaused: boolean;
    pauseTime: number | null; // The timestamp when pause was clicked
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

  const getStoredState = (): StoredTimerState | null => {
    try {
        const stored = localStorage.getItem(timerId);
        if (!stored) return null;
        const state = JSON.parse(stored) as StoredTimerState;
        if (state.startTime && state.timerType) {
            return state;
        }
        return null;
    } catch {
        return null;
    }
  };

  const setStoredState = (state: StoredTimerState | null) => {
    if (!state) {
        localStorage.removeItem(timerId);
    } else {
        localStorage.setItem(timerId, JSON.stringify(state));
    }
  };

  const handleTick = useCallback(() => {
    const storedState = getStoredState();
    if (!storedState || storedState.isPaused) {
      if(intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    const elapsed = Math.floor((Date.now() - storedState.startTime) / 1000);

    if (storedState.timerType === 'countdown') {
      const newTime = storedState.initialDuration - elapsed;
      setTime(newTime);
      if (newTime <= 0) {
        onEnd({ 
            duration: storedState.initialDuration, 
            pauseCount: storedState.pauseCount, 
            startTime: storedState.startTime
        });
        reset();
      }
    } else { // Stopwatch
      setTime(elapsed);
    }
  }, [timerId, onEnd, reset]);


  useEffect(() => {
    const storedState = getStoredState();
    if (storedState) {
        setIsActive(true);
        setIsPaused(storedState.isPaused);
        handleTick(); // Calculate current time immediately on load
        if (!storedState.isPaused) {
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
    const storedState = getStoredState();

    if (storedState && storedState.isPaused) {
        // Resuming from a paused state
        const pauseDuration = Date.now() - (storedState.pauseTime || Date.now());
        stateToStore = {
          ...storedState,
          startTime: storedState.startTime + pauseDuration,
          isPaused: false,
          pauseTime: null,
        };
    } else {
        // Starting fresh
        stateToStore = {
            startTime: Date.now(),
            pauseCount: 0,
            initialDuration: timerType === 'countdown' ? initialDuration : 0,
            timerType: timerType,
            isPaused: false,
            pauseTime: null,
        };
    }
    
    setStoredState(stateToStore);
    setIsActive(true);
    setIsPaused(false);
    handleTick(); // Immediate tick
    intervalRef.current = setInterval(handleTick, 1000);
  }, [timerId, initialDuration, timerType, handleTick]);

  const pause = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    const storedState = getStoredState();
    if (!storedState || !isActive) return;

    setStoredState({
        ...storedState,
        isPaused: true,
        pauseTime: Date.now(),
        pauseCount: storedState.pauseCount + 1,
    });
    setIsPaused(true);
  }, [timerId, isActive]);

  const reset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    const storedState = getStoredState();
    if (storedState) {
        let studiedDuration;
        if(storedState.timerType === 'countdown'){
            const elapsed = Math.floor(((storedState.pauseTime || Date.now()) - storedState.startTime) / 1000);
            studiedDuration = Math.min(elapsed, storedState.initialDuration);
        } else {
             studiedDuration = Math.floor(((storedState.pauseTime || Date.now()) - storedState.startTime) / 1000);
        }

        if (studiedDuration > 5) {
            onEnd({ 
                duration: studiedDuration, 
                pauseCount: storedState.pauseCount, 
                startTime: storedState.startTime 
            });
        }
    }
    
    setStoredState(null);
    setIsActive(false);
    setIsPaused(false);
    setTime(initialDuration);
  }, [timerId, onEnd, initialDuration]);

  return { time, isActive, isPaused, start, pause, reset };
}
