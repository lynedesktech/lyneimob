"use server"

import { revalidatePath } from "next/cache"
import { criarClienteServer } from "@/lib/supabase/server"
import { verificarPermissao } from "@/lib/permissoes"
import type { EstadoFormulario } from "@/types/formulario"
import { buscarUsuarioLogado } from "@/lib/buscar-usuario-logado"

// ============================================================
// Processar lead — cria cliente + negócio automaticamente
// ============================================================

export async function processarLead(leadId: string): Promise<EstadoFormulario> {
  const usuario = await buscarUsuarioLogado()
  if (!usuario) {
    return { erro: "Usuário não autenticado" }
  }

  const permissao = verificarPermissao(usuario.cargo as "admin" | "corretor" | "gerente", "processar_leads")
  if (permissao.erro) {
    return permissao
  }

  const supabase = await criarClienteServer()

  // 1. Buscar o lead
  const { data: lead, error: erroLead } = await supabase
    .from("leads_portais")
    .select("*, integracoes_portais(nome_portal)")
    .eq("id", leadId)
    .single()

  if (erroLead || !lead) {
    return { erro: "Lead não encontrado" }
  }

  if (lead.convertido) {
    return { erro: "Este lead já foi processado" }
  }

  const empresaId = usuario.organizacao_id || lead.empresa_id
  const nomePortal = lead.integracoes_portais?.nome_portal || "Portal"

  // 2. Verificar duplicidade por email ou telefone
  let clienteId: string | null = null

  if (lead.email) {
    const { data: clienteExistente } = await supabase
      .from("clientes")
      .select("id")
      .eq("email", lead.email)
      .limit(1)
      .maybeSingle()

    if (clienteExistente) {
      clienteId = clienteExistente.id
    }
  }

  if (!clienteId && lead.telefone) {
    const { data: clienteExistente } = await supabase
      .from("clientes")
      .select("id")
      .eq("telefone", lead.telefone)
      .limit(1)
      .maybeSingle()

    if (clienteExistente) {
      clienteId = clienteExistente.id
    }
  }

  // 3. Criar cliente se não existe
  if (!clienteId) {
    const { data: novoCliente, error: erroCliente } = await supabase
      .from("clientes")
      .insert({
        empresa_id: empresaId,
        nome: lead.nome || "Lead sem nome",
        email: lead.email,
        telefone: lead.telefone,
        whatsapp: lead.telefone,
        origem: "portal",
        interesse: "compra",
        status: "ativo",
        notas: lead.mensagem
          ? `Lead do ${nomePortal}: ${lead.mensagem}`
          : `Lead recebido do ${nomePortal}`,
      })
      .select("id")
      .single()

    if (erroCliente || !novoCliente) {
      return { erro: "Erro ao criar cliente a partir do lead" }
    }

    clienteId = novoCliente.id
  }

  // 4. Criar negócio
  const tituloNegocio = lead.nome
    ? `Lead ${nomePortal} — ${lead.nome}`
    : `Lead ${nomePortal}`

  const { data: negocio, error: erroNegocio } = await supabase
    .from("negocios")
    .insert({
      empresa_id: empresaId,
      responsavel_id: usuario.id,
      cliente_id: clienteId,
      titulo: tituloNegocio,
      tipo: "venda",
      etapa: "novo",
      notas: lead.mensagem || null,
    })
    .select("id")
    .single()

  if (erroNegocio || !negocio) {
    return { erro: "Erro ao criar negócio a partir do lead" }
  }

  // 5. Marcar lead como convertido
  await supabase
    .from("leads_portais")
    .update({
      convertido: true,
      cliente_id: clienteId,
    })
    .eq("id", leadId)

  revalidatePath("/configuracoes/portais")
  revalidatePath("/clientes")
  revalidatePath("/negocios")
  return { sucesso: `Lead processado! Cliente e negócio criados com sucesso.` }
}

// ============================================================
// Descartar lead (marcar como convertido sem criar cliente)
// ============================================================

export async function descartarLead(leadId: string): Promise<EstadoFormulario> {
  const usuario = await buscarUsuarioLogado()
  if (!usuario) {
    return { erro: "Usuário não autenticado" }
  }

  const permissao = verificarPermissao(usuario.cargo as "admin" | "corretor" | "gerente", "processar_leads")
  if (permissao.erro) {
    return permissao
  }

  const supabase = await criarClienteServer()

  const { error } = await supabase
    .from("leads_portais")
    .update({ convertido: true })
    .eq("id", leadId)

  if (error) {
    return { erro: "Erro ao descartar lead. Tente novamente." }
  }

  revalidatePath("/configuracoes/portais")
  return { sucesso: "Lead descartado com sucesso" }
}

// ============================================================
// Excluir lead
// ============================================================

export async function excluirLead(leadId: string): Promise<EstadoFormulario> {
  const usuario = await buscarUsuarioLogado()
  if (!usuario) {
    return { erro: "Usuário não autenticado" }
  }

  const permissao = verificarPermissao(usuario.cargo as "admin" | "corretor" | "gerente", "excluir_registros")
  if (permissao.erro) {
    return permissao
  }

  const supabase = await criarClienteServer()

  const { error } = await supabase
    .from("leads_portais")
    .delete()
    .eq("id", leadId)

  if (error) {
    return { erro: "Erro ao excluir lead. Tente novamente." }
  }

  revalidatePath("/configuracoes/portais")
  return { sucesso: "Lead excluído com sucesso" }
}
