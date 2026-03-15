import Link from "next/link"
import { criarClienteServer } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { CardCliente } from "@/components/clientes/card-cliente"
import { FiltrosClientes } from "@/components/clientes/filtros-clientes"
import { Plus, Users } from "lucide-react"

type SearchParams = Promise<{
  busca?: string
  tipo?: string
  origem?: string
  status?: string
  pagina?: string
}>

export default async function ClientesPage({
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
    .from("clientes")
    .select("*", { count: "exact" })

  if (params.busca) {
    query = query.or(
      `nome.ilike.%${params.busca}%,email.ilike.%${params.busca}%,telefone.ilike.%${params.busca}%,cpf_cnpj.ilike.%${params.busca}%`
    )
  }
  if (params.tipo) query = query.eq("tipo", params.tipo)
  if (params.origem) query = query.eq("origem", params.origem)
  if (params.status) query = query.eq("status", params.status)

  const { data: clientes, count } = await query
    .order("created_at", { ascending: false })
    .range(inicio, fim)

  const total = count ?? 0
  const totalPaginas = Math.ceil(total / porPagina)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">
            {total} {total === 1 ? "cliente encontrado" : "clientes encontrados"}
          </p>
        </div>
        <Button render={<Link href="/clientes/novo" />}>
          <Plus className="mr-2 h-4 w-4" />
          Novo cliente
        </Button>
      </div>

      <FiltrosClientes />

      {clientes && clientes.length > 0 ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {clientes.map((cliente) => (
              <CardCliente key={cliente.id} cliente={cliente} />
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
                      href={`/clientes?${new URLSearchParams({ ...params, pagina: String(pagina - 1) }).toString()}`}
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
                      href={`/clientes?${new URLSearchParams({ ...params, pagina: String(pagina + 1) }).toString()}`}
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
          <Users className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-medium">Nenhum cliente encontrado</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Comece cadastrando seu primeiro cliente
          </p>
          <Button render={<Link href="/clientes/novo" />}>
            <Plus className="mr-2 h-4 w-4" />
            Cadastrar cliente
          </Button>
        </div>
      )}
    </div>
  )
}
