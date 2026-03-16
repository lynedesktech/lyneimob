"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  StatusBadge,
  configStatusImovel,
  configStatusCliente,
  configStatusNegocio,
  configStatusAtividade,
} from "@/components/ui/status-badge"
import { useBuscaGlobal } from "@/hooks/use-busca-global"
import { formatarPreco, formatarDataCurta } from "@/lib/formatadores"
import { labelsTipoImovel } from "@/lib/constantes/imoveis"
import {
  Search,
  Building2,
  Users,
  Handshake,
  CalendarCheck,
  Plus,
  LayoutDashboard,
  ArrowRight,
  Loader2,
} from "lucide-react"

// ============================================================
// Context para compartilhar estado aberto/fechado
// ============================================================

type ContextoBuscaGlobal = {
  aberta: boolean
  abrir: () => void
  fechar: () => void
}

const BuscaGlobalContext = React.createContext<ContextoBuscaGlobal>({
  aberta: false,
  abrir: () => {},
  fechar: () => {},
})

function useBuscaGlobalContext() {
  return React.useContext(BuscaGlobalContext)
}

// ============================================================
// Provider
// ============================================================

export function ProvedorBuscaGlobal({ children }: { children: React.ReactNode }) {
  const [aberta, setAberta] = React.useState(false)

  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setAberta((prev) => !prev)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const valor = React.useMemo(
    () => ({
      aberta,
      abrir: () => setAberta(true),
      fechar: () => setAberta(false),
    }),
    [aberta]
  )

  return (
    <BuscaGlobalContext.Provider value={valor}>
      {children}
    </BuscaGlobalContext.Provider>
  )
}

// ============================================================
// Trigger (botão que fica no header)
// ============================================================

export function GatilhoBuscaGlobal() {
  const { abrir } = useBuscaGlobalContext()

  return (
    <button
      onClick={abrir}
      className="flex h-8 w-full max-w-64 items-center gap-2 rounded-md border bg-muted/50 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted"
    >
      <Search className="h-3.5 w-3.5 shrink-0" />
      <span className="flex-1 text-left">Buscar...</span>
      <kbd className="pointer-events-none hidden h-5 select-none items-center gap-0.5 rounded border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:flex">
        Ctrl K
      </kbd>
    </button>
  )
}

// ============================================================
// Ações rápidas (quando não tem busca)
// ============================================================

type AcaoRapida = {
  label: string
  href: string
  icone: React.ReactNode
  grupo: "criar" | "navegar"
}

const acoesRapidas: AcaoRapida[] = [
  { label: "Novo Imóvel", href: "/imoveis/novo", icone: <Plus className="h-4 w-4" />, grupo: "criar" },
  { label: "Novo Cliente", href: "/clientes/novo", icone: <Plus className="h-4 w-4" />, grupo: "criar" },
  { label: "Novo Negócio", href: "/negocios/novo", icone: <Plus className="h-4 w-4" />, grupo: "criar" },
  { label: "Nova Atividade", href: "/atividades/novo", icone: <Plus className="h-4 w-4" />, grupo: "criar" },
  { label: "Dashboard", href: "/painel", icone: <LayoutDashboard className="h-4 w-4" />, grupo: "navegar" },
  { label: "Imóveis", href: "/imoveis", icone: <Building2 className="h-4 w-4" />, grupo: "navegar" },
  { label: "Clientes", href: "/clientes", icone: <Users className="h-4 w-4" />, grupo: "navegar" },
  { label: "Negócios", href: "/negocios", icone: <Handshake className="h-4 w-4" />, grupo: "navegar" },
  { label: "Atividades", href: "/atividades", icone: <CalendarCheck className="h-4 w-4" />, grupo: "navegar" },
]

// ============================================================
// Tipos dos itens flat para navegação por teclado
// ============================================================

type ItemFlat = {
  id: string
  label: string
  sublabel?: string
  href: string
  icone: React.ReactNode
  badge?: React.ReactNode
}

// ============================================================
// Dialog principal
// ============================================================

export function DialogBuscaGlobal() {
  const { aberta, fechar } = useBuscaGlobalContext()
  const router = useRouter()
  const [termo, setTermo] = React.useState("")
  const [termoDebounced, setTermoDebounced] = React.useState("")
  const [indiceAtivo, setIndiceAtivo] = React.useState(0)
  const listaRef = React.useRef<HTMLDivElement>(null)

  // Debounce de 300ms
  React.useEffect(() => {
    const timer = setTimeout(() => setTermoDebounced(termo), 300)
    return () => clearTimeout(timer)
  }, [termo])

  // Reset ao abrir/fechar
  React.useEffect(() => {
    if (!aberta) {
      setTermo("")
      setTermoDebounced("")
      setIndiceAtivo(0)
    }
  }, [aberta])

  const { resultados, carregando } = useBuscaGlobal(termoDebounced)

  // Monta lista flat de itens para navegação por teclado
  const itensFlat = React.useMemo<ItemFlat[]>(() => {
    if (termoDebounced.length < 2) {
      // Ações rápidas
      return acoesRapidas.map((a) => ({
        id: `acao-${a.href}`,
        label: a.label,
        href: a.href,
        icone: a.icone,
      }))
    }

    const itens: ItemFlat[] = []

    for (const imovel of resultados.imoveis) {
      itens.push({
        id: `imovel-${imovel.id}`,
        label: imovel.titulo,
        sublabel: [labelsTipoImovel[imovel.tipo], imovel.bairro, imovel.cidade]
          .filter(Boolean)
          .join(" · "),
        href: `/imoveis/${imovel.id}`,
        icone: <Building2 className="h-4 w-4" />,
        badge: <StatusBadge status={imovel.status} config={configStatusImovel} />,
      })
    }

    for (const cliente of resultados.clientes) {
      itens.push({
        id: `cliente-${cliente.id}`,
        label: cliente.nome,
        sublabel: cliente.email || cliente.telefone || undefined,
        href: `/clientes/${cliente.id}`,
        icone: <Users className="h-4 w-4" />,
        badge: <StatusBadge status={cliente.status} config={configStatusCliente} />,
      })
    }

    for (const negocio of resultados.negocios) {
      const partes = [
        negocio.clientes?.nome,
        negocio.valor ? formatarPreco(negocio.valor) : null,
      ].filter(Boolean)
      itens.push({
        id: `negocio-${negocio.id}`,
        label: negocio.titulo,
        sublabel: partes.join(" · ") || undefined,
        href: `/negocios/${negocio.id}`,
        icone: <Handshake className="h-4 w-4" />,
        badge: <StatusBadge status={negocio.status} config={configStatusNegocio} />,
      })
    }

    for (const atividade of resultados.atividades) {
      itens.push({
        id: `atividade-${atividade.id}`,
        label: atividade.titulo,
        sublabel: formatarDataCurta(atividade.data_inicio) ?? undefined,
        href: `/atividades/${atividade.id}`,
        icone: <CalendarCheck className="h-4 w-4" />,
        badge: <StatusBadge status={atividade.status} config={configStatusAtividade} />,
      })
    }

    return itens
  }, [termoDebounced, resultados])

  // Reseta índice quando itens mudam
  React.useEffect(() => {
    setIndiceAtivo(0)
  }, [itensFlat])

  // Navegação por teclado
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setIndiceAtivo((prev) => (prev + 1) % itensFlat.length)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setIndiceAtivo((prev) => (prev - 1 + itensFlat.length) % itensFlat.length)
    } else if (e.key === "Enter" && itensFlat.length > 0) {
      e.preventDefault()
      const item = itensFlat[indiceAtivo]
      if (item) {
        router.push(item.href)
        fechar()
      }
    }
  }

  // Scroll para item ativo
  React.useEffect(() => {
    const container = listaRef.current
    if (!container) return
    const el = container.querySelector(`[data-indice="${indiceAtivo}"]`)
    if (el) {
      el.scrollIntoView({ block: "nearest" })
    }
  }, [indiceAtivo])

  // Verifica se a busca está ativa (com termo digitado)
  const buscaAtiva = termoDebounced.length >= 2

  // Agrupa ações rápidas para exibição
  const acoesCriar = acoesRapidas.filter((a) => a.grupo === "criar")
  const acoesNavegar = acoesRapidas.filter((a) => a.grupo === "navegar")

  // Monta seções de resultados para cabeçalhos
  const secoes = React.useMemo(() => {
    if (!buscaAtiva) return []
    const s: { titulo: string; icone: React.ReactNode; inicio: number; fim: number }[] = []
    let offset = 0

    if (resultados.imoveis.length > 0) {
      s.push({ titulo: "Imóveis", icone: <Building2 className="h-4 w-4" />, inicio: offset, fim: offset + resultados.imoveis.length })
      offset += resultados.imoveis.length
    }
    if (resultados.clientes.length > 0) {
      s.push({ titulo: "Clientes", icone: <Users className="h-4 w-4" />, inicio: offset, fim: offset + resultados.clientes.length })
      offset += resultados.clientes.length
    }
    if (resultados.negocios.length > 0) {
      s.push({ titulo: "Negócios", icone: <Handshake className="h-4 w-4" />, inicio: offset, fim: offset + resultados.negocios.length })
      offset += resultados.negocios.length
    }
    if (resultados.atividades.length > 0) {
      s.push({ titulo: "Atividades", icone: <CalendarCheck className="h-4 w-4" />, inicio: offset, fim: offset + resultados.atividades.length })
      offset += resultados.atividades.length
    }
    return s
  }, [buscaAtiva, resultados])

  return (
    <Dialog open={aberta} onOpenChange={(aberto) => { if (!aberto) fechar() }}>
      <DialogContent
        showCloseButton={false}
        className="top-[20%] -translate-y-0 sm:max-w-lg p-0 gap-0 overflow-hidden"
        onKeyDown={handleKeyDown}
      >
        <DialogTitle className="sr-only">Busca global</DialogTitle>

        {/* Input de busca */}
        <div className="flex items-center gap-2 border-b px-3">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar imóveis, clientes, negócios..."
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
            className="flex-1 h-11 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            autoFocus
          />
          {carregando && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>

        {/* Lista de resultados */}
        <div
          ref={listaRef}
          className="max-h-80 overflow-y-auto py-2"
        >
          {/* Estado: buscando e sem resultados */}
          {buscaAtiva && !carregando && itensFlat.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              Nenhum resultado para &quot;{termoDebounced}&quot;
            </p>
          )}

          {/* Resultados da busca */}
          {buscaAtiva && itensFlat.length > 0 && (
            <>
              {secoes.map((secao) => (
                <div key={secao.titulo}>
                  <div className="flex items-center gap-2 px-4 py-1.5">
                    <span className="text-xs font-medium text-muted-foreground">
                      {secao.titulo}
                    </span>
                  </div>
                  {itensFlat.slice(secao.inicio, secao.fim).map((item, i) => {
                    const indiceGlobal = secao.inicio + i
                    return (
                      <ItemResultado
                        key={item.id}
                        item={item}
                        ativo={indiceGlobal === indiceAtivo}
                        indice={indiceGlobal}
                        onClick={() => {
                          router.push(item.href)
                          fechar()
                        }}
                        onMouseEnter={() => setIndiceAtivo(indiceGlobal)}
                      />
                    )
                  })}
                </div>
              ))}
            </>
          )}

          {/* Ações rápidas (sem busca) */}
          {!buscaAtiva && (
            <>
              <div className="flex items-center gap-2 px-4 py-1.5">
                <span className="text-xs font-medium text-muted-foreground">
                  Criar
                </span>
              </div>
              {acoesCriar.map((acao, i) => {
                const indice = i
                return (
                  <ItemResultado
                    key={acao.href}
                    item={{
                      id: `acao-${acao.href}`,
                      label: acao.label,
                      href: acao.href,
                      icone: acao.icone,
                    }}
                    ativo={indice === indiceAtivo}
                    indice={indice}
                    onClick={() => {
                      router.push(acao.href)
                      fechar()
                    }}
                    onMouseEnter={() => setIndiceAtivo(indice)}
                  />
                )
              })}

              <div className="flex items-center gap-2 px-4 py-1.5 mt-1">
                <span className="text-xs font-medium text-muted-foreground">
                  Navegar
                </span>
              </div>
              {acoesNavegar.map((acao, i) => {
                const indice = acoesCriar.length + i
                return (
                  <ItemResultado
                    key={acao.href}
                    item={{
                      id: `acao-${acao.href}`,
                      label: acao.label,
                      href: acao.href,
                      icone: acao.icone,
                    }}
                    ativo={indice === indiceAtivo}
                    indice={indice}
                    onClick={() => {
                      router.push(acao.href)
                      fechar()
                    }}
                    onMouseEnter={() => setIndiceAtivo(indice)}
                  />
                )
              })}
            </>
          )}
        </div>

        {/* Footer com dicas */}
        <div className="flex items-center gap-3 border-t px-3 py-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <kbd className="rounded border bg-muted px-1 font-mono text-[10px]">↑↓</kbd>
            navegar
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border bg-muted px-1 font-mono text-[10px]">Enter</kbd>
            selecionar
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border bg-muted px-1 font-mono text-[10px]">Esc</kbd>
            fechar
          </span>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================
// Item individual da lista
// ============================================================

function ItemResultado({
  item,
  ativo,
  indice,
  onClick,
  onMouseEnter,
}: {
  item: ItemFlat
  ativo: boolean
  indice: number
  onClick: () => void
  onMouseEnter: () => void
}) {
  return (
    <button
      data-indice={indice}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className={`flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition-colors ${
        ativo ? "bg-accent text-accent-foreground" : "text-foreground"
      }`}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border bg-background text-muted-foreground">
        {item.icone}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block truncate font-medium">{item.label}</span>
        {item.sublabel && (
          <span className="block truncate text-xs text-muted-foreground">
            {item.sublabel}
          </span>
        )}
      </span>
      {item.badge}
      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" style={{ opacity: ativo ? 1 : 0 }} />
    </button>
  )
}
