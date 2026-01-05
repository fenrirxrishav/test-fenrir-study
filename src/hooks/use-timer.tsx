
"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useUser, useFirestore, useDoc, useCollection } from '@/firebase';
import { doc, serverTimestamp, updateDoc, setDoc, addDoc, collection, query, where } from 'firebase/firestore';
import { TimerState, Subject, Session } from '@/lib/definitions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function useTimer() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  // The local time state is just for display, derived from Firestore
  const [displayTime, setDisplayTime] = useState(0); 
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const toastRef = useRef(toast); // Stable ref for toast
  
  const timerStateRef = useMemo(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'timerStates', user.uid);
  }, [user, firestore]);

  const { data: timerState, loading: timerStateLoading } = useDoc<TimerState>(timerStateRef);

  const [customDuration, setCustomDuration] = useState(25);
  const [mode, setMode] = useState<'pomodoro' | 'stopwatch'>('pomodoro');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);

  // Sync local state with Firestore state when it loads or changes
  useEffect(() => {
    if (timerState) {
        setMode(timerState.mode);
        setSelectedSubjectId(timerState.subjectId);
        if (timerState.mode === 'pomodoro') {
            setCustomDuration(timerState.initialDuration / 60);
        }
    } else {
        // If no timer state, default to pomodoro
        setMode('pomodoro');
        setCustomDuration(25);
    }
  }, [timerState]);

  const calculateDisplayTime = useCallback(() => {
    if (!timerState) {
      setDisplayTime(mode === 'pomodoro' ? customDuration * 60 : 0);
      return;
    }
    
    if (timerState.status === 'stopped') {
        setDisplayTime(mode === 'pomodoro' ? customDuration * 60 : 0);
        return;
    }

    if (timerState.status === 'paused') {
        const remaining = timerState.initialDuration - timerState.accumulatedTime;
        setDisplayTime(timerState.mode === 'pomodoro' ? remaining : timerState.accumulatedTime);
        return;
    }

    if (timerState.status === 'running' && timerState.startedAt) {
      // Firebase timestamps can be null briefly before server sets them
      if (timerState.startedAt?.seconds) {
        const now = Date.now();
        const startedAtMillis = timerState.startedAt.seconds * 1000 + (timerState.startedAt.nanoseconds / 1000000);
        const elapsedSinceStart = now - startedAtMillis;
        const totalElapsedTime = timerState.accumulatedTime + elapsedSinceStart;

        if (timerState.mode === 'pomodoro') {
            const remaining = Math.max(0, timerState.initialDuration * 1000 - totalElapsedTime) / 1000;
            setDisplayTime(remaining);

            if (remaining <= 0) {
              stop('completed');
            }
        } else { // Stopwatch
            setDisplayTime(totalElapsedTime / 1000);
        }
      }
    }
  }, [timerState, mode, customDuration]);


  // Effect to manage the interval for UI updates
  useEffect(() => {
    if (intervalRef.current) {
        clearInterval(intervalRef.current);
    }
    if (timerState?.status === 'running') {
        calculateDisplayTime(); // Recalculate immediately
        intervalRef.current = setInterval(calculateDisplayTime, 1000);
    } else {
        calculateDisplayTime(); // Update display for paused/stopped state
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timerState, calculateDisplayTime]);

  const start = async () => {
    if (!firestore || !user) {
        toastRef.current({
            title: "You're not logged in",
            description: 'Log in to start the timer and track your progress.',
            action: <Button onClick={() => router.push('/login')}>Login</Button>
        });
        return;
    }
    if (!selectedSubjectId) {
      toastRef.current({
        title: 'No Subject Selected',
        description: 'Please select a subject before starting the timer.',
        variant: 'destructive',
      });
      return;
    }
    
    let accumulatedTime = 0;
    let newMode = mode;
    let newDuration = mode === 'pomodoro' ? customDuration * 60 : 0;
    let sessionStartTime = serverTimestamp();

    if(timerState && timerState.status === 'paused') {
        accumulatedTime = timerState.accumulatedTime;
        newMode = timerState.mode; // Resume with the mode that was paused
        newDuration = timerState.initialDuration;
        sessionStartTime = timerState.sessionStartTime; // Persist original start time
    }
    
    await setDoc(timerStateRef, {
      userId: user.uid,
      status: 'running',
      mode: newMode,
      initialDuration: newDuration,
      accumulatedTime: accumulatedTime,
      startedAt: serverTimestamp(),
      sessionStartTime: sessionStartTime,
      subjectId: selectedSubjectId,
    }, { merge: true });
  };

  const pause = async () => {
    if (!timerState || timerState.status !== 'running' || !timerState.startedAt?.seconds || !firestore) return;

    const now = Date.now();
    const startedAtMillis = timerState.startedAt.seconds * 1000 + (timerState.startedAt.nanoseconds / 1000000);
    const elapsedSinceStart = now - startedAtMillis;
    const newAccumulatedTime = timerState.accumulatedTime + elapsedSinceStart;

    await updateDoc(timerStateRef, {
      status: 'paused',
      accumulatedTime: newAccumulatedTime,
    });
  };

  const stop = async (finalStatus: 'stopped' | 'completed') => {
    if (!firestore || !user || !timerStateRef) return;
    if (!timerState) { // If no state, nothing to stop
        if (intervalRef.current) clearInterval(intervalRef.current);
        setDisplayTime(mode === 'pomodoro' ? customDuration * 60 : 0);
        return;
    }
    
    let finalElapsedTime = timerState.accumulatedTime;
    if(timerState.status === 'running' && timerState.startedAt?.seconds) {
      const now = Date.now();
      const startedAtMillis = timerState.startedAt.seconds * 1000 + (timerState.startedAt.nanoseconds / 1000000);
      const elapsedSinceStart = now - startedAtMillis;
      finalElapsedTime += elapsedSinceStart;
    }

    const finalDurationSeconds = Math.round(finalElapsedTime / 1000);

    // Only save session if it's longer than a few seconds
    if (finalDurationSeconds > 5) {
        const focusScore = 100; // Placeholder, real logic can be more complex

        const sessionPayload: Omit<Session, 'id'> = {
            userId: user.uid,
            subjectId: timerState.subjectId,
            mode: timerState.mode,
            startTime: new Date(timerState.sessionStartTime.seconds * 1000).toISOString(),
            endTime: new Date().toISOString(),
            duration: finalDurationSeconds,
            pauseCount: 0, // This needs to be tracked properly if required
            status: finalStatus,
            focusScore: focusScore,
        }
        
        await addDoc(collection(firestore, 'sessions'), sessionPayload);

        toastRef.current({
            title: "Session Saved!",
            description: `You studied for ${Math.round(finalDurationSeconds / 60)} minutes.`,
        });
    }

    // Reset the timer state in Firestore
    await updateDoc(timerStateRef, {
        status: 'stopped',
        accumulatedTime: 0,
        startedAt: null,
    });
  };
  
  const handleModeChange = (newMode: 'pomodoro' | 'stopwatch') => {
    if (timerState && timerState.status !== 'stopped') return;
    setMode(newMode);
  }
  
  const handleSubjectChange = (subjectId: string) => {
    if (timerState && timerState.status !== 'stopped') return;
    setSelectedSubjectId(subjectId);
  };
  
  const handleDurationChange = (newDuration: number) => {
    if (timerState && timerState.status !== 'stopped') return;
    setCustomDuration(newDuration);
  };


  const isActive = timerState?.status === 'running';
  const isPaused = timerState?.status === 'paused';
  
  return {
    displayTime,
    selectedSubjectId,
    mode,
    customDuration,
    isActive,
    isPaused,
    isIdle: timerState?.status === 'stopped' || !timerState,
    timerStateLoading,
    start,
    pause,
    stop,
    handleModeChange,
    handleSubjectChange,
    handleDurationChange,
    setSelectedSubjectId
  };
}
