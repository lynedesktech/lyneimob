import { criarClienteAdmin } from "@/lib/supabase/admin"
import { formatarPreco as formatarPrecoBase } from "@/lib/formatadores"
import { calcularRange, calcularTotalPaginas } from "@/lib/paginacao"

// ============================================================
// Utilitários de formatação
// ============================================================

export const formatarPreco = (valor: number | null) => formatarPrecoBase(valor, "Consulte")

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
  const { inicio, fim } = calcularRange(pagina, POR_PAGINA)

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
    totalPaginas: calcularTotalPaginas(count ?? 0, POR_PAGINA),
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
// Buscar estatísticas do site (contadores para a homepage)
// ============================================================

export async function buscarEstatisticasSite(organizacaoId: string) {
  const supabase = criarClienteAdmin()

  // Total de imóveis disponíveis no site
  const { count: totalImoveis } = await supabase
    .from("imoveis")
    .select("id", { count: "exact", head: true })
    .eq("organizacao_id", organizacaoId)
    .eq("status", "disponivel")
    .eq("publicar_site", true)

  // Bairros distintos
  const { data: bairrosData } = await supabase
    .from("imoveis")
    .select("bairro")
    .eq("organizacao_id", organizacaoId)
    .eq("status", "disponivel")
    .eq("publicar_site", true)
    .not("bairro", "is", null)
    .not("bairro", "eq", "")

  const bairrosUnicos = new Set(bairrosData?.map((i) => i.bairro))

  // Total de loteamentos publicados
  const { count: totalLoteamentos } = await supabase
    .from("loteamentos")
    .select("id", { count: "exact", head: true })
    .eq("organizacao_id", organizacaoId)
    .in("status", ["lancamento", "em_vendas"])
    .eq("publicar_site", true)

  return {
    totalImoveis: totalImoveis ?? 0,
    totalBairros: bairrosUnicos.size,
    totalLoteamentos: totalLoteamentos ?? 0,
  }
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

// ============================================================
// Buscar imóveis similares (mesma org, mesmo tipo ou bairro)
// ============================================================

export async function buscarImoveisSimilares(
  organizacaoId: string,
  imovelAtual: { id: string; tipo: string; bairro: string | null }
) {
  const supabase = criarClienteAdmin()

  // Buscar por mesmo tipo OU mesmo bairro, excluindo o imóvel atual
  let query = supabase
    .from("imoveis")
    .select("*, imovel_fotos(id, url, ordem, eh_capa)")
    .eq("organizacao_id", organizacaoId)
    .eq("status", "disponivel")
    .eq("publicar_site", true)
    .neq("id", imovelAtual.id)

  // Filtrar por tipo OU bairro
  const filtros = [`tipo.eq.${imovelAtual.tipo}`]
  if (imovelAtual.bairro) {
    filtros.push(`bairro.eq.${imovelAtual.bairro}`)
  }
  query = query.or(filtros.join(","))

  const { data } = await query
    .order("created_at", { ascending: false })
    .limit(3)

  return data ?? []
}

// ============================================================
// Tipos de filtros para loteamentos públicos
// ============================================================

export type FiltrosLoteamentosPublico = {
  status?: string
  cidade?: string
  busca?: string
  pagina?: number
}

// ============================================================
// Contar loteamentos publicados (para header condicional)
// ============================================================

export async function contarLoteamentosPublicados(organizacaoId: string) {
  const supabase = criarClienteAdmin()

  const { count } = await supabase
    .from("loteamentos")
    .select("id", { count: "exact", head: true })
    .eq("organizacao_id", organizacaoId)
    .in("status", ["lancamento", "em_vendas"])
    .eq("publicar_site", true)

  return count ?? 0
}

// ============================================================
// Buscar loteamentos públicos com filtros e paginação
// ============================================================

export async function buscarLoteamentosPublicos(
  organizacaoId: string,
  filtros: FiltrosLoteamentosPublico = {}
) {
  const supabase = criarClienteAdmin()
  const pagina = filtros.pagina || 1
  const { inicio, fim } = calcularRange(pagina, POR_PAGINA)

  let query = supabase
    .from("loteamentos")
    .select(
      "*, loteamento_fotos(id, url, ordem, eh_capa), lotes(valor, status)",
      { count: "exact" }
    )
    .eq("organizacao_id", organizacaoId)
    .in("status", ["lancamento", "em_vendas"])
    .eq("publicar_site", true)

  if (filtros.status) {
    query = query.eq("status", filtros.status)
  }
  if (filtros.cidade) {
    query = query.ilike("cidade", `%${filtros.cidade}%`)
  }
  if (filtros.busca) {
    query = query.or(
      `nome.ilike.%${filtros.busca}%,bairro.ilike.%${filtros.busca}%,cidade.ilike.%${filtros.busca}%`
    )
  }

  const { data, count } = await query
    .order("created_at", { ascending: false })
    .range(inicio, fim)

  return {
    loteamentos: data ?? [],
    total: count ?? 0,
    totalPaginas: calcularTotalPaginas(count ?? 0, POR_PAGINA),
    paginaAtual: pagina,
  }
}

// ============================================================
// Buscar loteamentos em destaque (home — últimos 3 publicados)
// ============================================================

export async function buscarLoteamentosDestaque(organizacaoId: string) {
  const supabase = criarClienteAdmin()

  const { data } = await supabase
    .from("loteamentos")
    .select("*, loteamento_fotos(id, url, ordem, eh_capa), lotes(valor, status)")
    .eq("organizacao_id", organizacaoId)
    .in("status", ["lancamento", "em_vendas"])
    .eq("publicar_site", true)
    .order("created_at", { ascending: false })
    .limit(3)

  return data ?? []
}

// ============================================================
// Buscar um loteamento específico com fotos e lotes
// ============================================================

export async function buscarLoteamentoPublico(
  organizacaoId: string,
  loteamentoId: string
) {
  const supabase = criarClienteAdmin()

  const { data } = await supabase
    .from("loteamentos")
    .select("*, loteamento_fotos(*), lotes(*)")
    .eq("organizacao_id", organizacaoId)
    .eq("id", loteamentoId)
    .in("status", ["lancamento", "em_vendas"])
    .eq("publicar_site", true)
    .single()

  return data
}

// ============================================================
// Buscar outros loteamentos (excluindo o atual)
// ============================================================

export async function buscarOutrosLoteamentos(
  organizacaoId: string,
  excluirId: string
) {
  const supabase = criarClienteAdmin()

  const { data } = await supabase
    .from("loteamentos")
    .select("*, loteamento_fotos(id, url, ordem, eh_capa), lotes(valor, status)")
    .eq("organizacao_id", organizacaoId)
    .in("status", ["lancamento", "em_vendas"])
    .eq("publicar_site", true)
    .neq("id", excluirId)
    .order("created_at", { ascending: false })
    .limit(3)

  return data ?? []
}
