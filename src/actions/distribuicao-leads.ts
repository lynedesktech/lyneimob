"use server"

import { revalidatePath } from "next/cache"
import { criarClienteServer } from "@/lib/supabase/server"
import { criarClienteAdmin } from "@/lib/supabase/admin"
import { verificarPermissao } from "@/lib/permissoes"
import { schemaSalvarConfigDistribuicao } from "@/types/distribuicao-leads"
import type { ConfigDistribuicao, CorretorComCarga } from "@/types/distribuicao-leads"
import type { EstadoFormulario } from "@/types/formulario"
import { buscarUsuarioLogado } from "@/lib/buscar-usuario-logado"

// ============================================================
// Buscar configuração de distribuição + corretores com carga
// ============================================================

export async function buscarConfigDistribuicao(): Promise<{
  config: ConfigDistribuicao
  corretores: CorretorComCarga[]
} | null> {
  const usuario = await buscarUsuarioLogado()
  if (!usuario) return null

  const permissao = verificarPermissao(
    usuario.cargo as "admin" | "corretor" | "gerente",
    "gerenciar_integracoes"
  )
  if (permissao.erro) return null

  const supabase = await criarClienteServer()

  // Buscar config da org
  const { data: org } = await supabase
    .from("organizacoes")
    .select("config_distribuicao")
    .eq("id", usuario.organizacao_id)
    .single()

  const config = (org?.config_distribuicao as ConfigDistribuicao) || {
    modo: "manual",
    corretores_participantes: [],
    ultimo_corretor_index: 0,
  }

  // Buscar corretores ativos da org
  const { data: usuarios } = await supabase
    .from("usuarios")
    .select("id, nome, cargo, ativo")
    .eq("organizacao_id", usuario.organizacao_id)
    .eq("ativo", true)
    .order("nome", { ascending: true })

  // Contar negócios abertos por corretor
  const { data: negocios } = await supabase
    .from("negocios")
    .select("corretor_id")
    .eq("organizacao_id", usuario.organizacao_id)
    .eq("status", "aberto")

  const contagemNegocios: Record<string, number> = {}
  if (negocios) {
    for (const n of negocios) {
      contagemNegocios[n.corretor_id] = (contagemNegocios[n.corretor_id] || 0) + 1
    }
  }

  const corretores: CorretorComCarga[] = (usuarios || []).map((u) => ({
    id: u.id,
    nome: u.nome,
    cargo: u.cargo,
    ativo: u.ativo,
    negocios_abertos: contagemNegocios[u.id] || 0,
    participa_distribuicao:
      config.corretores_participantes.length === 0 ||
      config.corretores_participantes.includes(u.id),
  }))

  return { config, corretores }
}

// ============================================================
// Salvar configuração de distribuição
// ============================================================

export async function salvarConfigDistribuicao(
  _estado: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  const usuario = await buscarUsuarioLogado()
  if (!usuario) {
    return { erro: "Usuário não autenticado" }
  }

  const permissao = verificarPermissao(
    usuario.cargo as "admin" | "corretor" | "gerente",
    "gerenciar_integracoes"
  )
  if (permissao.erro) {
    return permissao
  }

  // Parsear dados do formulário
  const modo = formData.get("modo") as string
  const corretoresJson = formData.get("corretores_participantes") as string
  let corretoresParticipantes: string[] = []

  if (corretoresJson) {
    try {
      corretoresParticipantes = JSON.parse(corretoresJson)
    } catch {
      corretoresParticipantes = []
    }
  }

  // Validar com Zod
  const validacao = schemaSalvarConfigDistribuicao.safeParse({
    modo,
    corretores_participantes: corretoresParticipantes,
  })

  if (!validacao.success) {
    return { erro: "Dados inválidos. Verifique os campos." }
  }

  const supabaseAdmin = criarClienteAdmin()

  // Buscar config atual para preservar ultimo_corretor_index (reseta se mudou de modo)
  const { data: orgAtual } = await supabaseAdmin
    .from("organizacoes")
    .select("config_distribuicao")
    .eq("id", usuario.organizacao_id)
    .single()

  const configAtual = (orgAtual?.config_distribuicao as ConfigDistribuicao) || {
    modo: "manual",
    corretores_participantes: [],
    ultimo_corretor_index: 0,
  }

  // Se o modo mudou, resetar o index da roleta
  const modoMudou = configAtual.modo !== validacao.data.modo
  const novaConfig: ConfigDistribuicao = {
    modo: validacao.data.modo,
    corretores_participantes: validacao.data.corretores_participantes,
    ultimo_corretor_index: modoMudou ? 0 : configAtual.ultimo_corretor_index,
  }

  const { error } = await supabaseAdmin
    .from("organizacoes")
    .update({ config_distribuicao: novaConfig })
    .eq("id", usuario.organizacao_id)

  if (error) {
    return { erro: "Erro ao salvar configuração. Tente novamente." }
  }

  revalidatePath("/configuracoes/distribuicao")
  return { sucesso: "Configuração de distribuição salva com sucesso!" }
}
