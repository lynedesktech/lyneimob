"use server"

import { gerarDescricaoIA, melhorarTextoIA, gerarTituloIA, salvarTextoIA } from "@/actions/ia-imoveis"
import { gerarScoreLead, gerarResumoCliente, matchInteligente } from "@/actions/ia-clientes"
import { analisarNegocio, sugerirAcao, analisarPerda } from "@/actions/ia-negocios"
import { gerarBriefingVisita, gerarSugestaoPosAtividade } from "@/actions/ia-atividades"
import { gerarDescricaoLoteamentoIA, melhorarTextoLoteamentoIA } from "@/actions/ia-loteamentos"
import { regenerarResumoSemanal } from "@/actions/resumo-semanal"

type ResultadoAcaoIA = {
  erro?: string
  sucesso?: string
  texto?: string
  resumo?: string
  dados?: unknown
}

/**
 * Executa uma ação de IA pelo ID.
 * Centraliza a chamada das server actions existentes.
 */
export async function executarAcaoIA(
  acaoId: string,
  entidadeId: string,
  dadosEntidade: Record<string, unknown>
): Promise<ResultadoAcaoIA> {
  switch (acaoId) {
    // ---- Imóvel ----
    case "gerar-descricao": {
      const res = await gerarDescricaoIA(entidadeId)
      if (res.erro) return { erro: res.erro }
      // Salvar automaticamente
      if (res.texto) await salvarTextoIA(entidadeId, "descricao_ia", res.texto)
      return { sucesso: res.sucesso, texto: res.texto }
    }
    case "melhorar-texto": {
      const descricaoAtual = (dadosEntidade.descricao_ia as string) || ""
      if (!descricaoAtual.trim()) return { erro: "Gere uma descrição primeiro antes de melhorar" }
      const res = await melhorarTextoIA(descricaoAtual, entidadeId)
      if (res.erro) return { erro: res.erro }
      if (res.texto) await salvarTextoIA(entidadeId, "descricao_ia", res.texto)
      return { sucesso: res.sucesso, texto: res.texto }
    }
    case "gerar-titulo": {
      const res = await gerarTituloIA(entidadeId)
      if (res.erro) return { erro: res.erro }
      if (res.texto) await salvarTextoIA(entidadeId, "titulo_ia", res.texto)
      return { sucesso: res.sucesso, texto: res.texto }
    }

    // ---- Cliente ----
    case "calcular-score": {
      const res = await gerarScoreLead(entidadeId)
      if (res.erro) return { erro: res.erro }
      return { sucesso: res.sucesso, texto: `Score: ${res.score ?? 0}/100`, dados: { score: res.score } }
    }
    case "gerar-resumo": {
      const res = await gerarResumoCliente(entidadeId)
      if (res.erro) return { erro: res.erro }
      return { sucesso: res.sucesso, texto: res.texto }
    }
    case "match-inteligente": {
      const res = await matchInteligente(entidadeId)
      if (res.erro) return { erro: res.erro }
      const sugestoes = (res.sugestoes ?? []) as { imovel_id: string; score: number; justificativa: string }[]
      const textoFormatado = sugestoes.length > 0
        ? sugestoes
            .map((s, i) => `${i + 1}. Score ${s.score}/100 — ${s.justificativa}\n   → /imoveis/${s.imovel_id}`)
            .join("\n\n")
        : "Nenhuma sugestão encontrada"
      return { sucesso: res.sucesso, texto: textoFormatado, dados: { sugestoes } }
    }

    // ---- Negócio ----
    case "analisar-contexto": {
      const res = await analisarNegocio(entidadeId)
      if (res.erro) return { erro: res.erro }
      return { sucesso: res.sucesso, texto: res.texto }
    }
    case "sugerir-acao": {
      const res = await sugerirAcao(entidadeId)
      if (res.erro) return { erro: res.erro }
      return { sucesso: res.sucesso, texto: formatarSugestaoAcao(res.texto) }
    }
    case "analisar-perda": {
      const res = await analisarPerda(entidadeId)
      if (res.erro) return { erro: res.erro }
      return { sucesso: res.sucesso, texto: res.texto }
    }

    // ---- Atividade ----
    case "gerar-briefing": {
      const res = await gerarBriefingVisita(entidadeId)
      if (res.erro) return { erro: res.erro }
      return { sucesso: res.sucesso, texto: res.texto }
    }
    case "sugerir-proximo-passo": {
      const res = await gerarSugestaoPosAtividade(entidadeId)
      if (res.erro) return { erro: res.erro }
      return { sucesso: res.sucesso, texto: res.texto }
    }

    // ---- Loteamento ----
    case "gerar-descricao-loteamento": {
      const res = await gerarDescricaoLoteamentoIA(entidadeId)
      if (res.erro) return { erro: res.erro }
      return { sucesso: res.sucesso, texto: res.texto }
    }
    case "melhorar-texto-loteamento": {
      const descricaoAtual = (dadosEntidade.descricao_ia as string) || ""
      if (!descricaoAtual.trim()) return { erro: "Gere uma descrição primeiro antes de melhorar" }
      const res = await melhorarTextoLoteamentoIA(descricaoAtual, entidadeId)
      if (res.erro) return { erro: res.erro }
      return { sucesso: res.sucesso, texto: res.texto }
    }

    // ---- Painel ----
    case "regenerar-resumo": {
      const res = await regenerarResumoSemanal()
      if (res.erro) return { erro: res.erro }
      const resumoConteudo = res.resumo?.conteudo
      return { sucesso: res.sucesso ?? "Resumo regenerado", texto: resumoConteudo ?? "Resumo gerado com sucesso" }
    }

    default:
      return { erro: "Ação não reconhecida" }
  }
}

/** Formata sugestão de ação (pode vir como JSON) */
function formatarSugestaoAcao(texto?: string): string {
  if (!texto) return ""
  try {
    const json = JSON.parse(texto)
    if (json.acao_resumida) {
      const partes = [`AÇÃO: ${json.acao_resumida}`]
      if (json.tipo_atividade) partes.push(`TIPO: ${json.tipo_atividade}`)
      if (json.prazo_dias) partes.push(`PRAZO: ${json.prazo_dias} dias`)
      if (json.detalhes) partes.push(`\nCOMO:\n${json.detalhes}`)
      if (json.script) partes.push(`\nSCRIPT:\n${json.script}`)
      return partes.join("\n")
    }
    return texto
  } catch {
    return texto
  }
}
