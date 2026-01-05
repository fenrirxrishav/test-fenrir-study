
"use client";

import { useState, useMemo } from 'react';
import { useTimer } from '@/hooks/use-timer';
import { TimerDisplay } from './timer-display';
import { TimerControls } from './timer-controls';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { PlusCircle, Palette, PanelLeft, PanelTop } from 'lucide-react';
import { AddSubjectDialog } from './add-subject-dialog';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { addDoc, collection, query, serverTimestamp, where } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { StyleSelector } from './style-selector';
import type { Subject } from '@/lib/definitions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';


type LayoutMode = 'side' | 'bottom';

const modeSettings: { [key in 'pomodoro' | 'stopwatch']: { label: string } } = {
  pomodoro: { label: 'Pomodoro' },
  stopwatch: { label: 'Stopwatch' },
};

export default function Timer() {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [layout, setLayout] = useState<LayoutMode>('bottom');
  const [isAddSubjectOpen, setAddSubjectOpen] = useState(false);
  const [isStyleSelectorOpen, setStyleSelectorOpen] = useState(false);
  
  const subjectsQuery = useMemo(() => {
      return user && firestore ? query(collection(firestore, 'subjects'), where('userId', '==', user.uid), where('archived', '==', false)) : null;
  }, [user, firestore]);
  const { data: subjects, loading: subjectsLoading } = useCollection<Subject>(subjectsQuery);

  const {
    displayTime,
    selectedSubjectId,
    mode,
    customDuration,
    isActive,
    isPaused,
    isIdle,
    timerStateLoading,
    start,
    pause,
    stop,
    handleModeChange,
    handleSubjectChange,
    handleDurationChange,
    setSelectedSubjectId
  } = useTimer();

  const selectedSubject = useMemo(() => {
    if (!subjects || !selectedSubjectId) return null;
    return subjects.find(s => s.id === selectedSubjectId) || null;
  }, [subjects, selectedSubjectId]);

  const handleAddSubject = async (newSubject: Omit<Subject, 'id' | 'archived' | 'userId' | 'createdAt'>) => {
    if (!user) {
      toast({
        title: 'Please Log In',
        description: 'You need to be logged in to add subjects.',
        action: <Button onClick={() => router.push('/login')}>Login</Button>
      });
      return;
    }
    if (!firestore) return;

    try {
        const docRef = await addDoc(collection(firestore, "subjects"), {
            ...newSubject,
            userId: user.uid,
            archived: false,
            createdAt: serverTimestamp()
        });
        setSelectedSubjectId(docRef.id);
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

  const layoutIcon = layout === 'side' ? <PanelTop /> : <PanelLeft />;

  const controlPanel = (
    <div className="flex w-full flex-col items-center justify-center gap-6">
        <Tabs value={mode} onValueChange={(val) => handleModeChange(val as 'pomodoro' | 'stopwatch')} className="w-full max-w-sm">
            <TabsList className={cn("grid w-full grid-cols-2", !isIdle && "pointer-events-none opacity-50")}>
            {Object.entries(modeSettings).map(([key, value]) => (
                <TabsTrigger key={key} value={key} disabled={!isIdle}>
                {value.label}
                </TabsTrigger>
            ))}
            </TabsList>
        </Tabs>

        {mode === 'pomodoro' && (
            <div className='flex items-center justify-center gap-2'>
            <label htmlFor="custom-duration" className='text-sm font-medium text-muted-foreground'>Duration:</label>
            <Input
                id="custom-duration"
                type="number"
                value={customDuration}
                onChange={(e) => handleDurationChange(Number(e.target.value))}
                className="w-20 h-9"
                disabled={!isIdle}
            />
                <span className="text-sm text-muted-foreground">min</span>
            </div>
        )}
        <div className="flex gap-2 w-full max-w-sm">
            <Select onValueChange={handleSubjectChange} disabled={!isIdle || !user} value={selectedSubjectId || ""}>
                <SelectTrigger>
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
            <Button variant="outline" size="icon" onClick={() => setAddSubjectOpen(true)} disabled={!isIdle}>
                <PlusCircle className="h-4 w-4" />
            </Button>
        </div>

        <TimerControls
        isActive={isActive}
        isPaused={isPaused}
        onStart={start}
        onPause={pause}
        onReset={() => stop('stopped')}
        />
    </div>
  );


  return (
    <>
        <div className={cn("relative flex h-full w-full flex-col items-center justify-center gap-8 md:gap-12 p-4", {
            "md:flex-row": layout === 'side',
            "md:flex-col": layout === 'bottom'
        })}>
            <div className="absolute top-4 right-4 flex items-center">
                <Button variant="ghost" size="icon" onClick={() => setStyleSelectorOpen(true)} className="hidden md:inline-flex">
                    <Palette />
                </Button>
                 <Button variant="ghost" size="icon" onClick={() => setLayout(prev => prev === 'side' ? 'bottom' : 'side')} className="hidden md:inline-flex">
                    {layoutIcon}
                </Button>
            </div>
        
            <TimerDisplay time={displayTime} subjectName={selectedSubject?.name || (user ? 'Select Subject' : 'Login to save session')} />
            
            <div className={cn("flex w-full items-center justify-center md:w-auto", {
                "md:max-w-sm": layout === 'side'
            })}>
               {controlPanel}
            </div>
        </div>
        <AddSubjectDialog
            isOpen={isAddSubjectOpen}
            onOpenChange={setAddSubjectOpen}
            onAddSubject={handleAddSubject}
        />
        <StyleSelector
            isOpen={isStyleSelectorOpen}
            onOpenChange={setStyleSelectorOpen}
        />
    </>
  );
}
