"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Search } from "lucide-react"
import { labelsTipoImovel, labelsFinalidade } from "@/lib/constantes"

type Props = {
  slug: string
}

export function BuscaRapidaHero({ slug }: Props) {
  const router = useRouter()
  const [tipo, setTipo] = useState("")
  const [finalidade, setFinalidade] = useState("")
  const [busca, setBusca] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (tipo) params.set("tipo", tipo)
    if (finalidade) params.set("finalidade", finalidade)
    if (busca) params.set("busca", busca)
    router.push(`/${slug}/imoveis?${params.toString()}`)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-10 mx-auto flex w-full max-w-3xl flex-col gap-3 rounded-xl bg-white/10 p-3 backdrop-blur-sm sm:flex-row sm:items-center sm:gap-2 sm:rounded-full sm:p-2"
    >
      <input
        type="text"
        placeholder="Bairro, cidade ou tipo de imóvel..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        className="flex-1 rounded-full bg-white px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none"
      />

      <select
        value={tipo}
        onChange={(e) => setTipo(e.target.value)}
        className="rounded-full bg-white px-4 py-3 text-sm text-foreground outline-none appearance-none cursor-pointer"
      >
        <option value="">Tipo</option>
        {Object.entries(labelsTipoImovel).map(([valor, label]) => (
          <option key={valor} value={valor}>
            {label}
          </option>
        ))}
      </select>

      <select
        value={finalidade}
        onChange={(e) => setFinalidade(e.target.value)}
        className="rounded-full bg-white px-4 py-3 text-sm text-foreground outline-none appearance-none cursor-pointer"
      >
        <option value="">Finalidade</option>
        {Object.entries(labelsFinalidade).map(([valor, label]) => (
          <option key={valor} value={valor}>
            {label}
          </option>
        ))}
      </select>

      <button
        type="submit"
        className="flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white transition-colors"
        style={{ backgroundColor: "var(--site-destaque)" }}
      >
        <Search className="h-4 w-4" />
        <span className="sm:hidden">Buscar</span>
      </button>
    </form>
  )
}
