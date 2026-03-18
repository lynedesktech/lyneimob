"use client"

import { useOnboarding } from "@/hooks/use-onboarding"
import { useOnborda } from "onborda"
import { useUsuario } from "@/hooks/use-usuario"
import { useRouter } from "next/navigation"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { ITENS_CHECKLIST, ITENS_POR_CARGO } from "@/types/onboarding"
import type { ChaveEtapaOnboarding } from "@/types/onboarding"
import { Check, ArrowRight, Rocket, Settings, Zap } from "lucide-react"

// ============================================================
// Componente do Checklist de Onboarding
// ============================================================

export function ChecklistOnboarding() {
  const { etapas, etapasCompletas, totalEtapas, checklistCompleto, carregando } =
    useOnboarding()
  const { startOnborda } = useOnborda()
  const { usuario } = useUsuario()
  const router = useRouter()

  const cargo = (usuario?.cargo as "admin" | "gerente" | "corretor") ?? "corretor"
  const chavesDoCargoAtual = ITENS_POR_CARGO[cargo] ?? ITENS_POR_CARGO.corretor

  // Filtrar itens do checklist pelo cargo
  const itensVisiveis = ITENS_CHECKLIST.filter((item) =>
    chavesDoCargoAtual.includes(item.chave)
  )

  // Agrupar: config + operacional
  const itensConfig = itensVisiveis.filter((item) => item.grupo === "config")
  const itensOperacional = itensVisiveis.filter((item) => item.grupo === "operacional")

  // Não renderiza se carregando ou se já completou tudo
  if (carregando || checklistCompleto) return null

  const percentual = totalEtapas > 0 ? (etapasCompletas / totalEtapas) * 100 : 0

  function handleFazerAgora(item: typeof ITENS_CHECKLIST[0]) {
    // Navegar para a rota de configurações antes de iniciar tours de config
    if (item.grupo === "config") {
      router.push("/configuracoes")
      // Pequeno delay para o DOM montar
      setTimeout(() => {
        startOnborda(item.tour)
      }, 600)
    } else {
      startOnborda(item.tour)
    }
  }

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

      {/* Grupo: Configurações */}
      {itensConfig.length > 0 && (
        <div className="mt-5">
          <div className="flex items-center gap-2 mb-2">
            <Settings className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Configurações
            </span>
          </div>
          <div className="space-y-1">
            {itensConfig.map((item) => (
              <ItemChecklistRow
                key={item.chave}
                item={item}
                completo={!!etapas[item.chave]}
                onFazerAgora={() => handleFazerAgora(item)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Grupo: Primeiros passos operacionais */}
      {itensOperacional.length > 0 && (
        <div className={itensConfig.length > 0 ? "mt-5" : "mt-4"}>
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Primeiros Cadastros
            </span>
          </div>
          <div className="space-y-1">
            {itensOperacional.map((item) => (
              <ItemChecklistRow
                key={item.chave}
                item={item}
                completo={!!etapas[item.chave]}
                onFazerAgora={() => handleFazerAgora(item)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================
// Linha individual do checklist
// ============================================================

function ItemChecklistRow({
  item,
  completo,
  onFazerAgora,
}: {
  item: typeof ITENS_CHECKLIST[0]
  completo: boolean
  onFazerAgora: () => void
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
        completo ? "opacity-60" : "hover:bg-muted"
      }`}
    >
      {/* Ícone de status */}
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-sm ${
          completo
            ? "border-success bg-success/10 text-success"
            : "border-border bg-background"
        }`}
      >
        {completo ? (
          <Check className="h-3.5 w-3.5" />
        ) : (
          <item.icone className="h-3.5 w-3.5" />
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

      {/* Botão Fazer agora */}
      {!completo && (
        <Button
          variant="ghost"
          size="sm"
          className="shrink-0 text-xs text-primary hover:text-primary"
          onClick={onFazerAgora}
        >
          Fazer agora
          <ArrowRight className="ml-1 h-3 w-3" />
        </Button>
      )}
    </div>
  )
}
