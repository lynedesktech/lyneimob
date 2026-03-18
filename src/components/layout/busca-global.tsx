"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { StatusBadge } from "@/components/ui/status-badge"
import {
  configStatusImovel,
  configStatusCliente,
  configStatusNegocio,
  configStatusAtividade,
} from "@/lib/constantes/status-configs"
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
  Loader2,
  BarChart3,
  Shield,
  MapPin,
  HelpCircle,
} from "lucide-react"

// ============================================================
// Context para compartilhar estado aberto/fechado
// ============================================================

type ContextoBuscaGlobal = {
  aberta: boolean
  abrir: () => void
  fechar: () => void
  superAdmin: boolean
}

const BuscaGlobalContext = React.createContext<ContextoBuscaGlobal>({
  aberta: false,
  abrir: () => {},
  fechar: () => {},
  superAdmin: false,
})

function useBuscaGlobalContext() {
  return React.useContext(BuscaGlobalContext)
}

// ============================================================
// Provider
// ============================================================

export function ProvedorBuscaGlobal({ children, superAdmin = false }: { children: React.ReactNode; superAdmin?: boolean }) {
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
      superAdmin,
    }),
    [aberta, superAdmin]
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
// Ações rápidas
// ============================================================

type AcaoRapida = {
  label: string
  href: string
  icone: React.ReactNode
  grupo: "criar" | "navegar" | "plataforma"
}

const acoesRapidas: AcaoRapida[] = [
  { label: "Novo Imóvel", href: "/imoveis/novo", icone: <Plus className="h-4 w-4" />, grupo: "criar" },
  { label: "Novo Cliente", href: "/clientes/novo", icone: <Plus className="h-4 w-4" />, grupo: "criar" },
  { label: "Novo Negócio", href: "/negocios/novo", icone: <Plus className="h-4 w-4" />, grupo: "criar" },
  { label: "Nova Atividade", href: "/atividades/novo", icone: <Plus className="h-4 w-4" />, grupo: "criar" },
  { label: "Novo Loteamento", href: "/loteamentos/novo", icone: <Plus className="h-4 w-4" />, grupo: "criar" },
  { label: "Dashboard", href: "/painel", icone: <LayoutDashboard className="h-4 w-4" />, grupo: "navegar" },
  { label: "Imóveis", href: "/imoveis", icone: <Building2 className="h-4 w-4" />, grupo: "navegar" },
  { label: "Loteamentos", href: "/loteamentos", icone: <MapPin className="h-4 w-4" />, grupo: "navegar" },
  { label: "Clientes", href: "/clientes", icone: <Users className="h-4 w-4" />, grupo: "navegar" },
  { label: "Negócios", href: "/negocios", icone: <Handshake className="h-4 w-4" />, grupo: "navegar" },
  { label: "Atividades", href: "/atividades", icone: <CalendarCheck className="h-4 w-4" />, grupo: "navegar" },
  { label: "Ajuda", href: "/ajuda", icone: <HelpCircle className="h-4 w-4" />, grupo: "navegar" },
]

const acoesPlataforma: AcaoRapida[] = [
  { label: "Painel Plataforma", href: "/admin/painel", icone: <BarChart3 className="h-4 w-4" />, grupo: "plataforma" },
  { label: "Organizações", href: "/admin/organizacoes", icone: <Building2 className="h-4 w-4" />, grupo: "plataforma" },
  { label: "Config Plataforma", href: "/admin/configuracoes", icone: <Shield className="h-4 w-4" />, grupo: "plataforma" },
]

// ============================================================
// Dialog principal (usa Command shadcn)
// ============================================================

export function DialogBuscaGlobal() {
  const { aberta, fechar, superAdmin } = useBuscaGlobalContext()
  const router = useRouter()
  const [termo, setTermo] = React.useState("")
  const [termoDebounced, setTermoDebounced] = React.useState("")

  // Debounce de 300ms
  React.useEffect(() => {
    const timer = setTimeout(() => setTermoDebounced(termo), 300)
    return () => clearTimeout(timer)
  }, [termo])

  // Reset ao fechar
  React.useEffect(() => {
    if (!aberta) {
      setTermo("")
      setTermoDebounced("")
    }
  }, [aberta])

  const { resultados, carregando } = useBuscaGlobal(termoDebounced)
  const buscaAtiva = termoDebounced.length >= 2

  const todasAcoes = superAdmin ? [...acoesRapidas, ...acoesPlataforma] : acoesRapidas
  const acoesCriar = todasAcoes.filter((a) => a.grupo === "criar")
  const acoesNavegar = todasAcoes.filter((a) => a.grupo === "navegar")
  const acoesAdmin = todasAcoes.filter((a) => a.grupo === "plataforma")

  function navegar(href: string) {
    router.push(href)
    fechar()
  }

  const temResultados =
    resultados.imoveis.length > 0 ||
    resultados.clientes.length > 0 ||
    resultados.negocios.length > 0 ||
    resultados.atividades.length > 0

  return (
    <CommandDialog
      open={aberta}
      onOpenChange={(aberto) => { if (!aberto) fechar() }}
      title="Busca global"
      description="Buscar imóveis, clientes, negócios e atividades"
      className="sm:max-w-lg"
    >
      <Command shouldFilter={false}>
        {/* Input de busca */}
        <div className="relative">
          <CommandInput
            placeholder="Buscar imóveis, clientes, negócios..."
            value={termo}
            onValueChange={setTermo}
          />
          {carregando && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Lista de resultados */}
        <CommandList className="max-h-80">
          {/* Sem resultados */}
          {buscaAtiva && !carregando && !temResultados && (
            <CommandEmpty>Nenhum resultado para &quot;{termoDebounced}&quot;</CommandEmpty>
          )}

          {/* Ações rápidas (sem busca ativa) */}
          {!buscaAtiva && (
            <>
              <CommandGroup heading="Criar">
                {acoesCriar.map((acao) => (
                  <CommandItem
                    key={acao.href}
                    value={`criar-${acao.href}`}
                    onSelect={() => navegar(acao.href)}
                  >
                    {acao.icone}
                    {acao.label}
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading="Navegar">
                {acoesNavegar.map((acao) => (
                  <CommandItem
                    key={acao.href}
                    value={`nav-${acao.href}`}
                    onSelect={() => navegar(acao.href)}
                  >
                    {acao.icone}
                    {acao.label}
                  </CommandItem>
                ))}
              </CommandGroup>
              {acoesAdmin.length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup heading="Plataforma">
                    {acoesAdmin.map((acao) => (
                      <CommandItem
                        key={acao.href}
                        value={`admin-${acao.href}`}
                        onSelect={() => navegar(acao.href)}
                      >
                        {acao.icone}
                        {acao.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
            </>
          )}

          {/* Resultados da busca */}
          {buscaAtiva && temResultados && (
            <>
              {resultados.imoveis.length > 0 && (
                <CommandGroup heading="Imóveis">
                  {resultados.imoveis.map((imovel) => (
                    <CommandItem
                      key={imovel.id}
                      value={`imovel-${imovel.id}`}
                      onSelect={() => navegar(`/imoveis/${imovel.id}`)}
                      className="gap-3"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border bg-background text-muted-foreground">
                        <Building2 className="h-4 w-4" />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block truncate font-medium">{imovel.titulo}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {[labelsTipoImovel[imovel.tipo], imovel.bairro, imovel.cidade].filter(Boolean).join(" · ")}
                        </span>
                      </span>
                      <StatusBadge status={imovel.status} config={configStatusImovel} />
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {resultados.clientes.length > 0 && (
                <CommandGroup heading="Clientes">
                  {resultados.clientes.map((cliente) => (
                    <CommandItem
                      key={cliente.id}
                      value={`cliente-${cliente.id}`}
                      onSelect={() => navegar(`/clientes/${cliente.id}`)}
                      className="gap-3"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border bg-background text-muted-foreground">
                        <Users className="h-4 w-4" />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block truncate font-medium">{cliente.nome}</span>
                        {(cliente.email || cliente.telefone) && (
                          <span className="block truncate text-xs text-muted-foreground">
                            {cliente.email || cliente.telefone}
                          </span>
                        )}
                      </span>
                      <StatusBadge status={cliente.status} config={configStatusCliente} />
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {resultados.negocios.length > 0 && (
                <CommandGroup heading="Negócios">
                  {resultados.negocios.map((negocio) => (
                    <CommandItem
                      key={negocio.id}
                      value={`negocio-${negocio.id}`}
                      onSelect={() => navegar(`/negocios/${negocio.id}`)}
                      className="gap-3"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border bg-background text-muted-foreground">
                        <Handshake className="h-4 w-4" />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block truncate font-medium">{negocio.titulo}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {[negocio.clientes?.nome, negocio.valor ? formatarPreco(negocio.valor) : null].filter(Boolean).join(" · ")}
                        </span>
                      </span>
                      <StatusBadge status={negocio.status} config={configStatusNegocio} />
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {resultados.atividades.length > 0 && (
                <CommandGroup heading="Atividades">
                  {resultados.atividades.map((atividade) => (
                    <CommandItem
                      key={atividade.id}
                      value={`atividade-${atividade.id}`}
                      onSelect={() => navegar(`/atividades/${atividade.id}`)}
                      className="gap-3"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border bg-background text-muted-foreground">
                        <CalendarCheck className="h-4 w-4" />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block truncate font-medium">{atividade.titulo}</span>
                        {atividade.data_inicio && (
                          <span className="block truncate text-xs text-muted-foreground">
                            {formatarDataCurta(atividade.data_inicio)}
                          </span>
                        )}
                      </span>
                      <StatusBadge status={atividade.status} config={configStatusAtividade} />
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </>
          )}
        </CommandList>

        {/* Footer com dicas de navegação */}
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
      </Command>
    </CommandDialog>
  )
}
