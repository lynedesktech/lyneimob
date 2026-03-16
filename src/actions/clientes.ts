"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { criarClienteServer } from "@/lib/supabase/server"
import { verificarPermissao } from "@/lib/permissoes"
import {
  schemaCriarCliente,
  schemaAtualizarCliente,
  schemaCriarInteresse,
  schemaAtualizarInteresse,
  schemaCriarInteracao,
} from "@/types/clientes"
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
    .select("id, organizacao_id, cargo")
    .eq("id", user.id)
    .single()

  return usuario
}

// ============================================================
// Criar cliente
// ============================================================

export async function criarCliente(
  _estado: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  const dados = schemaCriarCliente.safeParse({
    nome: formData.get("nome"),
    email: formData.get("email") || undefined,
    telefone: formData.get("telefone") || undefined,
    whatsapp: formData.get("whatsapp") || undefined,
    cpf_cnpj: formData.get("cpf_cnpj") || undefined,
    tipo: formData.get("tipo"),
    origem: formData.get("origem") || "outro",
    observacoes: formData.get("observacoes") || undefined,
  })

  if (!dados.success) {
    return { erro: dados.error.issues[0].message }
  }

  const usuario = await buscarUsuarioLogado()
  if (!usuario) {
    return { erro: "Usuário não autenticado" }
  }

  const supabase = await criarClienteServer()

  const { data: cliente, error } = await supabase
    .from("clientes")
    .insert({
      ...dados.data,
      organizacao_id: usuario.organizacao_id,
      corretor_id: usuario.id,
    })
    .select("id")
    .single()

  if (error) {
    if (error.code === "23505") {
      return { erro: "Já existe um cliente com este CPF/CNPJ" }
    }
    return { erro: "Erro ao cadastrar cliente. Tente novamente." }
  }

  redirect(`/clientes/${cliente.id}`)
}

// ============================================================
// Atualizar cliente
// ============================================================

export async function atualizarCliente(
  _estado: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  const dados = schemaAtualizarCliente.safeParse({
    id: formData.get("id"),
    nome: formData.get("nome"),
    email: formData.get("email") || undefined,
    telefone: formData.get("telefone") || undefined,
    whatsapp: formData.get("whatsapp") || undefined,
    cpf_cnpj: formData.get("cpf_cnpj") || undefined,
    tipo: formData.get("tipo"),
    origem: formData.get("origem") || "outro",
    status: formData.get("status") || undefined,
    observacoes: formData.get("observacoes") || undefined,
  })

  if (!dados.success) {
    return { erro: dados.error.issues[0].message }
  }

  const usuario = await buscarUsuarioLogado()
  if (!usuario) {
    return { erro: "Usuário não autenticado" }
  }

  const supabase = await criarClienteServer()
  const { id, ...camposAtualizar } = dados.data

  const { error } = await supabase
    .from("clientes")
    .update(camposAtualizar)
    .eq("id", id)

  if (error) {
    if (error.code === "23505") {
      return { erro: "Já existe um cliente com este CPF/CNPJ" }
    }
    return { erro: "Erro ao atualizar cliente. Tente novamente." }
  }

  redirect(`/clientes/${id}`)
}

// ============================================================
// Excluir cliente
// ============================================================

export async function excluirCliente(id: string): Promise<EstadoFormulario> {
  const usuario = await buscarUsuarioLogado()
  if (!usuario) {
    return { erro: "Usuário não autenticado" }
  }

  const permissao = verificarPermissao(usuario.cargo as "admin" | "corretor" | "gerente", "excluir_registros")
  if (permissao.erro) {
    return permissao
  }

  const supabase = await criarClienteServer()

  const { error } = await supabase.from("clientes").delete().eq("id", id)

  if (error) {
    return { erro: "Erro ao excluir cliente. Tente novamente." }
  }

  redirect("/clientes")
}

// ============================================================
// Alterar status do cliente
// ============================================================

export async function alterarStatusCliente(
  id: string,
  status: string
): Promise<EstadoFormulario> {
  const statusValidos = ["ativo", "inativo", "negociando", "fechado"]
  if (!statusValidos.includes(status)) {
    return { erro: "Status inválido" }
  }

  const usuario = await buscarUsuarioLogado()
  if (!usuario) {
    return { erro: "Usuário não autenticado" }
  }

  const supabase = await criarClienteServer()

  const { error } = await supabase
    .from("clientes")
    .update({ status })
    .eq("id", id)

  if (error) {
    return { erro: "Erro ao alterar status. Tente novamente." }
  }

  revalidatePath("/clientes")
  revalidatePath(`/clientes/${id}`)
  return { sucesso: "Status atualizado com sucesso" }
}

// ============================================================
// Criar interesse
// ============================================================

export async function criarInteresse(
  _estado: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  const bairrosRaw = formData.get("bairros_interesse") as string
  const dados = schemaCriarInteresse.safeParse({
    cliente_id: formData.get("cliente_id"),
    tipo_imovel: formData.get("tipo_imovel") || undefined,
    finalidade: formData.get("finalidade") || undefined,
    bairros_interesse: bairrosRaw || undefined,
    cidade: formData.get("cidade") || undefined,
    estado: formData.get("estado") || undefined,
    preco_min: formData.get("preco_min") || undefined,
    preco_max: formData.get("preco_max") || undefined,
    quartos_min: formData.get("quartos_min") || undefined,
    area_min: formData.get("area_min") || undefined,
    observacoes: formData.get("observacoes") || undefined,
  })

  if (!dados.success) {
    return { erro: dados.error.issues[0].message }
  }

  const usuario = await buscarUsuarioLogado()
  if (!usuario) {
    return { erro: "Usuário não autenticado" }
  }

  const supabase = await criarClienteServer()

  // Converter bairros de string separada por vírgulas para array
  const bairrosArray = dados.data.bairros_interesse
    ? dados.data.bairros_interesse
        .split(",")
        .map((b) => b.trim())
        .filter(Boolean)
    : null

  const { error } = await supabase.from("cliente_interesses").insert({
    ...dados.data,
    bairros_interesse: bairrosArray,
  })

  if (error) {
    return { erro: "Erro ao salvar interesse. Tente novamente." }
  }

  revalidatePath(`/clientes/${dados.data.cliente_id}`)
  return { sucesso: "Interesse salvo com sucesso" }
}

// ============================================================
// Atualizar interesse
// ============================================================

export async function atualizarInteresse(
  _estado: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  const bairrosRaw = formData.get("bairros_interesse") as string
  const dados = schemaAtualizarInteresse.safeParse({
    id: formData.get("id"),
    cliente_id: formData.get("cliente_id"),
    tipo_imovel: formData.get("tipo_imovel") || undefined,
    finalidade: formData.get("finalidade") || undefined,
    bairros_interesse: bairrosRaw || undefined,
    cidade: formData.get("cidade") || undefined,
    estado: formData.get("estado") || undefined,
    preco_min: formData.get("preco_min") || undefined,
    preco_max: formData.get("preco_max") || undefined,
    quartos_min: formData.get("quartos_min") || undefined,
    area_min: formData.get("area_min") || undefined,
    observacoes: formData.get("observacoes") || undefined,
  })

  if (!dados.success) {
    return { erro: dados.error.issues[0].message }
  }

  const usuario = await buscarUsuarioLogado()
  if (!usuario) {
    return { erro: "Usuário não autenticado" }
  }

  const supabase = await criarClienteServer()
  const { id, ...camposAtualizar } = dados.data

  const bairrosArray = camposAtualizar.bairros_interesse
    ? camposAtualizar.bairros_interesse
        .split(",")
        .map((b) => b.trim())
        .filter(Boolean)
    : null

  const { error } = await supabase
    .from("cliente_interesses")
    .update({
      ...camposAtualizar,
      bairros_interesse: bairrosArray,
    })
    .eq("id", id)

  if (error) {
    return { erro: "Erro ao atualizar interesse. Tente novamente." }
  }

  revalidatePath(`/clientes/${camposAtualizar.cliente_id}`)
  return { sucesso: "Interesse atualizado com sucesso" }
}

// ============================================================
// Excluir interesse
// ============================================================

export async function excluirInteresse(
  interesseId: string,
  clienteId: string
): Promise<EstadoFormulario> {
  const supabase = await criarClienteServer()

  const { error } = await supabase
    .from("cliente_interesses")
    .delete()
    .eq("id", interesseId)

  if (error) {
    return { erro: "Erro ao excluir interesse. Tente novamente." }
  }

  revalidatePath(`/clientes/${clienteId}`)
  return { sucesso: "Interesse removido com sucesso" }
}

// ============================================================
// Criar interação
// ============================================================

export async function criarInteracao(
  _estado: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  const dados = schemaCriarInteracao.safeParse({
    cliente_id: formData.get("cliente_id"),
    tipo: formData.get("tipo"),
    descricao: formData.get("descricao"),
    data: formData.get("data") || undefined,
  })

  if (!dados.success) {
    return { erro: dados.error.issues[0].message }
  }

  const usuario = await buscarUsuarioLogado()
  if (!usuario) {
    return { erro: "Usuário não autenticado" }
  }

  const supabase = await criarClienteServer()

  const { error } = await supabase.from("cliente_interacoes").insert({
    cliente_id: dados.data.cliente_id,
    usuario_id: usuario.id,
    tipo: dados.data.tipo,
    descricao: dados.data.descricao,
    data: dados.data.data || new Date().toISOString(),
  })

  if (error) {
    return { erro: "Erro ao registrar interação. Tente novamente." }
  }

  revalidatePath(`/clientes/${dados.data.cliente_id}`)
  return { sucesso: "Interação registrada com sucesso" }
}

// ============================================================
// Excluir interação
// ============================================================

export async function excluirInteracao(
  interacaoId: string,
  clienteId: string
): Promise<EstadoFormulario> {
  const supabase = await criarClienteServer()

  const { error } = await supabase
    .from("cliente_interacoes")
    .delete()
    .eq("id", interacaoId)

  if (error) {
    return { erro: "Erro ao excluir interação. Tente novamente." }
  }

  revalidatePath(`/clientes/${clienteId}`)
  return { sucesso: "Interação removida com sucesso" }
}
