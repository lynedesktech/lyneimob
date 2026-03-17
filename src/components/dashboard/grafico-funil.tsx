"use client"

import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart"

export type EtapaFunil = {
  nome: string
  cor: string
  total: number
}

interface GraficoFunilProps {
  etapas: EtapaFunil[]
}

const chartConfig = {} satisfies ChartConfig

export function GraficoFunil({ etapas }: GraficoFunilProps) {
  if (etapas.length === 0 || etapas.every((e) => e.total === 0)) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        Nenhum negócio aberto no funil
      </div>
    )
  }

  return (
    <ChartContainer config={chartConfig} className="h-44 w-full">
      <BarChart
        data={etapas}
        layout="vertical"
        margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
      >
        <CartesianGrid horizontal={false} strokeDasharray="3 3" />
        <XAxis
          type="number"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11 }}
          allowDecimals={false}
        />
        <YAxis
          type="category"
          dataKey="nome"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11 }}
          width={80}
        />
        <ChartTooltip
          cursor={{ fill: "var(--muted)", opacity: 0.4 }}
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
        <Bar dataKey="total" radius={[0, 4, 4, 0]}>
          {etapas.map((etapa) => (
            <Cell key={etapa.nome} fill={etapa.cor || "var(--chart-1)"} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}
