"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { useState, useEffect } from 'react';

const generateData = () => [
  {
    name: "Mon",
    total: Math.floor(Math.random() * 5000) + 1000,
  },
  {
    name: "Tue",
    total: Math.floor(Math.random() * 5000) + 1000,
  },
  {
    name: "Wed",
    total: Math.floor(Math.random() * 5000) + 1000,
  },
  {
    name: "Thu",
    total: Math.floor(Math.random() * 5000) + 1000,
  },
  {
    name: "Fri",
    total: Math.floor(Math.random() * 5000) + 1000,
  },
  {
    name: "Sat",
    total: Math.floor(Math.random() * 5000) + 1000,
  },
  {
    name: "Sun",
    total: Math.floor(Math.random() * 5000) + 1000,
  },
];


export function Overview() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    setData(generateData());
  }, []);

  if (data.length === 0) {
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
          tickFormatter={(value) => `${value / 60}m`}
        />
        <Tooltip
            contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                borderColor: 'hsl(var(--border))'
            }}
            cursor={{ fill: 'hsl(var(--muted))' }}
        />
        <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
