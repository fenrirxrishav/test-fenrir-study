
"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { doc, serverTimestamp, updateDoc, setDoc, addDoc, collection } from 'firebase/firestore';
import { TimerState, Session } from '@/lib/definitions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

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

  const [customDuration, setCustomDuration] = useState(25);
  const [mode, setMode] = useState<'pomodoro' | 'stopwatch'>('pomodoro');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);

  useEffect(() => {
    if (timerState) {
        setMode(timerState.mode);
        setSelectedSubjectId(timerState.subjectId);
        if (timerState.mode === 'pomodoro') {
            setCustomDuration(timerState.initialDuration / 60);
        }
    } else {
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
        setDisplayTime(mode === 'pomodoro' ? timerState.initialDuration : 0);
        return;
    }

    if (timerState.status === 'paused') {
        const remaining = timerState.initialDuration - timerState.accumulatedTime;
        setDisplayTime(timerState.mode === 'pomodoro' ? remaining : timerState.accumulatedTime);
        return;
    }

    if (timerState.status === 'running' && timerState.startedAt) {
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
        } else {
            setDisplayTime(totalElapsedTime / 1000);
        }
      }
    }
  }, [timerState, mode, customDuration]);


  useEffect(() => {
    if (intervalRef.current) {
        clearInterval(intervalRef.current);
    }
    if (timerState?.status === 'running') {
        calculateDisplayTime(); 
        intervalRef.current = setInterval(calculateDisplayTime, 1000);
    } else {
        calculateDisplayTime();
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timerState, calculateDisplayTime]);

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
    let sessionStartTime = serverTimestamp();

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
      startedAt: serverTimestamp(),
      sessionStartTime: sessionStartTime,
      subjectId: selectedSubjectId,
    };

    setDoc(timerStateRef, newState, { merge: true }).catch(serverError => {
        const permissionError = new FirestorePermissionError({
            path: timerStateRef.path,
            operation: 'update',
            requestResourceData: newState,
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  };

  const pause = async () => {
    if (!timerState || timerState.status !== 'running' || !timerState.startedAt?.seconds || !firestore || !timerStateRef) return;

    const now = Date.now();
    const startedAtMillis = timerState.startedAt.seconds * 1000 + (timerState.startedAt.nanoseconds / 1000000);
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
    if (!timerState) {
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

    if (finalDurationSeconds > 5) {
        const focusScore = 100;

        const sessionPayload: Omit<Session, 'id'> = {
            userId: user.uid,
            subjectId: timerState.subjectId,
            mode: timerState.mode,
            startTime: new Date(timerState.sessionStartTime.seconds * 1000).toISOString(),
            endTime: new Date().toISOString(),
            duration: finalDurationSeconds,
            pauseCount: 0,
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

    const resetState = {
        status: 'stopped',
        accumulatedTime: 0,
        startedAt: null,
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
