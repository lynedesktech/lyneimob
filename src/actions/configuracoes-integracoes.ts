"use server"

import { revalidatePath } from "next/cache"
import { criarClienteServer } from "@/lib/supabase/server"
import { verificarPermissao } from "@/lib/permissoes"
import { schemaConfiguracoesIntegracoes } from "@/types/configuracoes-integracoes"
import type { EstadoFormulario } from "@/types/formulario"

// ============================================================
// Helpers
// ============================================================

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
// Salvar configurações de integrações
// ============================================================

export async function salvarConfiguracoesIntegracoes(
  _estado: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  const usuario = await buscarUsuarioLogado()
  if (!usuario) {
    return { erro: "Você precisa estar logado para alterar as configurações." }
  }

  const permissao = verificarPermissao(usuario.cargo as "admin" | "corretor" | "gerente", "gerenciar_integracoes")
  if (permissao.erro) {
    return permissao
  }

  // Extrair dados do FormData
  const dadosJson = formData.get("integracoes") as string
  if (!dadosJson) {
    return { erro: "Dados inválidos." }
  }

  let dadosParseados: Record<string, string>
  try {
    dadosParseados = JSON.parse(dadosJson)
  } catch {
    return { erro: "Formato de dados inválido." }
  }

  const supabase = await criarClienteServer()

  // Buscar configurações atuais do banco para fazer merge
  const { data: orgAtual } = await supabase
    .from("organizacoes")
    .select("configuracoes_integracoes")
    .eq("id", usuario.organizacao_id)
    .single()

  const configAtuais = (orgAtual?.configuracoes_integracoes ?? {}) as Record<string, string>

  // Merge: campos vazios = manter atual, campos preenchidos = sobrescrever
  const configMerged: Record<string, string> = { ...configAtuais }

  for (const [campo, valor] of Object.entries(dadosParseados)) {
    if (valor && valor.trim().length > 0) {
      // Novo valor — sobrescrever
      configMerged[campo] = valor.trim()
    }
    // Se vazio, mantém o que já existe (não faz nada)
  }

  // Validar com Zod
  const resultado = schemaConfiguracoesIntegracoes.safeParse(configMerged)
  if (!resultado.success) {
    return { erro: "Dados de configuração inválidos. Verifique os campos." }
  }

  // Salvar no banco
  const { error } = await supabase
    .from("organizacoes")
    .update({
      configuracoes_integracoes: resultado.data,
    })
    .eq("id", usuario.organizacao_id)

  if (error) {
    return { erro: "Erro ao salvar configurações. Tente novamente." }
  }

  revalidatePath("/configuracoes")

  return { sucesso: "Configurações de integrações salvas com sucesso!" }
}

// ============================================================
// Remover chave de uma integração específica
// ============================================================

export async function removerChaveIntegracao(
  _estado: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  const usuario = await buscarUsuarioLogado()
  if (!usuario) {
    return { erro: "Você precisa estar logado." }
  }

  const permissao2 = verificarPermissao(usuario.cargo as "admin" | "corretor" | "gerente", "gerenciar_integracoes")
  if (permissao2.erro) {
    return permissao2
  }

  const campo = formData.get("campo") as string
  if (!campo) {
    return { erro: "Campo não especificado." }
  }

  // Validar que o campo é um campo válido do schema
  const camposValidos = Object.keys(schemaConfiguracoesIntegracoes.shape) as string[]
  if (!camposValidos.includes(campo)) {
    return { erro: "Campo inválido." }
  }

  const supabase = await criarClienteServer()

  // Buscar config atual
  const { data: orgAtual } = await supabase
    .from("organizacoes")
    .select("configuracoes_integracoes")
    .eq("id", usuario.organizacao_id)
    .single()

  const configAtuais = (orgAtual?.configuracoes_integracoes ?? {}) as Record<string, string>

  // Remover o campo
  delete configAtuais[campo]

  // Salvar no banco
  const { error } = await supabase
    .from("organizacoes")
    .update({
      configuracoes_integracoes: configAtuais,
    })
    .eq("id", usuario.organizacao_id)

  if (error) {
    return { erro: "Erro ao remover chave. Tente novamente." }
  }

  revalidatePath("/configuracoes")

  return { sucesso: "Chave removida com sucesso!" }
}
