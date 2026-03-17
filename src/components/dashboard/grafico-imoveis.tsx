"use client"

import { Cell, Pie, PieChart } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart"

interface GraficoImoveisProps {
  disponivel: number
  reservado: number
  vendido: number
  alugado: number
}

const chartConfig = {
  disponivel: { label: "Disponível", color: "var(--chart-2)" },
  reservado: { label: "Reservado", color: "var(--chart-3)" },
  vendido: { label: "Vendido", color: "var(--chart-1)" },
  alugado: { label: "Alugado", color: "var(--chart-4)" },
} satisfies ChartConfig

export function GraficoImoveis({
  disponivel,
  reservado,
  vendido,
  alugado,
}: GraficoImoveisProps) {
  const total = disponivel + reservado + vendido + alugado

  if (total === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        Nenhum imóvel cadastrado
      </div>
    )
  }

  const dados = [
    { name: "disponivel", value: disponivel, fill: "var(--chart-2)" },
    { name: "reservado", value: reservado, fill: "var(--chart-3)" },
    { name: "vendido", value: vendido, fill: "var(--chart-1)" },
    { name: "alugado", value: alugado, fill: "var(--chart-4)" },
  ].filter((d) => d.value > 0)

  return (
    <ChartContainer config={chartConfig} className="h-44 w-full">
      <PieChart>
        <Pie
          data={dados}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={36}
          outerRadius={60}
          paddingAngle={2}
        >
          {dados.map((entry) => (
            <Cell key={entry.name} fill={entry.fill} />
          ))}
        </Pie>
        <ChartTooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null
            const item = payload[0]
            const label = chartConfig[item.name as keyof typeof chartConfig]?.label ?? item.name
            return (
              <div className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs shadow-xl">
                <span className="font-medium">{label}:</span>{" "}
                <span className="text-muted-foreground">{item.value}</span>
              </div>
            )
          }}
        />
        <ChartLegend
          content={<ChartLegendContent nameKey="name" />}
          className="-mt-2 flex-wrap gap-x-4 gap-y-1 text-[11px]"
        />
      </PieChart>
    </ChartContainer>
  )
}
