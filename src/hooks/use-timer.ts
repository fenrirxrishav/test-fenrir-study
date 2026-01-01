"use client";

import { useState, useEffect, useCallback, useRef } from 'react';

export function useTimer(initialDuration: number, onEnd: (sessionData: { duration: number, pauseCount: number }) => void) {
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
  }, [initialDuration]);
  
  useEffect(() => {
    if (isActive && !isPaused) {
      intervalRef.current = setInterval(() => {
        setTime((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(intervalRef.current!);
            setIsActive(false);
            onEnd({ duration: duration, pauseCount });
            return 0;
          }
          return prevTime - 1;
        });
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
  }, [isActive, isPaused, duration, pauseCount, onEnd]);
  
  // Persist state to localStorage
  useEffect(() => {
    try {
      if (isActive) {
        const timerState = {
          time,
          duration,
          isActive,
          isPaused,
          pauseCount,
          startTime: startTimeRef.current,
          expires: Date.now() + time * 1000,
        };
        localStorage.setItem('timerState', JSON.stringify(timerState));
      } else {
        localStorage.removeItem('timerState');
      }
    } catch (error) {
      console.error("Could not access localStorage:", error);
    }
  }, [time, isActive, isPaused, pauseCount, duration]);

  // Rehydrate state from localStorage on mount
  useEffect(() => {
    try {
      const savedStateJSON = localStorage.getItem('timerState');
      if (savedStateJSON) {
        const savedState = JSON.parse(savedStateJSON);
        if (savedState.expires > Date.now()) {
          const timeRemaining = Math.round((savedState.expires - Date.now()) / 1000);
          setTime(timeRemaining);
          setDuration(savedState.duration);
          setIsActive(savedState.isActive);
          setIsPaused(savedState.isPaused);
          setPauseCount(savedState.pauseCount);
          startTimeRef.current = savedState.startTime;
        } else {
          // Timer expired while tab was closed
          onEnd({ duration: savedState.duration, pauseCount: savedState.pauseCount });
          localStorage.removeItem('timerState');
        }
      }
    } catch (error) {
      console.error("Could not access localStorage:", error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const start = useCallback(() => {
    setIsActive(true);
    setIsPaused(false);
    if (!startTimeRef.current) {
        startTimeRef.current = Date.now();
    }
  }, []);

  const pause = useCallback(() => {
    setIsPaused((prev) => {
      if (!prev) {
        setPauseCount((p) => p + 1);
      }
      return true;
    });
  }, []);

  const reset = useCallback((newDuration?: number) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    const finalDuration = newDuration ?? duration;
    
    if (isActive) {
        const studiedDuration = duration - time;
        onEnd({ duration: studiedDuration, pauseCount });
    }

    setIsActive(false);
    setIsPaused(false);
    setPauseCount(0);
    setTime(finalDuration);
    setDuration(finalDuration);
    startTimeRef.current = null;
    try {
      localStorage.removeItem('timerState');
    } catch (error) {
      console.error("Could not access localStorage:", error);
    }
  }, [duration, time, isActive, pauseCount, onEnd]);

  return { time, isActive, isPaused, start, pause, reset };
}
