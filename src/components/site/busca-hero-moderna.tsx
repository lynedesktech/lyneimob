"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search, SlidersHorizontal, X } from "lucide-react"

type Aba = "comprar" | "alugar" | "lotes"

type Props = {
  slug: string
  temLoteamentos: boolean
}

const PLACEHOLDERS: Record<Aba, string> = {
  comprar: "Busque imóveis para comprar...",
  alugar: "Busque imóveis para alugar...",
  lotes: "Busque loteamentos...",
}

const FINALIDADE_MAP: Record<string, string> = {
  comprar: "venda",
  alugar: "aluguel",
}

function mascaraReal(valor: string): string {
  const numeros = valor.replace(/\D/g, "")
  if (!numeros) return ""
  const numero = Number(numeros)
  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  })
}

export function BuscaHeroModerna({ slug, temLoteamentos }: Props) {
  const router = useRouter()
  const [abaAtiva, setAbaAtiva] = useState<Aba>("comprar")
  const [busca, setBusca] = useState("")
  const [filtrosAbertos, setFiltrosAbertos] = useState(false)

  // Filtros avançados — imóveis
  const [precoMin, setPrecoMin] = useState("")
  const [precoMax, setPrecoMax] = useState("")
  const [dormitorios, setDormitorios] = useState<number | null>(null)
  const [vagas, setVagas] = useState<number | null>(null)
  const [areaMin, setAreaMin] = useState("")
  const [areaMax, setAreaMax] = useState("")

  // Filtros avançados — lotes
  const [loteCidade, setLoteCidade] = useState("")
  const [lotePrecoMin, setLotePrecoMin] = useState("")
  const [lotePrecoMax, setLotePrecoMax] = useState("")
  const [loteAreaMin, setLoteAreaMin] = useState("")
  const [loteAreaMax, setLoteAreaMax] = useState("")

  const temFiltrosAtivos =
    abaAtiva === "lotes"
      ? !!(loteCidade || lotePrecoMin || lotePrecoMax || loteAreaMin || loteAreaMax)
      : !!(precoMin || precoMax || dormitorios || vagas || areaMin || areaMax)

  function limparFiltros() {
    if (abaAtiva === "lotes") {
      setLoteCidade("")
      setLotePrecoMin("")
      setLotePrecoMax("")
      setLoteAreaMin("")
      setLoteAreaMax("")
    } else {
      setPrecoMin("")
      setPrecoMax("")
      setDormitorios(null)
      setVagas(null)
      setAreaMin("")
      setAreaMax("")
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (abaAtiva === "lotes") {
      const params = new URLSearchParams()
      if (busca) params.set("busca", busca)
      if (loteCidade) params.set("cidade", loteCidade)
      if (lotePrecoMin) params.set("preco_min", lotePrecoMin.replace(/\D/g, ""))
      if (lotePrecoMax) params.set("preco_max", lotePrecoMax.replace(/\D/g, ""))
      if (loteAreaMin) params.set("area_min", loteAreaMin)
      if (loteAreaMax) params.set("area_max", loteAreaMax)
      router.push(`/${slug}/loteamentos?${params.toString()}`)
      return
    }

    const params = new URLSearchParams()
    params.set("finalidade", FINALIDADE_MAP[abaAtiva])
    if (busca) params.set("busca", busca)
    if (precoMin) params.set("preco_min", precoMin.replace(/\D/g, ""))
    if (precoMax) params.set("preco_max", precoMax.replace(/\D/g, ""))
    if (dormitorios) params.set("quartos", String(dormitorios))
    if (vagas) params.set("vagas", String(vagas))
    if (areaMin) params.set("area_min", areaMin)
    if (areaMax) params.set("area_max", areaMax)
    router.push(`/${slug}/imoveis?${params.toString()}`)
  }

  const abas: { id: Aba; label: string; ocultar?: boolean }[] = [
    { id: "comprar", label: "Comprar" },
    { id: "alugar", label: "Alugar" },
    { id: "lotes", label: "Lotes", ocultar: !temLoteamentos },
  ]

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-10 mx-auto w-full max-w-3xl rounded-xl bg-white/10 p-4 backdrop-blur-md"
    >
      {/* Abas */}
      <div className="mb-4 flex gap-1">
        {abas
          .filter((a) => !a.ocultar)
          .map((aba) => (
            <button
              key={aba.id}
              type="button"
              onClick={() => setAbaAtiva(aba.id)}
              className={`relative rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                abaAtiva === aba.id
                  ? "bg-white shadow-sm"
                  : "text-white/80 hover:text-white hover:bg-white/10"
              }`}
              style={abaAtiva === aba.id ? { color: "var(--site-primaria)" } : undefined}
            >
              {aba.label}
            </button>
          ))}
      </div>

      {/* Campo de busca + botões */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder={PLACEHOLDERS[abaAtiva]}
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full rounded-lg bg-white py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            className="flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "var(--site-primaria)" }}
          >
            <Search className="h-4 w-4" />
            Buscar
          </button>

          <button
            type="button"
            onClick={() => setFiltrosAbertos(!filtrosAbertos)}
            className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
              filtrosAbertos || temFiltrosAtivos
                ? "border-white bg-white/20 text-white"
                : "border-white/30 text-white/80 hover:border-white/50 hover:text-white"
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline">Filtros</span>
          </button>
        </div>
      </div>

      {/* Painel de filtros expandível */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          filtrosAbertos
            ? "mt-4 max-h-96 opacity-100"
            : "max-h-0 opacity-0"
        }`}
      >
        <div className="rounded-lg bg-white/10 p-4">
          {abaAtiva === "lotes" ? (
            /* Filtros de lotes */
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {/* Localização */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-white/80">Localização</p>
                <input
                  type="text"
                  placeholder="Cidade ou bairro"
                  value={loteCidade}
                  onChange={(e) => setLoteCidade(e.target.value)}
                  className="w-full rounded-md bg-white/90 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none"
                />
              </div>

              {/* Valor */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-white/80">Valor</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Mínimo"
                    value={lotePrecoMin ? mascaraReal(lotePrecoMin) : ""}
                    onChange={(e) => setLotePrecoMin(e.target.value.replace(/\D/g, ""))}
                    className="w-full rounded-md bg-white/90 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Máximo"
                    value={lotePrecoMax ? mascaraReal(lotePrecoMax) : ""}
                    onChange={(e) => setLotePrecoMax(e.target.value.replace(/\D/g, ""))}
                    className="w-full rounded-md bg-white/90 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none"
                  />
                </div>
              </div>

              {/* Área */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-white/80">Área (m²)</p>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="De"
                    value={loteAreaMin}
                    onChange={(e) => setLoteAreaMin(e.target.value)}
                    className="w-full rounded-md bg-white/90 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none"
                  />
                  <input
                    type="number"
                    placeholder="Até"
                    value={loteAreaMax}
                    onChange={(e) => setLoteAreaMax(e.target.value)}
                    className="w-full rounded-md bg-white/90 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Filtros de imóveis */
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Valor */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-white/80">Valor</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Mínimo"
                    value={precoMin ? mascaraReal(precoMin) : ""}
                    onChange={(e) => setPrecoMin(e.target.value.replace(/\D/g, ""))}
                    className="w-full rounded-md bg-white/90 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Máximo"
                    value={precoMax ? mascaraReal(precoMax) : ""}
                    onChange={(e) => setPrecoMax(e.target.value.replace(/\D/g, ""))}
                    className="w-full rounded-md bg-white/90 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none"
                  />
                </div>
              </div>

              {/* Dormitórios */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-white/80">Dormitórios</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setDormitorios(dormitorios === n ? null : n)}
                      className={`flex-1 rounded-md py-2 text-xs font-medium transition-colors ${
                        dormitorios === n
                          ? "text-white shadow-sm"
                          : "bg-white/20 text-white/80 hover:bg-white/30"
                      }`}
                      style={dormitorios === n ? { backgroundColor: "var(--site-primaria)" } : undefined}
                    >
                      {n === 4 ? "4+" : n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Área */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-white/80">Área (m²)</p>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="De"
                    value={areaMin}
                    onChange={(e) => setAreaMin(e.target.value)}
                    className="w-full rounded-md bg-white/90 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none"
                  />
                  <input
                    type="number"
                    placeholder="Até"
                    value={areaMax}
                    onChange={(e) => setAreaMax(e.target.value)}
                    className="w-full rounded-md bg-white/90 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none"
                  />
                </div>
              </div>

              {/* Vagas */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-white/80">Vagas</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setVagas(vagas === n ? null : n)}
                      className={`flex-1 rounded-md py-2 text-xs font-medium transition-colors ${
                        vagas === n
                          ? "text-white shadow-sm"
                          : "bg-white/20 text-white/80 hover:bg-white/30"
                      }`}
                      style={vagas === n ? { backgroundColor: "var(--site-primaria)" } : undefined}
                    >
                      {n === 4 ? "4+" : n}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Limpar filtros */}
          {temFiltrosAtivos && (
            <button
              type="button"
              onClick={limparFiltros}
              className="mt-3 flex items-center gap-1 text-xs text-white/70 hover:text-white transition-colors"
            >
              <X className="h-3 w-3" />
              Limpar filtros
            </button>
          )}
        </div>
      </div>
    </form>
  )
}
