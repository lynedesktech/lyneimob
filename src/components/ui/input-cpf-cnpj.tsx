"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"

/**
 * Aplica máscara de CPF (000.000.000-00) ou CNPJ (00.000.000/0000-00)
 * conforme a quantidade de dígitos digitados.
 */
function aplicarMascaraCpfCnpj(valor: string): string {
  const digitos = valor.replace(/\D/g, "").slice(0, 14) // max 14 dígitos (CNPJ)

  if (digitos.length <= 11) {
    // CPF: 000.000.000-00
    return digitos
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
  }

  // CNPJ: 00.000.000/0000-00
  return digitos
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2")
}

interface InputCpfCnpjProps extends Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "type"> {
  /** Valor inicial (pode ter máscara ou ser só dígitos) */
  defaultValue?: string
  /** Nome do campo para FormData (envia só dígitos) */
  name?: string
  /** Valor controlado (só dígitos) — para uso com React Hook Form */
  value?: string
  /** Callback com valor limpo (só dígitos) — para uso com React Hook Form */
  onChange?: (valor: string) => void
}

export function InputCpfCnpj({ defaultValue, name, value, onChange, ...props }: InputCpfCnpjProps) {
  const controlado = value !== undefined

  const [displayInterno, setDisplayInterno] = React.useState(() =>
    aplicarMascaraCpfCnpj(defaultValue ?? "")
  )

  // Para modo controlado: derivar display do value externo
  const display = controlado ? aplicarMascaraCpfCnpj(value ?? "") : displayInterno

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const mascarado = aplicarMascaraCpfCnpj(e.target.value)
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
        {...props}
      />
      {name && !controlado && <input type="hidden" name={name} value={valorLimpo} />}
    </>
  )
}
