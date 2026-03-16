"use server"

import { criarClienteServer } from "@/lib/supabase/server"
import type {
  FiltrosExportacaoImoveis,
  FiltrosExportacaoClientes,
  FiltrosExportacaoNegocios,
  FiltrosExportacaoAtividades,
} from "@/types/exportacao"

// ============================================================
// Helpers
// ============================================================

const LIMITE_EXPORTACAO = 5000

async function buscarUsuarioLogado() {
  const supabase = await criarClienteServer()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("id, organizacao_id, cargo")
    .eq("id", user.id)
    .single()

  return usuario
}

// ============================================================
// Exportar Imóveis
// ============================================================

export async function buscarImoveisParaExportacao(
  filtros: FiltrosExportacaoImoveis
): Promise<{ erro?: string; dados?: Record<string, unknown>[] }> {
  const usuario = await buscarUsuarioLogado()
  if (!usuario) return { erro: "Usuário não autenticado." }

  const supabase = await criarClienteServer()

  let query = supabase
    .from("imoveis")
    .select("*")

  if (filtros.busca) {
    query = query.or(
      `titulo.ilike.%${filtros.busca}%,codigo.ilike.%${filtros.busca}%,bairro.ilike.%${filtros.busca}%`
    )
  }
  if (filtros.tipo) query = query.eq("tipo", filtros.tipo)
  if (filtros.finalidade) query = query.eq("finalidade", filtros.finalidade)
  if (filtros.status) query = query.eq("status", filtros.status)
  if (filtros.cidade) query = query.ilike("cidade", `%${filtros.cidade}%`)
  if (filtros.bairro) query = query.ilike("bairro", `%${filtros.bairro}%`)
  if (filtros.canal === "site") query = query.eq("publicar_site", true)
  if (filtros.canal === "portais") query = query.eq("publicar_portais", true)
  if (filtros.canal === "nenhum") query = query.eq("publicar_site", false).eq("publicar_portais", false)

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .limit(LIMITE_EXPORTACAO)

  if (error) return { erro: "Erro ao buscar imóveis." }

  return { dados: (data ?? []) as Record<string, unknown>[] }
}

// ============================================================
// Exportar Clientes
// ============================================================

export async function buscarClientesParaExportacao(
  filtros: FiltrosExportacaoClientes
): Promise<{ erro?: string; dados?: Record<string, unknown>[] }> {
  const usuario = await buscarUsuarioLogado()
  if (!usuario) return { erro: "Usuário não autenticado." }

  const supabase = await criarClienteServer()

  let query = supabase
    .from("clientes")
    .select("*")

  if (filtros.busca) {
    query = query.or(
      `nome.ilike.%${filtros.busca}%,email.ilike.%${filtros.busca}%,telefone.ilike.%${filtros.busca}%,cpf_cnpj.ilike.%${filtros.busca}%`
    )
  }
  if (filtros.tipo) query = query.eq("tipo", filtros.tipo)
  if (filtros.origem) query = query.eq("origem", filtros.origem)
  if (filtros.status) query = query.eq("status", filtros.status)

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .limit(LIMITE_EXPORTACAO)

  if (error) return { erro: "Erro ao buscar clientes." }

  return { dados: (data ?? []) as Record<string, unknown>[] }
}

// ============================================================
// Exportar Negócios
// ============================================================

export async function buscarNegociosParaExportacao(
  filtros: FiltrosExportacaoNegocios
): Promise<{ erro?: string; dados?: Record<string, unknown>[] }> {
  const usuario = await buscarUsuarioLogado()
  if (!usuario) return { erro: "Usuário não autenticado." }

  const supabase = await criarClienteServer()

  let query = supabase
    .from("negocios")
    .select("*, clientes(nome), imoveis(titulo, codigo), usuarios(nome), pipeline_etapas(nome)")

  if (filtros.corretor_id) query = query.eq("corretor_id", filtros.corretor_id)
  if (filtros.tipo) query = query.eq("tipo", filtros.tipo)
  if (filtros.valor_min) query = query.gte("valor", filtros.valor_min)
  if (filtros.valor_max) query = query.lte("valor", filtros.valor_max)
  if (filtros.status) query = query.eq("status", filtros.status)

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .limit(LIMITE_EXPORTACAO)

  if (error) return { erro: "Erro ao buscar negócios." }

  return { dados: (data ?? []) as Record<string, unknown>[] }
}

// ============================================================
// Exportar Atividades
// ============================================================

export async function buscarAtividadesParaExportacao(
  filtros: FiltrosExportacaoAtividades
): Promise<{ erro?: string; dados?: Record<string, unknown>[] }> {
  const usuario = await buscarUsuarioLogado()
  if (!usuario) return { erro: "Usuário não autenticado." }

  const supabase = await criarClienteServer()

  let query = supabase
    .from("atividades")
    .select("*, clientes(nome), negocios(titulo), usuarios(nome)")

  if (filtros.tipo) query = query.eq("tipo", filtros.tipo)
  if (filtros.status) query = query.eq("status", filtros.status)
  if (filtros.prioridade) query = query.eq("prioridade", filtros.prioridade)
  if (filtros.usuario_id) query = query.eq("usuario_id", filtros.usuario_id)
  if (filtros.data_inicio) query = query.gte("data_inicio", filtros.data_inicio)
  if (filtros.data_fim) query = query.lte("data_inicio", filtros.data_fim)

  const { data, error } = await query
    .order("data_inicio", { ascending: false })
    .limit(LIMITE_EXPORTACAO)

  if (error) return { erro: "Erro ao buscar atividades." }

  return { dados: (data ?? []) as Record<string, unknown>[] }
}
