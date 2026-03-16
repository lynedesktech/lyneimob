"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { MessageCircle, Phone, Clock, User, Briefcase } from "lucide-react"
import { StatusBadge, configStatusConversa } from "@/components/ui/status-badge"
import type { ConversaComRelacoes } from "@/types/whatsapp"

interface CardConversaProps {
  conversa: ConversaComRelacoes
}

const coresIcone: Record<string, string> = {
  em_andamento: "bg-info/10 text-info",
  qualificado: "bg-warning/10 text-warning",
  encaminhado: "bg-success/10 text-success",
  finalizado: "bg-muted text-muted-foreground",
  arquivado: "bg-muted text-muted-foreground/60",
}

function formatarTempoRelativo(data: string) {
  const agora = new Date()
  const dataMsg = new Date(data)
  const diffMs = agora.getTime() - dataMsg.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHoras = Math.floor(diffMs / 3600000)
  const diffDias = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return "agora"
  if (diffMin < 60) return `${diffMin}min`
  if (diffHoras < 24) return `${diffHoras}h`
  if (diffDias < 7) return `${diffDias}d`
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  }).format(dataMsg)
}

function formatarNumero(numero: string) {
  // Formatar 5511999999999 para (11) 99999-9999
  const limpo = numero.replace(/\D/g, "")
  if (limpo.length === 13) {
    return `(${limpo.slice(2, 4)}) ${limpo.slice(4, 9)}-${limpo.slice(9)}`
  }
  if (limpo.length === 12) {
    return `(${limpo.slice(2, 4)}) ${limpo.slice(4, 8)}-${limpo.slice(8)}`
  }
  return numero
}

export function CardConversa({ conversa }: CardConversaProps) {
  return (
    <Link href={`/conversas/${conversa.id}`}>
      <Card className="transition-shadow hover:shadow-md">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {/* Ícone com cor do status */}
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${coresIcone[conversa.status]}`}>
              <MessageCircle className="h-5 w-5" />
            </div>

            {/* Conteúdo */}
            <div className="flex-1 min-w-0 space-y-2">
              {/* Nome e badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium truncate">
                  {conversa.nome_cliente || "Sem nome"}
                </p>
                <StatusBadge status={conversa.status} config={configStatusConversa} className="text-xs" />
              </div>

              {/* Contato e tempo */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {formatarNumero(conversa.numero_cliente)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatarTempoRelativo(conversa.ultima_mensagem_em)}
                </span>
              </div>

              {/* Resumo IA */}
              {conversa.resumo_ia && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {conversa.resumo_ia}
                </p>
              )}

              {/* Vinculações */}
              <div className="flex items-center gap-3 text-xs flex-wrap">
                {conversa.clientes && (
                  <span className="flex items-center gap-1 text-primary">
                    <User className="h-3 w-3" />
                    {conversa.clientes.nome}
                  </span>
                )}
                {conversa.negocios && (
                  <span className="flex items-center gap-1 text-primary">
                    <Briefcase className="h-3 w-3" />
                    {conversa.negocios.titulo}
                  </span>
                )}
                {conversa.usuarios && (
                  <span className="text-muted-foreground">
                    Corretor: {conversa.usuarios.nome}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
