import { Card, CardContent } from "@/components/ui/card"
import { Layers, CircleCheck, Clock, CircleDollarSign, Ban } from "lucide-react"
import { formatarPreco } from "@/lib/formatadores"
import type { Loteamento } from "@/types/database"

type ResumoLoteamentoProps = {
  loteamento: Loteamento
}

export function ResumoLoteamento({ loteamento }: ResumoLoteamentoProps) {
  const metricas = [
    {
      label: "Total de lotes",
      valor: loteamento.total_lotes,
      icone: Layers,
      cor: "text-info",
      bgCor: "bg-info/10",
    },
    {
      label: "Disponíveis",
      valor: loteamento.lotes_disponiveis,
      icone: CircleCheck,
      cor: "text-success",
      bgCor: "bg-success/10",
    },
    {
      label: "Reservados",
      valor: loteamento.lotes_reservados,
      icone: Clock,
      cor: "text-warning",
      bgCor: "bg-warning/10",
    },
    {
      label: "Vendidos",
      valor: loteamento.lotes_vendidos,
      icone: Ban,
      cor: "text-destructive",
      bgCor: "bg-destructive/10",
    },
    {
      label: "Valor total",
      valor: formatarPreco(loteamento.valor_total),
      icone: CircleDollarSign,
      cor: "text-primary",
      bgCor: "bg-primary/10",
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {metricas.map((m) => (
        <Card key={m.label}>
          <CardContent className="flex items-center gap-3 p-4">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${m.bgCor}`}>
              <m.icone className={`h-5 w-5 ${m.cor}`} />
            </div>
            <div>
              <p className="text-2xl font-bold">{m.valor}</p>
              <p className="text-xs text-muted-foreground">{m.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
