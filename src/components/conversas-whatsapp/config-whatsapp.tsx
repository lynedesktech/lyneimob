"use client"

import { useActionState, useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Settings, Loader2, MessageCircle } from "lucide-react"
import { toast } from "sonner"
import { useConfigWhatsapp } from "@/hooks/use-config-whatsapp"
import { salvarConfigWhatsapp } from "@/actions/whatsapp"
import type { EstadoFormulario } from "@/types/formulario"

export function ConfigWhatsapp() {
  const { config, carregando } = useConfigWhatsapp()
  const [ativo, setAtivo] = useState(false)

  const [estado, formAction, pendente] = useActionState<EstadoFormulario, FormData>(
    salvarConfigWhatsapp,
    {}
  )

  // Sincroniza estado do switch com config carregada
  useEffect(() => {
    if (config) {
      setAtivo(config.ativo)
    }
  }, [config])

  // Toast de feedback
  useEffect(() => {
    if (estado.sucesso) toast.success(estado.sucesso)
    if (estado.erro) toast.error(estado.erro)
  }, [estado])

  if (carregando) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 text-success">
            <MessageCircle className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg">Configuracao do WhatsApp</CardTitle>
            <p className="text-sm text-muted-foreground">
              Configure a integracao com o WhatsApp para o agente SDR
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-6">
          {/* Ativo */}
          <label className="flex items-center justify-between rounded-lg border p-4 cursor-pointer">
            <div className="space-y-0.5">
              <span className="text-base font-medium">Agente ativo</span>
              <p className="text-sm text-muted-foreground">
                Quando ativo, o agente IA responde automaticamente as mensagens
              </p>
            </div>
            <input
              type="checkbox"
              checked={ativo}
              onChange={(e) => setAtivo(e.target.checked)}
              className="h-5 w-5 rounded border-input accent-primary"
            />
            <input type="hidden" name="ativo" value={String(ativo)} />
          </label>

          {/* Conexao Uazapi */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-medium">Conexao com a Uazapi</h3>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="uazapi_url">URL da Uazapi</Label>
                <Input
                  id="uazapi_url"
                  name="uazapi_url"
                  placeholder="https://api.uazapi.com/..."
                  defaultValue={config?.uazapi_url || ""}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="uazapi_token">Token de autenticacao</Label>
                <Input
                  id="uazapi_token"
                  name="uazapi_token"
                  type="password"
                  placeholder="Token da API"
                  defaultValue={config?.uazapi_token || ""}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="numero_whatsapp">Numero do WhatsApp</Label>
              <Input
                id="numero_whatsapp"
                name="numero_whatsapp"
                placeholder="5511999999999"
                defaultValue={config?.numero_whatsapp || ""}
                required
              />
              <p className="text-xs text-muted-foreground">
                Numero conectado na Uazapi, com codigo do pais (ex: 5511999999999)
              </p>
            </div>
          </div>

          {/* Comportamento */}
          <div className="space-y-4">
            <h3 className="font-medium">Comportamento do agente</h3>

            <div className="space-y-2">
              <Label htmlFor="prompt_personalizado">Instrucoes personalizadas</Label>
              <Textarea
                id="prompt_personalizado"
                name="prompt_personalizado"
                placeholder="Ex: Sempre mencionar que temos imoveis na planta no bairro X..."
                defaultValue={config?.prompt_personalizado || ""}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Instrucoes extras para o agente IA seguir durante as conversas
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mensagem_fora_horario">Mensagem fora do horario</Label>
              <Textarea
                id="mensagem_fora_horario"
                name="mensagem_fora_horario"
                placeholder="Obrigado por entrar em contato! Nosso horario de atendimento e de segunda a sexta, das 8h as 18h."
                defaultValue={config?.mensagem_fora_horario || ""}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="horario_atendimento">Horario de atendimento (JSON)</Label>
              <Textarea
                id="horario_atendimento"
                name="horario_atendimento"
                placeholder='{"segunda": {"inicio": "08:00", "fim": "18:00"}, ...}'
                defaultValue={
                  config?.horario_atendimento
                    ? JSON.stringify(config.horario_atendimento, null, 2)
                    : ""
                }
                rows={4}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Deixe vazio para atendimento 24 horas
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="corretor_padrao_id">ID do corretor padrao</Label>
              <Input
                id="corretor_padrao_id"
                name="corretor_padrao_id"
                placeholder="UUID do corretor que recebera os leads"
                defaultValue={config?.corretor_padrao_id || ""}
              />
              <p className="text-xs text-muted-foreground">
                Corretor que sera atribuido automaticamente aos leads do WhatsApp
              </p>
            </div>
          </div>

          {/* Botao salvar */}
          <Button type="submit" disabled={pendente} className="w-full">
            {pendente ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar configuracao"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
