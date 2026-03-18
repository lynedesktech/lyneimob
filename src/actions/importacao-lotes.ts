"use server"

import { revalidatePath } from "next/cache"
import { criarClienteServer } from "@/lib/supabase/server"
import { schemaLinhaImportacaoLote } from "@/types/importacao-lotes"
import type {
  LinhaImportacaoLote,
  ResultadoImportacaoLotes,
} from "@/types/importacao-lotes"
import { buscarUsuarioLogado } from "@/lib/buscar-usuario-logado"

// ============================================================
// Importar lotes em massa
// ============================================================

export async function importarLotes(
  loteamentoId: string,
  linhas: LinhaImportacaoLote[]
): Promise<{ erro?: string; resultado?: ResultadoImportacaoLotes }> {
  const usuario = await buscarUsuarioLogado()
  if (!usuario) {
    return { erro: "Usuário não autenticado." }
  }

  if (!linhas.length) {
    return { erro: "Nenhum lote para importar." }
  }

  if (linhas.length > 1000) {
    return { erro: "Máximo de 1000 lotes por importação." }
  }

  // Verificar se o loteamento existe e pertence à organização
  const supabase = await criarClienteServer()

  const { data: loteamento } = await supabase
    .from("loteamentos")
    .select("id")
    .eq("id", loteamentoId)
    .single()

  if (!loteamento) {
    return { erro: "Loteamento não encontrado." }
  }

  // Revalidar cada linha no servidor (segurança)
  const linhasValidadas: LinhaImportacaoLote[] = []
  const errosValidacao: ResultadoImportacaoLotes["erros"] = []

  for (let i = 0; i < linhas.length; i++) {
    const resultado = schemaLinhaImportacaoLote.safeParse(linhas[i])
    if (resultado.success) {
      linhasValidadas.push(resultado.data)
    } else {
      errosValidacao.push({
        linha: i + 1,
        unidade: String(linhas[i].quadra || "") + "-" + String(linhas[i].numero_lote || ""),
        erro: resultado.error.issues[0].message,
      })
    }
  }

  if (!linhasValidadas.length) {
    return {
      erro: "Nenhum lote passou na validação.",
      resultado: { criados: 0, erros: errosValidacao },
    }
  }

  // Inserir em batches de 50
  const TAMANHO_BATCH = 50
  let totalCriados = 0
  const errosInsercao: ResultadoImportacaoLotes["erros"] = []

  for (let i = 0; i < linhasValidadas.length; i += TAMANHO_BATCH) {
    const batch = linhasValidadas.slice(i, i + TAMANHO_BATCH)

    const registros = batch.map((linha) => ({
      ...linha,
      unidade: linha.unidade || `${linha.quadra}-${linha.numero_lote}`,
      loteamento_id: loteamentoId,
      organizacao_id: usuario.organizacao_id,
      status: "disponivel" as const,
    }))

    const { data, error } = await supabase
      .from("lotes")
      .insert(registros)
      .select("id")

    if (error) {
      // Se batch falhou, tentar inserir um a um
      for (let j = 0; j < batch.length; j++) {
        const registro = {
          ...batch[j],
          unidade: batch[j].unidade || `${batch[j].quadra}-${batch[j].numero_lote}`,
          loteamento_id: loteamentoId,
          organizacao_id: usuario.organizacao_id,
          status: "disponivel" as const,
        }

        const { error: erroIndividual } = await supabase
          .from("lotes")
          .insert(registro)
          .select("id")
          .single()

        if (erroIndividual) {
          const linhaOriginal = i + j + 1
          errosInsercao.push({
            linha: linhaOriginal,
            unidade: `${batch[j].quadra}-${batch[j].numero_lote}`,
            erro:
              erroIndividual.code === "23505"
                ? "Lote já existe (quadra/número duplicado)"
                : erroIndividual.message,
          })
        } else {
          totalCriados++
        }
      }
    } else {
      totalCriados += data?.length ?? batch.length
    }
  }

  revalidatePath("/loteamentos")
  revalidatePath(`/loteamentos/${loteamentoId}`)

  return {
    resultado: {
      criados: totalCriados,
      erros: [...errosValidacao, ...errosInsercao],
    },
  }
}
