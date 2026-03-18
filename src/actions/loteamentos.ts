"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { criarClienteServer } from "@/lib/supabase/server"
import { verificarPermissao } from "@/lib/permissoes"
import { verificarLimiteLoteamentos } from "@/lib/verificar-limites"
import {
  schemaCriarLoteamento,
  schemaAtualizarLoteamento,
  schemaCriarLote,
  schemaAtualizarLote,
} from "@/types/loteamentos"
import type { EstadoFormulario } from "@/types/formulario"
import { buscarUsuarioLogado } from "@/lib/buscar-usuario-logado"

// ============================================================
// Criar loteamento
// ============================================================

export async function criarLoteamento(
  _estado: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  const dados = schemaCriarLoteamento.safeParse({
    nome: formData.get("nome"),
    descricao: formData.get("descricao") || undefined,
    status: formData.get("status") || "em_vendas",
    cep: formData.get("cep") || undefined,
    logradouro: formData.get("logradouro") || undefined,
    numero: formData.get("numero") || undefined,
    complemento: formData.get("complemento") || undefined,
    bairro: formData.get("bairro") || undefined,
    cidade: formData.get("cidade"),
    estado: formData.get("estado"),
    publicar_site:
      formData.get("publicar_site") === "on" ||
      formData.get("publicar_site") === "true",
    observacoes_internas: formData.get("observacoes_internas") || undefined,
  })

  if (!dados.success) {
    return { erro: dados.error.issues[0].message }
  }

  const usuario = await buscarUsuarioLogado()
  if (!usuario) {
    return { erro: "Usuário não autenticado" }
  }

  // Verificar limite de loteamentos do plano
  const limite = await verificarLimiteLoteamentos(usuario.organizacao_id)
  if (!limite.permitido) {
    return { erro: limite.mensagem! }
  }

  const supabase = await criarClienteServer()

  const { data: loteamento, error } = await supabase
    .from("loteamentos")
    .insert({
      ...dados.data,
      organizacao_id: usuario.organizacao_id,
    })
    .select("id")
    .single()

  if (error) {
    if (error.code === "23505") {
      return { erro: "Já existe um loteamento com este nome" }
    }
    return { erro: "Erro ao cadastrar loteamento. Tente novamente." }
  }

  revalidatePath("/loteamentos")
  revalidatePath("/")
  redirect(`/loteamentos/${loteamento.id}`)
}

// ============================================================
// Atualizar loteamento
// ============================================================

export async function atualizarLoteamento(
  _estado: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  const dados = schemaAtualizarLoteamento.safeParse({
    id: formData.get("id"),
    nome: formData.get("nome"),
    descricao: formData.get("descricao") || undefined,
    status: formData.get("status") || "em_vendas",
    cep: formData.get("cep") || undefined,
    logradouro: formData.get("logradouro") || undefined,
    numero: formData.get("numero") || undefined,
    complemento: formData.get("complemento") || undefined,
    bairro: formData.get("bairro") || undefined,
    cidade: formData.get("cidade"),
    estado: formData.get("estado"),
    publicar_site:
      formData.get("publicar_site") === "on" ||
      formData.get("publicar_site") === "true",
    observacoes_internas: formData.get("observacoes_internas") || undefined,
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
    .from("loteamentos")
    .update(camposAtualizar)
    .eq("id", id)

  if (error) {
    return { erro: "Erro ao atualizar loteamento. Tente novamente." }
  }

  revalidatePath("/loteamentos")
  revalidatePath(`/loteamentos/${id}`)
  redirect(`/loteamentos/${id}`)
}

// ============================================================
// Excluir loteamento
// ============================================================

export async function excluirLoteamento(
  id: string
): Promise<EstadoFormulario> {
  const usuario = await buscarUsuarioLogado()
  if (!usuario) {
    return { erro: "Usuário não autenticado" }
  }

  const permissao = verificarPermissao(
    usuario.cargo as "admin" | "corretor" | "gerente",
    "excluir_registros"
  )
  if (permissao.erro) {
    return permissao
  }

  const supabase = await criarClienteServer()

  const { error } = await supabase
    .from("loteamentos")
    .delete()
    .eq("id", id)

  if (error) {
    return { erro: "Erro ao excluir loteamento. Tente novamente." }
  }

  redirect("/loteamentos")
}

// ============================================================
// Criar lote
// ============================================================

export async function criarLote(
  _estado: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  const dados = schemaCriarLote.safeParse({
    loteamento_id: formData.get("loteamento_id"),
    quadra: formData.get("quadra"),
    numero_lote: formData.get("numero_lote"),
    unidade: formData.get("unidade"),
    status: formData.get("status") || "disponivel",
    comprador: formData.get("comprador") || undefined,
    valor: formData.get("valor"),
    data_venda: formData.get("data_venda") || undefined,
    area: formData.get("area") || undefined,
    observacoes: formData.get("observacoes") || undefined,
  })

  if (!dados.success) {
    return { erro: dados.error.issues[0].message }
  }

  const usuario = await buscarUsuarioLogado()
  if (!usuario) {
    return { erro: "Usuário não autenticado" }
  }

  const supabase = await criarClienteServer()

  const { error } = await supabase.from("lotes").insert({
    ...dados.data,
    organizacao_id: usuario.organizacao_id,
  })

  if (error) {
    if (error.code === "23505") {
      return {
        erro: "Já existe um lote com esta quadra/número neste loteamento",
      }
    }
    return { erro: "Erro ao cadastrar lote. Tente novamente." }
  }

  revalidatePath("/loteamentos")
  revalidatePath(`/loteamentos/${dados.data.loteamento_id}`)
  return { sucesso: "Lote cadastrado com sucesso" }
}

// ============================================================
// Atualizar lote
// ============================================================

export async function atualizarLote(
  _estado: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  const dados = schemaAtualizarLote.safeParse({
    id: formData.get("id"),
    loteamento_id: formData.get("loteamento_id"),
    quadra: formData.get("quadra"),
    numero_lote: formData.get("numero_lote"),
    unidade: formData.get("unidade"),
    status: formData.get("status") || "disponivel",
    comprador: formData.get("comprador") || undefined,
    valor: formData.get("valor"),
    data_venda: formData.get("data_venda") || undefined,
    area: formData.get("area") || undefined,
    observacoes: formData.get("observacoes") || undefined,
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
    .from("lotes")
    .update(camposAtualizar)
    .eq("id", id)

  if (error) {
    if (error.code === "23505") {
      return {
        erro: "Já existe um lote com esta quadra/número neste loteamento",
      }
    }
    return { erro: "Erro ao atualizar lote. Tente novamente." }
  }

  revalidatePath("/loteamentos")
  revalidatePath(`/loteamentos/${dados.data.loteamento_id}`)
  return { sucesso: "Lote atualizado com sucesso" }
}

// ============================================================
// Excluir lote
// ============================================================

export async function excluirLote(id: string): Promise<EstadoFormulario> {
  const usuario = await buscarUsuarioLogado()
  if (!usuario) {
    return { erro: "Usuário não autenticado" }
  }

  const supabase = await criarClienteServer()

  // Buscar loteamento_id antes de excluir (pra revalidar o path correto)
  const { data: lote } = await supabase
    .from("lotes")
    .select("loteamento_id")
    .eq("id", id)
    .single()

  const { error } = await supabase.from("lotes").delete().eq("id", id)

  if (error) {
    return { erro: "Erro ao excluir lote. Tente novamente." }
  }

  if (lote) {
    revalidatePath("/loteamentos")
    revalidatePath(`/loteamentos/${lote.loteamento_id}`)
  }

  return { sucesso: "Lote excluído com sucesso" }
}

// ============================================================
// Alterar status do lote
// ============================================================

export async function alterarStatusLote(
  id: string,
  status: string
): Promise<EstadoFormulario> {
  const statusValidos = ["disponivel", "reservado", "vendido"]
  if (!statusValidos.includes(status)) {
    return { erro: "Status inválido" }
  }

  const usuario = await buscarUsuarioLogado()
  if (!usuario) {
    return { erro: "Usuário não autenticado" }
  }

  const supabase = await criarClienteServer()

  // Buscar loteamento_id pra revalidar
  const { data: lote } = await supabase
    .from("lotes")
    .select("loteamento_id")
    .eq("id", id)
    .single()

  const { error } = await supabase
    .from("lotes")
    .update({ status })
    .eq("id", id)

  if (error) {
    return { erro: "Erro ao alterar status. Tente novamente." }
  }

  if (lote) {
    revalidatePath("/loteamentos")
    revalidatePath(`/loteamentos/${lote.loteamento_id}`)
  }

  return { sucesso: "Status atualizado com sucesso" }
}
