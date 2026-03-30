import { Suspense } from "react"
import { redirect } from "next/navigation"
import { obterUsuarioAutenticado, obterDadosUsuario } from "@/lib/supabase/queries"
import { criarClienteAdmin } from "@/lib/supabase/admin"
import { ehPerfilPlataforma, temAcessoFinanceiro } from "@/lib/permissoes"
import { TabelaOrganizacoes } from "@/components/admin/tabela-organizacoes"
import { FiltrosOrganizacoes } from "@/components/admin/filtros-organizacoes"
import { PaginacaoListagem } from "@/components/ui/paginacao-listagem"
import { calcularRange, calcularTotalPaginas } from "@/lib/paginacao"

type SearchParams = Promise<{
  busca?: string
  plano?: string
  status?: string
  pagina?: string
  porPagina?: string
}>

export default async function AdminOrganizacoesPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams
  const user = await obterUsuarioAutenticado()
  if (!user) redirect("/login")

  const usuario = await obterDadosUsuario(user.id)
  if (!ehPerfilPlataforma(usuario)) redirect("/painel")

  const mostraFinanceiro = temAcessoFinanceiro(usuario)
  const admin = criarClienteAdmin()

  const pagina = Number(params.pagina) || 1
  const porPaginaOpcoes = [12, 24, 48]
  const porPagina = porPaginaOpcoes.includes(Number(params.porPagina))
    ? Number(params.porPagina)
    : 12
  const { inicio, fim } = calcularRange(pagina, porPagina)

  // Query de organizações com filtros
  let query = admin
    .from("organizacoes")
    .select("id, nome, slug, plano, plano_status, trial_fim_em, created_at", { count: "exact" })

  if (params.busca) {
    query = query.or(
      `nome.ilike.%${params.busca}%,slug.ilike.%${params.busca}%`
    )
  }
  if (params.plano) query = query.eq("plano", params.plano)
  if (params.status) query = query.eq("plano_status", params.status)

  const { data: orgsRaw, count } = await query
    .order("created_at", { ascending: false })
    .range(inicio, fim)

  const total = count ?? 0
  const totalPaginas = calcularTotalPaginas(total, porPagina)

  // Buscar contagens de usuários e imóveis por org
  const orgIds = orgsRaw?.map((o) => o.id) ?? []

  let usuariosPorOrg: { organizacao_id: string }[] = []
  let imoveisPorOrg: { organizacao_id: string }[] = []

  if (orgIds.length > 0) {
    const [resUsuarios, resImoveis] = await Promise.all([
      admin.from("usuarios").select("organizacao_id").in("organizacao_id", orgIds),
      admin.from("imoveis").select("organizacao_id").in("organizacao_id", orgIds),
    ])
    usuariosPorOrg = resUsuarios.data ?? []
    imoveisPorOrg = resImoveis.data ?? []
  }

  const contarPorOrg = (dados: { organizacao_id: string }[], orgId: string) =>
    dados.filter((d) => d.organizacao_id === orgId).length

  const organizacoes = (orgsRaw ?? []).map((org) => ({
    ...org,
    qtd_usuarios: contarPorOrg(usuariosPorOrg, org.id),
    qtd_imoveis: contarPorOrg(imoveisPorOrg, org.id),
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Organizações</h1>
        <p className="text-muted-foreground">
          Todas as imobiliárias cadastradas na plataforma.
        </p>
      </div>

      <TabelaOrganizacoes
        organizacoes={organizacoes}
        total={total}
        mostraFinanceiro={mostraFinanceiro}
        filtros={
          <Suspense fallback={<div />}>
            <FiltrosOrganizacoes />
          </Suspense>
        }
        paginacao={
          <PaginacaoListagem
            pagina={pagina}
            totalPaginas={totalPaginas}
            porPagina={porPagina}
            baseUrl="/admin/organizacoes"
            paramsBase={Object.fromEntries(
              Object.entries(params).filter(([, v]) => v !== undefined)
            ) as Record<string, string>}
          />
        }
      />
    </div>
  )
}
