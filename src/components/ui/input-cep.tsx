"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"

/**
 * Aplica máscara de CEP brasileiro: 00000-000
 */
function aplicarMascaraCep(valor: string): string {
  const digitos = valor.replace(/\D/g, "").slice(0, 8) // max 8 dígitos

  if (digitos.length <= 5) return digitos
  return digitos.replace(/(\d{5})(\d{0,3})/, "$1-$2")
}

interface InputCepProps extends Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "type"> {
  /** Valor inicial (pode ter máscara ou ser só dígitos) */
  defaultValue?: string
  /** Nome do campo para FormData (envia só dígitos) */
  name?: string
  /** Valor controlado (só dígitos) — para uso com React Hook Form */
  value?: string
  /** Callback com valor limpo (só dígitos) — para uso com React Hook Form */
  onChange?: (valor: string) => void
}

export function InputCep({ defaultValue, name, value, onChange, ...props }: InputCepProps) {
  const controlado = value !== undefined

  const [displayInterno, setDisplayInterno] = React.useState(() =>
    aplicarMascaraCep(defaultValue ?? "")
  )

  // Para modo controlado: derivar display do value externo
  const display = controlado ? aplicarMascaraCep(value ?? "") : displayInterno

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const mascarado = aplicarMascaraCep(e.target.value)
    const limpo = mascarado.replace(/\D/g, "")

    if (controlado) {
      onChange?.(limpo)
    } else {
      setDisplayInterno(mascarado)
    }
  }

  // Valor limpo (só dígitos) para enviar no FormData
  const valorLimpo = display.replace(/\D/g, "")

  return (
    <>
      <Input
        inputMode="numeric"
        value={display}
        onChange={handleChange}
        placeholder="00000-000"
        {...props}
      />
      {name && !controlado && <input type="hidden" name={name} value={valorLimpo} />}
    </>
  )
}
