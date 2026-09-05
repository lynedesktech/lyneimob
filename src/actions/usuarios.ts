"use server"

import { criarClienteServer } from "@/lib/supabase/server"
import { criarClienteAdmin } from "@/lib/supabase/admin"
import { headers } from "next/headers"
import { enviarEmail } from "@/lib/resend"
import { assuntoEmailConvite, montarEmailConvite } from "@/lib/emails/convite-usuario"
import { verificarPermissao } from "@/lib/permissoes"
import { verificarLimiteCorretores } from "@/lib/verificar-limites"
import { buscarUsuarioLogado } from "@/lib/buscar-usuario-logado"

// ============================================================
// Listar usuarios da organizacao
// ============================================================

export async function listarUsuarios() {
  const usuario = await buscarUsuarioLogado()
  if (!usuario) {
    return { erro: "Voce precisa estar logado." }
  }

  const supabase = await criarClienteServer()

  const { data, error } = await supabase
    .from("usuarios")
    .select("id, nome, email, telefone, cargo, avatar_url, creci, ativo, created_at")
    .eq("organizacao_id", usuario.organizacao_id)
    .order("created_at", { ascending: true })

  if (error) {
    return { erro: "Erro ao buscar usuarios." }
  }

  return { dados: data }
}

// ============================================================
// Criar usuario direto (admin adiciona membro manualmente)
// ============================================================

export async function criarUsuario(formData: FormData) {
  const usuario = await buscarUsuarioLogado()
  if (!usuario) {
    return { erro: "Voce precisa estar logado." }
  }

  const permissao = verificarPermissao(usuario.cargo as "admin" | "corretor" | "gerente", "gerenciar_usuarios")
  if (permissao.erro) {
    return permissao
  }

  const nome = (formData.get("nome") as string)?.trim()
  const email = (formData.get("email") as string)?.trim().toLowerCase()
  const cargo = formData.get("cargo") as string

  if (!nome) {
    return { erro: "Nome é obrigatório." }
  }

  if (!email || !email.includes("@")) {
    return { erro: "Email inválido." }
  }

  if (!["admin", "corretor", "gerente"].includes(cargo)) {
    return { erro: "Cargo inválido." }
  }

  // Verificar limite de membros do plano
  const limite = await verificarLimiteCorretores(usuario.organizacao_id)
  if (!limite.permitido) {
    return { erro: limite.mensagem }
  }

  const admin = criarClienteAdmin()

  // Verificar se ja existe usuario com esse email na org
  const { data: usuarioExistente } = await admin
    .from("usuarios")
    .select("id")
    .eq("email", email)
    .eq("organizacao_id", usuario.organizacao_id)
    .maybeSingle()

  if (usuarioExistente) {
    return { erro: "Já existe um usuário com esse email nesta organização." }
  }

  // Convite em vez de senha: a conta nasce SEM senha e recebe um token de
  // primeiro acesso. A pessoa abre o link do e-mail, escolhe a propria senha e
  // ja entra. A marca convite_pendente vai no metadata e o middleware segura a
  // pessoa na tela de definir senha ate ela concluir. O trigger do banco le o
  // `nome` daqui, igual fazia com o createUser.
  const { data: convite, error: erroConvite } = await admin.auth.admin.generateLink({
    type: "invite",
    email,
    options: { data: { nome, convite_pendente: true } },
  })

  if (erroConvite || !convite?.user) {
    return { erro: `Erro ao criar conta: ${erroConvite?.message ?? "usuário não retornado."}` }
  }

  const userId = convite.user.id

  // Buscar registro criado pelo trigger para saber a org temporaria
  const { data: autoUser } = await admin
    .from("usuarios")
    .select("organizacao_id")
    .eq("id", userId)
    .single()

  const autoOrgId = autoUser?.organizacao_id

  // Mover para a org correta com o cargo correto
  const { error: updateError } = await admin
    .from("usuarios")
    .update({
      cargo,
      organizacao_id: usuario.organizacao_id,
    })
    .eq("id", userId)

  if (updateError) {
    await admin.auth.admin.deleteUser(userId)
    return { erro: `Erro ao vincular organização: ${updateError.message}` }
  }

  // Limpar org temporaria criada pelo trigger (se vazia e diferente da destino)
  if (autoOrgId && autoOrgId !== usuario.organizacao_id) {
    const { count } = await admin
      .from("usuarios")
      .select("id", { count: "exact", head: true })
      .eq("organizacao_id", autoOrgId)

    if (count === 0) {
      await admin.from("organizacoes").delete().eq("id", autoOrgId)
    }
  }

  // O link e montado aqui (nao pelo Supabase) e validado em /auth/callback com
  // verifyOtp. Assim nao depende da lista de URLs de redirecionamento do
  // Supabase nem de cookie no navegador de quem vai clicar.
  const baseUrl = await descobrirUrlDoApp()
  const linkConvite =
    `${baseUrl}/auth/callback?token_hash=${encodeURIComponent(convite.properties.hashed_token)}&type=invite`

  const { data: org } = await admin
    .from("organizacoes")
    .select("nome")
    .eq("id", usuario.organizacao_id)
    .single()
  const nomeOrganizacao = org?.nome ?? "sua imobiliária"

  // O e-mail e melhor esforco: a conta ja existe. Se o envio falhar, o link
  // volta pra tela pra quem criou mandar pelo WhatsApp — nao pode derrubar a
  // criacao nem deixar a pessoa sem caminho de entrada.
  let emailEnviado = false
  try {
    await enviarEmail({
      para: email,
      assunto: assuntoEmailConvite(nomeOrganizacao),
      html: montarEmailConvite({ nome, emailLogin: email, nomeOrganizacao, link: linkConvite }),
    })
    emailEnviado = true
  } catch (erroEmail) {
    console.error(
      "[criarUsuario] Falha ao enviar e-mail de convite:",
      erroEmail instanceof Error ? erroEmail.message : erroEmail
    )
  }

  return {
    sucesso: emailEnviado
      ? `Convite enviado para ${email}.`
      : "Conta criada, mas o e-mail não pôde ser enviado. Mande o link pelo WhatsApp.",
    dados: { nome, email, cargo, linkConvite, emailEnviado },
  }
}

/**
 * URL publica do app para montar links que saem por e-mail.
 * Prefere NEXT_PUBLIC_APP_URL; se faltar, deriva do proprio request.
 */
async function descobrirUrlDoApp(): Promise<string> {
  const daEnv = (process.env.NEXT_PUBLIC_APP_URL ?? "").trim().replace(/\/+$/, "")
  if (daEnv) return daEnv

  const h = await headers()
  const host = h.get("x-forwarded-host") ?? h.get("host")
  const proto = h.get("x-forwarded-proto") ?? "https"
  return host ? `${proto}://${host}` : "http://localhost:3000"
}

// ============================================================
// Alterar cargo de usuario
// ============================================================

export async function alterarCargo(usuarioAlvoId: string, novoCargo: string) {
  const usuario = await buscarUsuarioLogado()
  if (!usuario) {
    return { erro: "Voce precisa estar logado." }
  }

  const permissao = verificarPermissao(usuario.cargo as "admin" | "corretor" | "gerente", "gerenciar_usuarios")
  if (permissao.erro) {
    return permissao
  }

  if (!["admin", "corretor", "gerente"].includes(novoCargo)) {
    return { erro: "Cargo invalido." }
  }

  // Nao pode alterar o proprio cargo
  if (usuarioAlvoId === usuario.id) {
    return { erro: "Voce nao pode alterar seu proprio cargo." }
  }

  const supabase = await criarClienteServer()

  const { error } = await supabase
    .from("usuarios")
    .update({ cargo: novoCargo })
    .eq("id", usuarioAlvoId)
    .eq("organizacao_id", usuario.organizacao_id)

  if (error) {
    return { erro: "Erro ao alterar cargo." }
  }

  return { sucesso: `Cargo alterado para ${novoCargo}.` }
}

// ============================================================
// Desativar/ativar usuario
// ============================================================

export async function alternarStatusUsuario(usuarioAlvoId: string) {
  const usuario = await buscarUsuarioLogado()
  if (!usuario) {
    return { erro: "Voce precisa estar logado." }
  }

  const permissao = verificarPermissao(usuario.cargo as "admin" | "corretor" | "gerente", "gerenciar_usuarios")
  if (permissao.erro) {
    return permissao
  }

  // Nao pode desativar a si mesmo
  if (usuarioAlvoId === usuario.id) {
    return { erro: "Voce nao pode desativar sua propria conta." }
  }

  const supabase = await criarClienteServer()

  // Buscar status atual
  const { data: alvo } = await supabase
    .from("usuarios")
    .select("ativo")
    .eq("id", usuarioAlvoId)
    .eq("organizacao_id", usuario.organizacao_id)
    .single()

  if (!alvo) {
    return { erro: "Usuario nao encontrado." }
  }

  const { error } = await supabase
    .from("usuarios")
    .update({ ativo: !alvo.ativo })
    .eq("id", usuarioAlvoId)
    .eq("organizacao_id", usuario.organizacao_id)

  if (error) {
    return { erro: "Erro ao alterar status do usuario." }
  }

  return { sucesso: alvo.ativo ? "Usuario desativado." : "Usuario reativado." }
}

// ============================================================
// Remover usuario da organizacao
// ============================================================

export async function removerUsuario(usuarioAlvoId: string) {
  const usuario = await buscarUsuarioLogado()
  if (!usuario) {
    return { erro: "Voce precisa estar logado." }
  }

  const permissao = verificarPermissao(usuario.cargo as "admin" | "corretor" | "gerente", "gerenciar_usuarios")
  if (permissao.erro) {
    return permissao
  }

  // Nao pode remover a si mesmo
  if (usuarioAlvoId === usuario.id) {
    return { erro: "Voce nao pode remover sua propria conta." }
  }

  // Usar admin client para deletar o auth user (cascade remove da tabela usuarios)
  const supabaseAdmin = criarClienteAdmin()

  // O cliente admin ignora RLS, entao o vinculo com a organizacao precisa ser
  // conferido aqui: sem isso, um admin de qualquer organizacao removeria a conta
  // de um usuario de outra imobiliaria.
  const { data: alvo } = await supabaseAdmin
    .from("usuarios")
    .select("id, organizacao_id")
    .eq("id", usuarioAlvoId)
    .single()

  if (!alvo || alvo.organizacao_id !== usuario.organizacao_id) {
    return { erro: "Usuario nao encontrado na sua organizacao." }
  }

  const { error } = await supabaseAdmin.auth.admin.deleteUser(usuarioAlvoId)

  if (error) {
    return { erro: "Erro ao remover usuario." }
  }

  return { sucesso: "Usuario removido da organizacao." }
}
