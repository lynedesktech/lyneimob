"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { criarClienteServer } from "@/lib/supabase/server"
import { verificarPermissao } from "@/lib/permissoes"
import {
  schemaCriarNegocio,
  schemaAtualizarNegocio,
  schemaPerderNegocio,
} from "@/types/negocios"
import type { EstadoFormulario } from "@/types/formulario"
import { buscarUsuarioLogado } from "@/lib/buscar-usuario-logado"

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

  const { data: negocio, error } = await supabase
    .from("negocios")
    .insert({
      organizacao_id: usuario.organizacao_id,
      corretor_id: usuario.id,
      titulo: dados.data.titulo,
      cliente_id: dados.data.cliente_id,
      imovel_id: dados.data.imovel_id || null,
      etapa_id: dados.data.etapa_id,
      valor: dados.data.valor ?? null,
      tipo: dados.data.tipo,
      status: "aberto",
      previsao_fechamento: dados.data.previsao_fechamento || null,
      observacoes: dados.data.observacoes || null,
    })
    .select("id")
    .single()

  if (error) {
    console.error("Erro ao criar negócio:", error)
    return { erro: "Erro ao criar negócio. Tente novamente." }
  }

  // Gerar sugestão de ação automaticamente (import dinâmico para não pesar o bundle)
  try {
    const { sugerirAcao } = await import("@/actions/ia-negocios")
    await sugerirAcao(negocio.id)
  } catch {
    // IA é opcional — não bloqueia o fluxo principal
  }

  revalidatePath("/negocios")
  revalidatePath("/")
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
  })

  if (!dados.success) {
    return { erro: dados.error.issues[0].message }
  }

  const usuario = await buscarUsuarioLogado()
  if (!usuario) {
    return { erro: "Usuário não autenticado" }
  }

  const supabase = await criarClienteServer()

  const { error } = await supabase
    .from("negocios")
    .update({
      titulo: dados.data.titulo,
      cliente_id: dados.data.cliente_id,
      imovel_id: dados.data.imovel_id || null,
      etapa_id: dados.data.etapa_id,
      valor: dados.data.valor ?? null,
      tipo: dados.data.tipo,
      previsao_fechamento: dados.data.previsao_fechamento || null,
      observacoes: dados.data.observacoes || null,
    })
    .eq("id", dados.data.id)

  if (error) {
    console.error("Erro ao atualizar negócio:", error)
    return { erro: "Erro ao atualizar negócio. Tente novamente." }
  }

  revalidatePath("/negocios")
  revalidatePath(`/negocios/${dados.data.id}`)
  redirect(`/negocios/${dados.data.id}`)
}

// ============================================================
// Excluir negócio
// ============================================================

export async function excluirNegocio(id: string): Promise<EstadoFormulario> {
  const usuario = await buscarUsuarioLogado()
  if (!usuario) {
    return { erro: "Usuário não autenticado" }
  }

  const permissao = verificarPermissao(usuario.cargo as "admin" | "corretor" | "gerente", "excluir_registros")
  if (permissao.erro) {
    return permissao
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
  posicao?: number
): Promise<EstadoFormulario> {
  const usuario = await buscarUsuarioLogado()
  if (!usuario) {
    return { erro: "Usuário não autenticado" }
  }

  const supabase = await criarClienteServer()

  const atualizacao: Record<string, unknown> = { etapa_id: etapaId }
  if (posicao !== undefined) {
    atualizacao.posicao = posicao
  }

  const { error } = await supabase
    .from("negocios")
    .update(atualizacao)
    .eq("id", negocioId)

  if (error) {
    return { erro: "Erro ao mover negócio. Tente novamente." }
  }

  // Atualizar sugestão de ação ao mudar de etapa (import dinâmico para não pesar o bundle)
  try {
    const { sugerirAcao } = await import("@/actions/ia-negocios")
    await sugerirAcao(negocioId)
  } catch {
    // IA é opcional — não bloqueia o fluxo principal
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

  // Buscar etapa do tipo "ganho" da organização
  const { data: etapaGanho } = await supabase
    .from("pipeline_etapas")
    .select("id")
    .eq("organizacao_id", usuario.organizacao_id)
    .eq("tipo", "ganho")
    .limit(1)
    .single()

  const atualizacao: Record<string, unknown> = {
    status: "ganho",
    data_ganho: new Date().toISOString(),
  }

  if (etapaGanho) {
    atualizacao.etapa_id = etapaGanho.id
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

  // Arquivar conversa WhatsApp associada, se houver
  await supabase
    .from("conversas_whatsapp")
    .update({ status: "arquivado" })
    .eq("negocio_id", id)
    .in("status", ["em_andamento", "qualificado", "encaminhado"])

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

  // Buscar etapa do tipo "perdido" da organização
  const { data: etapaPerdido } = await supabase
    .from("pipeline_etapas")
    .select("id")
    .eq("organizacao_id", usuario.organizacao_id)
    .eq("tipo", "perdido")
    .limit(1)
    .single()

  const atualizacao: Record<string, unknown> = {
    status: "perdido",
    motivo_perda: dados.data.motivo_perda,
    data_perda: new Date().toISOString(),
  }

  if (etapaPerdido) {
    atualizacao.etapa_id = etapaPerdido.id
  }

  const { error } = await supabase
    .from("negocios")
    .update(atualizacao)
    .eq("id", dados.data.id)

  if (error) {
    return { erro: "Erro ao marcar como perdido. Tente novamente." }
  }

  revalidatePath("/negocios")
  revalidatePath(`/negocios/${dados.data.id}`)
  return { sucesso: "Negócio marcado como perdido" }
}

// ============================================================
// Ações em Massa
// ============================================================

export async function excluirNegociosEmMassa(ids: string[]): Promise<EstadoFormulario> {
  if (!ids.length) return { erro: "Nenhum negócio selecionado" }

  const usuario = await buscarUsuarioLogado()
  if (!usuario) return { erro: "Usuário não autenticado" }

  const permissao = verificarPermissao(
    usuario.cargo as "admin" | "corretor" | "gerente",
    "excluir_registros"
  )
  if (permissao.erro) return permissao

  const supabase = await criarClienteServer()
  const { error } = await supabase.from("negocios").delete().in("id", ids)

  if (error) return { erro: "Erro ao excluir negócios. Tente novamente." }

  revalidatePath("/negocios")
  const n = ids.length
  return { sucesso: `${n} negócio${n !== 1 ? "s" : ""} excluído${n !== 1 ? "s" : ""}` }
}

export async function moverNegociosParaEtapa(
  ids: string[],
  etapaId: string
): Promise<EstadoFormulario> {
  if (!ids.length) return { erro: "Nenhum negócio selecionado" }

  const usuario = await buscarUsuarioLogado()
  if (!usuario) return { erro: "Usuário não autenticado" }

  const supabase = await criarClienteServer()
  const { error } = await supabase
    .from("negocios")
    .update({ etapa_id: etapaId })
    .in("id", ids)

  if (error) return { erro: "Erro ao mover negócios. Tente novamente." }

  revalidatePath("/negocios")
  const n = ids.length
  return { sucesso: `${n} negócio${n !== 1 ? "s" : ""} movido${n !== 1 ? "s" : ""}` }
}

export async function ganharNegociosEmMassa(ids: string[]): Promise<EstadoFormulario> {
  if (!ids.length) return { erro: "Nenhum negócio selecionado" }

  const usuario = await buscarUsuarioLogado()
  if (!usuario) return { erro: "Usuário não autenticado" }

  const supabase = await criarClienteServer()

  // Buscar etapa do tipo "ganho"
  const { data: etapaGanho } = await supabase
    .from("pipeline_etapas")
    .select("id")
    .eq("organizacao_id", usuario.organizacao_id)
    .eq("tipo", "ganho")
    .limit(1)
    .single()

  const atualizacao: Record<string, unknown> = {
    status: "ganho",
    data_ganho: new Date().toISOString(),
  }
  if (etapaGanho) atualizacao.etapa_id = etapaGanho.id

  const { error } = await supabase
    .from("negocios")
    .update(atualizacao)
    .in("id", ids)

  if (error) return { erro: "Erro ao marcar negócios como ganhos. Tente novamente." }

  revalidatePath("/negocios")
  const n = ids.length
  return { sucesso: `${n} negócio${n !== 1 ? "s" : ""} marcado${n !== 1 ? "s" : ""} como ganho` }
}

export async function perderNegociosEmMassa(
  ids: string[],
  motivo: string
): Promise<EstadoFormulario> {
  if (!ids.length) return { erro: "Nenhum negócio selecionado" }

  const usuario = await buscarUsuarioLogado()
  if (!usuario) return { erro: "Usuário não autenticado" }

  const supabase = await criarClienteServer()

  // Buscar etapa do tipo "perdido"
  const { data: etapaPerdido } = await supabase
    .from("pipeline_etapas")
    .select("id")
    .eq("organizacao_id", usuario.organizacao_id)
    .eq("tipo", "perdido")
    .limit(1)
    .single()

  const atualizacao: Record<string, unknown> = {
    status: "perdido",
    motivo_perda: motivo,
    data_perda: new Date().toISOString(),
  }
  if (etapaPerdido) atualizacao.etapa_id = etapaPerdido.id

  const { error } = await supabase
    .from("negocios")
    .update(atualizacao)
    .in("id", ids)

  if (error) return { erro: "Erro ao marcar negócios como perdidos. Tente novamente." }

  revalidatePath("/negocios")
  const n = ids.length
  return {
    sucesso: `${n} negócio${n !== 1 ? "s" : ""} marcado${n !== 1 ? "s" : ""} como perdido`,
  }
}

// ============================================================
// Reabrir negócio (perdido → primeira etapa normal)
// ============================================================

export async function reabrirNegocio(id: string): Promise<EstadoFormulario> {
  const usuario = await buscarUsuarioLogado()
  if (!usuario) {
    return { erro: "Usuário não autenticado" }
  }

  const supabase = await criarClienteServer()

  // Buscar primeira etapa normal da organização
  const { data: primeiraEtapa } = await supabase
    .from("pipeline_etapas")
    .select("id")
    .eq("organizacao_id", usuario.organizacao_id)
    .eq("tipo", "normal")
    .order("ordem", { ascending: true })
    .limit(1)
    .single()

  if (!primeiraEtapa) {
    return { erro: "Nenhuma etapa encontrada no pipeline" }
  }

  const { error } = await supabase
    .from("negocios")
    .update({
      status: "aberto",
      etapa_id: primeiraEtapa.id,
      motivo_perda: null,
      data_perda: null,
    })
    .eq("id", id)

  if (error) {
    return { erro: "Erro ao reabrir negócio. Tente novamente." }
  }

  revalidatePath("/negocios")
  revalidatePath(`/negocios/${id}`)
  return { sucesso: "Negócio reaberto com sucesso" }
}
