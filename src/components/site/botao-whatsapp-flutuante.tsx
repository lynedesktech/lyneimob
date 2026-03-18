"use client"

import { MessageCircle } from "lucide-react"

type Props = {
  whatsappNumero: string
  nomeEmpresa: string
}

export function BotaoWhatsappFlutuante({ whatsappNumero, nomeEmpresa }: Props) {
  const numero = whatsappNumero.replace(/\D/g, "")
  const url = `https://wa.me/${numero}?text=${encodeURIComponent(
    `Olá! Estou visitando o site da ${nomeEmpresa} e gostaria de mais informações.`
  )}`

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar no WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-all hover:bg-[#1da851] hover:scale-110 animate-bounce-subtle"
    >
      <MessageCircle className="h-6 w-6" />
    </a>
  )
}
