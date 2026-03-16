"use client"

import Link from "next/link"
import { useOnboarding } from "@/hooks/use-onboarding"
import { Progress } from "@/components/ui/progress"
import type { ChaveEtapaOnboarding } from "@/types/onboarding"
import {
  Building2,
  Users,
  Handshake,
  Sparkles,
  Check,
  ArrowRight,
  Rocket,
} from "lucide-react"

// ============================================================
// Itens do checklist
// ============================================================

const itensChecklist: {
  chave: ChaveEtapaOnboarding
  label: string
  descricao: string
  href: string
  icone: React.ReactNode
}[] = [
  {
    chave: "imovel",
    label: "Cadastre seu primeiro imóvel",
    descricao: "Adicione um imóvel com fotos e detalhes",
    href: "/imoveis/novo",
    icone: <Building2 className="h-4 w-4" />,
  },
  {
    chave: "cliente",
    label: "Adicione um cliente",
    descricao: "Registre um comprador ou locatário",
    href: "/clientes/novo",
    icone: <Users className="h-4 w-4" />,
  },
  {
    chave: "negocio",
    label: "Crie um negócio",
    descricao: "Conecte cliente e imóvel no pipeline",
    href: "/negocios/novo",
    icone: <Handshake className="h-4 w-4" />,
  },
  {
    chave: "ia",
    label: "Explore a IA",
    descricao: "Peça uma análise inteligente de um imóvel",
    href: "/imoveis",
    icone: <Sparkles className="h-4 w-4" />,
  },
]

// ============================================================
// Componente
// ============================================================

export function ChecklistOnboarding() {
  const { etapas, etapasCompletas, totalEtapas, checklistCompleto, carregando } =
    useOnboarding()

  // Não renderiza se carregando ou se já completou tudo
  if (carregando || checklistCompleto) return null

  const percentual = (etapasCompletas / totalEtapas) * 100

  return (
    <div className="rounded-xl border bg-card p-5">
      {/* Cabeçalho */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
          <Rocket className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-foreground">
            Primeiros Passos
          </h3>
          <p className="text-xs text-muted-foreground">
            {etapasCompletas} de {totalEtapas} concluídos
          </p>
        </div>
      </div>

      {/* Barra de progresso */}
      <div className="mt-3">
        <Progress value={percentual} />
      </div>

      {/* Lista de itens */}
      <div className="mt-4 space-y-1">
        {itensChecklist.map((item) => {
          const completo = !!etapas[item.chave]

          return (
            <Link
              key={item.chave}
              href={completo ? "#" : item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                completo
                  ? "opacity-60"
                  : "hover:bg-muted"
              }`}
            >
              {/* Ícone de status */}
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${
                  completo
                    ? "border-success bg-success/10 text-success"
                    : "border-border bg-background text-muted-foreground"
                }`}
              >
                {completo ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  item.icone
                )}
              </span>

              {/* Texto */}
              <span className="flex-1 min-w-0">
                <span
                  className={`block text-sm font-medium ${
                    completo ? "line-through text-muted-foreground" : "text-foreground"
                  }`}
                >
                  {item.label}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {item.descricao}
                </span>
              </span>

              {/* Seta */}
              {!completo && (
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
