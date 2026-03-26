"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { criarClienteServer } from "@/lib/supabase/server"
import { verificarPermissao } from "@/lib/permissoes"
import {
  schemaCriarAtividade,
  schemaAtualizarAtividade,
} from "@/types/atividades"
import type { EstadoFormulario } from "@/types/formulario"
import { buscarUsuarioLogado } from "@/lib/buscar-usuario-logado"

// ============================================================
// Helpers
// ============================================================

function revalidarAtividades(id?: string) {
  revalidatePath("/atividades")
  revalidatePath("/")
  if (id) revalidatePath(`/atividades/${id}`)
}

// ============================================================
// Criar atividade
// ============================================================

export async function criarAtividade(
  _estado: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  const dados = schemaCriarAtividade.safeParse({
    titulo: formData.get("titulo"),
    tipo: formData.get("tipo"),
    prioridade: formData.get("prioridade") || "media",
    data_vencimento: formData.get("data_vencimento"),
    descricao: formData.get("descricao") || undefined,
    cliente_id: formData.get("cliente_id") || undefined,
    negocio_id: formData.get("negocio_id") || undefined,
    imovel_id: formData.get("imovel_id") || undefined,
  })

  if (!dados.success) {
    return { erro: dados.error.issues[0].message }
  }

  const usuario = await buscarUsuarioLogado()
  if (!usuario) {
    return { erro: "Usuário não autenticado" }
  }

  const supabase = await criarClienteServer()

  const { data: atividade, error } = await supabase
    .from("atividades")
    .insert({
      ...dados.data,
      cliente_id: dados.data.cliente_id || null,
      negocio_id: dados.data.negocio_id || null,
      imovel_id: dados.data.imovel_id || null,
      organizacao_id: usuario.organizacao_id,
      usuario_id: usuario.id,
    })
    .select("id")
    .single()

  if (error) {
    return { erro: "Erro ao criar atividade. Tente novamente." }
  }

  revalidarAtividades(atividade.id)
  redirect(`/atividades/${atividade.id}`)
}

// ============================================================
// Atualizar atividade
// ============================================================

export async function atualizarAtividade(
  _estado: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  const dados = schemaAtualizarAtividade.safeParse({
    id: formData.get("id"),
    titulo: formData.get("titulo"),
    tipo: formData.get("tipo"),
    prioridade: formData.get("prioridade") || "media",
    data_vencimento: formData.get("data_vencimento"),
    descricao: formData.get("descricao") || undefined,
    cliente_id: formData.get("cliente_id") || undefined,
    negocio_id: formData.get("negocio_id") || undefined,
    imovel_id: formData.get("imovel_id") || undefined,
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
    .from("atividades")
    .update({
      ...camposAtualizar,
      cliente_id: camposAtualizar.cliente_id || null,
      negocio_id: camposAtualizar.negocio_id || null,
      imovel_id: camposAtualizar.imovel_id || null,
    })
    .eq("id", id)

  if (error) {
    return { erro: "Erro ao atualizar atividade. Tente novamente." }
  }

  revalidarAtividades(id)
  redirect(`/atividades/${id}`)
}

// ============================================================
// Excluir atividade (admin/gerente)
// ============================================================

export async function excluirAtividade(id: string): Promise<EstadoFormulario> {
  const usuario = await buscarUsuarioLogado()
  if (!usuario) {
    return { erro: "Usuário não autenticado" }
  }

  const permissao = verificarPermissao(usuario.cargo as "admin" | "corretor" | "gerente", "excluir_registros")
  if (permissao.erro) {
    return permissao
  }

  const supabase = await criarClienteServer()

  const { error } = await supabase.from("atividades").delete().eq("id", id)

  if (error) {
    return { erro: "Erro ao excluir atividade. Tente novamente." }
  }

  redirect("/atividades")
}

// ============================================================
// Marcar como concluída
// ============================================================

export async function marcarConcluida(
  id: string
): Promise<EstadoFormulario> {
  const usuario = await buscarUsuarioLogado()
  if (!usuario) {
    return { erro: "Usuário não autenticado" }
  }

  const supabase = await criarClienteServer()

  const { error } = await supabase
    .from("atividades")
    .update({
      status: "concluida",
      data_conclusao: new Date().toISOString(),
    })
    .eq("id", id)

  if (error) {
    return { erro: "Erro ao concluir atividade. Tente novamente." }
  }

  revalidarAtividades(id)
  return { sucesso: "Atividade concluída!" }
}

// ============================================================
// Reagendar atividade
// ============================================================

export async function reagendarAtividade(
  id: string,
  dataVencimento: string
): Promise<EstadoFormulario> {
  const usuario = await buscarUsuarioLogado()
  if (!usuario) {
    return { erro: "Usuário não autenticado" }
  }

  const supabase = await criarClienteServer()

  const { error } = await supabase
    .from("atividades")
    .update({
      data_vencimento: dataVencimento,
    })
    .eq("id", id)

  if (error) {
    return { erro: "Erro ao reagendar atividade. Tente novamente." }
  }

  revalidarAtividades(id)
  return { sucesso: "Atividade reagendada!" }
}

// ============================================================
// Cancelar atividade
// ============================================================

export async function cancelarAtividade(id: string): Promise<EstadoFormulario> {
  const usuario = await buscarUsuarioLogado()
  if (!usuario) {
    return { erro: "Usuário não autenticado" }
  }

  const supabase = await criarClienteServer()

  const { error } = await supabase
    .from("atividades")
    .update({ status: "cancelada" })
    .eq("id", id)

  if (error) {
    return { erro: "Erro ao cancelar atividade. Tente novamente." }
  }

  revalidarAtividades(id)
  return { sucesso: "Atividade cancelada" }
}

// ============================================================
// Reabrir atividade (cancelada → pendente)
// ============================================================

export async function reabrirAtividade(id: string): Promise<EstadoFormulario> {
  const usuario = await buscarUsuarioLogado()
  if (!usuario) {
    return { erro: "Usuário não autenticado" }
  }

  const supabase = await criarClienteServer()

  const { error } = await supabase
    .from("atividades")
    .update({
      status: "pendente",
      data_conclusao: null,
    })
    .eq("id", id)

  if (error) {
    return { erro: "Erro ao reabrir atividade. Tente novamente." }
  }

  revalidarAtividades(id)
  return { sucesso: "Atividade reaberta" }
}
