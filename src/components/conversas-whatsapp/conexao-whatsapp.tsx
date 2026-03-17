"use client"

import { useState, type ReactNode } from "react"
import Link from "next/link"
import {
  MessageCircle,
  Wifi,
  WifiOff,
  RefreshCw,
  Smartphone,
  CheckCircle2,
  Settings,
  Loader2,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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

  const [dialogAberto, setDialogAberto] = useState(false)

  // Loading
  if (carregando) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="mt-2 h-4 w-48" />
        </div>
        <Card>
          <CardContent className="flex flex-col items-center py-16">
            <Skeleton className="h-12 w-12 rounded-full" />
            <Skeleton className="mt-4 h-5 w-48" />
            <Skeleton className="mt-2 h-4 w-64" />
          </CardContent>
        </Card>
      </div>
    )
  }

  // Sem credenciais configuradas
  if (!configurado) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Conversas WhatsApp</h1>
          <p className="text-sm text-muted-foreground">
            Configure a integração para começar
          </p>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center py-16">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Settings className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-5 text-lg font-semibold">
              Configuração necessária
            </h3>
            <p className="mt-2 max-w-sm text-center text-sm text-muted-foreground">
              Para usar o agente WhatsApp, primeiro configure a URL e o token da sua conta
              Uazapi na página de configurações.
            </p>
            <Button className="mt-6" render={<Link href="/configuracoes/whatsapp" />}>
              <Settings className="mr-2 h-4 w-4" />
              Ir para Configurações
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Desconectado — banner compacto + conversas visíveis abaixo
  if (status === "disconnected") {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Conversas WhatsApp</h1>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant="destructive">
                <WifiOff className="mr-1 h-3 w-3" />
                Desconectado
              </Badge>
              <span className="text-sm text-muted-foreground">
                Conecte o WhatsApp para ativar o agente IA
              </span>
            </div>
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
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Conversas WhatsApp</h1>
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">
              Aguardando conexão
            </p>
            <Badge variant="warning">
              <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
              Verificando...
            </Badge>
          </div>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Escaneie o QR Code</CardTitle>
            <CardDescription>
              Abra o WhatsApp no celular e escaneie o código abaixo
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center pb-10">
            {/* QR Code — bg-white intencional: QR precisa de fundo claro pra ser escaneável */}
            <div className="rounded-2xl border-2 border-dashed border-muted-foreground/20 bg-white p-4 dark:border-muted-foreground/10">
              {qrCode ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrCode}
                  alt="QR Code WhatsApp"
                  className="h-64 w-64"
                />
              ) : (
                <div className="flex h-64 w-64 items-center justify-center">
                  <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Instruções */}
            <div className="mt-8 space-y-3">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  1
                </div>
                <span>Abra o <strong>WhatsApp</strong> no seu celular</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  2
                </div>
                <span>
                  Toque em <strong>Dispositivos conectados</strong>
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  3
                </div>
                <span>
                  Toque em <strong>Conectar dispositivo</strong> e escaneie o código
                </span>
              </div>
            </div>

            {/* Botão para gerar novo QR */}
            <Button
              variant="outline"
              className="mt-6"
              onClick={() => conectar()}
              disabled={conectando}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${conectando ? "animate-spin" : ""}`} />
              Gerar novo QR Code
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Conectado — mostra status + conversas
  return (
    <div className="space-y-6">
      {/* Header com status */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Conversas WhatsApp</h1>
          <div className="mt-1 flex items-center gap-2">
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
              <span className="text-sm text-muted-foreground">
                — {perfilNome}
              </span>
            )}
          </div>
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
                O agente IA vai parar de atender automaticamente. Você precisará escanear
                um novo QR code para reconectar.
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
