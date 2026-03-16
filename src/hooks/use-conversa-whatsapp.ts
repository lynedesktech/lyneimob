"use client"

import { useQuery } from "@tanstack/react-query"
import { criarClienteBrowser } from "@/lib/supabase/client"
import type { ConversaComRelacoes, MensagemWhatsapp } from "@/types/whatsapp"

export function useConversaWhatsapp(id: string) {
  const supabase = criarClienteBrowser()

  const { data, isLoading, error } = useQuery<{
    conversa: ConversaComRelacoes
    mensagens: MensagemWhatsapp[]
  } | null>({
    queryKey: ["conversa-whatsapp", id],
    queryFn: async () => {
      // Buscar conversa com relações
      const { data: conversa, error: erroConversa } = await supabase
        .from("conversas_whatsapp")
        .select(
          "*, clientes(id, nome, telefone, email), negocios(id, titulo, status), usuarios(id, nome)"
        )
        .eq("id", id)
        .single()

      if (erroConversa) throw erroConversa

      // Buscar mensagens da conversa
      const { data: mensagens, error: erroMensagens } = await supabase
        .from("mensagens_whatsapp")
        .select("*")
        .eq("conversa_id", id)
        .order("criado_em", { ascending: true })

      if (erroMensagens) throw erroMensagens

      return {
        conversa: conversa as ConversaComRelacoes,
        mensagens: (mensagens as MensagemWhatsapp[]) ?? [],
      }
    },
    enabled: !!id,
  })

  return {
    conversa: data?.conversa ?? null,
    mensagens: data?.mensagens ?? [],
    carregando: isLoading,
    erro: error,
  }
}
