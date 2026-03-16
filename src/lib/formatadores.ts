/** Formata valor em reais (ex: R$ 350.000). Retorna "—" se null/0. */
export function formatarPreco(valor: number | null): string {
  if (!valor) return "—"
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  })
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

/** Formata data curta: dia + mês abreviado (ex: 15 mar). Retorna null se null. */
export function formatarDataCurta(data: string | null): string | null {
  if (!data) return null
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
