import Link from "next/link"
import { criarClienteServer } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/ui/page-header"
import { CardImovel } from "@/components/imoveis/card-imovel"
import { TabelaImoveis } from "@/components/imoveis/tabela-imoveis"
import { FiltrosImoveis } from "@/components/imoveis/filtros-imoveis"
import { ToggleVisualizacao } from "@/components/ui/toggle-visualizacao"
import { PaginacaoListagem } from "@/components/ui/paginacao-listagem"
import { Plus, Building2, Upload } from "lucide-react"
import { EstadoVazio } from "@/components/ui/estado-vazio"
import { BotaoExportar } from "@/components/ui/botao-exportar"
import { calcularRange, calcularTotalPaginas } from "@/lib/paginacao"

type SearchParams = Promise<{
  busca?: string
  tipo?: string
  finalidade?: string
  status?: string
  cidade?: string
  bairro?: string
  canal?: string
  pagina?: string
  porPagina?: string
  view?: string
}>

export default async function ImoveisPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams
  const supabase = await criarClienteServer()
  const pagina = Number(params.pagina) || 1
  const modoVisualizacao = params.view === "lista" ? "lista" : "cards"
  const porPaginaOpcoes = [12, 24, 48]
  const porPagina = porPaginaOpcoes.includes(Number(params.porPagina))
    ? Number(params.porPagina)
    : 12
  const { inicio, fim } = calcularRange(pagina, porPagina)

  let query = supabase
    .from("imoveis")
    .select("*, imovel_fotos(url, eh_capa)", { count: "exact" })

  if (params.busca) {
    query = query.or(
      `titulo.ilike.%${params.busca}%,codigo_interno.ilike.%${params.busca}%,bairro.ilike.%${params.busca}%`
    )
  }
  if (params.tipo) query = query.eq("tipo", params.tipo)
  if (params.finalidade) query = query.eq("finalidade", params.finalidade)
  if (params.status) query = query.eq("status", params.status)
  if (params.cidade) query = query.ilike("cidade", `%${params.cidade}%`)
  if (params.bairro) query = query.ilike("bairro", `%${params.bairro}%`)
  if (params.canal === "site") query = query.eq("publicar_site", true)
  if (params.canal === "portais") query = query.eq("publicar_portais", true)
  if (params.canal === "nenhum") query = query.eq("publicar_site", false).eq("publicar_portais", false)

  const { data: imoveis, count } = await query
    .order("created_at", { ascending: false })
    .range(inicio, fim)

  const total = count ?? 0
  const totalPaginas = calcularTotalPaginas(total, porPagina)

  return (
    <div className="space-y-6">
      <div className="animate-fade-in-up">
      <PageHeader
        titulo="Imóveis"
        descricao="Gerencie o portfólio de imóveis da sua imobiliária"
        acoes={
          <>
            <ToggleVisualizacao rota="/imoveis" />
            <BotaoExportar
              modulo="imoveis"
              filtros={{
                busca: params.busca,
                tipo: params.tipo,
                finalidade: params.finalidade,
                status: params.status,
                cidade: params.cidade,
                bairro: params.bairro,
                canal: params.canal,
              }}
              total={total}
            />
            <Button variant="outline" render={<Link href="/imoveis/importar" />}>
              <Upload className="mr-2 h-4 w-4" />
              Importar
            </Button>
            <Button render={<Link href="/imoveis/novo" />}>
              <Plus className="mr-2 h-4 w-4" />
              Novo imóvel
            </Button>
          </>
        }
      />
      </div>

      <div className="animate-fade-in-up" style={{ animationDelay: "50ms" }}>
      <FiltrosImoveis />
      </div>

      <div className="animate-fade-in-up" style={{ animationDelay: "100ms" }}>
      {imoveis && imoveis.length > 0 ? (
        <>
          {modoVisualizacao === "lista" ? (
            <TabelaImoveis imoveis={imoveis} total={total} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {imoveis.map((imovel) => (
                <CardImovel key={imovel.id} imovel={imovel} />
              ))}
            </div>
          )}

          <PaginacaoListagem
            pagina={pagina}
            totalPaginas={totalPaginas}
            porPagina={porPagina}
            baseUrl="/imoveis"
            paramsBase={Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined)) as Record<string, string>}
          />
        </>
      ) : (
        <EstadoVazio
          icone={Building2}
          titulo="Nenhum imóvel encontrado"
          descricao="Comece cadastrando seu primeiro imóvel"
          acao={
            <Button render={<Link href="/imoveis/novo" />}>
              <Plus className="mr-2 h-4 w-4" />
              Cadastrar imóvel
            </Button>
          }
        />
      )}
      </div>
    </div>
  )
}
