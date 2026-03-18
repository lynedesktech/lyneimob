/** Formata valor em reais (ex: R$ 350.000). Retorna fallback se null/0. */
export function formatarPreco(valor: number | null | undefined, fallback = "—"): string {
  if (!valor) return fallback
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  })
}

/** Formata centavos do Stripe em reais (ex: 9900 → R$ 99,00). */
export function formatarPrecoCentavos(centavos: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(centavos / 100)
}

/** Formata valor numérico simples sem símbolo (ex: 99 → "99"). */
export function formatarPrecoSimples(valor: number): string {
  return valor.toLocaleString("pt-BR")
}

/** Formata data em dd/mm/aaaa. Retorna "—" se null. */
export function formatarData(data: string | null): string {
  if (!data) return "—"
  return new Intl.DateTimeFormat("pt-BR").format(new Date(data))
}

/** Formata data + hora em dd/mm/aaaa HH:mm. Retorna "—" se null. */
export function formatarDataHora(data: string | null): string {
  if (!data) return "—"
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(data))
}

/** Formata data curta: dia + mês abreviado (ex: 15 mar). Retorna "—" se null. */
export function formatarDataCurta(data: string | null): string {
  if (!data) return "—"
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(new Date(data))
}

/** Formata data + hora curta: dd/mm HH:mm. */
export function formatarDataHoraCurta(data: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(data))
}
