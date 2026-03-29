"use server"

import { revalidatePath } from "next/cache"
import { criarClienteServer } from "@/lib/supabase/server"
import { verificarLimiteImoveis } from "@/lib/verificar-limites"
import { schemaLinhaImportacao } from "@/types/importacao"
import type { LinhaImportacao, ResultadoImportacao } from "@/types/importacao"
import { buscarUsuarioLogado } from "@/lib/buscar-usuario-logado"

// ============================================================
// Importar imóveis em massa
// ============================================================

export async function importarImoveis(
  linhas: LinhaImportacao[]
): Promise<{ erro?: string; resultado?: ResultadoImportacao }> {
  const usuario = await buscarUsuarioLogado()
  if (!usuario) {
    return { erro: "Usuário não autenticado." }
  }

  if (!linhas.length) {
    return { erro: "Nenhum imóvel para importar." }
  }

  if (linhas.length > 500) {
    return { erro: "Máximo de 500 imóveis por importação." }
  }

  // Verificar limite do plano
  const limite = await verificarLimiteImoveis(usuario.organizacao_id)
  if (!limite.permitido) {
    return { erro: limite.mensagem! }
  }

  // Verificar se cabe dentro do limite
  const espacoDisponivel =
    limite.limite_max != null && limite.limite_atual != null
      ? limite.limite_max - limite.limite_atual
      : Infinity

  if (linhas.length > espacoDisponivel) {
    return {
      erro: `Seu plano permite mais ${espacoDisponivel} imóveis. Você tentou importar ${linhas.length}. Reduza a quantidade ou faça upgrade.`,
    }
  }

  // Revalidar cada linha no servidor (segurança)
  const linhasValidadas: LinhaImportacao[] = []
  const errosValidacao: ResultadoImportacao["erros"] = []

  for (let i = 0; i < linhas.length; i++) {
    const resultado = schemaLinhaImportacao.safeParse(linhas[i])
    if (resultado.success) {
      linhasValidadas.push(resultado.data)
    } else {
      errosValidacao.push({
        linha: i + 1,
        codigo_interno: String(linhas[i].codigo_interno || "—"),
        erro: resultado.error.issues[0].message,
      })
    }
  }

  if (!linhasValidadas.length) {
    return {
      erro: "Nenhum imóvel passou na validação.",
      resultado: { criados: 0, erros: errosValidacao },
    }
  }

  // Inserir em batches de 50
  const supabase = await criarClienteServer()
  const TAMANHO_BATCH = 50
  let totalCriados = 0
  const errosInsercao: ResultadoImportacao["erros"] = []

  for (let i = 0; i < linhasValidadas.length; i += TAMANHO_BATCH) {
    const batch = linhasValidadas.slice(i, i + TAMANHO_BATCH)

    const registros = batch.map((linha) => ({
      ...linha,
      organizacao_id: usuario.organizacao_id,
      corretor_id: usuario.id,
      status: "disponivel" as const,
      publicar_site: true,
      publicar_portais: true,
    }))

    const { data, error } = await supabase
      .from("imoveis")
      .insert(registros)
      .select("id")

    if (error) {
      // Se batch falhou, tentar inserir um a um pra identificar quais falharam
      for (let j = 0; j < batch.length; j++) {
        const registro = {
          ...batch[j],
          organizacao_id: usuario.organizacao_id,
          corretor_id: usuario.id,
          status: "disponivel" as const,
          publicar_site: true,
          publicar_portais: true,
        }

        const { error: erroIndividual } = await supabase
          .from("imoveis")
          .insert(registro)
          .select("id")
          .single()

        if (erroIndividual) {
          const linhaOriginal = i + j + 1
          errosInsercao.push({
            linha: linhaOriginal,
            codigo_interno: batch[j].codigo_interno,
            erro:
              erroIndividual.code === "23505"
                ? "Código já existe"
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

  revalidatePath("/imoveis")

  return {
    resultado: {
      criados: totalCriados,
      erros: [...errosValidacao, ...errosInsercao],
    },
  }
}
