/** Calcula o range (inicio, fim) para queries paginadas do Supabase. */
export function calcularRange(pagina: number, porPagina: number) {
  const inicio = (pagina - 1) * porPagina
  return { inicio, fim: inicio + porPagina - 1 }
}

/** Calcula o total de páginas a partir do total de registros. */
export function calcularTotalPaginas(total: number, porPagina: number) {
  return Math.max(1, Math.ceil(total / porPagina))
}
