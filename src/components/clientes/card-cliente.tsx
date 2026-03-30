import Link from "next/link"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"
import { configStatusCliente } from "@/lib/constantes/status-configs"
import { ScoreBadge } from "./score-badge"
import { formatarTelefone } from "@/lib/formatadores"
import { Phone, Mail, User } from "lucide-react"
import { labelsTipoCliente, labelsOrigem } from "@/lib/constantes"
import type { Cliente } from "@/types/database"

export function CardCliente({ cliente }: { cliente: Cliente }) {
  return (
    <Link href={`/clientes/${cliente.id}`}>
      <Card className="transition-shadow hover:shadow-md">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <User className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="line-clamp-1 text-base">
                  {cliente.nome}
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {labelsTipoCliente[cliente.tipo] ?? cliente.tipo} • {labelsOrigem[cliente.origem] ?? cliente.origem}
                </p>
              </div>
            </div>
            <StatusBadge status={cliente.status} config={configStatusCliente} />
          </div>
        </CardHeader>

        <CardContent className="space-y-2">
          {cliente.telefone && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Phone className="h-3.5 w-3.5" />
              <span>{formatarTelefone(cliente.telefone)}</span>
            </div>
          )}

          {cliente.email && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Mail className="h-3.5 w-3.5" />
              <span className="line-clamp-1">{cliente.email}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-muted-foreground">
              {new Date(cliente.created_at).toLocaleDateString("pt-BR")}
            </span>
            {cliente.score_lead > 0 && (
              <ScoreBadge score={cliente.score_lead} />
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
