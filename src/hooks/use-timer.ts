
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
    pauseTime?: number;
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
  const [pauseCount, setPauseCount] = useState(0);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const getStoredState = (): StoredTimerState | null => {
    try {
        const stored = localStorage.getItem(timerId);
        if (!stored) return null;
        const state = JSON.parse(stored) as StoredTimerState;
        // Basic validation
        if (state.startTime && state.initialDuration !== undefined && state.timerType) {
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

    if (timerType === 'countdown') {
      const newTime = storedState.initialDuration - elapsed;
      setTime(newTime);

      if (newTime <= 0) {
        onEnd({ 
            duration: storedState.initialDuration, 
            pauseCount: storedState.pauseCount, 
            startTime: startTimeRef.current 
        });
        reset();
      }
    } else { // Stopwatch
      setTime(elapsed);
    }
  }, [timerId, onEnd, timerType]);


  useEffect(() => {
    const storedState = getStoredState();
    if (storedState) {
        // Resume from stored state
        startTimeRef.current = storedState.startTime;
        setPauseCount(storedState.pauseCount);
        setIsPaused(storedState.isPaused);
        
        let elapsed = 0;
        if(storedState.isPaused && storedState.pauseTime) {
             elapsed = Math.floor((storedState.pauseTime - storedState.startTime) / 1000);
        } else {
             elapsed = Math.floor((Date.now() - storedState.startTime) / 1000);
        }

        if(storedState.timerType === 'countdown'){
            const remaining = storedState.initialDuration - elapsed;
            setTime(remaining > 0 ? remaining : 0);
        } else {
            setTime(elapsed);
        }
        setIsActive(true);

    } else {
        setTime(initialDuration);
    }
  }, [timerId, initialDuration]);

  useEffect(() => {
    if (isActive && !isPaused) {
      handleTick(); // Run once immediately
      intervalRef.current = setInterval(handleTick, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, isPaused, handleTick]);

  const start = useCallback(() => {
    const storedState = getStoredState();
    let newStartTime;

    if (storedState && storedState.isPaused) {
        // Resuming from a paused state
        const pauseDuration = Date.now() - (storedState.pauseTime || Date.now());
        newStartTime = storedState.startTime + pauseDuration;
    } else {
        // Starting fresh
        newStartTime = Date.now();
        setPauseCount(0);
    }

    startTimeRef.current = newStartTime;
    const newState: StoredTimerState = {
        startTime: newStartTime,
        pauseCount: storedState?.pauseCount || 0,
        initialDuration: timerType === 'countdown' ? initialDuration : 0,
        timerType: timerType,
        isPaused: false,
    };
    setStoredState(newState);
    
    setIsActive(true);
    setIsPaused(false);
  }, [timerId, initialDuration, timerType, getStoredState, setStoredState]);

  const pause = useCallback(() => {
    const storedState = getStoredState();
    if (!storedState || !isActive) return;

    const newPauseCount = (storedState.pauseCount || 0) + 1;
    setStoredState({
        ...storedState,
        isPaused: true,
        pauseTime: Date.now(),
        pauseCount: newPauseCount,
    });
    setPauseCount(newPauseCount);
    setIsPaused(true);
  }, [timerId, isActive, getStoredState, setStoredState]);

  const reset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    const storedState = getStoredState();

    if (storedState) {
        const studiedDuration = timerType === 'countdown' 
            ? initialDuration - time 
            : time;

        if (studiedDuration > 5) {
            onEnd({ 
                duration: studiedDuration, 
                pauseCount: storedState.pauseCount, 
                startTime: storedState.startTime 
            });
        }
    }
    
    setStoredState(null);
    startTimeRef.current = null;
    setIsActive(false);
    setIsPaused(false);
    setPauseCount(0);
    setTime(initialDuration);
  }, [timerId, onEnd, time, initialDuration, timerType, setStoredState]);

  return { time, isActive, isPaused, start, pause, reset };
}
