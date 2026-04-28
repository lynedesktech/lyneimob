// ============================================================
// LYNEDES-148 — Auth de endpoints internos
//
// Helper centralizado pra validar chamadas a /api/interno/* e
// outros endpoints sensiveis. Usa secret dedicado (INTERNAL_API_SECRET),
// nao a service-role key do Supabase. Se o secret vazar, basta trocar
// ele sem precisar rodar a key do Supabase.
//
// Aceita o secret no header `Authorization: Bearer <secret>` OU
// no header `x-internal-token`. Mantem compat temporaria com
// `x-internal-secret` enquanto Railway nao for atualizado.
// ============================================================

/**
 * Valida o segredo de autenticacao interna.
 * Retorna true se o secret for valido. Caso contrario, false.
 *
 * Ordem de checagem dos headers:
 *   1. `Authorization: Bearer <secret>`
 *   2. `x-internal-token`
 *   3. `x-internal-secret` (compat, sera removido apos migracao do Railway)
 *
 * Em todos os casos, o valor e comparado com `process.env.INTERNAL_API_SECRET`.
 *
 * Como fallback de transicao (NUNCA em prod sem aviso), tambem aceita a
 * `SUPABASE_SERVICE_ROLE_KEY` em `x-internal-secret`. Esse fallback existe
 * pra nao quebrar o Railway antes da migracao das envs. Quando todos os
 * chamadores forem atualizados, este fallback deve ser removido.
 */
export function validarAuthInterna(request: Request): boolean {
  const expected = process.env.INTERNAL_API_SECRET
  if (!expected) {
    console.error(
      "[auth-interna] INTERNAL_API_SECRET nao configurada — bloqueando todas as chamadas internas."
    )
    return false
  }

  // 1. Authorization: Bearer <secret>
  const authHeader = request.headers.get("authorization")
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim()
    if (token && token === expected) return true
  }

  // 2. x-internal-token
  const tokenHeader = request.headers.get("x-internal-token")
  if (tokenHeader && tokenHeader === expected) return true

  // 3. x-internal-secret (compat com chamadores antigos)
  const legacyHeader = request.headers.get("x-internal-secret")
  if (legacyHeader && legacyHeader === expected) return true

  // Fallback de transicao: aceitar service-role key em x-internal-secret.
  // Quando Railway estiver atualizado com INTERNAL_API_SECRET, remover este bloco.
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (serviceRoleKey && legacyHeader && legacyHeader === serviceRoleKey) {
    console.warn(
      "[auth-interna] Chamada autorizada via legado SUPABASE_SERVICE_ROLE_KEY — atualize o chamador para usar INTERNAL_API_SECRET."
    )
    return true
  }

  return false
}
