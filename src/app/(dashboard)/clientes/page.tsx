import Link from "next/link"
import { criarClienteServer } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { CardCliente } from "@/components/clientes/card-cliente"
import { TabelaClientes } from "@/components/clientes/tabela-clientes"
import { FiltrosClientes } from "@/components/clientes/filtros-clientes"
import { ToggleVisualizacao } from "@/components/clientes/toggle-visualizacao"
import { PaginacaoListagem } from "@/components/ui/paginacao-listagem"
import { Plus, Users } from "lucide-react"
import { EstadoVazio } from "@/components/ui/estado-vazio"
import { BotaoExportar } from "@/components/ui/botao-exportar"

type SearchParams = Promise<{
  busca?: string
  tipo?: string
  origem?: string
  status?: string
  pagina?: string
  porPagina?: string
  view?: string
}>

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams
  const supabase = await criarClienteServer()
  const modoVisualizacao = params.view === "lista" ? "lista" : "cards"
  const pagina = Number(params.pagina) || 1
  const porPaginaOpcoes = [12, 24, 48]
  const porPagina = porPaginaOpcoes.includes(Number(params.porPagina))
    ? Number(params.porPagina)
    : 12
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
        </div>
        <div className="flex items-center gap-2">
          <ToggleVisualizacao />
          <BotaoExportar
            modulo="clientes"
            filtros={{
              busca: params.busca,
              tipo: params.tipo,
              origem: params.origem,
              status: params.status,
            }}
            total={total}
          />
          <Button render={<Link href="/clientes/novo" />}>
            <Plus className="mr-2 h-4 w-4" />
            Novo cliente
          </Button>
        </div>
      </div>

      <FiltrosClientes />

      {clientes && clientes.length > 0 ? (
        <>
          {modoVisualizacao === "lista" ? (
            <TabelaClientes clientes={clientes} total={total} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {clientes.map((cliente) => (
                <CardCliente key={cliente.id} cliente={cliente} />
              ))}
            </div>
          )}

          {/* Paginação */}
          <PaginacaoListagem
            pagina={pagina}
            totalPaginas={totalPaginas}
            porPagina={porPagina}
            construtorHref={(p) =>
              `/clientes?${new URLSearchParams({ ...params, pagina: String(p) }).toString()}`
            }
            construtorHrefPorPagina={(n) =>
              `/clientes?${new URLSearchParams({ ...params, pagina: "1", porPagina: String(n) }).toString()}`
            }
          />
        </>
      ) : (
        <EstadoVazio
          icone={Users}
          titulo="Nenhum cliente encontrado"
          descricao="Comece cadastrando seu primeiro cliente"
          acao={
            <Button render={<Link href="/clientes/novo" />}>
              <Plus className="mr-2 h-4 w-4" />
              Cadastrar cliente
            </Button>
          }
        />
      )}
    </div>
  )
}
