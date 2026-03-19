"use client"

import { useEffect } from "react"
import { useContextoIA, type ModuloIA } from "./contexto-ia"

type DefinirContextoIAProps = {
  modulo: ModuloIA
  entidadeId: string
  dados?: Record<string, unknown>
}

/**
 * Componente invisível que define o contexto IA quando montado.
 * Usado nas páginas de detalhe para informar ao widget qual entidade está ativa.
 *
 * Exemplo:
 * <DefinirContextoIA modulo="imovel" entidadeId={id} dados={{ descricao_ia: imovel.descricao_ia }} />
 */
export function DefinirContextoIA({ modulo, entidadeId, dados = {} }: DefinirContextoIAProps) {
  const { definirEntidade } = useContextoIA()

  useEffect(() => {
    definirEntidade({ modulo, entidadeId, dados })

    return () => {
      definirEntidade(null)
    }
  }, [modulo, entidadeId]) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}
