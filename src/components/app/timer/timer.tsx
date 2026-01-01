"use client";

import { useState, useEffect } from 'react';
import { useTimer } from '@/hooks/use-timer';
import { TimerDisplay } from './timer-display';
import { TimerControls } from './timer-controls';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Subject } from '@/lib/definitions';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { AddSubjectDialog } from './add-subject-dialog';

type TimerMode = 'pomodoro' | 'stopwatch';

const modeSettings = {
  pomodoro: { duration: 25 * 60, label: 'Pomodoro' },
  stopwatch: { duration: 0, label: 'Stopwatch' },
};

export default function Timer() {
  const [mode, setMode] = useState<TimerMode>('pomodoro');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [isAddSubjectOpen, setAddSubjectOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedSubjects = localStorage.getItem('subjects');
      if (storedSubjects) {
        setSubjects(JSON.parse(storedSubjects));
      }
    } catch (error) {
        console.error("Could not access localStorage:", error);
    }
  }, []);

  const handleSessionEnd = (sessionData: { duration: number; pauseCount: number }) => {
    console.log('Session ended:', sessionData);
    toast({
      title: "Session Saved!",
      description: `You studied ${selectedSubject?.name} for ${Math.round(sessionData.duration / 60)} minutes.`,
    });
    // In a real app, this would be saved to a database
  };

  const {
    time,
    isActive,
    isPaused,
    start,
    pause,
    reset,
  } = useTimer({ 
    initialDuration: modeSettings[mode].duration, 
    onEnd: handleSessionEnd, 
    timerType: mode === 'stopwatch' ? 'stopwatch' : 'countdown' 
  });

  const handleStart = () => {
    if (!selectedSubject) {
      toast({
        title: 'No Subject Selected',
        description: 'Please select a subject before starting the timer.',
        variant: 'destructive',
      });
      return;
    }
    start();
  };

  const handleModeChange = (newMode: string) => {
    if (isActive) return;
    setMode(newMode as TimerMode);
    reset(modeSettings[newMode as TimerMode].duration);
  };
  
  const handleSubjectChange = (subjectId: string) => {
    if (isActive) return;
    const subject = subjects.find(s => s.id === subjectId) || null;
    setSelectedSubject(subject);
  };

  const handleAddSubject = (newSubject: Omit<Subject, 'id' | 'archived'>) => {
    const subject: Subject = {
      ...newSubject,
      id: crypto.randomUUID(),
      archived: false,
    };
    const updatedSubjects = [...subjects, subject];
    setSubjects(updatedSubjects);
    try {
        localStorage.setItem('subjects', JSON.stringify(updatedSubjects));
    } catch (error) {
        console.error("Could not access localStorage:", error);
    }
    setSelectedSubject(subject);
    setAddSubjectOpen(false);
  };


  const activeSubjects = subjects.filter(s => !s.archived);

  return (
    <>
    <Card className="w-full max-w-lg shadow-lg">
      <CardContent className="flex flex-col items-center gap-8 p-6 md:p-8">
        <Tabs value={mode} onValueChange={handleModeChange} className="w-full">
          <TabsList className={cn("grid w-full grid-cols-2", isActive && "pointer-events-none opacity-50")}>
            {Object.entries(modeSettings).map(([key, value]) => (
              <TabsTrigger key={key} value={key} disabled={isActive}>
                {value.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        
        <TimerDisplay time={time} subjectName={selectedSubject?.name || 'Select Subject'} />

        <div className="w-full space-y-4">
            <div className="flex gap-2">
                <Select onValueChange={handleSubjectChange} disabled={isActive} value={selectedSubject?.id || ""}>
                    <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a subject to begin" />
                    </SelectTrigger>
                    <SelectContent>
                    {activeSubjects.map((subject) => (
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
              setSelectedSubject(null);
            }}
          />
        </div>
      </CardContent>
    </Card>
    <AddSubjectDialog
        isOpen={isAddSubjectOpen}
        onOpenChange={setAddSubjectOpen}
        onAddSubject={handleAddSubject}
    />
    </>
  );
}
