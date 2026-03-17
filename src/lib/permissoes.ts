// ============================================================
// Mapa de permissoes centralizado
// Todas as verificacoes de cargo passam por aqui
// ============================================================

type Cargo = "admin" | "corretor" | "gerente"

export type Acao =
  | "gerenciar_usuarios"
  | "gerenciar_plano"
  | "gerenciar_integracoes"
  | "gerenciar_site"
  | "processar_leads"
  | "ver_todos_registros"
  | "criar_registros"
  | "editar_proprio_registro"
  | "excluir_registros"
  | "ver_conversas_whatsapp"
  | "ver_integracoes"

const MAPA_PERMISSOES: Record<Acao, Cargo[]> = {
  gerenciar_usuarios:     ["admin"],
  gerenciar_plano:        ["admin"],
  gerenciar_integracoes:  ["admin"],
  gerenciar_site:         ["admin", "gerente"],
  processar_leads:        ["admin", "gerente"],
  ver_todos_registros:    ["admin", "gerente"],
  criar_registros:        ["admin", "gerente", "corretor"],
  editar_proprio_registro:["admin", "gerente", "corretor"],
  excluir_registros:      ["admin"],
  ver_conversas_whatsapp: ["admin", "gerente"],
  ver_integracoes:        ["admin", "gerente"],
}

/**
 * Verifica se um cargo tem permissao para executar uma acao.
 * Super admin tem acesso total a qualquer acao.
 */
export function temPermissao(cargo: Cargo, acao: Acao, superAdmin?: boolean): boolean {
  if (superAdmin) return true
  return MAPA_PERMISSOES[acao]?.includes(cargo) ?? false
}

/**
 * Verifica permissao e retorna objeto de erro se nao permitido.
 * Usar em server actions para retorno padrao.
 */
export function verificarPermissao(
  cargo: Cargo,
  acao: Acao,
  superAdmin?: boolean
): { erro?: string } {
  if (!temPermissao(cargo, acao, superAdmin)) {
    return { erro: "Voce nao tem permissao para realizar esta acao." }
  }
  return {}
}

/**
 * Retorna lista de acoes permitidas para um cargo.
 * Util para condicionar UI no frontend.
 */
export function obterPermissoes(cargo: Cargo): Acao[] {
  return (Object.entries(MAPA_PERMISSOES) as [Acao, Cargo[]][])
    .filter(([, cargos]) => cargos.includes(cargo))
    .map(([acao]) => acao)
}

/**
 * Verifica se o usuario e super admin (dono do SaaS).
 */
export function ehSuperAdmin(usuario: { super_admin?: boolean } | null): boolean {
  return usuario?.super_admin === true
}
