
"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { doc, serverTimestamp, updateDoc, setDoc, addDoc, collection, DocumentData, Timestamp } from 'firebase/firestore';
import { TimerState, Session } from '@/lib/definitions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

// Helper to convert Firestore Timestamp to milliseconds
const toMillis = (timestamp: Timestamp | null | undefined): number => {
  if (!timestamp) return 0;
  return timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000;
};

export function useTimer() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  const [displayTime, setDisplayTime] = useState(0); 
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const timerStateRef = useMemo(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'timerStates', user.uid);
  }, [user, firestore]);

  const { data: timerState, loading: timerStateLoading } = useDoc<TimerState>(timerStateRef);

  // Local state for UI configuration, synced from Firestore
  const [customDuration, setCustomDuration] = useState(25);
  const [mode, setMode] = useState<'pomodoro' | 'stopwatch'>('pomodoro');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);

  // Sync local UI config with server state when it loads
  useEffect(() => {
    if (timerState) {
        setMode(timerState.mode);
        setSelectedSubjectId(timerState.subjectId);
        if (timerState.mode === 'pomodoro') {
            setCustomDuration(timerState.initialDuration / 60);
        }
    }
  }, [timerState]);

  const calculateDisplayTime = useCallback(() => {
    if (!timerState) {
      setDisplayTime(mode === 'pomodoro' ? customDuration * 60 : 0);
      return;
    }
    
    if (timerState.status === 'stopped') {
        setDisplayTime(mode === 'pomodoro' ? timerState.initialDuration : 0);
        return;
    }

    if (timerState.status === 'paused') {
        const remaining = timerState.initialDuration - timerState.accumulatedTime;
        setDisplayTime(timerState.mode === 'pomodoro' ? remaining : timerState.accumulatedTime);
        return;
    }

    if (timerState.status === 'running' && timerState.startedAt) {
        const now = Date.now();
        const startedAtMillis = toMillis(timerState.startedAt);
        const elapsedSinceStart = now - startedAtMillis;
        const totalElapsedTime = timerState.accumulatedTime + elapsedSinceStart;

        if (timerState.mode === 'pomodoro') {
            const remaining = Math.max(0, timerState.initialDuration * 1000 - totalElapsedTime) / 1000;
            setDisplayTime(remaining);

            if (remaining <= 0) {
              stop('completed');
            }
        } else {
            setDisplayTime(totalElapsedTime / 1000);
        }
    }
  }, [timerState, mode, customDuration]);


  useEffect(() => {
    if (intervalRef.current) {
        clearInterval(intervalRef.current);
    }
    // Only set an interval if the timer is running
    if (timerState?.status === 'running') {
        // Run once immediately to prevent delay
        calculateDisplayTime(); 
        intervalRef.current = setInterval(calculateDisplayTime, 1000);
    } else {
        // If not running, just calculate the display time once (for paused/stopped states)
        calculateDisplayTime();
    }
    // Cleanup interval on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timerState, calculateDisplayTime]); // Rerun when timerState or calculation logic changes

  const start = async () => {
    if (!firestore || !user || !timerStateRef) {
        toast({
            title: "You're not logged in",
            description: 'Log in to start the timer and track your progress.',
            action: <Button onClick={() => router.push('/login')}>Login</Button>
        });
        return;
    }
    if (!selectedSubjectId) {
      toast({
        title: 'No Subject Selected',
        description: 'Please select a subject before starting the timer.',
        variant: 'destructive',
      });
      return;
    }
    
    let accumulatedTime = 0;
    let newMode = mode;
    let newDuration = mode === 'pomodoro' ? customDuration * 60 : 0;
    let sessionStartTime: any = serverTimestamp();

    // If resuming from a paused state, carry over the accumulated time and original start time
    if(timerState && timerState.status === 'paused') {
        accumulatedTime = timerState.accumulatedTime;
        newMode = timerState.mode;
        newDuration = timerState.initialDuration;
        sessionStartTime = timerState.sessionStartTime;
    }
    
    const newState = {
      userId: user.uid,
      status: 'running',
      mode: newMode,
      initialDuration: newDuration,
      accumulatedTime: accumulatedTime,
      startedAt: serverTimestamp(), // Mark the new run start time
      sessionStartTime: sessionStartTime, // Preserve the original session start time
      subjectId: selectedSubjectId,
    };

    // Use `setDoc` with `merge: true` to handle both creation of a new timerState and updating an existing one
    setDoc(timerStateRef, newState, { merge: true }).catch(serverError => {
        const permissionError = new FirestorePermissionError({
            path: timerStateRef.path,
            operation: 'update', // or 'create' - merge can do both
            requestResourceData: newState,
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  };

  const pause = async () => {
    if (!timerState || timerState.status !== 'running' || !timerState.startedAt || !firestore || !timerStateRef) return;

    const now = Date.now();
    const startedAtMillis = toMillis(timerState.startedAt);
    const elapsedSinceStart = now - startedAtMillis;
    const newAccumulatedTime = timerState.accumulatedTime + elapsedSinceStart;

    const updateData = {
      status: 'paused',
      accumulatedTime: newAccumulatedTime,
    };

    updateDoc(timerStateRef, updateData).catch(serverError => {
        const permissionError = new FirestorePermissionError({
            path: timerStateRef.path,
            operation: 'update',
            requestResourceData: updateData,
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  };

  const stop = async (finalStatus: 'stopped' | 'completed') => {
    if (!firestore || !user || !timerStateRef) return;

    // If there's no timer state, there's nothing to stop. Just reset the display.
    if (!timerState) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setDisplayTime(mode === 'pomodoro' ? customDuration * 60 : 0);
        return;
    }
    
    let finalElapsedTime = timerState.accumulatedTime;
    // If it was running when stopped, add the last running portion.
    if(timerState.status === 'running' && timerState.startedAt) {
      const now = Date.now();
      const startedAtMillis = toMillis(timerState.startedAt);
      const elapsedSinceStart = now - startedAtMillis;
      finalElapsedTime += elapsedSinceStart;
    }

    const finalDurationSeconds = Math.round(finalElapsedTime / 1000);

    // Only save the session if it's longer than a few seconds
    if (finalDurationSeconds > 5 && timerState.sessionStartTime) {
        const focusScore = 100; // Placeholder

        const sessionPayload: Omit<Session, 'id'> = {
            userId: user.uid,
            subjectId: timerState.subjectId,
            mode: timerState.mode,
            startTime: new Date(toMillis(timerState.sessionStartTime)).toISOString(),
            endTime: new Date().toISOString(),
            duration: finalDurationSeconds,
            pauseCount: 0, // Placeholder
            status: finalStatus,
            focusScore: focusScore,
        }
        
        addDoc(collection(firestore, 'sessions'), sessionPayload).catch(serverError => {
            const permissionError = new FirestorePermissionError({
                path: `sessions/(new_id)`,
                operation: 'create',
                requestResourceData: sessionPayload,
            });
            errorEmitter.emit('permission-error', permissionError);
        });

        toast({
            title: "Session Saved!",
            description: `You studied for ${Math.round(finalDurationSeconds / 60)} minutes.`,
        });
    }

    // Reset the timer state on the server
    const resetState = {
        status: 'stopped',
        accumulatedTime: 0,
        startedAt: null,
        // Keep subject and mode for next session
    };
    updateDoc(timerStateRef, resetState).catch(serverError => {
        const permissionError = new FirestorePermissionError({
            path: timerStateRef.path,
            operation: 'update',
            requestResourceData: resetState,
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  };
  
  // These handlers should only work if the timer is idle.
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
    // Basic validation
    if(newDuration > 0 && newDuration <= 180) {
        setCustomDuration(newDuration);
    }
  };


  const isActive = timerState?.status === 'running';
  const isPaused = timerState?.status === 'paused';
  const isIdle = !timerState || timerState.status === 'stopped';
  const totalDuration = timerState?.initialDuration || customDuration * 60;
  
  return {
    displayTime,
    selectedSubjectId,
    mode,
    customDuration,
    isActive,
    isPaused,
    isIdle,
    timerStateLoading,
    totalDuration,
    start,
    pause,
    stop,
    handleModeChange,
    handleSubjectChange,
    handleDurationChange,
    setSelectedSubjectId
  };
}
