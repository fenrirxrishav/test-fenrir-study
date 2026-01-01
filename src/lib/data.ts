import { Subject, Session } from './definitions';

export const mockSubjects: Subject[] = [];

export const mockSessions: Session[] = [
    {
        id: '1',
        userId: '1',
        subjectId: '1',
        mode: 'pomodoro',
        startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 30 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        duration: 1500,
        pauseCount: 1,
        status: 'completed',
        focusScore: 90,
    },
    {
        id: '2',
        userId: '1',
        subjectId: '2',
        mode: 'deep-focus',
        startTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 - 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        duration: 3600,
        pauseCount: 0,
        status: 'completed',
        focusScore: 100,
    },
    {
        id: '3',
        userId: '1',
        subjectId: '1',
        mode: 'pomodoro',
        startTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 - 30 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        duration: 1400,
        pauseCount: 2,
        status: 'stopped',
        focusScore: 75,
    },
    {
        id: '4',
        userId: '1',
        subjectId: '4',
        mode: 'custom',
        startTime: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        duration: 3500,
        pauseCount: 1,
        status: 'completed',
        focusScore: 95,
    },
      {
        id: '5',
        userId: '1',
        subjectId: '3',
        mode: 'pomodoro',
        startTime: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000 + 25 * 60 * 1000).toISOString(),
        duration: 1500,
        pauseCount: 0,
        status: 'completed',
        focusScore: 100,
    },
    {
        id: '6',
        userId: '1',
        subjectId: '2',
        mode: 'deep-focus',
        startTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 50 * 60 * 1000).toISOString(),
        duration: 3000,
        pauseCount: 1,
        status: 'completed',
        focusScore: 92,
    }
];

// Helper function to get subject name by ID
export const getSubjectById = (subjects: Subject[], id: string) => subjects.find(s => s.id === id);
