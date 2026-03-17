"use server"

import { revalidatePath } from "next/cache"
import { criarClienteServer } from "@/lib/supabase/server"
import { verificarPermissao } from "@/lib/permissoes"
import type { EstadoFormulario } from "@/types/formulario"
import { z } from "zod"

// ============================================================
// Schema
// ============================================================

const schemaConfigOrg = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  telefone: z.string().optional().default(""),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  logradouro: z.string().optional().default(""),
  numero: z.string().optional().default(""),
  bairro: z.string().optional().default(""),
  cidade: z.string().optional().default(""),
  estado: z.string().optional().default(""),
  cep: z.string().optional().default(""),
  creci: z.string().optional().default(""),
  whatsapp_numero: z.string().optional().default(""),
})

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
// Salvar configurações da organização
// ============================================================

export async function salvarConfiguracoesOrganizacao(
  _estado: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  const usuario = await buscarUsuarioLogado()
  if (!usuario) {
    return { erro: "Você precisa estar logado para alterar as configurações." }
  }

  const permissao = verificarPermissao(
    usuario.cargo as "admin" | "corretor" | "gerente",
    "gerenciar_integracoes"
  )
  if (permissao.erro) {
    return permissao
  }

  const dadosJson = formData.get("dados") as string
  if (!dadosJson) {
    return { erro: "Dados inválidos." }
  }

  let dados: z.infer<typeof schemaConfigOrg>
  try {
    dados = schemaConfigOrg.parse(JSON.parse(dadosJson))
  } catch {
    return { erro: "Dados inválidos. Verifique os campos." }
  }

  const supabase = await criarClienteServer()

  const endereco = {
    logradouro: dados.logradouro,
    numero: dados.numero,
    bairro: dados.bairro,
    cidade: dados.cidade,
    estado: dados.estado,
    cep: dados.cep,
  }

  const { error } = await supabase
    .from("organizacoes")
    .update({
      nome: dados.nome,
      telefone: dados.telefone || null,
      email: dados.email || null,
      endereco,
      creci: dados.creci || null,
      whatsapp_numero: dados.whatsapp_numero || null,
    })
    .eq("id", usuario.organizacao_id)

  if (error) {
    return { erro: "Erro ao salvar configurações. Tente novamente." }
  }

  revalidatePath("/configuracoes")

  return { sucesso: "Configurações da imobiliária salvas com sucesso!" }
}
