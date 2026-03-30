import { cache } from "react"
import { criarClienteServer } from "./server"

/**
 * Retorna o usuario autenticado do Supabase Auth.
 * Cacheado por render — layout e page compartilham o mesmo resultado.
 */
export const obterUsuarioAutenticado = cache(async () => {
  const supabase = await criarClienteServer()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
})

/**
 * Busca dados do usuario na tabela `usuarios`.
 * Cacheado por render + userId.
 */
export const obterDadosUsuario = cache(async (userId: string) => {
  const supabase = await criarClienteServer()
  const { data, error } = await supabase
    .from("usuarios")
    .select("*")
    .eq("id", userId)
    .single()
  if (error) return null
  return data
})

/**
 * Busca dados da organizacao na tabela `organizacoes`.
 * Cacheado por render + orgId.
 */
export const obterOrganizacao = cache(async (orgId: string) => {
  const supabase = await criarClienteServer()
  const { data, error } = await supabase
    .from("organizacoes")
    .select("*")
    .eq("id", orgId)
    .single()
  if (error) return null
  return data
})
