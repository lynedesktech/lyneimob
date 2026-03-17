"use server"

import { criarClienteServer } from "@/lib/supabase/server"
import { criarClienteAdmin } from "@/lib/supabase/admin"
import { gerarResumoParaOrganizacao, obterLimitesSemana, formatarDateISO } from "@/lib/resumo-semanal/gerar-resumo"
import type { ResumoSemanal } from "@/types/resumo-semanal"
import type { EstadoFormulario } from "@/types/formulario"

// ============================================================
// Helper
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
// Buscar resumo semanal (somente leitura — nao gera nada)
// ============================================================

export async function buscarResumoSemanal(): Promise<
  EstadoFormulario & {
    resumo?: ResumoSemanal
    orgCriadaEm?: string
    status?: "com_resumo" | "sem_resumo"
  }
> {
  const usuario = await buscarUsuarioLogado()
  if (!usuario) return { erro: "Usuário não autenticado" }

  const { inicio } = obterLimitesSemana()
  const semanaInicioStr = formatarDateISO(inicio)

  const supabase = await criarClienteServer()

  // Buscar resumo da semana atual
  const { data: resumo } = await supabase
    .from("resumos_semanais")
    .select("*")
    .eq("organizacao_id", usuario.organizacao_id)
    .eq("semana_inicio", semanaInicioStr)
    .single()

  if (resumo) {
    return {
      sucesso: "Resumo carregado",
      status: "com_resumo",
      resumo: resumo as unknown as ResumoSemanal,
    }
  }

  // Sem resumo — retornar data de criacao da org para o componente saber se e conta nova
  const { data: org } = await supabase
    .from("organizacoes")
    .select("created_at")
    .eq("id", usuario.organizacao_id)
    .single()

  return {
    sucesso: "Sem resumo",
    status: "sem_resumo",
    orgCriadaEm: org?.created_at ?? undefined,
  }
}

// ============================================================
// Regenerar resumo (deleta o atual e gera novo via admin client)
// ============================================================

export async function regenerarResumoSemanal(): Promise<
  EstadoFormulario & { resumo?: ResumoSemanal }
> {
  const usuario = await buscarUsuarioLogado()
  if (!usuario) return { erro: "Usuário não autenticado" }

  const { inicio } = obterLimitesSemana()
  const semanaInicioStr = formatarDateISO(inicio)

  const supabaseAdmin = criarClienteAdmin()

  // Deletar resumo existente da semana
  await supabaseAdmin
    .from("resumos_semanais")
    .delete()
    .eq("organizacao_id", usuario.organizacao_id)
    .eq("semana_inicio", semanaInicioStr)

  // Gerar novo usando o admin client
  const resultado = await gerarResumoParaOrganizacao(supabaseAdmin, usuario.organizacao_id)

  if (!resultado.sucesso) {
    return { erro: resultado.erro ?? "Erro ao gerar resumo. Verifique a chave da OpenAI." }
  }

  // Se gerou com sucesso, buscar o resumo recem-criado
  const { data: novoResumo } = await supabaseAdmin
    .from("resumos_semanais")
    .select("*")
    .eq("organizacao_id", usuario.organizacao_id)
    .eq("semana_inicio", semanaInicioStr)
    .single()

  if (!novoResumo) {
    return { erro: "Resumo gerado mas não foi possível carregá-lo." }
  }

  return {
    sucesso: "Resumo atualizado",
    resumo: novoResumo as unknown as ResumoSemanal,
  }
}
