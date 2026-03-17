"use server"

import { revalidatePath } from "next/cache"
import { criarClienteServer } from "@/lib/supabase/server"
import type { EstadoFormulario } from "@/types/formulario"

// ============================================================
// Helpers
// ============================================================

async function buscarAdminOuGerente() {
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

  if (!usuario) return null
  if (!["admin", "gerente"].includes(usuario.cargo)) return null

  return { supabase, usuario }
}

function revalidarPipeline() {
  revalidatePath("/negocios")
  revalidatePath("/configuracoes/pipeline")
}

// ============================================================
// Criar etapa
// ============================================================

export async function criarEtapaPipeline(
  _estado: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  const nome = (formData.get("nome") as string)?.trim()
  const cor = (formData.get("cor") as string) || "#6b7280"

  if (!nome || nome.length < 2) {
    return { erro: "Nome deve ter pelo menos 2 caracteres" }
  }

  const ctx = await buscarAdminOuGerente()
  if (!ctx) return { erro: "Sem permissão para criar etapas" }

  const { supabase, usuario } = ctx

  // Descobrir a próxima ordem disponível
  const { data: ultima } = await supabase
    .from("pipeline_etapas")
    .select("ordem")
    .eq("organizacao_id", usuario.organizacao_id)
    .order("ordem", { ascending: false })
    .limit(1)
    .single()

  // Inserir antes das etapas ganho/perdido (que ficam no fim)
  const { data: etapasEspeciais } = await supabase
    .from("pipeline_etapas")
    .select("ordem")
    .eq("organizacao_id", usuario.organizacao_id)
    .in("tipo", ["ganho", "perdido"])
    .order("ordem", { ascending: true })
    .limit(1)

  // Nova etapa fica antes das especiais ou no fim
  const ordemEspecial = etapasEspeciais?.[0]?.ordem ?? null
  const ordemFim = (ultima?.ordem ?? -1) + 1
  const novaOrdem = ordemEspecial !== null ? ordemEspecial - 1 : ordemFim

  // Se precisar abrir espaço antes das etapas especiais, deslocar as demais
  if (ordemEspecial !== null) {
    const { data: etapasParaDeslocar } = await supabase
      .from("pipeline_etapas")
      .select("id, ordem")
      .eq("organizacao_id", usuario.organizacao_id)
      .gte("ordem", ordemEspecial)
      .order("ordem", { ascending: false })

    if (etapasParaDeslocar?.length) {
      for (const etapa of etapasParaDeslocar) {
        await supabase
          .from("pipeline_etapas")
          .update({ ordem: etapa.ordem + 1 })
          .eq("id", etapa.id)
      }
    }
  }

  const { error } = await supabase.from("pipeline_etapas").insert({
    organizacao_id: usuario.organizacao_id,
    nome,
    cor,
    icone: "circle",
    ordem: novaOrdem,
    tipo: "normal",
  })

  if (error) {
    if (error.code === "23505") return { erro: "Já existe uma etapa com esse nome" }
    return { erro: "Erro ao criar etapa. Tente novamente." }
  }

  revalidarPipeline()
  return { sucesso: "Etapa criada com sucesso!" }
}

// ============================================================
// Atualizar etapa
// ============================================================

export async function atualizarEtapaPipeline(
  _estado: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  const id = formData.get("id") as string
  const nome = (formData.get("nome") as string)?.trim()
  const cor = (formData.get("cor") as string) || "#6b7280"

  if (!id) return { erro: "ID da etapa não informado" }
  if (!nome || nome.length < 2) return { erro: "Nome deve ter pelo menos 2 caracteres" }

  const ctx = await buscarAdminOuGerente()
  if (!ctx) return { erro: "Sem permissão para editar etapas" }

  const { supabase } = ctx

  const { error } = await supabase
    .from("pipeline_etapas")
    .update({ nome, cor })
    .eq("id", id)

  if (error) {
    if (error.code === "23505") return { erro: "Já existe uma etapa com esse nome" }
    return { erro: "Erro ao atualizar etapa. Tente novamente." }
  }

  revalidarPipeline()
  return { sucesso: "Etapa atualizada!" }
}

// ============================================================
// Excluir etapa
// ============================================================

export async function excluirEtapaPipeline(id: string): Promise<EstadoFormulario> {
  const ctx = await buscarAdminOuGerente()
  if (!ctx) return { erro: "Sem permissão para excluir etapas" }

  const { supabase } = ctx

  // Verificar se é etapa especial (ganho/perdido)
  const { data: etapa } = await supabase
    .from("pipeline_etapas")
    .select("tipo, nome")
    .eq("id", id)
    .single()

  if (!etapa) return { erro: "Etapa não encontrada" }

  if (etapa.tipo === "ganho" || etapa.tipo === "perdido") {
    return { erro: `A etapa "${etapa.nome}" não pode ser excluída — ela registra negócios ${etapa.tipo === "ganho" ? "ganhos" : "perdidos"}` }
  }

  if (etapa.tipo === "pre_atendimento_ia") {
    return { erro: `A etapa "${etapa.nome}" não pode ser excluída — ela é obrigatória para o atendimento automático via WhatsApp` }
  }

  // Verificar se tem negócios ativos nessa etapa
  const { count } = await supabase
    .from("negocios")
    .select("id", { count: "exact", head: true })
    .eq("etapa_id", id)
    .eq("status", "aberto")

  if (count && count > 0) {
    return { erro: `Não é possível excluir: essa etapa tem ${count} negócio${count > 1 ? "s" : ""} em aberto. Mova-os primeiro.` }
  }

  const { error } = await supabase.from("pipeline_etapas").delete().eq("id", id)

  if (error) return { erro: "Erro ao excluir etapa. Tente novamente." }

  revalidarPipeline()
  return { sucesso: "Etapa excluída" }
}

// ============================================================
// Reordenar etapas
// ============================================================

export async function reordenarEtapasPipeline(
  idsNaOrdem: string[]
): Promise<EstadoFormulario> {
  const ctx = await buscarAdminOuGerente()
  if (!ctx) return { erro: "Sem permissão para reordenar etapas" }

  const { supabase } = ctx

  // Atualizar cada etapa com sua nova ordem (sem conflito pois removemos a constraint UNIQUE)
  for (let i = 0; i < idsNaOrdem.length; i++) {
    const { error } = await supabase
      .from("pipeline_etapas")
      .update({ ordem: i })
      .eq("id", idsNaOrdem[i])

    if (error) return { erro: "Erro ao reordenar etapas. Tente novamente." }
  }

  revalidarPipeline()
  return { sucesso: "Ordem atualizada!" }
}
