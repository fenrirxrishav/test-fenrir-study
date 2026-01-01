"use client";

import { useState } from 'react';
import { useTimer } from '@/hooks/use-timer';
import { TimerDisplay } from './timer-display';
import { TimerControls } from './timer-controls';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockSubjects } from '@/lib/data';
import { Subject } from '@/lib/definitions';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

type TimerMode = 'pomodoro' | 'deep-focus' | 'custom';

const modeSettings = {
  pomodoro: { duration: 25 * 60, label: 'Pomodoro' },
  'deep-focus': { duration: 50 * 60, label: 'Deep Focus' },
  custom: { duration: 90 * 60, label: 'Custom' },
};

export default function Timer() {
  const [mode, setMode] = useState<TimerMode>('pomodoro');
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const { toast } = useToast();

  const handleSessionEnd = (sessionData: { duration: number; pauseCount: number }) => {
    console.log('Session ended:', sessionData);
    toast({
      title: "Session Saved!",
      description: `You studied ${selectedSubject?.name} for ${Math.round(sessionData.duration / 60)} minutes.`,
    });
    setSelectedSubject(null);
  };

  const {
    time,
    isActive,
    isPaused,
    start,
    pause,
    reset,
  } = useTimer(modeSettings[mode].duration, handleSessionEnd);

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
    const subject = mockSubjects.find(s => s.id === subjectId) || null;
    setSelectedSubject(subject);
  };

  const activeSubjects = mockSubjects.filter(s => !s.archived);

  return (
    <Card className="w-full max-w-lg shadow-lg">
      <CardContent className="flex flex-col items-center gap-8 p-6 md:p-8">
        <Tabs value={mode} onValueChange={handleModeChange} className="w-full">
          <TabsList className={cn("grid w-full grid-cols-3", isActive && "pointer-events-none opacity-50")}>
            {Object.entries(modeSettings).map(([key, value]) => (
              <TabsTrigger key={key} value={key} disabled={isActive}>
                {value.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        
        <TimerDisplay time={time} subjectName={selectedSubject?.name || 'Select Subject'} />

        <div className="w-full space-y-4">
          <Select onValueChange={handleSubjectChange} disabled={isActive}>
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
  );
}
