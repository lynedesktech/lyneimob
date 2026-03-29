// ============================================================
// Mapa de permissoes centralizado
// Todas as verificacoes de cargo passam por aqui
// ============================================================

type Cargo = "admin" | "corretor" | "gerente"

export type PerfilPlataforma = "super_admin" | "desenvolvedor" | "investidor" | null

export type Acao =
  | "gerenciar_usuarios"
  | "gerenciar_plano"
  | "gerenciar_integracoes"
  | "gerenciar_site"
  | "ver_configuracoes"
  | "processar_leads"
  | "ver_todos_registros"
  | "criar_registros"
  | "editar_proprio_registro"
  | "excluir_registros"
  | "ver_conversas_whatsapp"
  | "ver_integracoes"
  | "gerenciar_organizacao"

const MAPA_PERMISSOES: Record<Acao, Cargo[]> = {
  gerenciar_usuarios:     ["admin"],
  gerenciar_plano:        ["admin"],
  gerenciar_integracoes:  ["admin"],
  gerenciar_site:         ["admin", "gerente"],
  ver_configuracoes:      ["admin", "gerente"],
  processar_leads:        ["admin", "gerente"],
  ver_todos_registros:    ["admin", "gerente"],
  criar_registros:        ["admin", "gerente", "corretor"],
  editar_proprio_registro:["admin", "gerente", "corretor"],
  excluir_registros:      ["admin"],
  ver_conversas_whatsapp: ["admin", "gerente"],
  ver_integracoes:        ["admin", "gerente"],
  gerenciar_organizacao:  ["admin"],
}

/**
 * Verifica se um cargo tem permissao para executar uma acao.
 * Perfis de plataforma (super_admin, desenvolvedor) tem acesso total a acoes organizacionais.
 */
export function temPermissao(cargo: Cargo, acao: Acao, perfilPlataforma?: PerfilPlataforma | boolean): boolean {
  // Compatibilidade: aceita boolean (super_admin antigo) ou string (perfil_plataforma novo)
  if (typeof perfilPlataforma === "boolean") {
    if (perfilPlataforma) return true
  } else if (perfilPlataforma === "super_admin" || perfilPlataforma === "desenvolvedor") {
    return true
  }
  return MAPA_PERMISSOES[acao]?.includes(cargo) ?? false
}

/**
 * Verifica permissao e retorna objeto de erro se nao permitido.
 * Usar em server actions para retorno padrao.
 */
export function verificarPermissao(
  cargo: Cargo,
  acao: Acao,
  perfilPlataforma?: PerfilPlataforma | boolean
): { erro?: string } {
  if (!temPermissao(cargo, acao, perfilPlataforma)) {
    return { erro: "Você não tem permissão para realizar esta ação." }
  }
  return {}
}

/**
 * Verifica se o usuario e super admin (dono do SaaS).
 */
export function ehSuperAdmin(usuario: { perfil_plataforma?: PerfilPlataforma; super_admin?: boolean } | null): boolean {
  if (usuario?.perfil_plataforma === "super_admin") return true
  // Fallback para campo booleano antigo (compatibilidade)
  return usuario?.super_admin === true
}

/**
 * Verifica se o usuario e desenvolvedor.
 */
export function ehDesenvolvedor(usuario: { perfil_plataforma?: PerfilPlataforma } | null): boolean {
  return usuario?.perfil_plataforma === "desenvolvedor"
}

/**
 * Verifica se o usuario e investidor.
 */
export function ehInvestidor(usuario: { perfil_plataforma?: PerfilPlataforma } | null): boolean {
  return usuario?.perfil_plataforma === "investidor"
}

/**
 * Verifica se o usuario tem qualquer perfil de plataforma (acesso a area admin).
 */
export function ehPerfilPlataforma(usuario: { perfil_plataforma?: PerfilPlataforma; super_admin?: boolean } | null): boolean {
  if (usuario?.perfil_plataforma) return true
  // Fallback para campo booleano antigo
  return usuario?.super_admin === true
}

/**
 * Verifica se o usuario tem acesso a dados financeiros.
 * Apenas super admin ve dados de faturamento, Stripe, assinaturas.
 */
export function temAcessoFinanceiro(usuario: { perfil_plataforma?: PerfilPlataforma; super_admin?: boolean } | null): boolean {
  return ehSuperAdmin(usuario)
}
