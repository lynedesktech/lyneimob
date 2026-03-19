"use client"

import Link from "next/link"
import {
  CreditCard,
  Bot,
  MessageCircle,
  Database,
  BrainCircuit,
  ChevronRight,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useSaudeIntegracoes } from "@/hooks/use-saude-integracoes"
import type { StatusIntegracao } from "@/lib/saude-integracoes"

const cardsPlataforma = [
  {
    titulo: "Stripe",
    descricao: "Cobranca recorrente, checkout e portal do cliente",
    href: "/admin/configuracoes/stripe",
    icone: CreditCard,
    chaveSaude: "stripe" as const,
  },
  {
    titulo: "OpenAI",
    descricao: "IA usada em analise de imoveis, clientes e negocios",
    href: "/admin/configuracoes/openai",
    icone: Bot,
    chaveSaude: "openai" as const,
  },
  {
    titulo: "WhatsApp / Uazapi",
    descricao: "Credenciais do servidor Uazapi para o agente SDR",
    href: "/admin/configuracoes/uazapi",
    icone: MessageCircle,
    chaveSaude: "uazapi" as const,
  },
  {
    titulo: "Upstash Redis",
    descricao: "Cache e memoria de conversa do agente",
    href: "/admin/configuracoes/redis",
    icone: Database,
    chaveSaude: "redis" as const,
  },
  {
    titulo: "Memoria do Agente",
    descricao: "Reseta o contexto de conversa de todos os atendimentos",
    href: "/admin/configuracoes/memoria",
    icone: BrainCircuit,
    chaveSaude: null,
  },
]

const LABELS_STATUS: Record<StatusIntegracao, { texto: string; variante: "success" | "destructive" | "secondary" }> = {
  conectado: { texto: "Conectado", variante: "success" },
  desconectado: { texto: "Desconectado", variante: "destructive" },
  nao_configurado: { texto: "Não configurado", variante: "secondary" },
}

export function CardsPlataforma({ esconderStripe = false }: { esconderStripe?: boolean } = {}) {
  const { saude, carregando } = useSaudeIntegracoes(60000)

  const cardsFiltrados = esconderStripe
    ? cardsPlataforma.filter((c) => c.chaveSaude !== "stripe")
    : cardsPlataforma

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cardsFiltrados.map((card) => {
        const statusItem = card.chaveSaude && saude ? saude[card.chaveSaude] : null
        const label = statusItem ? LABELS_STATUS[statusItem.status] : null

        return (
          <Link key={card.href} href={card.href} className="group">
            <Card className="h-full transition-colors hover:bg-accent/50">
              <CardContent className="flex items-start gap-4 p-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <card.icone className="h-5 w-5" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium leading-tight">{card.titulo}</h3>
                    {card.chaveSaude && carregando && (
                      <span className="h-2 w-2 animate-pulse rounded-full bg-muted-foreground/40" />
                    )}
                    {label && (
                      <Badge variant={label.variante} className="text-[0.6rem]">
                        {label.texto}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{card.descricao}</p>
                  {statusItem?.mensagem && statusItem.status === "desconectado" && (
                    <p className="text-xs text-destructive">{statusItem.mensagem}</p>
                  )}
                </div>
                <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}
