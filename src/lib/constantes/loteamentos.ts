export const labelsStatusLoteamento: Record<string, string> = {
  lancamento: "Lançamento",
  em_vendas: "Em Vendas",
  esgotado: "Esgotado",
}

export const labelsStatusLote: Record<string, string> = {
  disponivel: "Disponível",
  reservado: "Reservado",
  vendido: "Vendido",
}

export const coresStatusLote: Record<string, string> = {
  disponivel: "bg-green-100 text-green-800",
  reservado: "bg-yellow-100 text-yellow-800",
  vendido: "bg-red-100 text-red-800",
}

/**
 * Landing pages dedicadas por loteamento (Duna).
 * Quando o nome do loteamento contém o termo, o card do site público
 * leva direto pra landing page em vez da página padrão de detalhes.
 * O termo é comparado sem acentos e em minúsculas.
 */
const landingPagesLoteamento: { termo: string; url: string }[] = [
  { termo: "guaruj", url: "https://guaruja.dunarealestate.com.br" },
]

export function obterLandingPageLoteamento(nome: string): string | null {
  const nomeNormalizado = nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
  const encontrada = landingPagesLoteamento.find((lp) =>
    nomeNormalizado.includes(lp.termo)
  )
  return encontrada?.url ?? null
}
