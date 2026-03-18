"use server"

import { revalidatePath } from "next/cache"
import { criarClienteServer } from "@/lib/supabase/server"
import { verificarPermissao } from "@/lib/permissoes"
import { schemaConfiguracoesSite } from "@/types/configuracoes-site"
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
// Salvar configurações do site
// ============================================================

export async function salvarConfiguracoesSite(
  _estado: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  const usuario = await buscarUsuarioLogado()
  if (!usuario) {
    return { erro: "Você precisa estar logado para alterar as configurações." }
  }

  const permissao = verificarPermissao(usuario.cargo as "admin" | "corretor" | "gerente", "gerenciar_site")
  if (permissao.erro) {
    return permissao
  }

  // Montar objeto das configurações a partir do FormData
  const configJson = formData.get("configuracoes") as string
  if (!configJson) {
    return { erro: "Dados inválidos." }
  }

  let configParseada
  try {
    configParseada = JSON.parse(configJson)
  } catch {
    return { erro: "Formato de dados inválido." }
  }

  const resultado = schemaConfiguracoesSite.safeParse(configParseada)
  if (!resultado.success) {
    return { erro: "Dados de configuração inválidos. Verifique os campos." }
  }

  // Logo URL (campo separado na tabela organizacoes)
  const logoUrl = (formData.get("logo_url") as string) || null

  const supabase = await criarClienteServer()

  const { error } = await supabase
    .from("organizacoes")
    .update({
      configuracoes_site: resultado.data,
      logo_url: logoUrl || null,
    })
    .eq("id", usuario.organizacao_id)

  if (error) {
    return { erro: "Erro ao salvar configurações. Tente novamente." }
  }

  // Revalidar o site público e o dashboard
  revalidatePath("/", "layout")

  return { sucesso: "Configurações salvas com sucesso!" }
}

// ============================================================
// Upload de imagem do site (hero ou logo)
// ============================================================

export async function uploadImagemSite(
  formData: FormData
): Promise<{ erro?: string; url?: string }> {
  const usuario = await buscarUsuarioLogado()
  if (!usuario) {
    return { erro: "Você precisa estar logado." }
  }

  const permissao = verificarPermissao(usuario.cargo as "admin" | "corretor" | "gerente", "gerenciar_site")
  if (permissao.erro) {
    return permissao
  }

  const arquivo = formData.get("arquivo") as File
  const tipo = formData.get("tipo") as string // "hero-bg" ou "logo"

  if (!arquivo || !tipo) {
    return { erro: "Arquivo e tipo são obrigatórios." }
  }

  // Validar tipo de arquivo
  const tiposPermitidos = ["image/jpeg", "image/png", "image/webp"]
  if (!tiposPermitidos.includes(arquivo.type)) {
    return { erro: "Formato não suportado. Use JPG, PNG ou WebP." }
  }

  // Validar tamanho (5MB)
  if (arquivo.size > 5 * 1024 * 1024) {
    return { erro: "Imagem muito grande. O limite é 5MB." }
  }

  const extensao = arquivo.name.split(".").pop() || "jpg"
  const caminho = `${usuario.organizacao_id}/${tipo}.${extensao}`

  const supabase = await criarClienteServer()

  // Remover arquivo anterior (se existir)
  const { data: arquivosExistentes } = await supabase.storage
    .from("site-assets")
    .list(usuario.organizacao_id, {
      search: tipo,
    })

  if (arquivosExistentes && arquivosExistentes.length > 0) {
    const caminhosDeletar = arquivosExistentes
      .filter((a) => a.name.startsWith(tipo))
      .map((a) => `${usuario.organizacao_id}/${a.name}`)

    if (caminhosDeletar.length > 0) {
      await supabase.storage.from("site-assets").remove(caminhosDeletar)
    }
  }

  // Upload do novo arquivo
  const { error: erroUpload } = await supabase.storage
    .from("site-assets")
    .upload(caminho, arquivo, {
      upsert: true,
    })

  if (erroUpload) {
    return { erro: "Erro ao fazer upload da imagem. Tente novamente." }
  }

  // Gerar URL pública
  const { data: urlPublica } = supabase.storage
    .from("site-assets")
    .getPublicUrl(caminho)

  revalidatePath("/", "layout")

  return { url: urlPublica.publicUrl }
}

// ============================================================
// Remover imagem do site
// ============================================================

export async function removerImagemSite(
  formData: FormData
): Promise<EstadoFormulario> {
  const usuario = await buscarUsuarioLogado()
  if (!usuario) {
    return { erro: "Você precisa estar logado." }
  }

  const permissao = verificarPermissao(usuario.cargo as "admin" | "corretor" | "gerente", "gerenciar_site")
  if (permissao.erro) {
    return permissao
  }

  const tipo = formData.get("tipo") as string // "hero-bg" ou "logo"

  if (!tipo) {
    return { erro: "Tipo de imagem é obrigatório." }
  }

  const supabase = await criarClienteServer()

  // Listar e remover arquivos do tipo
  const { data: arquivos } = await supabase.storage
    .from("site-assets")
    .list(usuario.organizacao_id, { search: tipo })

  if (arquivos && arquivos.length > 0) {
    const caminhos = arquivos
      .filter((a) => a.name.startsWith(tipo))
      .map((a) => `${usuario.organizacao_id}/${a.name}`)

    if (caminhos.length > 0) {
      await supabase.storage.from("site-assets").remove(caminhos)
    }
  }

  revalidatePath("/", "layout")

  return { sucesso: "Imagem removida com sucesso!" }
}
