"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, ArrowRight } from "lucide-react"

type CicloCobranca = "mensal" | "trimestral" | "anual"

const ciclos: { id: CicloCobranca; label: string; badge?: string }[] = [
  { id: "mensal", label: "Mensal" },
  { id: "trimestral", label: "Trimestral" },
  { id: "anual", label: "Anual", badge: "-20%" },
]

const descontos: Record<CicloCobranca, number> = {
  mensal: 0,
  trimestral: 0.1,
  anual: 0.2,
}

const planos = [
  {
    id: "crm_ia" as const,
    nome: "Profissional",
    descricao: "Gestão completa com IA integrada em todos os módulos",
    precoMensal: 199,
    destaque: false,
    funcionalidades: [
      "Gestão completa (imóveis, clientes, negócios, atividades)",
      "IA em todos os módulos",
      "Site público personalizado",
      "Integração com portais",
      "Até 5 corretores",
      "Até 300 imóveis",
      "Até 200 conversas IA/mês",
    ],
  },
  {
    id: "crm_ia_sdr" as const,
    nome: "Completo",
    descricao: "Tudo incluído + Agente SDR WhatsApp com IA",
    precoMensal: 399,
    destaque: true,
    funcionalidades: [
      "Tudo do plano Profissional",
      "Agente SDR WhatsApp com IA",
      "Qualificação automática de leads",
      "Atendimento 24/7 por WhatsApp",
      "Até 15 corretores",
      "Até 1.000 imóveis",
      "Até 1.000 conversas IA/mês",
    ],
  },
]

function calcularPreco(precoMensal: number, ciclo: CicloCobranca) {
  const desconto = descontos[ciclo]
  const precoComDesconto = Math.round(precoMensal * (1 - desconto))
  return precoComDesconto
}

function formatarPreco(valor: number) {
  return valor.toLocaleString("pt-BR")
}

export function SecaoPrecos() {
  const [ciclo, setCiclo] = useState<CicloCobranca>("mensal")

  return (
    <section id="precos" className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header da seção */}
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold tracking-widest text-accent-blue uppercase">
            Preços
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Planos que cabem no seu bolso
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Comece grátis por 14 dias. Sem cartão de crédito. Escolha o plano
            ideal quando estiver pronto.
          </p>
        </div>

        {/* Toggle de ciclo */}
        <div className="mt-10 flex justify-center">
          <div className="inline-flex items-center gap-1 rounded-xl border border-border bg-muted/50 p-1">
            {ciclos.map((c) => (
              <button
                key={c.id}
                onClick={() => setCiclo(c.id)}
                className={`relative rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  ciclo === c.id
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {c.label}
                {c.badge && (
                  <span className="ml-1.5 inline-flex items-center rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                    {c.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Cards de planos */}
        <div className="mx-auto mt-12 grid max-w-5xl gap-8 lg:grid-cols-2">
          {planos.map((plano) => {
            const precoFinal = calcularPreco(plano.precoMensal, ciclo)

            return (
              <div
                key={plano.id}
                className={`relative flex flex-col rounded-2xl border p-8 transition-all duration-300 ${
                  plano.destaque
                    ? "border-accent-blue/50 bg-card shadow-xl shadow-accent-blue/10"
                    : "border-border bg-card hover:border-accent-blue/30 hover:shadow-lg"
                }`}
              >
                {/* Badge mais popular */}
                {plano.destaque && (
                  <div className="absolute -top-3 right-6">
                    <Badge className="bg-accent-blue px-3 py-1 text-xs font-semibold text-white">
                      Mais popular
                    </Badge>
                  </div>
                )}

                {/* Nome e descrição */}
                <div>
                  <h3 className="text-xl font-bold text-foreground">
                    {plano.nome}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {plano.descricao}
                  </p>
                </div>

                {/* Preço */}
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-sm text-muted-foreground">R$</span>
                  <span className="text-5xl font-extrabold tracking-tight text-foreground">
                    {formatarPreco(precoFinal)}
                  </span>
                  <span className="text-sm text-muted-foreground">/mês</span>
                </div>

                {ciclo !== "mensal" && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    <span className="line-through">
                      R$ {formatarPreco(plano.precoMensal)}
                    </span>
                    <span className="ml-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                      Economize {descontos[ciclo] * 100}%
                    </span>
                  </p>
                )}

                {/* CTA */}
                <Link href="/cadastro" className="mt-6 block">
                  <Button
                    size="lg"
                    className={`h-12 w-full gap-2 rounded-xl text-base font-semibold ${
                      plano.destaque
                        ? "bg-gradient-to-r from-grad-start to-grad-mid text-white shadow-lg hover:opacity-90 dark:from-white dark:to-white dark:text-grad-mid dark:hover:opacity-90"
                        : ""
                    }`}
                    variant={plano.destaque ? "default" : "outline"}
                  >
                    Comece grátis por 14 dias
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>

                {/* Separador */}
                <div className="my-6 h-px bg-border" />

                {/* Funcionalidades */}
                <ul className="flex-1 space-y-3">
                  {plano.funcionalidades.map((feat) => (
                    <li key={feat} className="flex items-start gap-3">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      <span className="text-sm text-muted-foreground">
                        {feat}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>

        {/* Texto final */}
        <p className="mt-10 text-center text-sm text-muted-foreground">
          Todos os planos incluem <strong>14 dias grátis</strong>. Sem cartão de
          crédito. Sem compromisso.
        </p>
      </div>
    </section>
  )
}
