import Link from "next/link"
import { criarClienteServer } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { CardImovel } from "@/components/imoveis/card-imovel"
import { FiltrosImoveis } from "@/components/imoveis/filtros-imoveis"
import { PaginacaoListagem } from "@/components/ui/paginacao-listagem"
import { Plus, Building2, Upload } from "lucide-react"
import { EstadoVazio } from "@/components/ui/estado-vazio"

type SearchParams = Promise<{
  busca?: string
  tipo?: string
  finalidade?: string
  status?: string
  cidade?: string
  bairro?: string
  canal?: string
  pagina?: string
}>

export default async function ImoveisPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams
  const supabase = await criarClienteServer()
  const pagina = Number(params.pagina) || 1
  const porPagina = 12
  const inicio = (pagina - 1) * porPagina
  const fim = inicio + porPagina - 1

  let query = supabase
    .from("imoveis")
    .select("*, imovel_fotos(url, eh_capa)", { count: "exact" })

  if (params.busca) {
    query = query.or(
      `titulo.ilike.%${params.busca}%,codigo.ilike.%${params.busca}%,bairro.ilike.%${params.busca}%`
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
  const totalPaginas = Math.ceil(total / porPagina)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Imóveis</h1>
          <p className="text-muted-foreground">
            {total} {total === 1 ? "imóvel encontrado" : "imóveis encontrados"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" render={<Link href="/imoveis/importar" />}>
            <Upload className="mr-2 h-4 w-4" />
            Importar
          </Button>
          <Button render={<Link href="/imoveis/novo" />}>
            <Plus className="mr-2 h-4 w-4" />
            Novo imóvel
          </Button>
        </div>
      </div>

      <FiltrosImoveis />

      {imoveis && imoveis.length > 0 ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {imoveis.map((imovel) => (
              <CardImovel key={imovel.id} imovel={imovel} />
            ))}
          </div>

          {/* Paginação */}
          <PaginacaoListagem
            pagina={pagina}
            totalPaginas={totalPaginas}
            construtorHref={(p) =>
              `/imoveis?${new URLSearchParams({ ...params, pagina: String(p) }).toString()}`
            }
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
  )
}
