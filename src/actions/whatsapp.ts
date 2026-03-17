"use server"

import { revalidatePath } from "next/cache"
import { criarClienteServer } from "@/lib/supabase/server"
import { criarClienteAdmin } from "@/lib/supabase/admin"
import { verificarPermissao, ehSuperAdmin } from "@/lib/permissoes"
import { schemaConfigWhatsapp } from "@/types/whatsapp"
import type { StatusConversa } from "@/types/whatsapp"
import type { EstadoFormulario } from "@/types/formulario"

// ============================================================
// Helpers
// ============================================================

async function buscarUsuarioLogado() {
  const supabase = await criarClienteServer()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("id, organizacao_id, cargo, super_admin")
    .eq("id", user.id)
    .single()

  return usuario
}

// ============================================================
// Atualizar status da conversa
// ============================================================

export async function atualizarStatusConversa(
  conversaId: string,
  status: StatusConversa
): Promise<EstadoFormulario> {
  const statusValidos: StatusConversa[] = [
    "em_andamento",
    "qualificado",
    "encaminhado",
    "finalizado",
    "arquivado",
  ]
  if (!statusValidos.includes(status)) {
    return { erro: "Status inválido" }
  }

  const usuario = await buscarUsuarioLogado()
  if (!usuario) {
    return { erro: "Usuário não autenticado" }
  }

  const permissao = verificarPermissao(usuario.cargo as "admin" | "corretor" | "gerente", "ver_conversas_whatsapp")
  if (permissao.erro) {
    return permissao
  }

  const supabase = await criarClienteServer()

  const { error } = await supabase
    .from("conversas_whatsapp")
    .update({ status })
    .eq("id", conversaId)

  if (error) {
    return { erro: "Erro ao atualizar status da conversa. Tente novamente." }
  }

  revalidatePath("/conversas")
  revalidatePath(`/conversas/${conversaId}`)
  return { sucesso: `Status atualizado para "${status}"` }
}

// ============================================================
// Atribuir corretor a conversa
// ============================================================

export async function atribuirCorretor(
  conversaId: string,
  corretorId: string
): Promise<EstadoFormulario> {
  const usuario = await buscarUsuarioLogado()
  if (!usuario) {
    return { erro: "Usuário não autenticado" }
  }

  const permissao = verificarPermissao(usuario.cargo as "admin" | "corretor" | "gerente", "ver_conversas_whatsapp")
  if (permissao.erro) {
    return permissao
  }

  const supabase = await criarClienteServer()

  const { error } = await supabase
    .from("conversas_whatsapp")
    .update({ corretor_id: corretorId })
    .eq("id", conversaId)

  if (error) {
    return { erro: "Erro ao atribuir corretor. Tente novamente." }
  }

  revalidatePath("/conversas")
  revalidatePath(`/conversas/${conversaId}`)
  return { sucesso: "Corretor atribuído com sucesso" }
}

// ============================================================
// Buscar configuração WhatsApp da organização
// ============================================================

export async function buscarConfigWhatsapp() {
  const usuario = await buscarUsuarioLogado()
  if (!usuario) return null

  const supabase = await criarClienteServer()

  const { data } = await supabase
    .from("config_whatsapp")
    .select("*")
    .eq("organizacao_id", usuario.organizacao_id)
    .single()

  return data
}

// ============================================================
// Salvar configuração WhatsApp
// ============================================================

export async function salvarConfigWhatsapp(
  _estado: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  const dados = schemaConfigWhatsapp.safeParse({
    uazapi_url: formData.get("uazapi_url"),
    uazapi_token: formData.get("uazapi_token"),
    numero_whatsapp: formData.get("numero_whatsapp"),
    ativo: formData.get("ativo") === "true",
    prompt_personalizado: formData.get("prompt_personalizado") || undefined,
    horario_atendimento: formData.get("horario_atendimento") || undefined,
    mensagem_fora_horario: formData.get("mensagem_fora_horario") || undefined,
    corretor_padrao_id: formData.get("corretor_padrao_id") || undefined,
  })

  if (!dados.success) {
    return { erro: dados.error.issues[0].message }
  }

  const usuario = await buscarUsuarioLogado()
  if (!usuario) {
    return { erro: "Usuário não autenticado" }
  }

  if (!ehSuperAdmin(usuario)) {
    return { erro: "Apenas o administrador da plataforma pode alterar configurações do WhatsApp." }
  }

  const supabase = await criarClienteServer()

  // Tenta parsear horário de atendimento se for string JSON
  let horarioAtendimento = null
  if (dados.data.horario_atendimento) {
    try {
      horarioAtendimento = JSON.parse(dados.data.horario_atendimento)
    } catch {
      horarioAtendimento = null
    }
  }

  const camposConfig = {
    uazapi_url: dados.data.uazapi_url,
    uazapi_token: dados.data.uazapi_token,
    numero_whatsapp: dados.data.numero_whatsapp,
    ativo: dados.data.ativo ?? false,
    prompt_personalizado: dados.data.prompt_personalizado || null,
    horario_atendimento: horarioAtendimento,
    mensagem_fora_horario: dados.data.mensagem_fora_horario || null,
    corretor_padrao_id: dados.data.corretor_padrao_id || null,
  }

  // Verifica se já existe config para a org
  const { data: existente } = await supabase
    .from("config_whatsapp")
    .select("id")
    .eq("organizacao_id", usuario.organizacao_id)
    .single()

  if (existente) {
    const { error } = await supabase
      .from("config_whatsapp")
      .update(camposConfig)
      .eq("id", existente.id)

    if (error) {
      return { erro: "Erro ao atualizar configuração. Tente novamente." }
    }
  } else {
    const { error } = await supabase
      .from("config_whatsapp")
      .insert({
        ...camposConfig,
        organizacao_id: usuario.organizacao_id,
      })

    if (error) {
      return { erro: "Erro ao criar configuração. Tente novamente." }
    }
  }

  revalidatePath("/conversas")
  return { sucesso: "Configuração do WhatsApp salva com sucesso" }
}

// ============================================================
// Salvar apenas configurações do agente (sem sobrescrever campos técnicos)
// ============================================================

export async function salvarConfigAgenteWhatsapp(
  formData: FormData
): Promise<EstadoFormulario> {
  const usuario = await buscarUsuarioLogado()
  if (!usuario) return { erro: "Usuário não autenticado" }

  if (!ehSuperAdmin(usuario)) {
    return { erro: "Apenas o administrador da plataforma pode alterar configurações do WhatsApp." }
  }

  const supabase = await criarClienteServer()

  // Parsear horário de atendimento (JSON serializado pelo seletor visual)
  let horarioAtendimento = null
  const horarioStr = formData.get("horario_atendimento") as string | null
  if (horarioStr) {
    try {
      horarioAtendimento = JSON.parse(horarioStr)
    } catch {
      horarioAtendimento = null
    }
  }

  const camposAgente = {
    ativo: formData.get("ativo") === "true",
    nome_agente: (formData.get("nome_agente") as string) || null,
    prompt_personalizado: (formData.get("prompt_personalizado") as string) || null,
    horario_atendimento: horarioAtendimento,
    mensagem_fora_horario: (formData.get("mensagem_fora_horario") as string) || null,
    corretor_padrao_id: (formData.get("corretor_padrao_id") as string) || null,
  }

  // Verificar se já existe config
  const { data: existente } = await supabase
    .from("config_whatsapp")
    .select("id")
    .eq("organizacao_id", usuario.organizacao_id)
    .single()

  if (existente) {
    const { error } = await supabase
      .from("config_whatsapp")
      .update(camposAgente)
      .eq("id", existente.id)

    if (error) return { erro: "Erro ao salvar configurações. Tente novamente." }
  } else {
    // Inserir mesmo sem credenciais técnicas (serão preenchidas ao conectar)
    const { error } = await supabase.from("config_whatsapp").insert({
      ...camposAgente,
      organizacao_id: usuario.organizacao_id,
      uazapi_url: "",
      uazapi_token: "",
    })

    if (error) return { erro: "Erro ao salvar configurações. Tente novamente." }
  }

  revalidatePath("/conversas")
  revalidatePath("/configuracoes/whatsapp")
  return { sucesso: "Configurações do agente salvas com sucesso!" }
}

// ============================================================
// Limpar memória Redis de todas as conversas da organização
// ============================================================

export async function limparMemoriasOrganizacao(): Promise<EstadoFormulario> {
  const usuario = await buscarUsuarioLogado()
  if (!usuario) return { erro: "Usuário não autenticado" }

  if (!ehSuperAdmin(usuario)) {
    return { erro: "Apenas o administrador da plataforma pode limpar a memória do agente." }
  }

  const supabase = criarClienteAdmin()

  const { data: conversas } = await supabase
    .from("conversas_whatsapp")
    .select("id")

  if (!conversas || conversas.length === 0) {
    return { sucesso: "Nenhuma memória para limpar." }
  }

  const { limparMemoria } = await import("@/lib/whatsapp/memoria")
  await Promise.all(conversas.map((c) => limparMemoria(c.id)))

  return {
    sucesso: `Memória limpa para ${conversas.length} conversa(s). O agente começa do zero na próxima mensagem.`,
  }
}

// ============================================================
// Buscar conversa WhatsApp vinculada a um negócio
// ============================================================

export async function buscarConversaPorNegocio(negocioId: string) {
  const usuario = await buscarUsuarioLogado()
  if (!usuario) return null

  const supabase = await criarClienteServer()

  const { data } = await supabase
    .from("conversas_whatsapp")
    .select("id, nome_cliente, numero_cliente, status, resumo_ia, ultima_mensagem_em")
    .eq("negocio_id", negocioId)
    .order("ultima_mensagem_em", { ascending: false })
    .limit(1)
    .maybeSingle()

  return data
}
