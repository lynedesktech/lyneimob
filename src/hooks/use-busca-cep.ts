"use client"

import { useState, useCallback } from "react"
import { toast } from "sonner"

export type DadosCep = {
  logradouro: string
  bairro: string
  cidade: string
  estado: string
}

export function useBuscaCep() {
  const [buscandoCep, setBuscandoCep] = useState(false)
  const [preenchidoPorCep, setPreenchidoPorCep] = useState(false)

  const buscarCep = useCallback(async (cep: string): Promise<DadosCep | null> => {
    const digitos = cep.replace(/\D/g, "")
    if (digitos.length !== 8) return null

    setBuscandoCep(true)
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digitos}/json/`)
      const dados = await res.json()
      if (dados.erro) {
        toast.error("CEP não encontrado")
        setPreenchidoPorCep(false)
        return null
      }
      setPreenchidoPorCep(true)
      toast.success("Endereço preenchido pelo CEP")
      return {
        logradouro: dados.logradouro || "",
        bairro: dados.bairro || "",
        cidade: dados.localidade || "",
        estado: dados.uf || "",
      }
    } catch {
      toast.error("Erro ao buscar CEP")
      setPreenchidoPorCep(false)
      return null
    } finally {
      setBuscandoCep(false)
    }
  }, [])

  const limparPreenchimento = useCallback(() => {
    setPreenchidoPorCep(false)
  }, [])

  return { buscandoCep, preenchidoPorCep, buscarCep, limparPreenchimento }
}
