"use client"

import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Phone, MessageCircle, Clock, Archive, RotateCcw, CheckCircle } from "lucide-react"
import { toast } from "sonner"
import { HistoricoConversa } from "@/components/conversas-whatsapp/historico-conversa"
import { InfoQualificacao } from "@/components/conversas-whatsapp/info-qualificacao"
import { StatusBadge } from "@/components/ui/status-badge"
import { configStatusConversa } from "@/lib/constantes/status-configs"
import { useConversaWhatsapp } from "@/hooks/use-conversa-whatsapp"
import { atualizarStatusConversa } from "@/actions/whatsapp"
import type { StatusConversa } from "@/types/whatsapp"

function formatarNumero(numero: string) {
  const limpo = numero.replace(/\D/g, "")
  if (limpo.length === 13) {
    return `(${limpo.slice(2, 4)}) ${limpo.slice(4, 9)}-${limpo.slice(9)}`
  }
  if (limpo.length === 12) {
    return `(${limpo.slice(2, 4)}) ${limpo.slice(4, 8)}-${limpo.slice(8)}`
  }
  return numero
}

function formatarData(data: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(data))
}

interface ConversaNegocioProps {
  conversaId: string
}

export function ConversaNegocio({ conversaId }: ConversaNegocioProps) {
  const { conversa, mensagens, carregando } = useConversaWhatsapp(conversaId)
  const [atualizando, setAtualizando] = useState(false)
  const queryClient = useQueryClient()

  async function mudarStatus(novoStatus: StatusConversa) {
    setAtualizando(true)
    const resultado = await atualizarStatusConversa(conversaId, novoStatus)
    setAtualizando(false)

    if (resultado.erro) {
      toast.error(resultado.erro)
    } else {
      toast.success(resultado.sucesso)
      queryClient.invalidateQueries({ queryKey: ["conversa-whatsapp", conversaId] })
    }
  }

  if (carregando) {
    return (
      <div className="mt-4 space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-[400px] w-full rounded-lg" />
      </div>
    )
  }

  if (!conversa) {
    return (
      <div className="mt-4 flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
        <MessageCircle className="mb-2 h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Nenhuma conversa WhatsApp vinculada a este negócio.</p>
      </div>
    )
  }

  return (
    <div className="mt-4 space-y-4">
      {/* Info do contato + ações */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold">
              {conversa.nome_cliente || "Sem nome"}
            </h2>
            <StatusBadge status={conversa.status} config={configStatusConversa} />
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Phone className="h-3.5 w-3.5" />
              {formatarNumero(conversa.numero_cliente)}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="h-3.5 w-3.5" />
              {mensagens.length} mensagem{mensagens.length !== 1 ? "ns" : ""}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              Última: {formatarData(conversa.ultima_mensagem_em)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {conversa.status !== "arquivado" && conversa.status !== "finalizado" && (
            <Button
              variant="outline"
              size="sm"
              disabled={atualizando}
              onClick={() => mudarStatus("finalizado")}
            >
              <CheckCircle className="mr-1.5 h-4 w-4" />
              Finalizar
            </Button>
          )}
          {conversa.status !== "arquivado" && (
            <Button
              variant="outline"
              size="sm"
              disabled={atualizando}
              onClick={() => mudarStatus("arquivado")}
            >
              <Archive className="mr-1.5 h-4 w-4" />
              Arquivar
            </Button>
          )}
          {(conversa.status === "arquivado" || conversa.status === "finalizado") && (
            <Button
              variant="outline"
              size="sm"
              disabled={atualizando}
              onClick={() => mudarStatus("em_andamento")}
            >
              <RotateCcw className="mr-1.5 h-4 w-4" />
              Reabrir
            </Button>
          )}
        </div>
      </div>

      {/* Histórico + qualificação */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Histórico da Conversa</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-[500px] overflow-y-auto pr-2">
                <HistoricoConversa mensagens={mensagens} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <InfoQualificacao conversa={conversa} />
        </div>
      </div>
    </div>
  )
}
