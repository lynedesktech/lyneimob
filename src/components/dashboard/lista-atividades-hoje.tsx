import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { CalendarX } from "lucide-react"

export type AtividadeHojeItem = {
  id: string
  titulo: string
  tipo: string
  data_inicio: string
  cliente_nome: string | null
}

function formatarTipo(tipo: string): string {
  const mapa: Record<string, string> = {
    ligacao: "Ligação",
    email: "Email",
    visita: "Visita",
    reuniao: "Reunião",
    follow_up: "Follow-up",
    proposta: "Proposta",
    outro: "Outro",
  }
  return mapa[tipo] ?? tipo.charAt(0).toUpperCase() + tipo.slice(1).replace(/_/g, " ")
}

interface ListaAtividadesHojeProps {
  atividades: AtividadeHojeItem[]
}

export function ListaAtividadesHoje({ atividades }: ListaAtividadesHojeProps) {
  if (atividades.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
        <CalendarX className="h-8 w-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">Nenhuma atividade para hoje</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {atividades.map((atividade) => {
        const hora = new Date(atividade.data_inicio).toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        })

        return (
          <Link
            key={atividade.id}
            href={`/atividades/${atividade.id}`}
            className="flex items-center gap-3 rounded-lg border border-border p-3 text-sm transition-colors hover:bg-muted/50"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-foreground">{atividade.titulo}</p>
              {atividade.cliente_nome && (
                <p className="truncate text-xs text-muted-foreground">{atividade.cliente_nome}</p>
              )}
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <Badge variant="secondary" className="text-xs">
                {formatarTipo(atividade.tipo)}
              </Badge>
              <span className="text-xs text-muted-foreground">{hora}</span>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
