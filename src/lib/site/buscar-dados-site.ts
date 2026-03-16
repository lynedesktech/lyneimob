import { criarClienteAdmin } from "@/lib/supabase/admin"

// ============================================================
// Utilitários de formatação
// ============================================================

export function formatarPreco(valor: number | null): string {
  if (!valor) return "Consulte"
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  })
}

// ============================================================
// Tipos de filtros para listagem pública
// ============================================================

export type FiltrosImoveisPublico = {
  tipo?: string
  finalidade?: string
  cidade?: string
  busca?: string
  preco_min?: number
  preco_max?: number
  quartos?: number
  pagina?: number
}

// ============================================================
// Buscar organização pelo slug
// ============================================================

export async function buscarOrganizacaoPorSlug(slug: string) {
  const supabase = criarClienteAdmin()

  const { data } = await supabase
    .from("organizacoes")
    .select(
      "id, nome, slug, logo_url, telefone, email, endereco, creci, whatsapp_numero, configuracoes_site"
    )
    .eq("slug", slug)
    .single()

  return data
}

export type OrganizacaoSite = NonNullable<
  Awaited<ReturnType<typeof buscarOrganizacaoPorSlug>>
>

// ============================================================
// Buscar organização pelo domínio customizado
// ============================================================

export async function buscarOrganizacaoPorDominio(dominio: string) {
  const supabase = criarClienteAdmin()

  // Buscar domínio verificado
  const { data: dominioDados } = await supabase
    .from("dominios_customizados")
    .select("organizacao_id")
    .eq("dominio", dominio)
    .eq("status", "verificado")
    .single()

  if (!dominioDados) return null

  // Buscar organização completa (mesmos campos que buscarOrganizacaoPorSlug)
  const { data } = await supabase
    .from("organizacoes")
    .select(
      "id, nome, slug, logo_url, telefone, email, endereco, creci, whatsapp_numero, configuracoes_site"
    )
    .eq("id", dominioDados.organizacao_id)
    .single()

  return data
}

// ============================================================
// Buscar domínio customizado de uma organização
// ============================================================

export async function buscarDominioOrganizacao(organizacaoId: string) {
  const supabase = criarClienteAdmin()

  const { data } = await supabase
    .from("dominios_customizados")
    .select("*")
    .eq("organizacao_id", organizacaoId)
    .single()

  return data as import("@/types/dominios").DominioCustomizado | null
}

// ============================================================
// Buscar imóveis públicos com filtros e paginação
// ============================================================

const POR_PAGINA = 12

export async function buscarImoveisPublicos(
  organizacaoId: string,
  filtros: FiltrosImoveisPublico = {}
) {
  const supabase = criarClienteAdmin()
  const pagina = filtros.pagina || 1
  const inicio = (pagina - 1) * POR_PAGINA
  const fim = inicio + POR_PAGINA - 1

  let query = supabase
    .from("imoveis")
    .select("*, imovel_fotos(id, url, ordem, eh_capa)", { count: "exact" })
    .eq("organizacao_id", organizacaoId)
    .eq("status", "disponivel")
    .eq("publicar_site", true)

  if (filtros.tipo) {
    query = query.eq("tipo", filtros.tipo)
  }
  if (filtros.finalidade) {
    query = query.eq("finalidade", filtros.finalidade)
  }
  if (filtros.cidade) {
    query = query.ilike("cidade", `%${filtros.cidade}%`)
  }
  if (filtros.quartos) {
    query = query.gte("quartos", filtros.quartos)
  }
  if (filtros.preco_min || filtros.preco_max) {
    const campoPreco =
      filtros.finalidade === "aluguel" ? "preco_aluguel" : "preco_venda"

    if (filtros.preco_min) {
      query = query.gte(campoPreco, filtros.preco_min)
    }
    if (filtros.preco_max) {
      query = query.lte(campoPreco, filtros.preco_max)
    }
  }
  if (filtros.busca) {
    query = query.or(
      `titulo.ilike.%${filtros.busca}%,bairro.ilike.%${filtros.busca}%,cidade.ilike.%${filtros.busca}%`
    )
  }

  const { data, count } = await query
    .order("created_at", { ascending: false })
    .range(inicio, fim)

  return {
    imoveis: data ?? [],
    total: count ?? 0,
    totalPaginas: Math.ceil((count ?? 0) / POR_PAGINA),
    paginaAtual: pagina,
  }
}

// ============================================================
// Buscar imóveis em destaque (home — últimos 6 disponíveis)
// ============================================================

export async function buscarImoveisDestaque(organizacaoId: string) {
  const supabase = criarClienteAdmin()

  const { data } = await supabase
    .from("imoveis")
    .select("*, imovel_fotos(id, url, ordem, eh_capa)")
    .eq("organizacao_id", organizacaoId)
    .eq("status", "disponivel")
    .eq("publicar_site", true)
    .order("created_at", { ascending: false })
    .limit(6)

  return data ?? []
}

// ============================================================
// Buscar um imóvel específico com todas as fotos
// ============================================================

export async function buscarImovelPublico(
  organizacaoId: string,
  imovelId: string
) {
  const supabase = criarClienteAdmin()

  const { data } = await supabase
    .from("imoveis")
    .select("*, imovel_fotos(*)")
    .eq("organizacao_id", organizacaoId)
    .eq("id", imovelId)
    .eq("status", "disponivel")
    .eq("publicar_site", true)
    .single()

  return data
}
