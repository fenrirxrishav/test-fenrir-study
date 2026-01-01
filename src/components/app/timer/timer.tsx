"use client";

import { useState, useEffect } from 'react';
import { useTimer } from '@/hooks/use-timer';
import { TimerDisplay } from './timer-display';
import { TimerControls } from './timer-controls';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Subject } from '@/lib/definitions';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { AddSubjectDialog } from './add-subject-dialog';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { addDoc, collection, serverTimestamp, query, where } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';

type TimerMode = 'pomodoro' | 'stopwatch';

const modeSettings: { [key in TimerMode]: { defaultDuration: number; label: string } } = {
  pomodoro: { defaultDuration: 25 * 60, label: 'Pomodoro' },
  stopwatch: { defaultDuration: 0, label: 'Stopwatch' },
};

export default function Timer() {
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const [mode, setMode] = useState<TimerMode>('pomodoro');
  const [customDuration, setCustomDuration] = useState(modeSettings.pomodoro.defaultDuration / 60);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [isAddSubjectOpen, setAddSubjectOpen] = useState(false);
  const { toast } = useToast();

  const subjectsQuery = user ? query(collection(firestore, 'subjects'), where('userId', '==', user.uid), where('archived', '==', false)) : null;
  const { data: subjects, loading: subjectsLoading } = useCollection<Subject>(subjectsQuery);

  const handleSessionEnd = async (sessionData: { duration: number; pauseCount: number, startTime: number | null }) => {
    if (!selectedSubject || !user || !sessionData.startTime) return;
    
    try {
      await addDoc(collection(firestore, 'sessions'), {
        userId: user.uid,
        subjectId: selectedSubject.id,
        mode: mode,
        startTime: new Date(sessionData.startTime).toISOString(),
        endTime: serverTimestamp(),
        duration: sessionData.duration,
        pauseCount: sessionData.pauseCount,
        status: 'completed',
        focusScore: 100, // Placeholder
      });

      toast({
        title: "Session Saved!",
        description: `You studied ${selectedSubject?.name} for ${Math.round(sessionData.duration / 60)} minutes.`,
      });
    } catch (error) {
      console.error("Error saving session: ", error);
      toast({
        title: 'Error',
        description: 'Could not save your session.',
        variant: 'destructive'
      })
    }
  };

  const timerDuration = mode === 'pomodoro' ? customDuration * 60 : modeSettings.stopwatch.defaultDuration;

  const {
    time,
    isActive,
    isPaused,
    start,
    pause,
    reset,
    duration,
  } = useTimer({ 
    initialDuration: timerDuration, 
    onEnd: handleSessionEnd, 
    timerType: mode === 'stopwatch' ? 'stopwatch' : 'countdown' 
  });
  
  useEffect(() => {
    if (!isActive) {
        reset(timerDuration);
    }
  }, [customDuration, mode, isActive]);


  const handleStart = () => {
    if (user && !selectedSubject) {
      toast({
        title: 'No Subject Selected',
        description: 'Please select a subject before starting the timer to save your session.',
        variant: 'destructive',
      });
      return;
    }
    start();
  };

  const handleModeChange = (newMode: string) => {
    if (isActive) return;
    const modeKey = newMode as TimerMode;
    setMode(modeKey);
    const newDuration = modeKey === 'pomodoro' ? customDuration * 60 : modeSettings.stopwatch.defaultDuration;
    reset(newDuration);
  };
  
  const handleSubjectChange = (subjectId: string) => {
    if (isActive) return;
    const subject = subjects?.find(s => s.id === subjectId) || null;
    setSelectedSubject(subject);
  };

  const handleAddSubject = async (newSubject: Omit<Subject, 'id' | 'archived' | 'userId'>) => {
    if (!user) {
        toast({
            title: 'Please Log In',
            description: 'You need to be logged in to add subjects.',
            action: <Button onClick={() => router.push('/login')}>Login</Button>
        });
        return;
    }
    try {
        const docRef = await addDoc(collection(firestore, "subjects"), {
            ...newSubject,
            userId: user.uid,
            archived: false,
        });
        setSelectedSubject({ ...newSubject, id: docRef.id, archived: false, userId: user.uid });
        setAddSubjectOpen(false);
    } catch (e) {
        console.error("Error adding document: ", e);
        toast({
            title: 'Error',
            description: 'Could not add subject.',
            variant: 'destructive'
        })
    }
  };

  return (
    <>
    <div className="w-full max-w-lg flex flex-col items-center gap-8 p-6 md:p-8 rounded-2xl bg-card/50 shadow-lg backdrop-blur-sm">
        <Tabs value={mode} onValueChange={handleModeChange} className="w-full">
          <TabsList className={cn("grid w-full grid-cols-2", isActive && "pointer-events-none opacity-50")}>
            {Object.entries(modeSettings).map(([key, value]) => (
              <TabsTrigger key={key} value={key} disabled={isActive}>
                {value.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        
        <TimerDisplay time={time} subjectName={selectedSubject?.name || (user ? 'Select Subject' : 'Login to save session')} duration={duration} timerType={mode} />

        <div className="w-full space-y-4">
            {mode === 'pomodoro' && (
              <div className='flex items-center gap-2'>
                <label htmlFor="custom-duration" className='text-sm text-muted-foreground'>Duration (min):</label>
                <Input
                    id="custom-duration"
                    type="number"
                    value={customDuration}
                    onChange={(e) => setCustomDuration(Number(e.target.value))}
                    className="w-20"
                    disabled={isActive}
                />
              </div>
            )}
            <div className="flex gap-2">
                <Select onValueChange={handleSubjectChange} disabled={isActive || !user} value={selectedSubject?.id || ""}>
                    <SelectTrigger className="w-full">
                    <SelectValue placeholder={user ? (subjectsLoading ? "Loading subjects..." : "Select a subject") : "Login to see subjects"} />
                    </SelectTrigger>
                    <SelectContent>
                    {user && subjects && subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                        <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: subject.color }}></span>
                            {subject.name}
                        </div>
                        </SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                <Button variant="outline" size="icon" onClick={() => setAddSubjectOpen(true)} disabled={isActive}>
                    <PlusCircle className="h-4 w-4" />
                </Button>
            </div>


          <TimerControls
            isActive={isActive}
            isPaused={isPaused}
            onStart={handleStart}
            onPause={pause}
            onReset={() => {
              reset();
            }}
          />
        </div>
    </div>
    <AddSubjectDialog
        isOpen={isAddSubjectOpen}
        onOpenChange={setAddSubjectOpen}
        onAddSubject={handleAddSubject}
    />
    </>
  );
}
