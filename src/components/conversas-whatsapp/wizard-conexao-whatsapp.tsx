"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useQueryClient } from "@tanstack/react-query"
import {
  MessageCircle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  ArrowRight,
  Wifi,
  Bot,
  ExternalLink,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { useInstanciaWhatsapp } from "@/hooks/use-instancia-whatsapp"
import { useListaUsuarios } from "@/hooks/use-lista-usuarios"
import { configurarCredenciaisUazapi } from "@/actions/instancia-whatsapp"
import { salvarConfigAgenteWhatsapp } from "@/actions/whatsapp"

// ============================================================
// Indicador de progresso
// ============================================================

const PASSOS = ["Provedor", "Conexão", "Agente IA", "Pronto"]

function IndicadorProgresso({ etapa }: { etapa: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {PASSOS.map((nome, i) => {
        const numero = i + 1
        const concluido = etapa > numero
        const atual = etapa === numero
        return (
          <div key={nome} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  concluido
                    ? "bg-primary text-primary-foreground"
                    : atual
                    ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {concluido ? <CheckCircle2 className="h-4 w-4" /> : numero}
              </div>
              <span
                className={`text-[11px] font-medium leading-none ${
                  atual ? "text-primary" : concluido ? "text-primary/70" : "text-muted-foreground"
                }`}
              >
                {nome}
              </span>
            </div>
            {i < PASSOS.length - 1 && (
              <div
                className={`mx-2 mb-4 h-0.5 w-10 transition-colors ${
                  etapa > numero ? "bg-primary" : "bg-muted"
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ============================================================
// Etapa 1 — Credenciais Uazapi
// ============================================================

function Etapa1Credenciais({ onAvancar }: { onAvancar: () => void }) {
  const queryClient = useQueryClient()
  const [url, setUrl] = useState("")
  const [token, setToken] = useState("")
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)
    setCarregando(true)

    const resultado = await configurarCredenciaisUazapi(url, token)

    if (resultado.erro) {
      setErro(resultado.erro)
      setCarregando(false)
      return
    }

    // Invalida o cache para que o hook detecte as novas credenciais
    await queryClient.invalidateQueries({ queryKey: ["instancia-whatsapp-status"] })
    onAvancar()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#25D366]/10">
          <MessageCircle className="h-7 w-7 text-[#25D366]" />
        </div>
        <CardTitle className="text-xl">Conecte seu WhatsApp</CardTitle>
        <CardDescription className="text-sm max-w-sm mx-auto">
          O LyneImob usa a{" "}
          <strong>Uazapi</strong> para se comunicar com o WhatsApp. Você precisa de uma conta lá
          para continuar.
        </CardDescription>
      </div>

      <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground space-y-1">
        <p className="font-medium text-foreground">O que é a Uazapi?</p>
        <p>
          É o serviço que faz a ponte entre o LyneImob e o WhatsApp. Você cria uma conta na
          Uazapi, recebe uma URL e um token, e cola aqui.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="uazapi-url">URL do servidor Uazapi</Label>
          <Input
            id="uazapi-url"
            type="url"
            placeholder="https://seu-servidor.uazapi.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
          <p className="text-xs text-muted-foreground">
            Encontre no painel da Uazapi, em &quot;Configurações&quot; ou &quot;API&quot;
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="uazapi-token">Token de administrador</Label>
          <Input
            id="uazapi-token"
            type="password"
            placeholder="Cole o token aqui"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            required
          />
          <p className="text-xs text-muted-foreground">
            O token admin, diferente do token da instância — é o token principal da sua conta
          </p>
        </div>
      </div>

      {erro && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {erro}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={carregando}>
        {carregando ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Verificando credenciais...
          </>
        ) : (
          <>
            Continuar
            <ArrowRight className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>
    </form>
  )
}

// ============================================================
// Etapa 2 — QR Code
// ============================================================

function Etapa2QrCode({ onAvancar }: { onAvancar: () => void }) {
  const { status, qrCode, conectar, conectando } = useInstanciaWhatsapp()
  const conectouRef = useRef(false)

  // Iniciar conexão automaticamente ao entrar na etapa
  useEffect(() => {
    if (!conectouRef.current) {
      conectouRef.current = true
      conectar()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Avançar automaticamente quando conectar
  useEffect(() => {
    if (status === "connected") {
      onAvancar()
    }
  }, [status, onAvancar])

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <MessageCircle className="h-7 w-7 text-primary" />
        </div>
        <CardTitle className="text-xl">Escaneie o QR Code</CardTitle>
        <CardDescription>
          Abra o WhatsApp no celular e escaneie o código abaixo
        </CardDescription>
      </div>

      {/* QR Code — fundo branco intencional: QR precisa de fundo claro para ser escaneável */}
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
      <div className="space-y-3">
        {[
          "Abra o WhatsApp no seu celular",
          "Toque em Dispositivos conectados",
          "Toque em Conectar dispositivo e escaneie o código",
        ].map((instrucao, i) => (
          <div key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
              {i + 1}
            </div>
            <span dangerouslySetInnerHTML={{ __html: instrucao.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }} />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Verificando conexão automaticamente...
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => conectar()}
          disabled={conectando}
        >
          <RefreshCw className={`mr-2 h-3.5 w-3.5 ${conectando ? "animate-spin" : ""}`} />
          Novo QR
        </Button>
      </div>
    </div>
  )
}

// ============================================================
// Etapa 3 — Configurar Agente IA
// ============================================================

type ConfigDia = { ativo: boolean; inicio: string; fim: string }

const DIAS_SEMANA: { key: string; abrev: string; label: string }[] = [
  { key: "segunda", abrev: "Seg", label: "Segunda" },
  { key: "terca", abrev: "Ter", label: "Terça" },
  { key: "quarta", abrev: "Qua", label: "Quarta" },
  { key: "quinta", abrev: "Qui", label: "Quinta" },
  { key: "sexta", abrev: "Sex", label: "Sexta" },
  { key: "sabado", abrev: "Sáb", label: "Sábado" },
  { key: "domingo", abrev: "Dom", label: "Domingo" },
]

const HORARIO_PADRAO: Record<string, ConfigDia> = {
  segunda: { ativo: true, inicio: "08:00", fim: "18:00" },
  terca: { ativo: true, inicio: "08:00", fim: "18:00" },
  quarta: { ativo: true, inicio: "08:00", fim: "18:00" },
  quinta: { ativo: true, inicio: "08:00", fim: "18:00" },
  sexta: { ativo: true, inicio: "08:00", fim: "18:00" },
  sabado: { ativo: false, inicio: "09:00", fim: "13:00" },
  domingo: { ativo: false, inicio: "09:00", fim: "12:00" },
}

function Etapa3Agente({ onAvancar }: { onAvancar: () => void }) {
  const { usuarios } = useListaUsuarios()
  const [ativo, setAtivo] = useState(true)
  const [corretorId, setCorretorId] = useState("")
  const [horario, setHorario] = useState<Record<string, ConfigDia>>(HORARIO_PADRAO)
  const [carregando, setCarregando] = useState(false)

  function serializarHorario() {
    const resultado: Record<string, { inicio: string; fim: string }> = {}
    for (const [key, config] of Object.entries(horario)) {
      if (config.ativo) {
        resultado[key] = { inicio: config.inicio, fim: config.fim }
      }
    }
    return Object.keys(resultado).length > 0 ? JSON.stringify(resultado) : ""
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setCarregando(true)

    const formData = new FormData(e.currentTarget)
    formData.set("horario_atendimento", serializarHorario())
    formData.set("ativo", String(ativo))
    if (corretorId) formData.set("corretor_padrao_id", corretorId)

    const resultado = await salvarConfigAgenteWhatsapp(formData)

    if (resultado.erro) {
      toast.error(resultado.erro)
      setCarregando(false)
      return
    }

    onAvancar()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <Bot className="h-7 w-7 text-primary" />
        </div>
        <CardTitle className="text-xl">Configure o agente IA</CardTitle>
        <CardDescription>
          Como seu agente deve se comportar ao responder leads no WhatsApp
        </CardDescription>
      </div>

      {/* Agente ativo */}
      <label className="flex items-center justify-between rounded-lg border p-4 cursor-pointer gap-4">
        <div>
          <p className="text-sm font-medium">Agente ativo</p>
          <p className="text-xs text-muted-foreground">
            Quando ativo, o agente responde automaticamente
          </p>
        </div>
        <input
          type="checkbox"
          checked={ativo}
          onChange={(e) => setAtivo(e.target.checked)}
          className="h-5 w-5 rounded border-input accent-primary"
        />
      </label>

      {/* Instruções personalizadas */}
      <div className="space-y-2">
        <Label htmlFor="prompt_personalizado">Instruções personalizadas (opcional)</Label>
        <Textarea
          id="prompt_personalizado"
          name="prompt_personalizado"
          placeholder="Ex: Sempre mencionar que temos imóveis na planta no bairro X. Falar sobre o lançamento Y..."
          rows={3}
        />
        <p className="text-xs text-muted-foreground">
          Personalize como o agente fala com os leads da sua imobiliária
        </p>
      </div>

      {/* Mensagem fora do horário */}
      <div className="space-y-2">
        <Label htmlFor="mensagem_fora_horario">Mensagem fora do horário (opcional)</Label>
        <Textarea
          id="mensagem_fora_horario"
          name="mensagem_fora_horario"
          placeholder="Obrigado por entrar em contato! Nosso horário é de seg a sex, das 8h às 18h. Em breve respondemos!"
          rows={2}
        />
      </div>

      {/* Horário de atendimento */}
      <div className="space-y-3">
        <Label>Horário de atendimento</Label>
        <div className="space-y-2 rounded-lg border p-4">
          {DIAS_SEMANA.map(({ key, abrev, label }) => {
            const dia = horario[key]
            return (
              <div key={key} className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id={`dia-${key}`}
                  checked={dia.ativo}
                  onChange={(e) =>
                    setHorario((prev) => ({
                      ...prev,
                      [key]: { ...prev[key], ativo: e.target.checked },
                    }))
                  }
                  className="h-4 w-4 accent-primary shrink-0"
                />
                <label
                  htmlFor={`dia-${key}`}
                  className="w-10 text-sm font-medium text-muted-foreground cursor-pointer select-none"
                  title={label}
                >
                  {abrev}
                </label>
                {dia.ativo ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={dia.inicio}
                      onChange={(e) =>
                        setHorario((prev) => ({
                          ...prev,
                          [key]: { ...prev[key], inicio: e.target.value },
                        }))
                      }
                      className="h-8 rounded-md border border-input bg-input/20 px-2 text-sm"
                    />
                    <span className="text-xs text-muted-foreground">até</span>
                    <input
                      type="time"
                      value={dia.fim}
                      onChange={(e) =>
                        setHorario((prev) => ({
                          ...prev,
                          [key]: { ...prev[key], fim: e.target.value },
                        }))
                      }
                      className="h-8 rounded-md border border-input bg-input/20 px-2 text-sm"
                    />
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">Fechado</span>
                )}
              </div>
            )
          })}
        </div>
        <p className="text-xs text-muted-foreground">
          Fora desse horário, o agente usa a mensagem acima (se preenchida)
        </p>
      </div>

      {/* Corretor padrão */}
      {usuarios.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="corretor_padrao">Corretor padrão para leads (opcional)</Label>
          <select
            id="corretor_padrao"
            value={corretorId}
            onChange={(e) => setCorretorId(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-input/20 px-3 py-1 text-sm transition-colors"
          >
            <option value="">Nenhum (distribuição automática)</option>
            {usuarios.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nome}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            Corretor atribuído automaticamente aos leads recebidos via WhatsApp
          </p>
        </div>
      )}

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={onAvancar}
          disabled={carregando}
        >
          Pular por agora
        </Button>
        <Button type="submit" className="flex-1" disabled={carregando}>
          {carregando ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            "Finalizar configuração"
          )}
        </Button>
      </div>
    </form>
  )
}

// ============================================================
// Etapa 4 — Sucesso
// ============================================================

function Etapa4Sucesso() {
  const { numero, perfilNome } = useInstanciaWhatsapp()

  return (
    <div className="space-y-6 text-center">
      <div className="space-y-3">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#25D366]/10">
          <CheckCircle2 className="h-8 w-8 text-[#25D366]" />
        </div>
        <CardTitle className="text-xl">WhatsApp conectado!</CardTitle>
        <CardDescription className="max-w-sm mx-auto">
          Seu agente IA está pronto para atender leads automaticamente no WhatsApp.
        </CardDescription>
      </div>

      {(numero || perfilNome) && (
        <div className="rounded-lg border bg-muted/30 p-4 space-y-1">
          <div className="flex items-center justify-center gap-2 text-sm font-medium">
            <Wifi className="h-4 w-4 text-[#25D366]" />
            <span>Conectado com sucesso</span>
          </div>
          {numero && (
            <p className="text-sm text-muted-foreground">Número: {numero}</p>
          )}
          {perfilNome && (
            <p className="text-sm text-muted-foreground">Perfil: {perfilNome}</p>
          )}
        </div>
      )}

      <Button
        className="w-full"
        render={<Link href="/negocios" />}
      >
        <ExternalLink className="mr-2 h-4 w-4" />
        Ver negócios
      </Button>
    </div>
  )
}

// ============================================================
// Componente principal do wizard
// ============================================================

interface WizardConexaoWhatsappProps {
  onConcluir?: () => void
}

export function WizardConexaoWhatsapp({ onConcluir }: WizardConexaoWhatsappProps) {
  const [etapa, setEtapa] = useState<1 | 2 | 3 | 4>(1)

  function avancar() {
    setEtapa((e) => {
      const proxima = (e + 1) as 1 | 2 | 3 | 4
      if (proxima > 4 && onConcluir) onConcluir()
      return proxima <= 4 ? proxima : 4
    })
  }

  return (
    <Card className="mx-auto max-w-lg">
      <CardHeader className="pb-0">
        <IndicadorProgresso etapa={etapa} />
      </CardHeader>
      <CardContent className="pt-4 pb-8">
        {etapa === 1 && <Etapa1Credenciais onAvancar={avancar} />}
        {etapa === 2 && <Etapa2QrCode onAvancar={avancar} />}
        {etapa === 3 && <Etapa3Agente onAvancar={avancar} />}
        {etapa === 4 && <Etapa4Sucesso />}
      </CardContent>
    </Card>
  )
}
