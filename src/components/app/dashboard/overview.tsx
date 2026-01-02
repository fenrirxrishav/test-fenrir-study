
"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { Session } from "@/lib/definitions";
import { useMemo } from 'react';
import { format, subDays, startOfDay } from 'date-fns';

interface OverviewProps {
  sessions: Session[] | null;
}

export function Overview({ sessions }: OverviewProps) {
  const data = useMemo(() => {
    const weeklyData = Array.from({ length: 7 }).map((_, i) => {
        const date = startOfDay(subDays(new Date(), 6 - i));
        return {
            name: format(date, 'E'), // "Mon", "Tue", etc.
            total: 0,
        };
    });

    if (sessions) {
        sessions.forEach(session => {
            const sessionDateStr = format(startOfDay(new Date(session.startTime)), 'E');
            const dayData = weeklyData.find(d => d.name === sessionDateStr);
            if (dayData) {
                dayData.total += session.duration; // duration in seconds
            }
        });
    }
    
    return weeklyData;
  }, [sessions]);


  if (!sessions) {
      return (
        <div style={{ height: 350, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div>Loading chart...</div>
        </div>
      )
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <XAxis
          dataKey="name"
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${Math.round(value / 60)}m`}
        />
        <Tooltip
            contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                borderColor: 'hsl(var(--border))'
            }}
            cursor={{ fill: 'hsl(var(--muted))' }}
            formatter={(value: number) => [`${Math.round(value/60)} minutes`, 'Time Studied']}
        />
        <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
