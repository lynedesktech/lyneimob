"use client"

import { useState, useMemo, useEffect } from "react"
import { useOnboarding } from "@/hooks/use-onboarding"
import { useOnborda } from "onborda"
import { useUsuario } from "@/hooks/use-usuario"
import { useRouter } from "next/navigation"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { ITENS_CHECKLIST, ITENS_POR_CARGO } from "@/types/onboarding"
import type { ChaveEtapaOnboarding } from "@/types/onboarding"
import { Check, ArrowRight, Rocket, Settings, Zap, ChevronLeft, ChevronRight } from "lucide-react"

const ITENS_POR_PAGINA = 3

// ============================================================
// Componente do Checklist de Onboarding
// ============================================================

export function ChecklistOnboarding() {
  const { etapas, etapasCompletas, totalEtapas, checklistCompleto, carregando } =
    useOnboarding()
  const { startOnborda } = useOnborda()
  const { usuario } = useUsuario()
  const router = useRouter()

  // Super admin não faz onboarding
  if (usuario?.super_admin) return null

  const cargo = (usuario?.cargo as "admin" | "gerente" | "corretor") ?? "corretor"
  const chavesDoCargoAtual = ITENS_POR_CARGO[cargo] ?? ITENS_POR_CARGO.corretor

  // Filtrar itens do checklist pelo cargo (config primeiro, operacional depois)
  const todosItens = useMemo(() => {
    const visiveis = ITENS_CHECKLIST.filter((item) =>
      chavesDoCargoAtual.includes(item.chave)
    )
    return [
      ...visiveis.filter((i) => i.grupo === "config"),
      ...visiveis.filter((i) => i.grupo === "operacional"),
    ]
  }, [chavesDoCargoAtual])

  const totalPaginas = Math.ceil(todosItens.length / ITENS_POR_PAGINA)

  // Encontrar primeira página com itens pendentes
  const paginaInicialComPendente = useMemo(() => {
    for (let p = 0; p < totalPaginas; p++) {
      const itensPagina = todosItens.slice(p * ITENS_POR_PAGINA, (p + 1) * ITENS_POR_PAGINA)
      if (itensPagina.some((item) => !etapas[item.chave])) return p
    }
    return 0
  }, [todosItens, etapas, totalPaginas])

  const [paginaAtual, setPaginaAtual] = useState(paginaInicialComPendente)

  // Atualizar página quando etapas mudam (pular para próxima com pendentes)
  useEffect(() => {
    setPaginaAtual(paginaInicialComPendente)
  }, [paginaInicialComPendente])

  // Não renderiza se carregando ou se já completou tudo
  if (carregando || checklistCompleto) return null

  const percentual = totalEtapas > 0 ? (etapasCompletas / totalEtapas) * 100 : 0

  // Itens da página atual
  const itensPaginaAtual = todosItens.slice(
    paginaAtual * ITENS_POR_PAGINA,
    (paginaAtual + 1) * ITENS_POR_PAGINA
  )

  // Verificar se precisa exibir label de grupo
  const gruposNaPagina = new Set(itensPaginaAtual.map((i) => i.grupo))

  function handleFazerAgora(item: typeof ITENS_CHECKLIST[0]) {
    if (item.grupo === "config") {
      router.push("/configuracoes")
      setTimeout(() => {
        startOnborda(item.tour)
      }, 600)
    } else {
      startOnborda(item.tour)
    }
  }

  // Agrupar itens da página por grupo para renderizar com labels
  const gruposRenderizar: { grupo: "config" | "operacional"; itens: typeof ITENS_CHECKLIST }[] = []
  for (const item of itensPaginaAtual) {
    const ultimo = gruposRenderizar[gruposRenderizar.length - 1]
    if (ultimo && ultimo.grupo === item.grupo) {
      ultimo.itens.push(item)
    } else {
      gruposRenderizar.push({ grupo: item.grupo, itens: [item] })
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

      {/* Itens da página atual — agrupados por label */}
      <div className="mt-5">
        {gruposRenderizar.map((bloco) => (
          <div key={bloco.grupo} className="mb-1">
            <div className="flex items-center gap-2 mb-2">
              {bloco.grupo === "config" ? (
                <Settings className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <Zap className="h-3.5 w-3.5 text-muted-foreground" />
              )}
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {bloco.grupo === "config" ? "Configurações" : "Primeiros Cadastros"}
              </span>
            </div>
            <div className="space-y-1">
              {bloco.itens.map((item) => (
                <ItemChecklistRow
                  key={item.chave}
                  item={item}
                  completo={!!etapas[item.chave]}
                  onFazerAgora={() => handleFazerAgora(item)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Navegação entre páginas */}
      {totalPaginas > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-muted-foreground"
            disabled={paginaAtual === 0}
            onClick={() => setPaginaAtual((p) => p - 1)}
          >
            <ChevronLeft className="mr-1 h-3.5 w-3.5" />
            Anterior
          </Button>

          {/* Indicadores (bolinhas) */}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalPaginas }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPaginaAtual(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === paginaAtual
                    ? "w-4 bg-primary"
                    : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                }`}
              />
            ))}
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-muted-foreground"
            disabled={paginaAtual === totalPaginas - 1}
            onClick={() => setPaginaAtual((p) => p + 1)}
          >
            Próximo
            <ChevronRight className="ml-1 h-3.5 w-3.5" />
          </Button>
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
