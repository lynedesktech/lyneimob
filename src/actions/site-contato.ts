"use server"

import { headers } from "next/headers"
import { redis } from "@/lib/redis"
import { criarClienteAdmin } from "@/lib/supabase/admin"
import { schemaContatoSite } from "@/types/leads-portais"
import type { EstadoFormulario } from "@/types/formulario"
import { digitosDe } from "@/components/ui/input-telefone"

const LIMITE_ENVIOS = 3
const JANELA_SEGUNDOS = 900 // 15 minutos

export async function enviarContatoSite(
  formData: FormData
): Promise<EstadoFormulario> {
  const dados = {
    nome: formData.get("nome") as string,
    email: formData.get("email") as string,
    telefone: digitosDe(formData.get("telefone") as string | null),
    mensagem: formData.get("mensagem") as string,
    organizacao_slug: formData.get("organizacao_slug") as string,
    imovel_codigo: (formData.get("imovel_codigo") as string) || "",
  }

  const resultado = schemaContatoSite.safeParse(dados)
  if (!resultado.success) {
    const primeiroErro = resultado.error.issues[0]?.message
    return { erro: primeiroErro || "Preencha os campos corretamente." }
  }

  // Rate limiting por IP
  const cabecalhos = await headers()
  const ip =
    cabecalhos.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    cabecalhos.get("x-real-ip") ||
    "desconhecido"
  const chaveRateLimit = `ratelimit:contato:${ip}`

  if (redis) {
    try {
      const contadorAtual = await redis.get<number>(chaveRateLimit)

      if (contadorAtual !== null && contadorAtual >= LIMITE_ENVIOS) {
        return {
          erro: "Aguarde alguns minutos antes de enviar outra mensagem. Já recebemos sua solicitação anterior.",
        }
      }

      if (contadorAtual === null) {
        await redis.set(chaveRateLimit, 1, { ex: JANELA_SEGUNDOS })
      } else {
        await redis.incr(chaveRateLimit)
      }
    } catch {
      // Se Redis falhar, não bloquear o envio — só perde a proteção
    }
  }

  const supabase = criarClienteAdmin()

  // Buscar organização pelo slug
  const { data: org } = await supabase
    .from("organizacoes")
    .select("id")
    .eq("slug", resultado.data.organizacao_slug)
    .single()

  if (!org) {
    return { erro: "Imobiliária não encontrada." }
  }

  // Se informou código de imóvel, tentar vincular
  let imovelId: string | null = null
  if (resultado.data.imovel_codigo) {
    const { data: imovel } = await supabase
      .from("imoveis")
      .select("id")
      .eq("organizacao_id", org.id)
      .eq("codigo", resultado.data.imovel_codigo)
      .single()

    if (imovel) {
      imovelId = imovel.id
    }
  }

  // Criar lead na tabela leads_portais
  const { error } = await supabase.from("leads_portais").insert({
    organizacao_id: org.id,
    portal: "site" as const,
    nome: resultado.data.nome,
    email: resultado.data.email || null,
    telefone: resultado.data.telefone || null,
    mensagem: resultado.data.mensagem,
    imovel_codigo: resultado.data.imovel_codigo || null,
    imovel_id: imovelId,
    status: "novo" as const,
    payload_original: resultado.data,
  })

  if (error) {
    return { erro: "Erro ao enviar mensagem. Tente novamente." }
  }

  return {
    sucesso:
      "Mensagem enviada com sucesso! Entraremos em contato em breve.",
  }
}
