"use client"

import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart"

const chartConfig = {} satisfies ChartConfig

const CORES_BARRAS = [
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-1)",
]

interface GraficoStatusNegociosProps {
  abertos: number
  ganhos: number
  perdidos: number
}

export function GraficoStatusNegocios({
  abertos,
  ganhos,
  perdidos,
}: GraficoStatusNegociosProps) {
  const dados = [
    { label: "Abertos", valor: abertos },
    { label: "Ganhos", valor: ganhos },
    { label: "Perdidos", valor: perdidos },
  ]

  return (
    <ChartContainer config={chartConfig} className="h-48 w-full">
      <BarChart data={dados} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12 }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12 }}
          allowDecimals={false}
        />
        <ChartTooltip
          cursor={{ fill: "var(--muted)", opacity: 0.4 }}
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null
            return (
              <div className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs shadow-xl">
                <span className="font-medium">{label}:</span>{" "}
                <span className="text-muted-foreground">{payload[0].value}</span>
              </div>
            )
          }}
        />
        <Bar dataKey="valor" radius={[4, 4, 0, 0]}>
          {dados.map((entry, index) => (
            <Cell key={entry.label} fill={CORES_BARRAS[index % CORES_BARRAS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}
