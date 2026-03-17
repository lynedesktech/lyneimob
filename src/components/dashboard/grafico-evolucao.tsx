"use client"

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart"

export type PontoMensal = {
  mes: string
  criados: number
}

interface GraficoEvolucaoProps {
  dados: PontoMensal[]
}

const chartConfig = {
  criados: {
    label: "Negócios",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

export function GraficoEvolucao({ dados }: GraficoEvolucaoProps) {
  const totalGeral = dados.reduce((s, d) => s + d.criados, 0)

  if (totalGeral === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        Nenhum negócio criado nos últimos 6 meses
      </div>
    )
  }

  return (
    <ChartContainer config={chartConfig} className="h-40 w-full">
      <AreaChart data={dados} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="gradCriados" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="mes"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11 }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11 }}
          allowDecimals={false}
        />
        <ChartTooltip
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null
            return (
              <div className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs shadow-xl">
                <span className="font-medium">{label}:</span>{" "}
                <span className="text-muted-foreground">
                  {payload[0].value} negócio{payload[0].value !== 1 ? "s" : ""}
                </span>
              </div>
            )
          }}
        />
        <Area
          type="monotone"
          dataKey="criados"
          stroke="var(--chart-1)"
          strokeWidth={2}
          fill="url(#gradCriados)"
          dot={false}
          activeDot={{ r: 4 }}
        />
      </AreaChart>
    </ChartContainer>
  )
}
