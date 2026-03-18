import Link from "next/link"
import { criarClienteServer } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/ui/page-header"
import { CardLoteamento } from "@/components/loteamentos/card-loteamento"
import { FiltrosLoteamentos } from "@/components/loteamentos/filtros-loteamentos"
import { PaginacaoListagem } from "@/components/ui/paginacao-listagem"
import { EstadoVazio } from "@/components/ui/estado-vazio"
import { Plus, MapPin } from "lucide-react"
import { calcularRange, calcularTotalPaginas } from "@/lib/paginacao"

type SearchParams = Promise<{
  busca?: string
  status?: string
  pagina?: string
  porPagina?: string
}>

export default async function LoteamentosPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams
  const supabase = await criarClienteServer()
  const pagina = Number(params.pagina) || 1
  const porPaginaOpcoes = [12, 24, 48]
  const porPagina = porPaginaOpcoes.includes(Number(params.porPagina))
    ? Number(params.porPagina)
    : 12
  const { inicio, fim } = calcularRange(pagina, porPagina)

  let query = supabase
    .from("loteamentos")
    .select("*, loteamento_fotos(url, eh_capa)", { count: "exact" })

  if (params.busca) {
    query = query.or(
      `nome.ilike.%${params.busca}%,bairro.ilike.%${params.busca}%,cidade.ilike.%${params.busca}%`
    )
  }
  if (params.status) query = query.eq("status", params.status)

  const { data: loteamentos, count } = await query
    .order("created_at", { ascending: false })
    .range(inicio, fim)

  const total = count ?? 0
  const totalPaginas = calcularTotalPaginas(total, porPagina)

  return (
    <div className="space-y-6">
      <div className="animate-fade-in-up">
      <PageHeader
        titulo="Loteamentos"
        descricao="Gerencie os loteamentos e lotes da sua imobiliária"
        acoes={
          <Button render={<Link href="/loteamentos/novo" />}>
            <Plus className="mr-2 h-4 w-4" />
            Novo loteamento
          </Button>
        }
      />
      </div>

      <div className="animate-fade-in-up" style={{ animationDelay: "50ms" }}>
        <FiltrosLoteamentos />
      </div>

      <div className="animate-fade-in-up" style={{ animationDelay: "100ms" }}>
      {loteamentos && loteamentos.length > 0 ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {loteamentos.map((loteamento) => (
              <CardLoteamento key={loteamento.id} loteamento={loteamento} />
            ))}
          </div>

          <PaginacaoListagem
            pagina={pagina}
            totalPaginas={totalPaginas}
            porPagina={porPagina}
            baseUrl="/loteamentos"
            paramsBase={Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined)) as Record<string, string>}
          />
        </>
      ) : (
        <EstadoVazio
          icone={MapPin}
          titulo="Nenhum loteamento encontrado"
          descricao="Comece cadastrando seu primeiro loteamento"
          acao={
            <Button render={<Link href="/loteamentos/novo" />}>
              <Plus className="mr-2 h-4 w-4" />
              Cadastrar loteamento
            </Button>
          }
        />
      )}
      </div>
    </div>
  )
}
