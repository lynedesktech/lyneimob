import Link from "next/link"
import { criarClienteServer } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { CardImovel } from "@/components/imoveis/card-imovel"
import { FiltrosImoveis } from "@/components/imoveis/filtros-imoveis"
import { Plus, Building2 } from "lucide-react"

type SearchParams = Promise<{
  busca?: string
  tipo?: string
  finalidade?: string
  status?: string
  cidade?: string
  bairro?: string
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

  const { data: imoveis, count } = await query
    .order("created_at", { ascending: false })
    .range(inicio, fim)

  const total = count ?? 0
  const totalPaginas = Math.ceil(total / porPagina)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Imóveis</h1>
          <p className="text-muted-foreground">
            {total} {total === 1 ? "imóvel encontrado" : "imóveis encontrados"}
          </p>
        </div>
        <Button render={<Link href="/imoveis/novo" />}>
          <Plus className="mr-2 h-4 w-4" />
          Novo imóvel
        </Button>
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
          {totalPaginas > 1 && (
            <div className="flex items-center justify-center gap-2">
              {pagina > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  render={
                    <Link
                      href={`/imoveis?${new URLSearchParams({ ...params, pagina: String(pagina - 1) }).toString()}`}
                    />
                  }
                >
                  Anterior
                </Button>
              )}
              <span className="text-sm text-muted-foreground">
                Página {pagina} de {totalPaginas}
              </span>
              {pagina < totalPaginas && (
                <Button
                  variant="outline"
                  size="sm"
                  render={
                    <Link
                      href={`/imoveis?${new URLSearchParams({ ...params, pagina: String(pagina + 1) }).toString()}`}
                    />
                  }
                >
                  Próxima
                </Button>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
          <Building2 className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-medium">Nenhum imóvel encontrado</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Comece cadastrando seu primeiro imóvel
          </p>
          <Button render={<Link href="/imoveis/novo" />}>
            <Plus className="mr-2 h-4 w-4" />
            Cadastrar imóvel
          </Button>
        </div>
      )}
    </div>
  )
}
