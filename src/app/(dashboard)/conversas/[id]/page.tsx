"use client"

import { use, useState } from "react"
import Link from "next/link"
import { useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, Phone, MessageCircle, Clock, Archive, RotateCcw, CheckCircle } from "lucide-react"
import { toast } from "sonner"
import { HistoricoConversa } from "@/components/conversas-whatsapp/historico-conversa"
import { InfoQualificacao } from "@/components/conversas-whatsapp/info-qualificacao"
import { StatusBadge, configStatusConversa } from "@/components/ui/status-badge"
import { useConversaWhatsapp } from "@/hooks/use-conversa-whatsapp"
import { atualizarStatusConversa } from "@/actions/whatsapp"
import type { StatusConversa } from "@/types/whatsapp"

interface Props {
  params: Promise<{ id: string }>
}

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

export default function DetalheConversaPage({ params }: Props) {
  const { id } = use(params)
  const { conversa, mensagens, carregando } = useConversaWhatsapp(id)
  const [atualizando, setAtualizando] = useState(false)
  const queryClient = useQueryClient()

  async function mudarStatus(novoStatus: StatusConversa) {
    setAtualizando(true)
    const resultado = await atualizarStatusConversa(id, novoStatus)
    setAtualizando(false)

    if (resultado.erro) {
      toast.error(resultado.erro)
    } else {
      toast.success(resultado.sucesso)
      queryClient.invalidateQueries({ queryKey: ["conversa-whatsapp", id] })
    }
  }

  if (carregando) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[600px] w-full rounded-lg" />
      </div>
    )
  }

  if (!conversa) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">Conversa não encontrada.</p>
        <Button variant="outline" className="mt-4" render={<Link href="/conversas" />}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para conversas
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" render={<Link href="/conversas" />}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">
                {conversa.nome_cliente || "Sem nome"}
              </h1>
              <StatusBadge status={conversa.status} config={configStatusConversa} />
            </div>
            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
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
        </div>

        {/* Botões de ação */}
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

      {/* Conteúdo */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Histórico de conversa */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Histórico da Conversa</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-[600px] overflow-y-auto pr-2">
                <HistoricoConversa mensagens={mensagens} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Painel lateral */}
        <div className="lg:col-span-1">
          <InfoQualificacao conversa={conversa} />
        </div>
      </div>
    </div>
  )
}
