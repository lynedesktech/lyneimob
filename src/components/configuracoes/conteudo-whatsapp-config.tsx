"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { WizardWhatsapp } from "@/components/configuracoes/wizard-whatsapp"
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

  // Sem credenciais — exibir wizard de onboarding
  if (!configurado) {
    return <WizardWhatsapp />
  }

  // Ja configurado — exibir status de conexao + formulario do agente
  return (
    <ConexaoWhatsapp>
      <ConfigWhatsapp />
    </ConexaoWhatsapp>
  )
}
