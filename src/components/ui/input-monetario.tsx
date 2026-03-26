"use client"

import * as React from "react"
import { InputGroup, InputGroupAddon, InputGroupText, InputGroupInput } from "@/components/ui/input-group"

/**
 * Formata centavos (inteiro) para string "1.234.567,89"
 */
function formatarCentavosParaDisplay(centavos: number): string {
  if (centavos === 0) return ""
  const reais = centavos / 100
  return reais.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/**
 * Extrai apenas dígitos de uma string e retorna o valor em centavos (inteiro)
 */
function extrairCentavos(texto: string): number {
  const apenasDigitos = texto.replace(/\D/g, "")
  return parseInt(apenasDigitos || "0", 10)
}

interface InputMonetarioProps
  extends Omit<React.ComponentProps<"input">, "value" | "onChange" | "type"> {
  /** Valor em reais (número decimal, ex: 50000.00) */
  valor: number | string | null | undefined
  /** Callback com valor em reais (número decimal) */
  onValorChange: (valor: number | null) => void
  /** Nome do campo para FormData */
  name?: string
}

export function InputMonetario({
  valor,
  onValorChange,
  name,
  className,
  ...props
}: InputMonetarioProps) {
  // Converter valor (reais) para centavos para estado interno
  const valorNumerico = typeof valor === "string" ? parseFloat(valor) || 0 : (valor ?? 0)
  const centavosRef = React.useRef(Math.round(valorNumerico * 100))

  const [display, setDisplay] = React.useState(() =>
    formatarCentavosParaDisplay(centavosRef.current)
  )

  // Sincronizar quando o valor externo muda (ex: edição com defaultValue)
  const valorAnteriorRef = React.useRef(valorNumerico)
  React.useEffect(() => {
    if (valorNumerico !== valorAnteriorRef.current) {
      valorAnteriorRef.current = valorNumerico
      const novosCentavos = Math.round(valorNumerico * 100)
      centavosRef.current = novosCentavos
      setDisplay(formatarCentavosParaDisplay(novosCentavos))
    }
  }, [valorNumerico])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const centavos = extrairCentavos(e.target.value)
    // Limitar a um valor razoável (999.999.999.999,99)
    const centavosLimitados = Math.min(centavos, 99999999999999)
    centavosRef.current = centavosLimitados
    setDisplay(formatarCentavosParaDisplay(centavosLimitados))
    onValorChange(centavosLimitados > 0 ? centavosLimitados / 100 : null)
  }

  return (
    <InputGroup>
      <InputGroupAddon>
        <InputGroupText>R$</InputGroupText>
      </InputGroupAddon>
      <InputGroupInput
        inputMode="numeric"
        placeholder="0,00"
        value={display}
        onChange={handleChange}
        className={className}
        {...props}
      />
      {/* Hidden input com valor numérico real para FormData */}
      {name && (
        <input
          type="hidden"
          name={name}
          value={centavosRef.current > 0 ? (centavosRef.current / 100).toString() : ""}
        />
      )}
    </InputGroup>
  )
}
