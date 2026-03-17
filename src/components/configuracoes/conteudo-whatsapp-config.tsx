"use client"

import { ConexaoWhatsapp } from "@/components/conversas-whatsapp/conexao-whatsapp"
import { ConfigWhatsapp } from "@/components/conversas-whatsapp/config-whatsapp"

export function ConteudoWhatsappConfig() {
  return (
    <ConexaoWhatsapp>
      <ConfigWhatsapp />
    </ConexaoWhatsapp>
  )
}
