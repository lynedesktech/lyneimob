"use server"

import { criarClienteServer } from "@/lib/supabase/server"
import type { ResultadoBuscaGlobal } from "@/types/busca-global"

export async function buscarGlobal(termo: string): Promise<ResultadoBuscaGlobal> {
  const vazio: ResultadoBuscaGlobal = {
    imoveis: [],
    clientes: [],
    negocios: [],
    atividades: [],
  }

  if (!termo || termo.length < 2) return vazio

  const supabase = await criarClienteServer()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return vazio

  const busca = `%${termo}%`

  const [imoveis, clientes, negocios, atividades] = await Promise.all([
    supabase
      .from("imoveis")
      .select("id, titulo, codigo, tipo, status, bairro, cidade")
      .or(`titulo.ilike.${busca},codigo.ilike.${busca},bairro.ilike.${busca}`)
      .order("created_at", { ascending: false })
      .limit(5),

    supabase
      .from("clientes")
      .select("id, nome, email, telefone, tipo, status")
      .or(`nome.ilike.${busca},email.ilike.${busca},telefone.ilike.${busca}`)
      .order("created_at", { ascending: false })
      .limit(5),

    supabase
      .from("negocios")
      .select("id, titulo, status, tipo, valor, clientes(nome), imoveis(titulo)")
      .ilike("titulo", busca)
      .order("created_at", { ascending: false })
      .limit(5),

    supabase
      .from("atividades")
      .select("id, titulo, tipo, status, data_inicio")
      .or(`titulo.ilike.${busca},descricao.ilike.${busca}`)
      .order("data_inicio", { ascending: false })
      .limit(5),
  ])

  return {
    imoveis: imoveis.data ?? [],
    clientes: clientes.data ?? [],
    negocios: (negocios.data as unknown as ResultadoBuscaGlobal["negocios"]) ?? [],
    atividades: atividades.data ?? [],
  }
}
