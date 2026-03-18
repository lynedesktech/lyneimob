import { Layers, CheckCircle2, Clock } from "lucide-react"

type Props = {
  totalLotes: number
  lotesDisponiveis: number
  lotesReservados: number
}

export function ResumoLotesPublico({
  totalLotes,
  lotesDisponiveis,
  lotesReservados,
}: Props) {
  const itens = [
    {
      icone: Layers,
      valor: totalLotes,
      label: "Total de lotes",
    },
    {
      icone: CheckCircle2,
      valor: lotesDisponiveis,
      label: "Disponíveis",
    },
    {
      icone: Clock,
      valor: lotesReservados,
      label: "Reservados",
    },
  ]

  return (
    <div className="grid grid-cols-3 gap-3">
      {itens.map((item) => (
        <div
          key={item.label}
          className="flex flex-col items-center rounded-lg border p-4 text-center"
        >
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--site-primaria)]/10">
            <item.icone className="h-5 w-5 text-[var(--site-primaria)]" />
          </div>
          <p className="text-2xl font-bold">{item.valor}</p>
          <p className="text-xs text-muted-foreground">{item.label}</p>
        </div>
      ))}
    </div>
  )
}
