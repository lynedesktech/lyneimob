"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { criarClienteServer } from "@/lib/supabase/server"
import { verificarLimiteImoveis } from "@/lib/verificar-limites"
import { verificarPermissao } from "@/lib/permissoes"
import { schemaCriarImovel, schemaAtualizarImovel } from "@/types/imoveis"
import type { EstadoFormulario } from "@/types/formulario"
import { buscarUsuarioLogado } from "@/lib/buscar-usuario-logado"

// ============================================================
// Criar imóvel
// ============================================================

export async function criarImovel(
  _estado: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  const dados = schemaCriarImovel.safeParse({
    codigo_interno: formData.get("codigo_interno"),
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
    valor: formData.get("valor") || undefined,
    valor_condominio: formData.get("valor_condominio") || undefined,
    valor_iptu: formData.get("valor_iptu") || undefined,
    area_total: formData.get("area_total") || undefined,
    area_construida: formData.get("area_construida") || undefined,
    quartos: formData.get("quartos") || 0,
    suites: formData.get("suites") || 0,
    banheiros: formData.get("banheiros") || 0,
    vagas: formData.get("vagas") || 0,
    destaque: formData.get("destaque") === "on" || formData.get("destaque") === "true",
    publicar_site: formData.get("publicar_site") === "on" || formData.get("publicar_site") === "true",
    publicar_portais: formData.get("publicar_portais") === "on" || formData.get("publicar_portais") === "true",
    latitude: formData.get("latitude") || undefined,
    longitude: formData.get("longitude") || undefined,
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

  // Auto-gerar código interno se não fornecido
  let codigoInterno = dados.data.codigo_interno
  if (!codigoInterno) {
    const { count } = await supabase
      .from("imoveis")
      .select("id", { count: "exact", head: true })
      .eq("organizacao_id", usuario.organizacao_id)

    const sequencial = (count ?? 0) + 1
    codigoInterno = `IMO-${String(sequencial).padStart(3, "0")}`
  }

  // Campos do Zod schema correspondem 1:1 às colunas do banco live
  const { data: imovel, error } = await supabase
    .from("imoveis")
    .insert({
      ...dados.data,
      codigo_interno: codigoInterno,
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

  revalidatePath("/imoveis")
  revalidatePath("/")
  return { sucesso: "Imóvel cadastrado com sucesso!", redirectUrl: `/imoveis/${imovel.id}` }
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
    codigo_interno: formData.get("codigo_interno"),
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
    valor: formData.get("valor") || undefined,
    valor_condominio: formData.get("valor_condominio") || undefined,
    valor_iptu: formData.get("valor_iptu") || undefined,
    area_total: formData.get("area_total") || undefined,
    area_construida: formData.get("area_construida") || undefined,
    quartos: formData.get("quartos") || 0,
    suites: formData.get("suites") || 0,
    banheiros: formData.get("banheiros") || 0,
    vagas: formData.get("vagas") || 0,
    destaque: formData.get("destaque") === "on" || formData.get("destaque") === "true",
    publicar_site: formData.get("publicar_site") === "on" || formData.get("publicar_site") === "true",
    publicar_portais: formData.get("publicar_portais") === "on" || formData.get("publicar_portais") === "true",
    latitude: formData.get("latitude") || undefined,
    longitude: formData.get("longitude") || undefined,
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

  revalidatePath("/imoveis")
  revalidatePath(`/imoveis/${id}`)
  return { sucesso: "Imóvel atualizado com sucesso!", redirectUrl: `/imoveis/${id}` }
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
