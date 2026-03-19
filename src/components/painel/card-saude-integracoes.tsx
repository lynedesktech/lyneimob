"use client"

import {
  CreditCard,
  Bot,
  MessageCircle,
  Database,
  RefreshCw,
  CheckCircle2,
  XCircle,
  MinusCircle,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useSaudeIntegracoes } from "@/hooks/use-saude-integracoes"
import type { StatusIntegracao } from "@/lib/saude-integracoes"

const integracoes = [
  { chave: "stripe" as const, nome: "Stripe", icone: CreditCard },
  { chave: "openai" as const, nome: "OpenAI", icone: Bot },
  { chave: "uazapi" as const, nome: "WhatsApp / Uazapi", icone: MessageCircle },
  { chave: "redis" as const, nome: "Upstash Redis", icone: Database },
]

const CONFIG_STATUS: Record<
  StatusIntegracao,
  {
    texto: string
    variante: "success" | "destructive" | "secondary"
    icone: typeof CheckCircle2
  }
> = {
  conectado: { texto: "Conectado", variante: "success", icone: CheckCircle2 },
  desconectado: { texto: "Desconectado", variante: "destructive", icone: XCircle },
  nao_configurado: { texto: "Não configurado", variante: "secondary", icone: MinusCircle },
}

export function CardSaudeIntegracoes() {
  const { saude, carregando, verificarAgora } = useSaudeIntegracoes(300000)

  const totalConectadas = saude
    ? integracoes.filter((i) => saude[i.chave].status === "conectado").length
    : 0
  const totalIntegracoes = integracoes.length

  const corResumo =
    !saude ? "bg-muted text-muted-foreground"
    : totalConectadas === totalIntegracoes ? "bg-success/10 text-success"
    : totalConectadas > 0 ? "bg-warning/10 text-warning"
    : "bg-destructive/10 text-destructive"

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-sm font-medium">Saúde das Integrações</CardTitle>
          <CardDescription>
            {saude
              ? `${totalConectadas} de ${totalIntegracoes} conectadas`
              : "Verificando..."}
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${corResumo}`}>
            {saude ? (
              <span className="text-sm font-bold">{totalConectadas}/{totalIntegracoes}</span>
            ) : (
              <RefreshCw className="h-4 w-4 animate-spin" />
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {integracoes.map((integracao) => {
          const item = saude ? saude[integracao.chave] : null
          const config = item ? CONFIG_STATUS[item.status] : null
          const IconeStatus = config?.icone

          return (
            <div
              key={integracao.chave}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <integracao.icone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{integracao.nome}</span>
              </div>
              {carregando && !saude ? (
                <span className="h-2 w-2 animate-pulse rounded-full bg-muted-foreground/40" />
              ) : config && IconeStatus ? (
                <Badge variant={config.variante} className="gap-1 text-[0.6rem]">
                  <IconeStatus className="h-3 w-3" />
                  {config.texto}
                </Badge>
              ) : null}
            </div>
          )
        })}

        {saude?.verificado_em && (
          <p className="pt-1 text-[0.65rem] text-muted-foreground/60">
            Última verificação: {new Date(saude.verificado_em).toLocaleTimeString("pt-BR")}
          </p>
        )}

        <Button
          variant="outline"
          size="sm"
          className="mt-2 w-full"
          onClick={() => verificarAgora()}
          disabled={carregando}
        >
          <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${carregando ? "animate-spin" : ""}`} />
          {carregando ? "Verificando..." : "Verificar agora"}
        </Button>
      </CardContent>
    </Card>
  )
}
