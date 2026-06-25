// ============================================================
// Formatador de imóvel — FONTE ÚNICA de formatação de cômodos
// Usado pelo agente SDR (ficha pro modelo, listagem e card do WhatsApp).
//
// Regra central (anti dado-lixo): quarto/suíte/banheiro/vaga só aparecem
// quando o valor é > 0. Terreno, lote e loteamento NUNCA exibem cômodos —
// não existe "0 quarto / 0 banheiro / 0 vaga" num terreno.
// ============================================================

type ImovelLike = Record<string, unknown>

// Tipos de imóvel que não possuem cômodos (são área pura)
const TIPOS_SEM_COMODOS = new Set(["terreno", "lote", "loteamento"])

/** Converte valor desconhecido em número positivo, ou null se for 0/vazio/inválido. */
function numPositivo(v: unknown): number | null {
  const n = typeof v === "number" ? v : Number(v)
  return Number.isFinite(n) && n > 0 ? n : null
}

/** True se o imóvel é terreno/lote/loteamento (nunca mostra cômodos). */
export function ehImovelSemComodos(tipo: unknown): boolean {
  return TIPOS_SEM_COMODOS.has(String(tipo ?? "").toLowerCase().trim())
}

/**
 * Linhas de cômodos para o CARD do WhatsApp (com emoji).
 * Retorna [] para terreno/lote ou quando todos os campos são 0/vazios.
 */
export function linhasComodosCard(i: ImovelLike): string[] {
  if (ehImovelSemComodos(i.tipo)) return []
  const q = numPositivo(i.quartos)
  const s = numPositivo(i.suites)
  const b = numPositivo(i.banheiros)
  const v = numPositivo(i.vagas)
  const linhas: string[] = []
  if (q) {
    linhas.push(`🛏 ${q} quarto${q > 1 ? "s" : ""}${s ? ` (${s} suíte${s > 1 ? "s" : ""})` : ""}`)
  } else if (s) {
    // Imóvel cadastrado só com suíte (sem quartos) ainda mostra os dormitórios
    linhas.push(`🛏 ${s} suíte${s > 1 ? "s" : ""}`)
  }
  if (b) linhas.push(`🚿 ${b} banheiro${b > 1 ? "s" : ""}`)
  if (v) linhas.push(`🚗 ${v} vaga${v > 1 ? "s" : ""}`)
  return linhas
}

/**
 * Linhas de cômodos para a FICHA TEXTO que vai pro modelo (rotuladas).
 * Retorna [] para terreno/lote ou quando todos os campos são 0/vazios.
 */
export function linhasComodosFicha(i: ImovelLike): string[] {
  if (ehImovelSemComodos(i.tipo)) return []
  const q = numPositivo(i.quartos)
  const s = numPositivo(i.suites)
  const b = numPositivo(i.banheiros)
  const v = numPositivo(i.vagas)
  const linhas: string[] = []
  if (q) linhas.push(`Quartos: ${q}`)
  if (s) linhas.push(`Suítes: ${s}`)
  if (b) linhas.push(`Banheiros: ${b}`)
  if (v) linhas.push(`Vagas: ${v}`)
  return linhas
}

/**
 * Resumo compacto de cômodos para listagem interna: "3q/1s/2b/2v".
 * Retorna "" para terreno/lote ou quando não há cômodos.
 */
export function comodosCompacto(i: ImovelLike): string {
  if (ehImovelSemComodos(i.tipo)) return ""
  const q = numPositivo(i.quartos)
  const s = numPositivo(i.suites)
  const b = numPositivo(i.banheiros)
  const v = numPositivo(i.vagas)
  const partes: string[] = []
  if (q) partes.push(`${q}q`)
  if (s) partes.push(`${s}s`)
  if (b) partes.push(`${b}b`)
  if (v) partes.push(`${v}v`)
  return partes.join("/")
}
