"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Webhook, Copy, Check } from "lucide-react"
import { toast } from "sonner"

interface WebhookInfoProps {
  slug: string
}

export function WebhookInfo({ slug }: WebhookInfoProps) {
  const [copiado, setCopiado] = useState(false)

  const appUrl = typeof window !== "undefined"
    ? window.location.origin
    : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  const webhookUrl = `${appUrl}/api/webhooks/portais`

  async function copiarUrl() {
    await navigator.clipboard.writeText(webhookUrl)
    setCopiado(true)
    toast.success("URL copiada!")
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-warning/10 text-warning">
            <Webhook className="h-6 w-6" />
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <h3 className="font-semibold text-lg">Webhook de Leads</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Configure esta URL nos portais para receber leads automaticamente na plataforma.
              </p>
            </div>

            <div className="flex gap-2">
              <Input
                readOnly
                value={webhookUrl}
                className="font-mono text-sm bg-muted/50"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={copiarUrl}
                className="shrink-0"
              >
                {copiado ? (
                  <Check className="h-4 w-4 text-success" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>

            <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
              <p><strong>Configuração nos portais:</strong></p>
              <p>Envie um POST para esta URL com os headers:</p>
              <p className="font-mono mt-1">x-org-slug: {slug}</p>
              <p className="font-mono">x-portal: zap | olx | vivareal</p>
              <p className="mt-2">O webhook aceita payloads do ZAP, OLX, VivaReal e Imovelweb automaticamente.</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
