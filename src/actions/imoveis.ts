"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { criarClienteServer } from "@/lib/supabase/server"
import { verificarLimiteImoveis } from "@/lib/verificar-limites"
import { verificarPermissao } from "@/lib/permissoes"
import { schemaCriarImovel, schemaAtualizarImovel } from "@/types/imoveis"
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
// Criar imóvel
// ============================================================

export async function criarImovel(
  _estado: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  const dados = schemaCriarImovel.safeParse({
    codigo: formData.get("codigo"),
    titulo: formData.get("titulo"),
    descricao: formData.get("descricao") || undefined,
    tipo: formData.get("tipo"),
    finalidade: formData.get("finalidade"),
    cep: formData.get("cep") || undefined,
    logradouro: formData.get("logradouro") || undefined,
    numero: formData.get("numero") || undefined,
    complemento: formData.get("complemento") || undefined,
    bairro: formData.get("bairro") || undefined,
    cidade: formData.get("cidade"),
    estado: formData.get("estado"),
    preco_venda: formData.get("preco_venda") || undefined,
    preco_aluguel: formData.get("preco_aluguel") || undefined,
    iptu: formData.get("iptu") || undefined,
    condominio: formData.get("condominio") || undefined,
    area_total: formData.get("area_total") || undefined,
    area_construida: formData.get("area_construida") || undefined,
    quartos: formData.get("quartos") || 0,
    suites: formData.get("suites") || 0,
    banheiros: formData.get("banheiros") || 0,
    vagas_garagem: formData.get("vagas_garagem") || 0,
    andares: formData.get("andares") || undefined,
    observacoes_internas: formData.get("observacoes_internas") || undefined,
    publicar_site: formData.get("publicar_site") === "on" || formData.get("publicar_site") === "true",
    publicar_portais: formData.get("publicar_portais") === "on" || formData.get("publicar_portais") === "true",
  })

  if (!dados.success) {
    return { erro: dados.error.issues[0].message }
  }

  const usuario = await buscarUsuarioLogado()
  if (!usuario) {
    return { erro: "Usuário não autenticado" }
  }

  // Verificar limite de imóveis do plano
  const limite = await verificarLimiteImoveis(usuario.organizacao_id)
  if (!limite.permitido) {
    return { erro: limite.mensagem! }
  }

  const supabase = await criarClienteServer()

  const { data: imovel, error } = await supabase
    .from("imoveis")
    .insert({
      ...dados.data,
      organizacao_id: usuario.organizacao_id,
      corretor_id: usuario.id,
    })
    .select("id")
    .single()

  if (error) {
    if (error.code === "23505") {
      return { erro: "Já existe um imóvel com este código" }
    }
    return { erro: "Erro ao cadastrar imóvel. Tente novamente." }
  }

  redirect(`/imoveis/${imovel.id}`)
}

// ============================================================
// Atualizar imóvel
// ============================================================

export async function atualizarImovel(
  _estado: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  const dados = schemaAtualizarImovel.safeParse({
    id: formData.get("id"),
    codigo: formData.get("codigo"),
    titulo: formData.get("titulo"),
    descricao: formData.get("descricao") || undefined,
    tipo: formData.get("tipo"),
    finalidade: formData.get("finalidade"),
    status: formData.get("status") || undefined,
    cep: formData.get("cep") || undefined,
    logradouro: formData.get("logradouro") || undefined,
    numero: formData.get("numero") || undefined,
    complemento: formData.get("complemento") || undefined,
    bairro: formData.get("bairro") || undefined,
    cidade: formData.get("cidade"),
    estado: formData.get("estado"),
    preco_venda: formData.get("preco_venda") || undefined,
    preco_aluguel: formData.get("preco_aluguel") || undefined,
    iptu: formData.get("iptu") || undefined,
    condominio: formData.get("condominio") || undefined,
    area_total: formData.get("area_total") || undefined,
    area_construida: formData.get("area_construida") || undefined,
    quartos: formData.get("quartos") || 0,
    suites: formData.get("suites") || 0,
    banheiros: formData.get("banheiros") || 0,
    vagas_garagem: formData.get("vagas_garagem") || 0,
    andares: formData.get("andares") || undefined,
    observacoes_internas: formData.get("observacoes_internas") || undefined,
    publicar_site: formData.get("publicar_site") === "on" || formData.get("publicar_site") === "true",
    publicar_portais: formData.get("publicar_portais") === "on" || formData.get("publicar_portais") === "true",
  })

  if (!dados.success) {
    return { erro: dados.error.issues[0].message }
  }

  const usuario = await buscarUsuarioLogado()
  if (!usuario) {
    return { erro: "Usuário não autenticado" }
  }

  const supabase = await criarClienteServer()
  const { id, ...camposAtualizar } = dados.data

  const { error } = await supabase
    .from("imoveis")
    .update(camposAtualizar)
    .eq("id", id)

  if (error) {
    if (error.code === "23505") {
      return { erro: "Já existe um imóvel com este código" }
    }
    return { erro: "Erro ao atualizar imóvel. Tente novamente." }
  }

  redirect(`/imoveis/${id}`)
}

// ============================================================
// Excluir imóvel
// ============================================================

export async function excluirImovel(id: string): Promise<EstadoFormulario> {
  const usuario = await buscarUsuarioLogado()
  if (!usuario) {
    return { erro: "Usuário não autenticado" }
  }

  const permissao = verificarPermissao(usuario.cargo as "admin" | "corretor" | "gerente", "excluir_registros")
  if (permissao.erro) {
    return permissao
  }

  const supabase = await criarClienteServer()

  const { error } = await supabase.from("imoveis").delete().eq("id", id)

  if (error) {
    return { erro: "Erro ao excluir imóvel. Tente novamente." }
  }

  redirect("/imoveis")
}

// ============================================================
// Alterar status do imóvel
// ============================================================

export async function alterarStatusImovel(
  id: string,
  status: string
): Promise<EstadoFormulario> {
  const statusValidos = [
    "disponivel",
    "reservado",
    "vendido",
    "alugado",
    "inativo",
  ]
  if (!statusValidos.includes(status)) {
    return { erro: "Status inválido" }
  }

  const usuario = await buscarUsuarioLogado()
  if (!usuario) {
    return { erro: "Usuário não autenticado" }
  }

  const supabase = await criarClienteServer()

  const { error } = await supabase
    .from("imoveis")
    .update({ status })
    .eq("id", id)

  if (error) {
    return { erro: "Erro ao alterar status. Tente novamente." }
  }

  revalidatePath("/imoveis")
  return { sucesso: "Status atualizado com sucesso" }
}
