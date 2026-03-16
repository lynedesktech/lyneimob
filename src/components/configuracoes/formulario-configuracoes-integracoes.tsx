"use client"

import { useActionState, useState, useEffect } from "react"
import {
  Save,
  CreditCard,
  Bot,
  MessageCircle,
  Database,
  Eye,
  EyeOff,
  Trash2,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  salvarConfiguracoesIntegracoes,
  removerChaveIntegracao,
} from "@/actions/configuracoes-integracoes"
import {
  gruposIntegracoes,
  nomesChaves,
} from "@/types/configuracoes-integracoes"
import type {
  IntegracoesMascaradas,
  ConfiguracoesIntegracoes,
} from "@/types/configuracoes-integracoes"
import { toast } from "sonner"

// ============================================================
// Ícone por grupo de integração
// ============================================================

const iconesPorGrupo: Record<string, typeof CreditCard> = {
  stripe: CreditCard,
  openai: Bot,
  whatsapp: MessageCircle,
  redis: Database,
}

// ============================================================
// Props
// ============================================================

type Props = {
  integracoesMascaradas: IntegracoesMascaradas
  ehAdmin: boolean
}

// ============================================================
// Componente
// ============================================================

export function FormularioConfiguracoesIntegracoes({
  integracoesMascaradas,
  ehAdmin,
}: Props) {
  // Estado dos campos do formulário (valores que o usuário está digitando)
  const [campos, setCampos] = useState<Record<string, string>>({})

  // Controle de visibilidade das senhas
  const [camposVisiveis, setCamposVisiveis] = useState<Record<string, boolean>>(
    {}
  )

  // Estado mascarado local (atualiza ao remover chave)
  const [mascaradas, setMascaradas] =
    useState<IntegracoesMascaradas>(integracoesMascaradas)

  // Actions
  const [estadoSalvar, formActionSalvar, pendenteSalvar] = useActionState(
    salvarConfiguracoesIntegracoes,
    {}
  )
  const [estadoRemover, formActionRemover, pendenteRemover] = useActionState(
    removerChaveIntegracao,
    {}
  )

  // Toasts
  useEffect(() => {
    if (estadoSalvar.sucesso) toast.success(estadoSalvar.sucesso)
    if (estadoSalvar.erro) toast.error(estadoSalvar.erro)
  }, [estadoSalvar])

  // Rastrear qual campo foi removido para atualizar estado local
  const [campoRemovido, setCampoRemovido] = useState<string | null>(null)

  useEffect(() => {
    if (estadoRemover.sucesso) {
      toast.success(estadoRemover.sucesso)
      // Atualizar estado local sem reload
      if (campoRemovido) {
        setMascaradas((prev) => ({
          ...prev,
          [campoRemovido]: { mascarada: "", temChave: false },
        }))
        setCampoRemovido(null)
      }
    }
    if (estadoRemover.erro) toast.error(estadoRemover.erro)
  }, [estadoRemover])

  // Helpers
  function atualizarCampo(campo: string, valor: string) {
    setCampos((prev) => ({ ...prev, [campo]: valor }))
  }

  function toggleVisibilidade(campo: string) {
    setCamposVisiveis((prev) => ({ ...prev, [campo]: !prev[campo] }))
  }

  function handleRemover(campo: string) {
    setCampoRemovido(campo)
    const formData = new FormData()
    formData.set("campo", campo)
    formActionRemover(formData)
  }

  // Verificar se um grupo inteiro está configurado
  function grupoConfigurado(campos: (keyof ConfiguracoesIntegracoes)[]): boolean {
    return campos.every((c) => mascaradas[c]?.temChave)
  }

  function grupoParcial(campos: (keyof ConfiguracoesIntegracoes)[]): boolean {
    return campos.some((c) => mascaradas[c]?.temChave) && !grupoConfigurado(campos)
  }

  if (!ehAdmin) {
    return (
      <div className="mx-auto max-w-md py-12 text-center">
        <ShieldAlert className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
        <h2 className="text-lg font-semibold">Acesso restrito</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Apenas administradores podem configurar integrações.
          Entre em contato com o administrador da sua imobiliária.
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie as chaves de API das integrações do sistema
          </p>
        </div>
      </div>

      {/* Aviso de segurança */}
      <div className="mb-6 flex items-start gap-3 rounded-lg border border-info/20 bg-info/5 p-4">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-info" />
        <div className="text-sm text-info">
          <p className="font-medium">Suas chaves estão seguras</p>
          <p className="mt-0.5 text-info/80">
            Depois de salvas, as chaves nunca são exibidas novamente por completo.
            Se precisar trocar, basta digitar a nova chave no campo.
          </p>
        </div>
      </div>

      <form
        action={(formData) => {
          formData.set("integracoes", JSON.stringify(campos))
          formActionSalvar(formData)
        }}
      >
        <Tabs defaultValue="stripe" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:w-auto sm:grid-cols-none sm:flex">
            {gruposIntegracoes.map((grupo) => {
              const Icone = iconesPorGrupo[grupo.id]
              return (
                <TabsTrigger key={grupo.id} value={grupo.id}>
                  <Icone className="mr-1.5 h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{grupo.nome}</span>
                  <span className="sm:hidden">
                    {grupo.nome.split(" ")[0]}
                  </span>
                  {grupoConfigurado(grupo.campos) && (
                    <span className="ml-1.5 h-2 w-2 rounded-full bg-success" />
                  )}
                </TabsTrigger>
              )
            })}
          </TabsList>

          {gruposIntegracoes.map((grupo) => {
            const todoConfigurado = grupoConfigurado(grupo.campos)
            const parcial = grupoParcial(grupo.campos)

            return (
              <TabsContent key={grupo.id} value={grupo.id}>
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CardTitle>{grupo.nome}</CardTitle>
                        {todoConfigurado && (
                          <Badge variant="success">
                            Configurado
                          </Badge>
                        )}
                        {parcial && (
                          <Badge variant="warning">
                            Parcial
                          </Badge>
                        )}
                        {!todoConfigurado && !parcial && (
                          <Badge variant="secondary">Não configurado</Badge>
                        )}
                      </div>
                    </div>
                    <CardDescription>{grupo.descricao}</CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-5">
                    {grupo.campos.map((campo) => {
                      const info = mascaradas[campo]
                      if (!info) return null
                      const valorDigitado = campos[campo] ?? ""
                      const visivel = camposVisiveis[campo] ?? false

                      return (
                        <div key={campo} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor={campo}>{nomesChaves[campo]}</Label>
                            {info.temChave && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                                onClick={() => handleRemover(campo)}
                                disabled={pendenteRemover}
                              >
                                <Trash2 className="mr-1 h-3 w-3" />
                                Remover
                              </Button>
                            )}
                          </div>

                          <div className="relative">
                            <Input
                              id={campo}
                              type={visivel ? "text" : "password"}
                              value={valorDigitado}
                              onChange={(e) =>
                                atualizarCampo(campo, e.target.value)
                              }
                              placeholder={
                                info.temChave
                                  ? `Chave atual: ${info.mascarada} — deixe vazio para manter`
                                  : "Cole a chave aqui..."
                              }
                              className="pr-10 font-mono text-sm"
                            />
                            <button
                              type="button"
                              onClick={() => toggleVisibilidade(campo)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                              tabIndex={-1}
                            >
                              {visivel ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>

                          {info.temChave && !valorDigitado && (
                            <p className="text-xs text-muted-foreground">
                              Chave configurada. Deixe o campo vazio para manter
                              a chave atual.
                            </p>
                          )}
                        </div>
                      )
                    })}
                  </CardContent>
                </Card>
              </TabsContent>
            )
          })}
        </Tabs>

        {/* Botão salvar fixo embaixo */}
        <div className="mt-6 flex justify-end">
          <Button type="submit" disabled={pendenteSalvar}>
            <Save className="mr-1.5 h-4 w-4" />
            {pendenteSalvar ? "Salvando..." : "Salvar configurações"}
          </Button>
        </div>
      </form>
    </div>
  )
}
