"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"

interface OverviewChartProps {
  data: {
    name: string
    total: number
  }[]
}

export function OverviewChart({ data }: OverviewChartProps) {
  return (
    <ResponsiveContainer width="100%" aspect={16 / 9} minHeight={200}>
      <BarChart data={data} role="img" aria-label="Pipeline overview chart showing application distribution by status">
        <XAxis
          dataKey="name"
          stroke="currentColor"
          className="text-muted-foreground"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="currentColor"
          className="text-muted-foreground"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}`}
        />
        <Tooltip
          cursor={{ fill: 'transparent' }}
          contentStyle={{ borderRadius: 'var(--radius)', border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: 'var(--card)' }}
          labelStyle={{ color: 'var(--card-foreground)' }}
        />
        <Bar
          dataKey="total"
          fill="currentColor"
          radius={[4, 4, 0, 0]}
          className="fill-primary"
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
