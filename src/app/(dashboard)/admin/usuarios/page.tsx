import { Suspense } from "react"
import { redirect } from "next/navigation"
import { obterUsuarioAutenticado, obterDadosUsuario } from "@/lib/supabase/queries"
import { ehSuperAdmin, ehDesenvolvedor } from "@/lib/permissoes"
import { listarUsuariosPlataforma } from "@/actions/usuarios-plataforma"
import { TabelaUsuariosPlataforma } from "@/components/admin/tabela-usuarios-plataforma"
import { FiltrosUsuariosPlataforma } from "@/components/admin/filtros-usuarios-plataforma"
import { PaginacaoListagem } from "@/components/ui/paginacao-listagem"
import { DialogNovoUsuario } from "@/components/admin/dialog-novo-usuario"
import { calcularTotalPaginas } from "@/lib/paginacao"

type SearchParams = Promise<{
  busca?: string
  cargo?: string
  organizacao?: string
  status?: string
  pagina?: string
  porPagina?: string
}>

export default async function AdminUsuariosPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams
  const user = await obterUsuarioAutenticado()
  if (!user) redirect("/login")

  const usuario = await obterDadosUsuario(user.id)

  if (!ehSuperAdmin(usuario) && !ehDesenvolvedor(usuario)) {
    redirect("/painel")
  }

  const podeMudarPerfil = ehSuperAdmin(usuario)
  const pagina = Number(params.pagina) || 1
  const porPaginaOpcoes = [12, 24, 48]
  const porPagina = porPaginaOpcoes.includes(Number(params.porPagina))
    ? Number(params.porPagina)
    : 12

  const { usuarios, total, organizacoes } = await listarUsuariosPlataforma(
    {
      busca: params.busca,
      cargo: params.cargo,
      organizacao: params.organizacao,
      status: params.status,
    },
    pagina,
    porPagina
  )

  const totalPaginas = calcularTotalPaginas(total, porPagina)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Usuários</h1>
          <p className="text-muted-foreground">
            Todos os usuários cadastrados na plataforma.
          </p>
        </div>
        {podeMudarPerfil && (
          <DialogNovoUsuario organizacoes={organizacoes} />
        )}
      </div>

      <TabelaUsuariosPlataforma
        usuarios={usuarios}
        total={total}
        podeMudarPerfil={podeMudarPerfil}
        organizacoes={organizacoes}
        filtros={
          <Suspense fallback={<div />}>
            <FiltrosUsuariosPlataforma organizacoes={organizacoes} />
          </Suspense>
        }
        paginacao={
          <PaginacaoListagem
            pagina={pagina}
            totalPaginas={totalPaginas}
            porPagina={porPagina}
            baseUrl="/admin/usuarios"
            paramsBase={Object.fromEntries(
              Object.entries(params).filter(([, v]) => v !== undefined)
            ) as Record<string, string>}
          />
        }
      />
    </div>
  )
}
