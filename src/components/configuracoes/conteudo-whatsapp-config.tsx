"use client"

import { MessageCircle } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { ConexaoWhatsapp } from "@/components/conversas-whatsapp/conexao-whatsapp"
import { ConfigWhatsapp } from "@/components/conversas-whatsapp/config-whatsapp"
import { useInstanciaWhatsapp } from "@/hooks/use-instancia-whatsapp"

export function ConteudoWhatsappConfig() {
  const { configurado, carregando } = useInstanciaWhatsapp()

  if (carregando) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center py-16 gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardContent>
      </Card>
    )
  }

  // Sem credenciais — integração ainda não configurada pelo administrador da plataforma
  if (!configurado) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center py-16 gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <MessageCircle className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="text-base font-medium">Integração não configurada</p>
            <p className="text-sm text-muted-foreground max-w-sm">
              Para conectar o WhatsApp, o administrador da plataforma precisa configurar
              as credenciais da Uazapi em{" "}
              <strong>Painel da Plataforma → Config Plataforma</strong>.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Credenciais configuradas — exibir status de conexão + formulário do agente
  return (
    <ConexaoWhatsapp>
      <ConfigWhatsapp />
    </ConexaoWhatsapp>
  )
}
