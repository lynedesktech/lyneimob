"use client"

import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { PlanoConfig, TipoPlano } from "@/types/billing"
import { formatarPreco } from "@/types/billing"

interface CardPlanoProps {
  config: PlanoConfig
  planoAtual: TipoPlano
  carregando?: boolean
  onAssinar: (plano: TipoPlano) => void
}

export function CardPlano({
  config,
  planoAtual,
  carregando,
  onAssinar,
}: CardPlanoProps) {
  const ehAtual = config.id === planoAtual
  const ehTrial = config.id === "trial"
  const ehDestaque = config.id === "crm_ia_sdr"

  // Determinar texto do botão
  let textoBotao = "Assinar"
  if (ehAtual) textoBotao = "Plano atual"
  else if (ehTrial) textoBotao = "—"

  // Determinar se pode clicar
  const desabilitado = ehAtual || ehTrial || carregando

  return (
    <Card
      className={cn(
        "relative flex flex-col",
        ehDestaque && "border-primary shadow-lg",
        ehAtual && "border-primary/50 bg-primary/5"
      )}
    >
      {ehDestaque && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground px-3 py-1 text-xs">
            Mais popular
          </Badge>
        </div>
      )}

      <CardHeader className="text-center pb-2">
        <CardTitle className="text-xl">{config.nome}</CardTitle>
        <CardDescription className="text-sm">
          {config.descricao}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1">
        {/* Preço */}
        <div className="text-center mb-6">
          {ehTrial ? (
            <div>
              <span className="text-4xl font-bold">Grátis</span>
              <p className="text-sm text-muted-foreground mt-1">
                14 dias para testar
              </p>
            </div>
          ) : (
            <div>
              <span className="text-4xl font-bold">
                {formatarPreco(config.preco_mensal)}
              </span>
              <span className="text-muted-foreground">/mês</span>
            </div>
          )}
        </div>

        {/* Funcionalidades */}
        <ul className="space-y-2.5">
          {config.funcionalidades.map((func, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <span>{func}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter>
        {!ehTrial && (
          <Button
            className="w-full"
            variant={ehDestaque ? "default" : "outline"}
            disabled={desabilitado}
            onClick={() => onAssinar(config.id)}
          >
            {carregando ? "Aguarde..." : textoBotao}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
