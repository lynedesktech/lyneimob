"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"

/**
 * Aplica máscara de telefone brasileiro:
 * - Celular: (00) 00000-0000
 * - Fixo:    (00) 0000-0000
 */
function aplicarMascaraTelefone(valor: string): string {
  const digitos = valor.replace(/\D/g, "").slice(0, 11) // max 11 dígitos

  if (digitos.length <= 2) return digitos.replace(/(\d{1,2})/, "($1")
  if (digitos.length <= 6) return digitos.replace(/(\d{2})(\d{1,4})/, "($1) $2")

  if (digitos.length <= 10) {
    // Fixo: (00) 0000-0000
    return digitos.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3")
  }

  // Celular: (00) 00000-0000
  return digitos.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3")
}

interface InputTelefoneProps extends Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "type"> {
  /** Valor inicial (pode ter máscara ou ser só dígitos) */
  defaultValue?: string
  /** Nome do campo para FormData (envia só dígitos) */
  name?: string
  /** Valor controlado (só dígitos) — para uso com React Hook Form */
  value?: string
  /** Callback com valor limpo (só dígitos) — para uso com React Hook Form */
  onChange?: (valor: string) => void
}

export function InputTelefone({ defaultValue, name, value, onChange, ...props }: InputTelefoneProps) {
  const controlado = value !== undefined

  const [displayInterno, setDisplayInterno] = React.useState(() =>
    aplicarMascaraTelefone(defaultValue ?? "")
  )

  // Para modo controlado: derivar display do value externo
  const display = controlado ? aplicarMascaraTelefone(value ?? "") : displayInterno

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const mascarado = aplicarMascaraTelefone(e.target.value)
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
        inputMode="tel"
        value={display}
        onChange={handleChange}
        {...props}
      />
      {name && !controlado && <input type="hidden" name={name} value={valorLimpo} />}
    </>
  )
}
