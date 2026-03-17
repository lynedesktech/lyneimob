"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  CheckCircle2,
  Loader2,
  RefreshCw,
  MessageCircle,
  Bot,
  Wifi,
  ArrowRight,
  Smartphone,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"
import { toast } from "sonner"
import {
  configurarCredenciaisUazapi,
  criarEConectarInstancia,
  verificarStatusInstancia,
} from "@/actions/instancia-whatsapp"
import { salvarConfigAgenteWhatsapp } from "@/actions/whatsapp"
import { criarClienteBrowser } from "@/lib/supabase/client"
import type { HorarioAtendimento } from "@/types/whatsapp"

// ============================================================
// Tipos
// ============================================================

type Passo = 1 | 2 | 3 | 4

interface Corretor {
  id: string
  nome: string
  cargo: string
}

// ============================================================
// Indicador de passos
// ============================================================

const PASSOS = [
  { numero: 1, label: "Credenciais" },
  { numero: 2, label: "Conexão" },
  { numero: 3, label: "Agente IA" },
  { numero: 4, label: "Pronto" },
]

function IndicadorPassos({ passoAtual }: { passoAtual: Passo }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {PASSOS.map((passo, i) => (
        <div key={passo.numero} className="flex items-center">
          <div className="flex flex-col items-center gap-1.5">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                passo.numero < passoAtual
                  ? "bg-primary text-primary-foreground"
                  : passo.numero === passoAtual
                  ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {passo.numero < passoAtual ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                passo.numero
              )}
            </div>
            <span
              className={`text-xs hidden sm:block ${
                passo.numero === passoAtual
                  ? "text-foreground font-medium"
                  : "text-muted-foreground"
              }`}
            >
              {passo.label}
            </span>
          </div>
          {i < PASSOS.length - 1 && (
            <div
              className={`mx-2 mb-5 h-px w-10 sm:w-16 transition-colors ${
                passo.numero < passoAtual ? "bg-primary" : "bg-border"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  )
}

// ============================================================
// Passo 1 — Credenciais Uazapi
// ============================================================

function PassoCredenciais({ onAvancar }: { onAvancar: () => void }) {
  const [url, setUrl] = useState("")
  const [token, setToken] = useState("")

  const { mutate: salvar, isPending } = useMutation({
    mutationFn: async () => {
      const resultado = await configurarCredenciaisUazapi(url.trim(), token.trim())
      if (resultado.erro) throw new Error(resultado.erro)
      return resultado
    },
    onSuccess: () => {
      toast.success("Credenciais verificadas!")
      onAvancar()
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <MessageCircle className="h-7 w-7 text-primary" />
        </div>
        <h2 className="text-xl font-bold tracking-tight">Conecte sua conta Uazapi</h2>
        <p className="mt-1.5 text-sm text-muted-foreground max-w-sm mx-auto">
          A Uazapi é o serviço que faz a ponte entre o LyneImob e o WhatsApp.
          Insira as credenciais da sua conta.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="uazapi_url">URL da Uazapi</Label>
          <Input
            id="uazapi_url"
            placeholder="https://api.uazapi.com/..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            autoComplete="off"
          />
          <p className="text-xs text-muted-foreground">
            O endereço do servidor Uazapi que você contratou
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="uazapi_token">Token de administrador</Label>
          <Input
            id="uazapi_token"
            type="password"
            placeholder="Seu token de acesso"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            autoComplete="new-password"
          />
          <p className="text-xs text-muted-foreground">
            Token principal da sua conta Uazapi (encontrado no painel deles)
          </p>
        </div>
      </div>

      <Button
        className="w-full"
        onClick={() => salvar()}
        disabled={isPending || !url.trim() || !token.trim()}
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Verificando credenciais...
          </>
        ) : (
          <>
            Verificar e continuar
            <ArrowRight className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Ainda não tem uma conta?{" "}
        <a
          href="https://uazapi.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline-offset-4 hover:underline"
        >
          Conheça a Uazapi
        </a>
      </p>
    </div>
  )
}

// ============================================================
// Passo 2 — QR Code
// ============================================================

function PassoQRCode({ onAvancar }: { onAvancar: () => void }) {
  const queryClient = useQueryClient()
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [conectando, setConectando] = useState(false)

  const gerarQR = async () => {
    setConectando(true)
    try {
      const resultado = await criarEConectarInstancia()
      if (resultado.erro) {
        toast.error(resultado.erro)
      } else if (resultado.qrCode) {
        setQrCode(resultado.qrCode)
      }
    } finally {
      setConectando(false)
    }
  }

  // Gerar QR ao entrar no passo
  useEffect(() => {
    gerarQR()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Polling de status a cada 5s
  const { data: statusData } = useQuery({
    queryKey: ["instancia-whatsapp-status-wizard"],
    queryFn: () => verificarStatusInstancia(),
    refetchInterval: 5000,
  })

  // Quando conectar, avançar
  useEffect(() => {
    if (statusData?.status === "connected") {
      queryClient.invalidateQueries({ queryKey: ["instancia-whatsapp-status"] })
      toast.success("WhatsApp conectado com sucesso!")
      onAvancar()
    }
    // Atualizar QR se vier um novo
    if (statusData?.qrCode) {
      setQrCode(statusData.qrCode)
    }
  }, [statusData, onAvancar, queryClient])

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#25D366]/10">
          <Smartphone className="h-7 w-7 text-[#25D366]" />
        </div>
        <h2 className="text-xl font-bold tracking-tight">Escaneie o QR Code</h2>
        <p className="mt-1.5 text-sm text-muted-foreground max-w-sm mx-auto">
          Abra o WhatsApp no celular e escaneie o código para conectar
        </p>
      </div>

      {/* QR Code — bg-white intencional: QR precisa de fundo claro pra ser escaneável */}
      <div className="flex justify-center">
        <div className="rounded-2xl border-2 border-dashed border-muted-foreground/20 bg-white p-4 dark:border-muted-foreground/10">
          {conectando || (!qrCode && !statusData) ? (
            <div className="flex h-52 w-52 items-center justify-center">
              <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            </div>
          ) : qrCode ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrCode} alt="QR Code WhatsApp" className="h-52 w-52" />
          ) : (
            <div className="flex h-52 w-52 items-center justify-center text-center">
              <p className="text-sm text-muted-foreground">Clique em &quot;Novo QR Code&quot; abaixo</p>
            </div>
          )}
        </div>
      </div>

      {/* Instrucoes */}
      <div className="space-y-2.5 rounded-lg bg-muted/50 p-4">
        {[
          "Abra o WhatsApp no seu celular",
          "Toque em Dispositivos conectados",
          "Toque em Conectar dispositivo e escaneie o código",
        ].map((instrucao, i) => (
          <div key={i} className="flex items-center gap-3 text-sm">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
              {i + 1}
            </div>
            <span className="text-muted-foreground">{instrucao}</span>
          </div>
        ))}
      </div>

      <Button
        variant="outline"
        className="w-full"
        onClick={gerarQR}
        disabled={conectando}
      >
        <RefreshCw className={`mr-2 h-4 w-4 ${conectando ? "animate-spin" : ""}`} />
        Gerar novo QR Code
      </Button>
    </div>
  )
}

// ============================================================
// Seletor visual de horário
// ============================================================

const DIAS_SEMANA = [
  { key: "segunda", label: "Seg" },
  { key: "terca", label: "Ter" },
  { key: "quarta", label: "Qua" },
  { key: "quinta", label: "Qui" },
  { key: "sexta", label: "Sex" },
  { key: "sabado", label: "Sáb" },
  { key: "domingo", label: "Dom" },
]

function SeletorHorario({
  value,
  onChange,
}: {
  value: HorarioAtendimento
  onChange: (v: HorarioAtendimento) => void
}) {
  const toggleDia = (dia: string, ativo: boolean) => {
    const novo = { ...value }
    if (ativo) {
      novo[dia] = { inicio: "08:00", fim: "18:00" }
    } else {
      delete novo[dia]
    }
    onChange(novo)
  }

  const alterarHorario = (dia: string, campo: "inicio" | "fim", hora: string) => {
    const diaAtual = value[dia]
    if (!diaAtual) return
    onChange({ ...value, [dia]: { ...diaAtual, [campo]: hora } })
  }

  return (
    <div className="space-y-2">
      {DIAS_SEMANA.map(({ key, label }) => {
        const ativo = !!value[key]
        return (
          <div
            key={key}
            className={`flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors ${
              ativo ? "border-primary/30 bg-primary/5" : "border-border"
            }`}
          >
            <label className="flex cursor-pointer items-center gap-2.5 min-w-0 flex-1">
              <input
                type="checkbox"
                checked={ativo}
                onChange={(e) => toggleDia(key, e.target.checked)}
                className="h-4 w-4 rounded border-input accent-primary"
              />
              <span className={`text-sm font-medium w-8 shrink-0 ${ativo ? "text-foreground" : "text-muted-foreground"}`}>
                {label}
              </span>
            </label>
            {ativo ? (
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={value[key]?.inicio || "08:00"}
                  onChange={(e) => alterarHorario(key, "inicio", e.target.value)}
                  className="rounded border border-input bg-background px-2 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <span className="text-xs text-muted-foreground">até</span>
                <input
                  type="time"
                  value={value[key]?.fim || "18:00"}
                  onChange={(e) => alterarHorario(key, "fim", e.target.value)}
                  className="rounded border border-input bg-background px-2 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">Fechado</span>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ============================================================
// Passo 3 — Configurar agente IA
// ============================================================

function PassoAgente({
  onAvancar,
  onPular,
}: {
  onAvancar: () => void
  onPular: () => void
}) {
  const supabase = criarClienteBrowser()
  const [ativo, setAtivo] = useState(true)
  const [prompt, setPrompt] = useState("")
  const [mensagemFora, setMensagemFora] = useState(
    "Obrigado por entrar em contato! Nosso horário de atendimento é de segunda a sexta, das 8h às 18h. Retornaremos em breve!"
  )
  const [corretorId, setCorretorId] = useState("")
  const [horario, setHorario] = useState<HorarioAtendimento>({
    segunda: { inicio: "08:00", fim: "18:00" },
    terca: { inicio: "08:00", fim: "18:00" },
    quarta: { inicio: "08:00", fim: "18:00" },
    quinta: { inicio: "08:00", fim: "18:00" },
    sexta: { inicio: "08:00", fim: "18:00" },
  })

  // Buscar corretores
  const { data: corretores = [] } = useQuery<Corretor[]>({
    queryKey: ["corretores-wizard"],
    queryFn: async () => {
      const { data } = await supabase
        .from("usuarios")
        .select("id, nome, cargo")
        .eq("ativo", true)
        .order("nome")
      return (data ?? []) as Corretor[]
    },
  })

  const { mutate: salvar, isPending } = useMutation({
    mutationFn: async () => {
      const formData = new FormData()
      formData.set("ativo", String(ativo))
      formData.set("prompt_personalizado", prompt)
      formData.set("mensagem_fora_horario", mensagemFora)
      formData.set("corretor_padrao_id", corretorId)
      formData.set("horario_atendimento", JSON.stringify(horario))

      const resultado = await salvarConfigAgenteWhatsapp(formData)
      if (resultado.erro) throw new Error(resultado.erro)
      return resultado
    },
    onSuccess: () => {
      toast.success("Agente configurado!")
      onAvancar()
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <Bot className="h-7 w-7 text-primary" />
        </div>
        <h2 className="text-xl font-bold tracking-tight">Configure o agente IA</h2>
        <p className="mt-1.5 text-sm text-muted-foreground max-w-sm mx-auto">
          Personalize como o assistente vai atender seus clientes no WhatsApp
        </p>
      </div>

      <div className="space-y-5">
        {/* Toggle ativo */}
        <label className="flex cursor-pointer items-center justify-between rounded-lg border p-4">
          <div>
            <p className="text-sm font-medium">Ativar agente IA</p>
            <p className="text-xs text-muted-foreground">
              Quando ativo, responde automaticamente aos clientes
            </p>
          </div>
          <input
            type="checkbox"
            checked={ativo}
            onChange={(e) => setAtivo(e.target.checked)}
            className="h-5 w-5 rounded border-input accent-primary"
          />
        </label>

        {/* Corretor padrão */}
        <div className="space-y-2">
          <Label htmlFor="corretor">Corretor responsável pelos leads</Label>
          <select
            id="corretor"
            value={corretorId}
            onChange={(e) => setCorretorId(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Nenhum (usar distribuição automática)</option>
            {corretores.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome} — {c.cargo}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            Corretor que receberá os leads qualificados pelo agente
          </p>
        </div>

        {/* Instrucoes personalizadas */}
        <div className="space-y-2">
          <Label htmlFor="prompt">Instruções personalizadas (opcional)</Label>
          <Textarea
            id="prompt"
            placeholder="Ex: Sempre mencionar que temos imóveis na planta no bairro X. Focar em clientes que buscam apartamentos de 2 quartos..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
          />
          <p className="text-xs text-muted-foreground">
            O agente já sabe como qualificar leads imobiliários. Aqui você adiciona detalhes específicos do seu negócio.
          </p>
        </div>

        {/* Horário de atendimento */}
        <div className="space-y-2">
          <Label>Horário de atendimento</Label>
          <p className="text-xs text-muted-foreground">
            Fora deste horário, o agente envia a mensagem abaixo e para de responder automaticamente.
            Deixe todos os dias desmarcados para atendimento 24h.
          </p>
          <SeletorHorario value={horario} onChange={setHorario} />
        </div>

        {/* Mensagem fora do horário */}
        <div className="space-y-2">
          <Label htmlFor="fora_horario">Mensagem fora do horário</Label>
          <Textarea
            id="fora_horario"
            value={mensagemFora}
            onChange={(e) => setMensagemFora(e.target.value)}
            rows={3}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Button onClick={() => salvar()} disabled={isPending} className="w-full">
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              Salvar e concluir
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
        <Button variant="ghost" onClick={onPular} disabled={isPending} className="w-full text-muted-foreground">
          Pular por agora (configurar depois)
        </Button>
      </div>
    </div>
  )
}

// ============================================================
// Passo 4 — Sucesso
// ============================================================

function PassoSucesso() {
  return (
    <div className="space-y-6 text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#25D366]/10">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366]">
          <Wifi className="h-7 w-7 text-white" />
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold tracking-tight">WhatsApp conectado!</h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
          Seu agente IA já está pronto para atender leads automaticamente pelo WhatsApp.
          Cada nova conversa vai aparecer na seção de Conversas.
        </p>
      </div>

      <div className="rounded-lg bg-muted/50 p-4 text-left space-y-2">
        <p className="text-xs font-medium text-foreground">O que acontece agora:</p>
        {[
          "Clientes que te mandarem mensagem serão atendidos pelo agente IA",
          "O agente qualifica o lead e cria negócio automaticamente no pipeline",
          "Você recebe o lead já qualificado, pronto para fechar",
        ].map((item, i) => (
          <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0 text-[#25D366]" />
            <span>{item}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <Button className="w-full" render={<Link href="/conversas" />}>
          <MessageCircle className="mr-2 h-4 w-4" />
          Ver conversas
        </Button>
        <Button variant="outline" className="w-full" render={<Link href="/configuracoes/whatsapp" />}>
          Ajustar configurações
        </Button>
      </div>
    </div>
  )
}

// ============================================================
// Wizard principal
// ============================================================

export function WizardWhatsapp() {
  const [passo, setPasso] = useState<Passo>(1)

  return (
    <Card className="mx-auto max-w-lg">
      <CardHeader className="pb-2">
        <CardTitle className="sr-only">Configuração do WhatsApp</CardTitle>
        <CardDescription className="sr-only">Wizard de configuração em 4 passos</CardDescription>
      </CardHeader>
      <CardContent className="pt-6 pb-8 px-6 sm:px-8">
        <IndicadorPassos passoAtual={passo} />

        {passo === 1 && (
          <PassoCredenciais onAvancar={() => setPasso(2)} />
        )}
        {passo === 2 && (
          <PassoQRCode onAvancar={() => setPasso(3)} />
        )}
        {passo === 3 && (
          <PassoAgente
            onAvancar={() => setPasso(4)}
            onPular={() => setPasso(4)}
          />
        )}
        {passo === 4 && (
          <PassoSucesso />
        )}
      </CardContent>
    </Card>
  )
}
