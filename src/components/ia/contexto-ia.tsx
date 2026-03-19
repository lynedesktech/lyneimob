"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

/**
 * Contexto IA — permite que as páginas de detalhe informem ao widget
 * qual entidade está sendo visualizada e seu estado atual.
 */

export type ModuloIA = "imovel" | "cliente" | "negocio" | "atividade" | "loteamento" | "painel"

export type ContextoEntidadeIA = {
  modulo: ModuloIA
  entidadeId: string
  /** Dados extras que as ações condicionais precisam (ex: status do negócio) */
  dados: Record<string, unknown>
}

type ContextoIAValor = {
  entidade: ContextoEntidadeIA | null
  definirEntidade: (entidade: ContextoEntidadeIA | null) => void
}

const ContextoIA = createContext<ContextoIAValor>({
  entidade: null,
  definirEntidade: () => {},
})

export function ProvedorContextoIA({ children }: { children: ReactNode }) {
  const [entidade, setEntidade] = useState<ContextoEntidadeIA | null>(null)

  const definirEntidade = useCallback((novaEntidade: ContextoEntidadeIA | null) => {
    setEntidade(novaEntidade)
  }, [])

  return (
    <ContextoIA.Provider value={{ entidade, definirEntidade }}>
      {children}
    </ContextoIA.Provider>
  )
}

export function useContextoIA() {
  return useContext(ContextoIA)
}
