"use client"

import { useState } from "react"
import { toast } from "sonner"

interface ResultadoIA {
  erro?: string
  sucesso?: string
  [chave: string]: unknown
}

export function useAcaoIA() {
  const [carregando, setCarregando] = useState(false)

  async function executar<T extends ResultadoIA>(
    acao: () => Promise<T>,
    onSucesso?: (resultado: T) => void
  ) {
    setCarregando(true)
    const resultado = await acao()
    setCarregando(false)

    if (resultado.erro) {
      toast.error(resultado.erro)
    } else {
      if (onSucesso) onSucesso(resultado)
      if (resultado.sucesso) toast.success(resultado.sucesso)
    }
  }

  return { executar, carregando }
}
