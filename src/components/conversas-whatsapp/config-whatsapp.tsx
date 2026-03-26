"use client"

import { useActionState, useEffect, useState, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Bot, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { useConfigWhatsapp } from "@/hooks/use-config-whatsapp"
import { useListaUsuarios } from "@/hooks/use-lista-usuarios"
import { salvarConfigAgenteWhatsapp } from "@/actions/whatsapp"
import type { EstadoFormulario } from "@/types/formulario"

// ============================================================
// Seletor visual de horário de atendimento
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

const HORARIO_VAZIO: Record<string, ConfigDia> = {
  segunda: { ativo: true, inicio: "08:00", fim: "18:00" },
  terca: { ativo: true, inicio: "08:00", fim: "18:00" },
  quarta: { ativo: true, inicio: "08:00", fim: "18:00" },
  quinta: { ativo: true, inicio: "08:00", fim: "18:00" },
  sexta: { ativo: true, inicio: "08:00", fim: "18:00" },
  sabado: { ativo: false, inicio: "09:00", fim: "13:00" },
  domingo: { ativo: false, inicio: "09:00", fim: "12:00" },
}

function carregarHorarioDoConfig(horario: Record<string, { inicio: string; fim: string }> | null): Record<string, ConfigDia> {
  if (!horario) return HORARIO_VAZIO

  const resultado = { ...HORARIO_VAZIO }
  for (const [key, def] of Object.entries(HORARIO_VAZIO)) {
    if (horario[key]) {
      resultado[key] = { ativo: true, inicio: horario[key].inicio, fim: horario[key].fim }
    } else {
      resultado[key] = { ...def, ativo: false }
    }
  }
  return resultado
}

// ============================================================
// Componente principal
// ============================================================

// Wrapper para usar useActionState com a nova action que só aceita FormData
async function actionWrapper(_estado: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  return salvarConfigAgenteWhatsapp(formData)
}

export function ConfigWhatsapp() {
  const { config, carregando } = useConfigWhatsapp()
  const { usuarios } = useListaUsuarios()
  const [ativo, setAtivo] = useState(false)
  const [horario, setHorario] = useState<Record<string, ConfigDia>>(HORARIO_VAZIO)
  const [corretorId, setCorretorId] = useState("")

  const [estado, formAction] = useActionState<EstadoFormulario, FormData>(
    actionWrapper,
    {}
  )
  const [transitando, iniciarTransicao] = useTransition()
  const pendente = transitando

  // Sincroniza estado com config carregada
  useEffect(() => {
    if (config) {
      setAtivo(config.ativo)
      setHorario(carregarHorarioDoConfig(config.horario_atendimento as Record<string, { inicio: string; fim: string }> | null))
      setCorretorId(config.corretor_padrao_id ?? "")
    }
  }, [config])

  // Toast de feedback
  useEffect(() => {
    if (estado.sucesso) toast.success(estado.sucesso)
    if (estado.erro) toast.error(estado.erro)
  }, [estado])

  function serializarHorario() {
    const resultado: Record<string, { inicio: string; fim: string }> = {}
    for (const [key, c] of Object.entries(horario)) {
      if (c.ativo) resultado[key] = { inicio: c.inicio, fim: c.fim }
    }
    return Object.keys(resultado).length > 0 ? JSON.stringify(resultado) : ""
  }

  if (carregando) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Comportamento do Agente IA</CardTitle>
            <p className="text-sm text-muted-foreground">
              Como o agente responde leads no WhatsApp
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form
          action={(formData) => {
            formData.set("horario_atendimento", serializarHorario())
            formData.set("ativo", String(ativo))
            if (corretorId) formData.set("corretor_padrao_id", corretorId)
            iniciarTransicao(() => {
              formAction(formData)
            })
          }}
          className="space-y-6"
        >
          {/* Ativo */}
          <label className="flex items-center justify-between rounded-lg border p-4 cursor-pointer gap-4">
            <div>
              <span className="text-sm font-medium">Agente ativo</span>
              <p className="text-xs text-muted-foreground">
                Quando ativo, o agente IA responde automaticamente as mensagens
              </p>
            </div>
            <input
              type="checkbox"
              checked={ativo}
              onChange={(e) => setAtivo(e.target.checked)}
              className="h-5 w-5 rounded border-input accent-primary"
            />
          </label>

          {/* Nome do agente */}
          <div className="space-y-2">
            <Label htmlFor="nome_agente">Nome do agente</Label>
            <Input
              id="nome_agente"
              name="nome_agente"
              placeholder="Ex: Ana Paula, Sofia, Assistente Lynedesk..."
              defaultValue={config?.nome_agente ?? ""}
            />
            <p className="text-xs text-muted-foreground">
              Como o agente se apresenta nas conversas. Deixe em branco para usar "Assistente [Nome da Imobiliária]".
            </p>
          </div>

          {/* Instruções personalizadas */}
          <div className="space-y-2">
            <Label htmlFor="prompt_personalizado">Instruções personalizadas</Label>
            <Textarea
              id="prompt_personalizado"
              name="prompt_personalizado"
              placeholder="Ex: Sempre mencionar que temos imóveis na planta no bairro X..."
              defaultValue={config?.prompt_personalizado ?? ""}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Instruções extras para o agente IA seguir durante as conversas
            </p>
          </div>

          {/* Mensagem fora do horário */}
          <div className="space-y-2">
            <Label htmlFor="mensagem_fora_horario">Mensagem fora do horário</Label>
            <Textarea
              id="mensagem_fora_horario"
              name="mensagem_fora_horario"
              placeholder="Obrigado por entrar em contato! Nosso horário é de segunda a sexta, das 8h às 18h."
              defaultValue={config?.mensagem_fora_horario ?? ""}
              rows={3}
            />
          </div>

          {/* Horário de atendimento — seletor visual */}
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
              Deixe todos os dias desmarcados para atendimento 24 horas
            </p>
          </div>

          {/* Corretor padrão */}
          <div className="space-y-2">
            <Label htmlFor="corretor_padrao">Corretor padrão para leads</Label>
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

          {/* Botão salvar */}
          <Button type="submit" disabled={pendente} className="w-full">
            {pendente ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar configurações"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
