"use server"

import { criarClienteServer } from "@/lib/supabase/server"
import type { ChaveEtapaOnboarding, ProgressoOnboarding, EtapasOnboarding } from "@/types/onboarding"

// ============================================================
// Buscar progresso do onboarding
// ============================================================

export async function buscarProgressoOnboarding(): Promise<ProgressoOnboarding | null> {
  const supabase = await criarClienteServer()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data } = await supabase
    .from("usuarios")
    .select("onboarding_completado, onboarding_etapas, organizacao_id")
    .eq("id", user.id)
    .single()

  if (!data) return null

  const etapas = (data.onboarding_etapas ?? {}) as EtapasOnboarding

  // Auto-detecção: se já existem dados na organização, marcar etapas automaticamente
  if (!etapas.imovel || !etapas.cliente || !etapas.negocio) {
    const orgId = data.organizacao_id
    const etapasAtualizadas = { ...etapas }
    let atualizou = false

    if (!etapas.imovel) {
      const { count } = await supabase
        .from("imoveis")
        .select("id", { count: "exact", head: true })
        .eq("organizacao_id", orgId)
        .limit(1)
      if (count && count > 0) {
        etapasAtualizadas.imovel = true
        atualizou = true
      }
    }

    if (!etapas.cliente) {
      const { count } = await supabase
        .from("clientes")
        .select("id", { count: "exact", head: true })
        .eq("organizacao_id", orgId)
        .limit(1)
      if (count && count > 0) {
        etapasAtualizadas.cliente = true
        atualizou = true
      }
    }

    if (!etapas.negocio) {
      const { count } = await supabase
        .from("negocios")
        .select("id", { count: "exact", head: true })
        .eq("organizacao_id", orgId)
        .limit(1)
      if (count && count > 0) {
        etapasAtualizadas.negocio = true
        atualizou = true
      }
    }

    // Persistir no banco se alguma etapa foi detectada
    if (atualizou) {
      await supabase
        .from("usuarios")
        .update({ onboarding_etapas: etapasAtualizadas })
        .eq("id", user.id)

      return {
        onboarding_completado: data.onboarding_completado,
        onboarding_etapas: etapasAtualizadas,
      }
    }
  }

  return {
    onboarding_completado: data.onboarding_completado,
    onboarding_etapas: etapas,
  }
}

// ============================================================
// Marcar tour de boas-vindas como concluído
// ============================================================

export async function marcarTourCompleto(): Promise<{ erro?: string }> {
  const supabase = await criarClienteServer()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { erro: "Usuário não autenticado" }

  const { error } = await supabase
    .from("usuarios")
    .update({ onboarding_completado: true })
    .eq("id", user.id)

  if (error) {
    console.error("[onboarding] Erro ao marcar tour completo:", error.message)
    return { erro: "Erro ao salvar progresso do tour" }
  }

  return {}
}

// ============================================================
// Marcar etapa do checklist como concluída
// ============================================================

export async function marcarEtapaChecklist(
  etapa: ChaveEtapaOnboarding
): Promise<{ erro?: string }> {
  const supabase = await criarClienteServer()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { erro: "Usuário não autenticado" }

  // Buscar etapas atuais
  const { data: usuario } = await supabase
    .from("usuarios")
    .select("onboarding_etapas")
    .eq("id", user.id)
    .single()

  if (!usuario) return { erro: "Usuário não encontrado" }

  const etapasAtuais = (usuario.onboarding_etapas ?? {}) as EtapasOnboarding
  const etapasNovas = { ...etapasAtuais, [etapa]: true }

  const { error } = await supabase
    .from("usuarios")
    .update({ onboarding_etapas: etapasNovas })
    .eq("id", user.id)

  if (error) {
    console.error("[onboarding] Erro ao marcar etapa:", error.message)
    return { erro: "Erro ao salvar progresso" }
  }

  return {}
}
