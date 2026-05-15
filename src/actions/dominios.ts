"use server"

import dns from "node:dns/promises"
import { revalidatePath } from "next/cache"
import { criarClienteAdmin } from "@/lib/supabase/admin"
import { verificarPermissao } from "@/lib/permissoes"
import { schemaDominio } from "@/types/dominios"
import type { EstadoFormulario } from "@/types/formulario"
import { buscarUsuarioLogado } from "@/lib/buscar-usuario-logado"

// ============================================================
// Helpers
// ============================================================

/** Extrai hostname de NEXT_PUBLIC_APP_URL para comparação com CNAME */
function obterHostnameApp(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  try {
    return new URL(url).hostname
  } catch {
    return "localhost"
  }
}

// ============================================================
// Salvar domínio customizado
// ============================================================

export async function salvarDominio(
  _estado: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  const usuario = await buscarUsuarioLogado()
  if (!usuario) {
    return { erro: "Você precisa estar logado para configurar o domínio." }
  }

  const permissao = verificarPermissao(
    usuario.cargo as "admin" | "corretor" | "gerente",
    "gerenciar_site"
  )
  if (permissao.erro) return permissao

  const dominioRaw = formData.get("dominio") as string
  if (!dominioRaw) {
    return { erro: "Domínio é obrigatório." }
  }

  // Validar formato do domínio
  const resultado = schemaDominio.safeParse(dominioRaw)
  if (!resultado.success) {
    return { erro: resultado.error.issues[0].message }
  }

  const dominio = resultado.data

  const supabase = criarClienteAdmin()

  // Verificar se já existe domínio para esta organização
  const { data: existente } = await supabase
    .from("dominios_customizados")
    .select("id")
    .eq("organizacao_id", usuario.organizacao_id)
    .single()

  if (existente) {
    // Atualizar domínio existente
    const { error } = await supabase
      .from("dominios_customizados")
      .update({
        dominio,
        status: "pendente",
        verificado_em: null,
      })
      .eq("id", existente.id)

    if (error) {
      if (error.code === "23505") {
        return { erro: "Este domínio já está sendo usado por outra imobiliária." }
      }
      return { erro: "Erro ao atualizar domínio. Tente novamente." }
    }
  } else {
    const { data: criado, error } = await supabase.from("dominios_customizados").insert({
      organizacao_id: usuario.organizacao_id,
      dominio,
      status: "pendente",
    }).select("id")

    if (error) {
      console.error("[salvarDominio] insert error", error)
      if (error.code === "23505") {
        return { erro: "Este domínio já está sendo usado por outra imobiliária." }
      }
      return { erro: `Erro ao salvar domínio: ${error.message}` }
    }
    if (!criado || criado.length === 0) {
      console.error("[salvarDominio] insert afetou 0 linhas — RLS bloqueou", {
        organizacao_id: usuario.organizacao_id,
        cargo: usuario.cargo,
        dominio,
      })
      return { erro: "Não foi possível salvar (sem permissão de escrita). Avise o suporte." }
    }
  }

  revalidatePath("/configuracoes/meu-site")

  return {
    sucesso:
      "Domínio salvo! Agora configure o DNS: aponte um registro CNAME para " +
      obterHostnameApp() +
      ". Depois, clique em 'Verificar DNS'.",
  }
}

// ============================================================
// Verificar DNS do domínio
// ============================================================

export async function verificarDns(
  _estado: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  const usuario = await buscarUsuarioLogado()
  if (!usuario) {
    return { erro: "Você precisa estar logado." }
  }

  const permissao = verificarPermissao(
    usuario.cargo as "admin" | "corretor" | "gerente",
    "gerenciar_site"
  )
  if (permissao.erro) return permissao

  const supabase = criarClienteAdmin()

  // Buscar domínio da organização
  const { data: dominio } = await supabase
    .from("dominios_customizados")
    .select("id, dominio, status")
    .eq("organizacao_id", usuario.organizacao_id)
    .single()

  if (!dominio) {
    return { erro: "Nenhum domínio configurado. Salve um domínio primeiro." }
  }

  const hostnameApp = obterHostnameApp()

  // Verificar CNAME via DNS
  try {
    const registros = await dns.resolveCname(dominio.dominio)
    const cnameCorreto = registros.some(
      (registro) => registro.toLowerCase() === hostnameApp.toLowerCase()
    )

    if (cnameCorreto) {
      // DNS verificado com sucesso
      await supabase
        .from("dominios_customizados")
        .update({
          status: "verificado",
          verificado_em: new Date().toISOString(),
        })
        .eq("id", dominio.id)

      revalidatePath("/configuracoes/meu-site")
      return { sucesso: "DNS verificado com sucesso! Seu domínio está ativo." }
    }

    // CNAME encontrado mas aponta para lugar errado
    return {
      erro:
        "O CNAME do seu domínio aponta para " +
        registros[0] +
        ", mas deveria apontar para " +
        hostnameApp +
        ". Corrija no seu provedor de DNS.",
    }
  } catch {
    // DNS não encontrado ou sem CNAME
    // Tentar verificar via registro A (caso o domínio aponte diretamente)
    try {
      await dns.resolve4(dominio.dominio)
      return {
        erro:
          "Seu domínio tem registro A, mas precisa de um registro CNAME apontando para " +
          hostnameApp +
          ". Remova o registro A e crie um CNAME.",
      }
    } catch {
      return {
        erro:
          "DNS ainda não configurado. Crie um registro CNAME apontando " +
          dominio.dominio +
          " para " +
          hostnameApp +
          ". A propagação de DNS pode levar até 48 horas.",
      }
    }
  }
}

// ============================================================
// Remover domínio customizado
// ============================================================

export async function removerDominio(
  _estado: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  const usuario = await buscarUsuarioLogado()
  if (!usuario) {
    return { erro: "Você precisa estar logado." }
  }

  const permissao = verificarPermissao(
    usuario.cargo as "admin" | "corretor" | "gerente",
    "gerenciar_site"
  )
  if (permissao.erro) return permissao

  const supabase = criarClienteAdmin()

  // Buscar domínio da organização
  const { data: dominio } = await supabase
    .from("dominios_customizados")
    .select("id")
    .eq("organizacao_id", usuario.organizacao_id)
    .single()

  if (!dominio) {
    return { erro: "Nenhum domínio configurado para remover." }
  }

  const { error } = await supabase
    .from("dominios_customizados")
    .delete()
    .eq("id", dominio.id)

  if (error) {
    return { erro: "Erro ao remover domínio. Tente novamente." }
  }

  revalidatePath("/configuracoes/meu-site")

  return { sucesso: "Domínio removido. Seu site voltará a funcionar apenas pelo link padrão." }
}
