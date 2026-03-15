"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { criarClienteServer } from "@/lib/supabase/server"
import {
  schemaCriarNegocio,
  schemaAtualizarNegocio,
  schemaPerderNegocio,
} from "@/types/negocios"
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
// Criar negócio
// ============================================================

export async function criarNegocio(
  _estado: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  const dados = schemaCriarNegocio.safeParse({
    titulo: formData.get("titulo"),
    cliente_id: formData.get("cliente_id"),
    imovel_id: formData.get("imovel_id") || undefined,
    etapa_id: formData.get("etapa_id"),
    valor: formData.get("valor") || undefined,
    tipo: formData.get("tipo"),
    previsao_fechamento: formData.get("previsao_fechamento") || undefined,
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

  // Buscar maior posicao na etapa para adicionar no final
  const { data: ultimoNegocio } = await supabase
    .from("negocios")
    .select("posicao")
    .eq("etapa_id", dados.data.etapa_id)
    .order("posicao", { ascending: false })
    .limit(1)
    .single()

  const posicao = ultimoNegocio ? ultimoNegocio.posicao + 1 : 0

  const { data: negocio, error } = await supabase
    .from("negocios")
    .insert({
      ...dados.data,
      imovel_id: dados.data.imovel_id || null,
      organizacao_id: usuario.organizacao_id,
      corretor_id: usuario.id,
      posicao,
    })
    .select("id")
    .single()

  if (error) {
    return { erro: "Erro ao criar negócio. Tente novamente." }
  }

  redirect(`/negocios/${negocio.id}`)
}

// ============================================================
// Atualizar negócio
// ============================================================

export async function atualizarNegocio(
  _estado: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  const dados = schemaAtualizarNegocio.safeParse({
    id: formData.get("id"),
    titulo: formData.get("titulo"),
    cliente_id: formData.get("cliente_id"),
    imovel_id: formData.get("imovel_id") || undefined,
    etapa_id: formData.get("etapa_id"),
    valor: formData.get("valor") || undefined,
    tipo: formData.get("tipo"),
    previsao_fechamento: formData.get("previsao_fechamento") || undefined,
    observacoes: formData.get("observacoes") || undefined,
    status: formData.get("status") || undefined,
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
    .from("negocios")
    .update({
      ...camposAtualizar,
      imovel_id: camposAtualizar.imovel_id || null,
    })
    .eq("id", id)

  if (error) {
    return { erro: "Erro ao atualizar negócio. Tente novamente." }
  }

  redirect(`/negocios/${id}`)
}

// ============================================================
// Excluir negócio
// ============================================================

export async function excluirNegocio(id: string): Promise<EstadoFormulario> {
  const usuario = await buscarUsuarioLogado()
  if (!usuario) {
    return { erro: "Usuário não autenticado" }
  }

  if (usuario.cargo !== "admin") {
    return { erro: "Apenas administradores podem excluir negócios" }
  }

  const supabase = await criarClienteServer()

  const { error } = await supabase.from("negocios").delete().eq("id", id)

  if (error) {
    return { erro: "Erro ao excluir negócio. Tente novamente." }
  }

  redirect("/negocios")
}

// ============================================================
// Mover negócio no kanban (drag-and-drop)
// ============================================================

export async function moverNegocio(
  negocioId: string,
  etapaId: string,
  posicao: number
): Promise<EstadoFormulario> {
  const usuario = await buscarUsuarioLogado()
  if (!usuario) {
    return { erro: "Usuário não autenticado" }
  }

  const supabase = await criarClienteServer()

  const { error } = await supabase
    .from("negocios")
    .update({ etapa_id: etapaId, posicao })
    .eq("id", negocioId)

  if (error) {
    return { erro: "Erro ao mover negócio. Tente novamente." }
  }

  revalidatePath("/negocios")
  return { sucesso: "Negócio movido com sucesso" }
}

// ============================================================
// Ganhar negócio
// ============================================================

export async function ganharNegocio(
  id: string,
  valorFinal?: number
): Promise<EstadoFormulario> {
  const usuario = await buscarUsuarioLogado()
  if (!usuario) {
    return { erro: "Usuário não autenticado" }
  }

  const supabase = await criarClienteServer()

  // Buscar etapa do tipo "ganho"
  const { data: etapaGanho } = await supabase
    .from("pipeline_etapas")
    .select("id")
    .eq("organizacao_id", usuario.organizacao_id)
    .eq("tipo", "ganho")
    .single()

  if (!etapaGanho) {
    return { erro: "Etapa 'Ganho' não encontrada no pipeline" }
  }

  const atualizacao: Record<string, unknown> = {
    status: "ganho",
    etapa_id: etapaGanho.id,
    data_ganho: new Date().toISOString(),
  }

  if (valorFinal) {
    atualizacao.valor = valorFinal
  }

  const { error } = await supabase
    .from("negocios")
    .update(atualizacao)
    .eq("id", id)

  if (error) {
    return { erro: "Erro ao marcar como ganho. Tente novamente." }
  }

  revalidatePath("/negocios")
  revalidatePath(`/negocios/${id}`)
  return { sucesso: "Negócio ganho! Parabéns! 🎉" }
}

// ============================================================
// Perder negócio
// ============================================================

export async function perderNegocio(
  _estado: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  const dados = schemaPerderNegocio.safeParse({
    id: formData.get("id"),
    motivo_perda: formData.get("motivo_perda"),
  })

  if (!dados.success) {
    return { erro: dados.error.issues[0].message }
  }

  const usuario = await buscarUsuarioLogado()
  if (!usuario) {
    return { erro: "Usuário não autenticado" }
  }

  const supabase = await criarClienteServer()

  // Buscar etapa do tipo "perdido"
  const { data: etapaPerdido } = await supabase
    .from("pipeline_etapas")
    .select("id")
    .eq("organizacao_id", usuario.organizacao_id)
    .eq("tipo", "perdido")
    .single()

  if (!etapaPerdido) {
    return { erro: "Etapa 'Perdido' não encontrada no pipeline" }
  }

  const { error } = await supabase
    .from("negocios")
    .update({
      status: "perdido",
      etapa_id: etapaPerdido.id,
      motivo_perda: dados.data.motivo_perda,
      data_perda: new Date().toISOString(),
    })
    .eq("id", dados.data.id)

  if (error) {
    return { erro: "Erro ao marcar como perdido. Tente novamente." }
  }

  revalidatePath("/negocios")
  revalidatePath(`/negocios/${dados.data.id}`)
  return { sucesso: "Negócio marcado como perdido" }
}

// ============================================================
// Reabrir negócio (perdido → aberto)
// ============================================================

export async function reabrirNegocio(id: string): Promise<EstadoFormulario> {
  const usuario = await buscarUsuarioLogado()
  if (!usuario) {
    return { erro: "Usuário não autenticado" }
  }

  const supabase = await criarClienteServer()

  // Buscar primeira etapa normal
  const { data: primeiraEtapa } = await supabase
    .from("pipeline_etapas")
    .select("id")
    .eq("organizacao_id", usuario.organizacao_id)
    .eq("tipo", "normal")
    .order("ordem", { ascending: true })
    .limit(1)
    .single()

  if (!primeiraEtapa) {
    return { erro: "Nenhuma etapa disponível no pipeline" }
  }

  const { error } = await supabase
    .from("negocios")
    .update({
      status: "aberto",
      etapa_id: primeiraEtapa.id,
      data_ganho: null,
      data_perda: null,
      motivo_perda: null,
    })
    .eq("id", id)

  if (error) {
    return { erro: "Erro ao reabrir negócio. Tente novamente." }
  }

  revalidatePath("/negocios")
  revalidatePath(`/negocios/${id}`)
  return { sucesso: "Negócio reaberto com sucesso" }
}
