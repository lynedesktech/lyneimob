"use client"

import { useActionState, useEffect, useState } from "react"
import {
  Globe,
  CheckCircle2,
  Clock,
  Trash2,
  RefreshCw,
  Copy,
  ArrowRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { salvarDominio, verificarDns, removerDominio } from "@/actions/dominios"
import type { DominioCustomizado } from "@/types/dominios"
import { toast } from "sonner"

type Props = {
  dominio: DominioCustomizado | null
  appHostname: string
}

export function ConfiguracaoDominio({ dominio, appHostname }: Props) {
  const [dominioInput, setDominioInput] = useState("")

  // Actions
  const [estadoSalvar, actionSalvar, salvando] = useActionState(
    salvarDominio,
    {}
  )
  const [estadoVerificar, actionVerificar, verificando] = useActionState(
    verificarDns,
    {}
  )
  const [estadoRemover, actionRemover, removendo] = useActionState(
    removerDominio,
    {}
  )

  // Toast feedback para cada action
  useEffect(() => {
    if (estadoSalvar.sucesso) toast.success(estadoSalvar.sucesso)
    if (estadoSalvar.erro) toast.error(estadoSalvar.erro)
  }, [estadoSalvar])

  useEffect(() => {
    if (estadoVerificar.sucesso) toast.success(estadoVerificar.sucesso)
    if (estadoVerificar.erro) toast.error(estadoVerificar.erro)
  }, [estadoVerificar])

  useEffect(() => {
    if (estadoRemover.sucesso) toast.success(estadoRemover.sucesso)
    if (estadoRemover.erro) toast.error(estadoRemover.erro)
  }, [estadoRemover])

  function copiarParaClipboard(texto: string) {
    navigator.clipboard.writeText(texto)
    toast.info("Copiado!")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Domínio Customizado</CardTitle>
        <CardDescription>
          Conecte seu próprio domínio ao site da sua imobiliária. Em vez de
          acessar pelo link padrão, seus clientes poderão visitar diretamente o
          seu endereço, como www.suaimobiliaria.com.br.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!dominio ? (
          /* ========== SEM DOMÍNIO CONFIGURADO ========== */
          <form action={actionSalvar} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dominio">Seu domínio</Label>
              <div className="flex gap-2">
                <Input
                  id="dominio"
                  name="dominio"
                  value={dominioInput}
                  onChange={(e) => setDominioInput(e.target.value)}
                  placeholder="www.suaimobiliaria.com.br"
                  className="flex-1"
                />
                <Button type="submit" disabled={salvando}>
                  <Globe className="mr-1.5 h-3.5 w-3.5" />
                  {salvando ? "Salvando..." : "Salvar"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Digite o domínio completo, sem http:// e sem barra no final.
                Exemplo: www.suaimobiliaria.com.br
              </p>
            </div>

            <Separator />

            {/* Explicação de como funciona */}
            <div className="rounded-lg border border-dashed p-4">
              <p className="mb-3 text-sm font-medium">Como funciona?</p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                    1
                  </span>
                  <span>Salve o domínio que você quer usar</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                    2
                  </span>
                  <span>
                    Configure o DNS no seu provedor de domínio (vamos te mostrar
                    como)
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                    3
                  </span>
                  <span>Clique em &quot;Verificar DNS&quot; e pronto!</span>
                </div>
              </div>
            </div>
          </form>
        ) : (
          /* ========== DOMÍNIO CONFIGURADO ========== */
          <div className="space-y-6">
            {/* Status atual */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{dominio.dominio}</p>
                  {dominio.status === "verificado" && dominio.verificado_em && (
                    <p className="text-xs text-muted-foreground">
                      Verificado em{" "}
                      {new Date(dominio.verificado_em).toLocaleDateString(
                        "pt-BR"
                      )}
                    </p>
                  )}
                </div>
              </div>
              {dominio.status === "verificado" ? (
                <Badge variant="success">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Verificado
                </Badge>
              ) : (
                <Badge variant="warning">
                  <Clock className="mr-1 h-3 w-3" />
                  Pendente
                </Badge>
              )}
            </div>

            {/* Instruções DNS (sempre visível quando pendente) */}
            {dominio.status === "pendente" && (
              <div className="rounded-lg border border-warning/20 bg-warning/5 p-4">
                <p className="mb-3 text-sm font-medium text-warning">
                  Configure o DNS do seu domínio
                </p>
                <p className="mb-4 text-sm text-warning/80">
                  No painel do seu provedor de domínio (como Registro.br,
                  GoDaddy, Cloudflare etc.), crie um registro CNAME com os dados
                  abaixo:
                </p>

                <div className="space-y-3 rounded-md bg-white p-3 dark:bg-background">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">
                        Tipo
                      </p>
                      <p className="font-mono text-sm">CNAME</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">
                        Nome / Host
                      </p>
                      <p className="font-mono text-sm">{dominio.dominio}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => copiarParaClipboard(dominio.dominio)}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">
                        Valor / Aponta para
                      </p>
                      <p className="font-mono text-sm">{appHostname}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => copiarParaClipboard(appHostname)}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <p className="mt-3 text-xs text-warning/70">
                  A propagação de DNS pode levar até 48 horas. Após configurar,
                  clique em &quot;Verificar DNS&quot; abaixo.
                </p>
              </div>
            )}

            {/* Domínio verificado — mensagem de sucesso */}
            {dominio.status === "verificado" && (
              <div className="rounded-lg border border-success/20 bg-success/5 p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-success" />
                  <div>
                    <p className="text-sm font-medium text-success">
                      Domínio ativo!
                    </p>
                    <p className="mt-1 text-sm text-success/80">
                      Seu site está acessível em{" "}
                      <span className="font-medium">{dominio.dominio}</span>.
                      Os links do feed XML para portais imobiliários também
                      usarão este domínio automaticamente.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <Separator />

            {/* Ações */}
            <div className="flex flex-wrap gap-2">
              {/* Verificar DNS */}
              <form action={actionVerificar}>
                <Button
                  type="submit"
                  variant={
                    dominio.status === "pendente" ? "default" : "outline"
                  }
                  size="sm"
                  disabled={verificando}
                >
                  <RefreshCw
                    className={`mr-1.5 h-3.5 w-3.5 ${verificando ? "animate-spin" : ""}`}
                  />
                  {verificando ? "Verificando..." : "Verificar DNS"}
                </Button>
              </form>

              {/* Alterar domínio */}
              <form action={actionSalvar} className="flex gap-2">
                <Input
                  name="dominio"
                  placeholder="Novo domínio..."
                  className="h-8 w-52 text-sm"
                />
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  disabled={salvando}
                >
                  <ArrowRight className="mr-1.5 h-3.5 w-3.5" />
                  {salvando ? "Salvando..." : "Alterar"}
                </Button>
              </form>

              {/* Remover domínio */}
              <Dialog>
                <DialogTrigger
                  render={
                    <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" />
                  }
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  Remover
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Remover domínio?</DialogTitle>
                    <DialogDescription>
                      Seu site deixará de funcionar pelo domínio{" "}
                      <span className="font-medium">{dominio.dominio}</span> e
                      voltará a ser acessível apenas pelo link padrão. Essa ação
                      pode ser revertida configurando o domínio novamente.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <DialogClose render={<Button variant="outline" />}>
                      Cancelar
                    </DialogClose>
                    <form action={actionRemover}>
                      <Button
                        type="submit"
                        variant="destructive"
                        disabled={removendo}
                      >
                        {removendo ? "Removendo..." : "Sim, remover"}
                      </Button>
                    </form>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
