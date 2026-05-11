import { redis } from "@/lib/redis"

// ============================================================
// Observabilidade do callback Railway -> CRM
// (LYNEDES-151)
//
// Counters horarios (TTL 48h) somados pra "ultimas 24h":
//   crm:callback:{success|fail|already_exists}:hourly:YYYY-MM-DD-HH
//
// Lista de latencias (rolling 1000):
//   crm:callback:latencia_ms
//
// Timestamp do ultimo callback:
//   crm:callback:ultimo_em
// ============================================================

type StatusCallback = "success" | "fail" | "already_exists"

const TTL_CHAVE_HORARIA_S = 48 * 60 * 60 // 48h
const MAX_LATENCIAS = 1000
const CHAVE_LATENCIAS = "crm:callback:latencia_ms"
const CHAVE_ULTIMO_EM = "crm:callback:ultimo_em"

function chaveHoraria(status: StatusCallback, agora = new Date()): string {
  const ano = agora.getUTCFullYear()
  const mes = String(agora.getUTCMonth() + 1).padStart(2, "0")
  const dia = String(agora.getUTCDate()).padStart(2, "0")
  const hora = String(agora.getUTCHours()).padStart(2, "0")
  return `crm:callback:${status}:hourly:${ano}-${mes}-${dia}-${hora}`
}

/**
 * Registra a ocorrencia de um callback Railway no Redis. Falha silenciosamente
 * se Redis nao estiver configurado ou se houver erro de rede — observabilidade
 * nao pode quebrar o fluxo principal.
 */
export async function registrarCallback(
  status: StatusCallback,
  latenciaMs: number
): Promise<void> {
  if (!redis) return

  const chave = chaveHoraria(status)
  const agoraIso = new Date().toISOString()

  try {
    await Promise.all([
      redis.incr(chave).then(() => redis!.expire(chave, TTL_CHAVE_HORARIA_S)),
      redis
        .lpush(CHAVE_LATENCIAS, latenciaMs)
        .then(() => redis!.ltrim(CHAVE_LATENCIAS, 0, MAX_LATENCIAS - 1)),
      redis.set(CHAVE_ULTIMO_EM, agoraIso),
    ])
  } catch (error) {
    console.error("[OBSERVABILIDADE] Falha ao registrar callback no Redis", error)
  }
}

export interface MetricasCallbackRailway {
  success_count_24h: number
  fail_count_24h: number
  already_exists_count_24h: number
  total_24h: number
  taxa_sucesso_pct: number
  latencia_p50_ms: number | null
  latencia_p95_ms: number | null
  latencia_p99_ms: number | null
  latencias_amostra: number
  ultimo_callback_em: string | null
  redis_disponivel: boolean
}

const METRICAS_VAZIAS: MetricasCallbackRailway = {
  success_count_24h: 0,
  fail_count_24h: 0,
  already_exists_count_24h: 0,
  total_24h: 0,
  taxa_sucesso_pct: 0,
  latencia_p50_ms: null,
  latencia_p95_ms: null,
  latencia_p99_ms: null,
  latencias_amostra: 0,
  ultimo_callback_em: null,
  redis_disponivel: false,
}

function calcularPercentil(valores: number[], p: number): number | null {
  if (valores.length === 0) return null
  const ordenados = [...valores].sort((a, b) => a - b)
  const indice = Math.min(
    ordenados.length - 1,
    Math.floor((p / 100) * ordenados.length)
  )
  return Math.round(ordenados[indice])
}

function somarValores(lista: (number | string | null)[]): number {
  return lista.reduce<number>((acc, v) => {
    if (v == null) return acc
    const n = Number(v)
    return acc + (Number.isFinite(n) ? n : 0)
  }, 0)
}

/**
 * Le metricas agregadas das ultimas 24h. Soma 24 chaves horarias (uma por hora
 * UTC) por status. `taxa_sucesso_pct` considera success+already_exists como
 * "deu certo" (ja_existe nao e erro — eh idempotencia funcionando).
 */
export async function lerMetricasCallback(): Promise<MetricasCallbackRailway> {
  if (!redis) return METRICAS_VAZIAS

  const agora = new Date()
  const chavesSuccess: string[] = []
  const chavesFail: string[] = []
  const chavesAlready: string[] = []

  for (let i = 0; i < 24; i++) {
    const tempo = new Date(agora.getTime() - i * 60 * 60 * 1000)
    chavesSuccess.push(chaveHoraria("success", tempo))
    chavesFail.push(chaveHoraria("fail", tempo))
    chavesAlready.push(chaveHoraria("already_exists", tempo))
  }

  try {
    const [vSuccess, vFail, vAlready, latenciasRaw, ultimoEm] = await Promise.all([
      redis.mget<(number | string | null)[]>(...chavesSuccess),
      redis.mget<(number | string | null)[]>(...chavesFail),
      redis.mget<(number | string | null)[]>(...chavesAlready),
      redis.lrange(CHAVE_LATENCIAS, 0, MAX_LATENCIAS - 1),
      redis.get<string>(CHAVE_ULTIMO_EM),
    ])

    const success = somarValores(vSuccess)
    const fail = somarValores(vFail)
    const already = somarValores(vAlready)
    const total = success + fail + already

    const latencias = latenciasRaw
      .map((v) => Number(v))
      .filter((v) => Number.isFinite(v))

    return {
      success_count_24h: success,
      fail_count_24h: fail,
      already_exists_count_24h: already,
      total_24h: total,
      taxa_sucesso_pct:
        total > 0
          ? Math.round(((success + already) / total) * 1000) / 10
          : 0,
      latencia_p50_ms: calcularPercentil(latencias, 50),
      latencia_p95_ms: calcularPercentil(latencias, 95),
      latencia_p99_ms: calcularPercentil(latencias, 99),
      latencias_amostra: latencias.length,
      ultimo_callback_em: ultimoEm,
      redis_disponivel: true,
    }
  } catch (error) {
    console.error("[OBSERVABILIDADE] Falha ao ler metricas do Redis", error)
    return { ...METRICAS_VAZIAS, redis_disponivel: true }
  }
}
