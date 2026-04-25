"use client"

import { useState, useCallback } from "react"
import { usePathname } from "next/navigation"
import { Bot, X, Loader2, Sparkles, Check, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "sonner"
import { useContextoIA } from "./contexto-ia"
import { obterAcoesVisiveis, type AcaoIA } from "./acoes-ia"
import { executarAcaoIA } from "./executar-acoes"

// ============================================================
// Rotas onde o widget NÃO aparece de jeito nenhum
// ============================================================

const ROTAS_OCULTAS = ["/admin"]

function deveOcultarWidget(pathname: string): boolean {
  return ROTAS_OCULTAS.some((rota) => pathname.startsWith(rota))
}

// ============================================================
// Labels do módulo pro header do painel
// ============================================================

const LABELS_MODULO: Record<string, string> = {
  imovel: "Imóvel",
  cliente: "Cliente",
  negocio: "Negócio",
  atividade: "Atividade",
  loteamento: "Loteamento",
  painel: "Dashboard",
}

// Ações cujo resultado pode ser aplicado em um campo do formulário
const ACAO_PARA_CAMPO: Record<string, "descricao" | "titulo"> = {
  "gerar-descricao": "descricao",
  "melhorar-texto": "descricao",
  "gerar-titulo": "titulo",
  "gerar-descricao-loteamento": "descricao",
  "melhorar-texto-loteamento": "descricao",
}

type AplicarNoFormulario = (campo: "descricao" | "titulo", texto: string) => void

// ============================================================
// Widget IA
// ============================================================

export function WidgetIA() {
  const pathname = usePathname()
  const { entidade } = useContextoIA()
  const [aberto, setAberto] = useState(false)
  const [acaoAtiva, setAcaoAtiva] = useState<string | null>(null)
  const [resultado, setResultado] = useState<string | null>(null)
  const [executando, setExecutando] = useState(false)

  // Não renderizar em rotas ocultas
  if (deveOcultarWidget(pathname)) return null

  // Determinar ações disponíveis
  const acoes = entidade
    ? obterAcoesVisiveis(entidade.modulo, entidade.dados)
    : []

  const temAcoes = acoes.length > 0
  const desabilitado = !temAcoes

  const copiarParaClipboard = useCallback(async (texto: string) => {
    try {
      await navigator.clipboard.writeText(texto)
      toast.success("Copiado!")
    } catch {
      toast.error("Não foi possível copiar")
    }
  }, [])

  const aplicarNoFormulario = useCallback(
    (campo: "descricao" | "titulo", texto: string) => {
      const onAplicar = entidade?.dados?.onAplicar as AplicarNoFormulario | undefined
      if (!onAplicar) {
        toast.info("Abra a página de edição para aplicar no formulário")
        return
      }
      const valorAtual = String((entidade?.dados?.[campo] as string | undefined) ?? "").trim()
      const label = campo === "titulo" ? "título" : "descrição"
      if (valorAtual && !window.confirm(`Substituir ${label} atual?`)) return
      onAplicar(campo, texto)
      toast.success(`${campo === "titulo" ? "Título aplicado" : "Descrição aplicada"} no formulário`)
      setAberto(false)
    },
    [entidade]
  )

  const handleExecutarAcao = useCallback(
    async (acao: AcaoIA) => {
      if (!entidade) return

      setAcaoAtiva(acao.id)
      setResultado(null)
      setExecutando(true)

      try {
        const res = await executarAcaoIA(acao.id, entidade.entidadeId, entidade.dados)

        if (res.erro) {
          toast.error(res.erro)
          setResultado(null)
        } else {
          if (res.sucesso) toast.success(res.sucesso)
          setResultado(res.texto ?? res.resumo ?? (res.dados ? JSON.stringify(res.dados, null, 2) : null))

          // Notificar a página para atualizar dados se necessário
          if (entidade.dados.onAtualizar && typeof entidade.dados.onAtualizar === "function") {
            ;(entidade.dados.onAtualizar as (acaoId: string, resultado: Record<string, unknown>) => void)(acao.id, res)
          }
        }
      } catch {
        toast.error("Erro ao executar ação de IA")
      } finally {
        setExecutando(false)
      }
    },
    [entidade]
  )

  return (
    <>
      {/* Botão flutuante */}
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              data-testid="widget-ia-botao"
              size="icon"
              aria-label="Assistente IA"
              className={`fixed bottom-6 right-6 z-40 h-12 w-12 rounded-full shadow-lg transition-all hover:scale-105 ${
                desabilitado
                  ? "bg-muted text-muted-foreground hover:bg-muted"
                  : "bg-gradient-to-br from-[var(--grad-start)] to-[var(--grad-end)] text-white hover:opacity-90 dark:from-[var(--accent-blue)] dark:to-[var(--grad-start)]"
              }`}
              onClick={() => {
                if (desabilitado) {
                  toast.info("Abra um registro para usar a IA", {
                    description: "Navegue até o detalhe de um imóvel, cliente, negócio ou atividade",
                  })
                  return
                }
                setAberto(true)
              }}
            />
          }
        >
          <Bot className="h-5 w-5" />
          {temAcoes && (
            <span data-testid="widget-ia-badge" className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent-blue text-[10px] font-bold text-white">
              {acoes.length}
            </span>
          )}
        </TooltipTrigger>
        <TooltipContent side="left">
          {desabilitado
            ? "Abra um registro para usar a IA"
            : acoes.length === 1
              ? "1 ação de IA disponível"
              : `${acoes.length} ações de IA disponíveis`}
        </TooltipContent>
      </Tooltip>

      {/* Painel lateral */}
      <Sheet open={aberto} onOpenChange={setAberto}>
        <SheetContent
          side="right"
          className="flex w-full flex-col sm:w-[400px] sm:max-w-[400px]"
          data-testid="widget-ia-painel"
        >
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Assistente IA
              {entidade && (
                <span className="text-xs font-normal text-muted-foreground">
                  — {LABELS_MODULO[entidade.modulo] ?? entidade.modulo}
                </span>
              )}
            </SheetTitle>
            <SheetDescription>
              Funcionalidades de inteligência artificial para esta página
            </SheetDescription>
          </SheetHeader>

          <Separator />

          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-3 py-4">
              {/* Lista de ações */}
              {acoes.map((acao) => {
                const Icone = acao.icone
                const estaExecutando = executando && acaoAtiva === acao.id
                const estaAtiva = acaoAtiva === acao.id

                return (
                  <div key={acao.id}>
                    <button
                      onClick={() => handleExecutarAcao(acao)}
                      disabled={executando}
                      className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-accent disabled:opacity-50 ${
                        estaAtiva ? "border-primary bg-primary/5" : "border-border"
                      }`}
                    >
                      <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${
                        estaAtiva ? "bg-primary/10" : "bg-muted"
                      }`}>
                        {estaExecutando ? (
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        ) : (
                          <Icone className={`h-4 w-4 ${estaAtiva ? "text-primary" : "text-muted-foreground"}`} />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{acao.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {acao.descricao}
                        </p>
                      </div>
                    </button>

                    {/* Resultado inline */}
                    {estaAtiva && resultado && !executando && (
                      <div className="mt-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-medium text-primary">Resultado</p>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => {
                              setAcaoAtiva(null)
                              setResultado(null)
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="whitespace-pre-wrap text-xs leading-relaxed text-foreground">
                          {resultado}
                        </div>
                        <div className="mt-3 flex gap-2">
                          {ACAO_PARA_CAMPO[acao.id] && (
                            <Button
                              size="sm"
                              className="flex-1"
                              onClick={() => aplicarNoFormulario(ACAO_PARA_CAMPO[acao.id]!, resultado)}
                            >
                              <Check className="mr-1 h-3 w-3" />
                              Usar {ACAO_PARA_CAMPO[acao.id] === "titulo" ? "este título" : "esta descrição"}
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className={ACAO_PARA_CAMPO[acao.id] ? "" : "flex-1"}
                            onClick={() => copiarParaClipboard(resultado)}
                          >
                            <Copy className="mr-1 h-3 w-3" />
                            Copiar
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}

              {acoes.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Bot className="mb-2 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Nenhuma ação de IA disponível para esta página
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  )
}
