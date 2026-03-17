"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  MoreHorizontal,
  Clock,
  User,
} from "lucide-react"
import { useTiposAtividade } from "@/hooks/use-tipos-atividade"
import { formatarDataHoraCurta } from "@/lib/formatadores"
import { StatusBadge, configStatusAtividade, configPrioridade } from "@/components/ui/status-badge"
import type { AtividadeComRelacoes } from "@/types/database"

interface CardAtividadeProps {
  atividade: AtividadeComRelacoes
}

export function CardAtividade({ atividade }: CardAtividadeProps) {
  const { labelDoTipo } = useTiposAtividade()

  const estaAtrasada =
    atividade.status === "pendente" &&
    new Date(atividade.data_inicio) < new Date()

  return (
    <Link href={`/atividades/${atividade.id}`}>
      <Card className={`transition-shadow hover:shadow-md ${estaAtrasada ? "border-destructive/30" : ""}`}>
        <CardContent className="flex items-center gap-4 p-4">
          {/* Ícone do tipo */}
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
            atividade.status === "concluida"
              ? "bg-success/10 text-success"
              : atividade.status === "cancelada"
                ? "bg-muted text-muted-foreground"
                : estaAtrasada
                  ? "bg-destructive/10 text-destructive"
                  : "bg-primary/10 text-primary"
          }`}>
            <MoreHorizontal className="h-5 w-5" />
          </div>

          {/* Conteúdo */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className={`font-medium truncate ${
                atividade.status === "cancelada" ? "line-through text-muted-foreground" : ""
              }`}>
                {atividade.titulo}
              </p>
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatarDataHoraCurta(atividade.data_inicio)}
              </span>
              {atividade.clientes && (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {atividade.clientes.nome}
                </span>
              )}
            </div>
          </div>

          {/* Badges */}
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="outline" className="text-xs">
              {labelDoTipo(atividade.tipo)}
            </Badge>
            <StatusBadge status={atividade.prioridade} config={configPrioridade} className="text-xs" />
            {atividade.status !== "pendente" && (
              <StatusBadge status={atividade.status} config={configStatusAtividade} className="text-xs" />
            )}
            {estaAtrasada && (
              <Badge variant="destructive" className="text-xs">Atrasada</Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
