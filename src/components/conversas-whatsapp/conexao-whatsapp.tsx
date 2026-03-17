"use client"

import { useState, useEffect, type ReactNode } from "react"
import {
  MessageCircle,
  Wifi,
  WifiOff,
  RefreshCw,
  Smartphone,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useInstanciaWhatsapp } from "@/hooks/use-instancia-whatsapp"
import { WizardConexaoWhatsapp } from "@/components/conversas-whatsapp/wizard-conexao-whatsapp"

interface ConexaoWhatsappProps {
  children: ReactNode
}

export function ConexaoWhatsapp({ children }: ConexaoWhatsappProps) {
  const {
    status,
    configurado,
    qrCode,
    numero,
    perfilNome,
    carregando,
    conectar,
    conectando,
    desconectar,
    desconectando,
  } = useInstanciaWhatsapp()

  const [modoWizard, setModoWizard] = useState(false)
  const [dialogAberto, setDialogAberto] = useState(false)

  // Ativa o wizard quando não há credenciais configuradas
  useEffect(() => {
    if (!carregando && !configurado) {
      setModoWizard(true)
    }
  }, [carregando, configurado])

  // Loading
  if (carregando) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="mt-2 h-4 w-48" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  // Wizard de onboarding (primeira configuração)
  if (modoWizard) {
    return (
      <div className="space-y-6">
        <WizardConexaoWhatsapp onConcluir={() => setModoWizard(false)} />
      </div>
    )
  }

  // Desconectado — banner compacto + conversas visíveis abaixo
  if (status === "disconnected") {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="destructive">
              <WifiOff className="mr-1 h-3 w-3" />
              Desconectado
            </Badge>
            <span className="text-sm text-muted-foreground">
              Conecte o WhatsApp para ativar o agente IA
            </span>
          </div>
          <Button
            className="bg-[#25D366] text-white hover:bg-[#1da851]"
            onClick={() => conectar()}
            disabled={conectando}
          >
            {conectando ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando QR Code...
              </>
            ) : (
              <>
                <MessageCircle className="mr-2 h-4 w-4" />
                Conectar WhatsApp
              </>
            )}
          </Button>
        </div>

        {/* Conversas históricas */}
        {children}
      </div>
    )
  }

  // Aguardando QR code
  if (status === "connecting") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">Aguardando conexão</p>
          <Badge variant="warning">
            <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
            Verificando...
          </Badge>
        </div>

        <div className="mx-auto max-w-md rounded-xl border bg-card p-8 text-center space-y-6">
          <div>
            <h2 className="text-lg font-semibold">Escaneie o QR Code</h2>
            <p className="text-sm text-muted-foreground">
              Abra o WhatsApp no celular e escaneie o código abaixo
            </p>
          </div>

          {/* QR Code — bg-white intencional: QR precisa de fundo claro pra ser escaneável */}
          <div className="flex justify-center">
            <div className="rounded-2xl border-2 border-dashed border-muted-foreground/20 bg-white p-4">
              {qrCode ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrCode} alt="QR Code WhatsApp" className="h-56 w-56" />
              ) : (
                <div className="flex h-56 w-56 items-center justify-center">
                  <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
          </div>

          {/* Instruções */}
          <div className="space-y-3 text-left">
            {[
              "Abra o WhatsApp no seu celular",
              "Toque em Dispositivos conectados",
              "Toque em Conectar dispositivo e escaneie o código",
            ].map((instrucao, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {i + 1}
                </div>
                <span>{instrucao}</span>
              </div>
            ))}
          </div>

          <Button
            variant="outline"
            onClick={() => conectar()}
            disabled={conectando}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${conectando ? "animate-spin" : ""}`} />
            Gerar novo QR Code
          </Button>
        </div>
      </div>
    )
  }

  // Conectado — mostra status + conversas
  return (
    <div className="space-y-6">
      {/* Header com status */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="success">
            <Wifi className="mr-1 h-3 w-3" />
            Conectado
          </Badge>
          {numero && (
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Smartphone className="h-3.5 w-3.5" />
              {numero}
            </span>
          )}
          {perfilNome && (
            <span className="text-sm text-muted-foreground">— {perfilNome}</span>
          )}
        </div>

        {/* Botão desconectar */}
        <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
          <DialogTrigger
            render={
              <Button variant="outline" size="sm">
                <WifiOff className="mr-2 h-4 w-4" />
                Desconectar
              </Button>
            }
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Desconectar WhatsApp?</DialogTitle>
              <DialogDescription>
                Isso vai desconectar e excluir a instância do WhatsApp. Para usar novamente,
                será necessário escanear um novo QR code.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogAberto(false)}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  desconectar()
                  setDialogAberto(false)
                }}
                disabled={desconectando}
              >
                {desconectando ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Desconectando...
                  </>
                ) : (
                  <>
                    <WifiOff className="mr-2 h-4 w-4" />
                    Desconectar
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Conversas (children) */}
      {children}
    </div>
  )
}
