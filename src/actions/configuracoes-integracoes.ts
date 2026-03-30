"use server"

import { revalidatePath } from "next/cache"
import { criarClienteServer } from "@/lib/supabase/server"
import { ehSuperAdmin } from "@/lib/permissoes"
import { schemaConfiguracoesIntegracoes } from "@/types/configuracoes-integracoes"
import type { EstadoFormulario } from "@/types/formulario"
import { buscarUsuarioLogado } from "@/lib/buscar-usuario-logado"

// ============================================================
// Validação real das chaves contra as APIs
// ============================================================

async function validarChavesNovas(
  novasChaves: Record<string, string>
): Promise<string | null> {
  // OpenAI
  if (novasChaves.openai_api_key) {
    try {
      const resp = await fetch("https://api.openai.com/v1/models", {
        headers: { Authorization: `Bearer ${novasChaves.openai_api_key}` },
      })
      if (resp.status === 401) {
        return "Chave OpenAI inválida. Verifique se copiou corretamente em platform.openai.com → API keys."
      }
      if (!resp.ok) {
        return "Não foi possível validar a chave OpenAI. Tente novamente."
      }
    } catch {
      return "Erro de conexão ao validar chave OpenAI."
    }
  }

  // Stripe
  if (novasChaves.stripe_secret_key) {
    try {
      const resp = await fetch("https://api.stripe.com/v1/balance", {
        headers: {
          Authorization: `Bearer ${novasChaves.stripe_secret_key}`,
        },
      })
      if (resp.status === 401) {
        return "Chave secreta Stripe inválida. Verifique em dashboard.stripe.com → Developers → API keys."
      }
      if (!resp.ok) {
        return "Não foi possível validar a chave Stripe. Tente novamente."
      }
    } catch {
      return "Erro de conexão ao validar chave Stripe."
    }
  }

  // Uazapi — validar URL + admin token criando instância de teste
  if (novasChaves.uazapi_url || novasChaves.uazapi_token) {
    const urlUazapi = novasChaves.uazapi_url?.trim()
    const tokenUazapi = novasChaves.uazapi_token?.trim()

    if (urlUazapi && tokenUazapi) {
      try {
        const { testarConexaoUazapi } = await import("@/lib/whatsapp/uazapi")
        const valido = await testarConexaoUazapi(urlUazapi, tokenUazapi)
        if (!valido) {
          return "Credenciais Uazapi inválidas. Verifique a URL e o admin token."
        }
      } catch {
        return "Não foi possível conectar ao servidor Uazapi. Verifique a URL e tente novamente."
      }
    }
  }

  // Upstash Redis
  if (novasChaves.upstash_redis_url && novasChaves.upstash_redis_token) {
    try {
      const url = novasChaves.upstash_redis_url.replace(/\/$/, "")
      const resp = await fetch(`${url}/ping`, {
        headers: { Authorization: `Bearer ${novasChaves.upstash_redis_token}` },
      })
      if (resp.status === 401) {
        return "Token do Redis inválido. Verifique em console.upstash.com → REST API."
      }
      if (!resp.ok) {
        return "Não foi possível validar as credenciais Redis. Tente novamente."
      }
    } catch {
      return "Erro de conexão ao validar credenciais Redis."
    }
  }

  return null
}

// ============================================================
// Salvar configurações de integrações (apenas super_admin)
// ============================================================

export async function salvarConfiguracoesIntegracoes(
  _estado: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  const usuario = await buscarUsuarioLogado()
  if (!usuario) {
    return { erro: "Você precisa estar logado para alterar as configurações." }
  }

  if (!ehSuperAdmin(usuario)) {
    return { erro: "Apenas o administrador da plataforma pode alterar integrações." }
  }

  // Extrair dados do FormData
  const dadosJson = formData.get("integracoes") as string
  if (!dadosJson) {
    return { erro: "Dados inválidos." }
  }

  let dadosParseados: Record<string, string>
  try {
    dadosParseados = JSON.parse(dadosJson)
  } catch {
    return { erro: "Formato de dados inválido." }
  }

  const supabase = await criarClienteServer()

  // Buscar configurações atuais do banco para fazer merge
  const { data: orgAtual } = await supabase
    .from("organizacoes")
    .select("configuracoes_integracoes")
    .eq("id", usuario.organizacao_id)
    .single()

  const configAtuais = (orgAtual?.configuracoes_integracoes ?? {}) as Record<string, string>

  // Merge: campos vazios = manter atual, campos preenchidos = sobrescrever
  const configMerged: Record<string, string> = { ...configAtuais }

  for (const [campo, valor] of Object.entries(dadosParseados)) {
    if (valor && valor.trim().length > 0) {
      // Novo valor — sobrescrever
      configMerged[campo] = valor.trim()
    }
    // Se vazio, mantém o que já existe (não faz nada)
  }

  // Validar com Zod
  const resultado = schemaConfiguracoesIntegracoes.safeParse(configMerged)
  if (!resultado.success) {
    return { erro: "Dados de configuração inválidos. Verifique os campos." }
  }

  // Validar chaves novas contra as APIs reais
  const erroValidacao = await validarChavesNovas(dadosParseados)
  if (erroValidacao) {
    return { erro: erroValidacao }
  }

  // Salvar no banco
  const { error } = await supabase
    .from("organizacoes")
    .update({
      configuracoes_integracoes: resultado.data,
    })
    .eq("id", usuario.organizacao_id)

  if (error) {
    return { erro: "Erro ao salvar configurações. Tente novamente." }
  }

  revalidatePath("/admin/configuracoes")

  return { sucesso: "Configurações salvas e validadas com sucesso!" }
}

// ============================================================
// Remover chave de uma integração específica (apenas super_admin)
// ============================================================

export async function removerChaveIntegracao(
  _estado: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  const usuario = await buscarUsuarioLogado()
  if (!usuario) {
    return { erro: "Você precisa estar logado." }
  }

  if (!ehSuperAdmin(usuario)) {
    return { erro: "Apenas o administrador da plataforma pode alterar integrações." }
  }

  const campo = formData.get("campo") as string
  if (!campo) {
    return { erro: "Campo não especificado." }
  }

  // Validar que o campo é um campo válido do schema
  const camposValidos = Object.keys(schemaConfiguracoesIntegracoes.shape) as string[]
  if (!camposValidos.includes(campo)) {
    return { erro: "Campo inválido." }
  }

  const supabase = await criarClienteServer()

  // Buscar config atual
  const { data: orgAtual } = await supabase
    .from("organizacoes")
    .select("configuracoes_integracoes")
    .eq("id", usuario.organizacao_id)
    .single()

  const configAtuais = (orgAtual?.configuracoes_integracoes ?? {}) as Record<string, string>

  // Remover o campo
  delete configAtuais[campo]

  // Salvar no banco
  const { error } = await supabase
    .from("organizacoes")
    .update({
      configuracoes_integracoes: configAtuais,
    })
    .eq("id", usuario.organizacao_id)

  if (error) {
    return { erro: "Erro ao remover chave. Tente novamente." }
  }

  revalidatePath("/admin/configuracoes")

  return { sucesso: "Chave removida com sucesso!" }
}
