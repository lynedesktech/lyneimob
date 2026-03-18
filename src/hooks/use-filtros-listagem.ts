"use client"

import { useState, useEffect, useRef } from "react"
import { calcularTotalPaginas as calcularTotalPaginasUtil } from "@/lib/paginacao"

interface FiltrosBase {
  pagina?: number
  por_pagina?: number
  busca?: string
  [chave: string]: unknown
}

interface UseFiltrosListagemOpcoes<T extends FiltrosBase> {
  inicial: T
  debounceMs?: number
}

export function useFiltrosListagem<T extends FiltrosBase>({
  inicial,
  debounceMs = 400,
}: UseFiltrosListagemOpcoes<T>) {
  const [filtros, setFiltrosInterno] = useState<T>(inicial)
  const [buscaLocal, setBuscaLocal] = useState(inicial.busca || "")
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounce da busca
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(() => {
      setFiltrosInterno((prev) => ({
        ...prev,
        busca: buscaLocal || undefined,
        pagina: 1,
      }))
    }, debounceMs)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [buscaLocal, debounceMs])

  function setFiltro<K extends keyof T>(chave: K, valor: T[K]) {
    setFiltrosInterno((prev) => ({ ...prev, [chave]: valor, pagina: 1 }))
  }

  function setFiltros(novosFiltros: T) {
    setFiltrosInterno(novosFiltros)
  }

  function limparFiltros() {
    setFiltrosInterno(inicial)
    setBuscaLocal("")
  }

  const porPagina = filtros.por_pagina || 20
  const paginaAtual = filtros.pagina || 1

  function calcularTotalPaginas(total: number) {
    return calcularTotalPaginasUtil(total, porPagina)
  }

  function irParaPagina(pagina: number) {
    setFiltrosInterno((prev) => ({ ...prev, pagina }))
  }

  // Conta filtros ativos (ignora pagina, por_pagina e busca vazia)
  const totalFiltrosAtivos = Object.entries(filtros).filter(
    ([chave, valor]) =>
      chave !== "pagina" && chave !== "por_pagina" && valor !== undefined
  ).length

  return {
    filtros,
    setFiltro,
    setFiltros,
    buscaLocal,
    setBuscaLocal,
    limparFiltros,
    paginaAtual,
    calcularTotalPaginas,
    irParaPagina,
    totalFiltrosAtivos,
  }
}
