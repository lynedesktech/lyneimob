import Link from "next/link"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { StatusBadgeCliente } from "./status-badge-cliente"
import { ScoreBadge } from "./score-badge"
import { Phone, Mail, User } from "lucide-react"
import type { Cliente } from "@/types/database"

const labelsTipo: Record<string, string> = {
  comprador: "Comprador",
  vendedor: "Vendedor",
  locatario: "Locatário",
  proprietario: "Proprietário",
}

const labelsOrigem: Record<string, string> = {
  indicacao: "Indicação",
  portal: "Portal",
  site: "Site",
  whatsapp: "WhatsApp",
  outro: "Outro",
}

export function CardCliente({ cliente }: { cliente: Cliente }) {
  return (
    <Link href={`/clientes/${cliente.id}`}>
      <Card className="transition-shadow hover:shadow-md">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                <User className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="line-clamp-1 text-base">
                  {cliente.nome}
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {labelsTipo[cliente.tipo] ?? cliente.tipo} • {labelsOrigem[cliente.origem] ?? cliente.origem}
                </p>
              </div>
            </div>
            <StatusBadgeCliente status={cliente.status} />
          </div>
        </CardHeader>

        <CardContent className="space-y-2">
          {cliente.telefone && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Phone className="h-3.5 w-3.5" />
              <span>{cliente.telefone}</span>
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
