// ============================================================
// LYNEDES-148 — Auth de endpoints internos
//
// Helper centralizado pra validar chamadas a /api/interno/* e
// outros endpoints sensiveis. Usa secret dedicado (INTERNAL_API_SECRET),
// nao a service-role key do Supabase. Se o secret vazar, basta trocar
// ele sem precisar rodar a key do Supabase.
//
// Aceita o secret nos headers Authorization: Bearer / x-internal-token /
// x-internal-secret (compat). Compara contra DOIS valores aceitos durante
// a migracao: INTERNAL_API_SECRET (novo) e SUPABASE_SERVICE_ROLE_KEY
// (legacy). Quando todos os chamadores estiverem usando o novo, remover
// o fallback deste arquivo.
// ============================================================

/**
 * Valida o segredo de autenticacao interna.
 * Retorna true se o secret for valido. Caso contrario, false.
 *
 * Aceita o secret em 3 headers (qualquer ordem):
 *   1. `Authorization: Bearer <secret>` (preferencial)
 *   2. `x-internal-token`
 *   3. `x-internal-secret` (compat com chamadores antigos)
 *
 * Compara contra DOIS valores aceitos durante a migracao:
 *   - `INTERNAL_API_SECRET` (novo, dedicado)
 *   - `SUPABASE_SERVICE_ROLE_KEY` (legacy, sera removido apos 7 dias estavel)
 *
 * Importante: enquanto INTERNAL_API_SECRET nao for configurada em todas as
 * envs (Vercel + Railway + .env.local), o fallback pro service-role mantem
 * o agente funcionando em prod. Pelo menos uma das duas envs precisa estar
 * configurada — sem nenhuma, todas as chamadas sao bloqueadas.
 */
export function validarAuthInterna(request: Request): boolean {
  const newSecret = process.env.INTERNAL_API_SECRET
  const legacySecret = process.env.SUPABASE_SERVICE_ROLE_KEY

  // Pelo menos um dos dois precisa estar configurado
  if (!newSecret && !legacySecret) {
    console.error(
      "[auth-interna] Nem INTERNAL_API_SECRET nem SUPABASE_SERVICE_ROLE_KEY configuradas — bloqueando."
    )
    return false
  }

  // Lista de valores aceitos (filtra falsy)
  const accepted = [newSecret, legacySecret].filter((v): v is string => Boolean(v))

  // 1. Authorization: Bearer <secret>
  const authHeader = request.headers.get("authorization")
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim()
    if (token && accepted.includes(token)) {
      if (token === legacySecret && newSecret) {
        console.warn(
          "[auth-interna] Bearer com legado SUPABASE_SERVICE_ROLE_KEY — atualize chamador pra INTERNAL_API_SECRET."
        )
      }
      return true
    }
  }

  // 2. x-internal-token
  const tokenHeader = request.headers.get("x-internal-token")
  if (tokenHeader && accepted.includes(tokenHeader)) return true

  // 3. x-internal-secret (compat)
  const legacyHeader = request.headers.get("x-internal-secret")
  if (legacyHeader && accepted.includes(legacyHeader)) {
    if (legacyHeader === legacySecret && newSecret) {
      console.warn(
        "[auth-interna] Chamada via legacy x-internal-secret + service-role — atualize chamador."
      )
    }
    return true
  }

  return false
}
