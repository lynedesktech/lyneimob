"use server"

import { revalidatePath } from "next/cache"
import { criarClienteServer } from "@/lib/supabase/server"
import { verificarPermissao } from "@/lib/permissoes"
import { obterProximoCorretor } from "@/lib/distribuicao-leads"
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
    .select("*")
    .eq("id", leadId)
    .single()

  if (erroLead || !lead) {
    return { erro: "Lead não encontrado" }
  }

  if (lead.status === "processado") {
    return { erro: "Este lead já foi processado" }
  }

  // 2. Obter corretor via distribuição (roleta, balanceamento ou manual)
  const corretorId = await obterProximoCorretor(usuario.organizacao_id, {
    corretorManualId: usuario.id,
  }) || usuario.id

  // 3. Verificar duplicidade por email ou telefone
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
        organizacao_id: usuario.organizacao_id,
        corretor_id: corretorId,
        nome: lead.nome || "Lead sem nome",
        email: lead.email,
        telefone: lead.telefone,
        whatsapp: lead.telefone,
        tipo: "comprador",
        origem: "portal",
        status: "ativo",
        observacoes: lead.mensagem
          ? `Lead do portal ${lead.portal}: ${lead.mensagem}`
          : `Lead recebido do portal ${lead.portal}`,
      })
      .select("id")
      .single()

    if (erroCliente || !novoCliente) {
      // Atualizar lead com erro
      await supabase
        .from("leads_portais")
        .update({
          status: "erro",
          erro_processamento: "Erro ao criar cliente: " + (erroCliente?.message || "desconhecido"),
        })
        .eq("id", leadId)

      return { erro: "Erro ao criar cliente a partir do lead" }
    }

    clienteId = novoCliente.id
  }

  // 4. Buscar primeira etapa do pipeline (tipo 'normal', menor ordem)
  const { data: primeiraEtapa } = await supabase
    .from("pipeline_etapas")
    .select("id")
    .eq("organizacao_id", usuario.organizacao_id)
    .eq("tipo", "normal")
    .order("ordem", { ascending: true })
    .limit(1)
    .single()

  if (!primeiraEtapa) {
    await supabase
      .from("leads_portais")
      .update({
        status: "erro",
        erro_processamento: "Nenhuma etapa de pipeline encontrada",
        cliente_id: clienteId,
      })
      .eq("id", leadId)

    return { erro: "Nenhuma etapa de pipeline encontrada. Configure o pipeline primeiro." }
  }

  // 5. Criar negócio
  const tituloNegocio = lead.nome
    ? `Lead ${lead.portal.toUpperCase()} — ${lead.nome}`
    : `Lead ${lead.portal.toUpperCase()}`

  const { data: negocio, error: erroNegocio } = await supabase
    .from("negocios")
    .insert({
      organizacao_id: usuario.organizacao_id,
      corretor_id: corretorId,
      cliente_id: clienteId,
      imovel_id: lead.imovel_id || null,
      etapa_id: primeiraEtapa.id,
      titulo: tituloNegocio,
      tipo: "venda",
      status: "aberto",
      posicao: 0,
      observacoes: lead.mensagem || null,
    })
    .select("id")
    .single()

  if (erroNegocio || !negocio) {
    await supabase
      .from("leads_portais")
      .update({
        status: "erro",
        erro_processamento: "Erro ao criar negócio: " + (erroNegocio?.message || "desconhecido"),
        cliente_id: clienteId,
      })
      .eq("id", leadId)

    return { erro: "Erro ao criar negócio a partir do lead" }
  }

  // 6. Atualizar lead como processado
  await supabase
    .from("leads_portais")
    .update({
      status: "processado",
      cliente_id: clienteId,
      negocio_id: negocio.id,
      processado_em: new Date().toISOString(),
    })
    .eq("id", leadId)

  revalidatePath("/configuracoes/portais")
  revalidatePath("/clientes")
  revalidatePath("/negocios")
  return { sucesso: `Lead processado! Cliente e negócio criados com sucesso.` }
}

// ============================================================
// Descartar lead
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
    .update({ status: "descartado" })
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
