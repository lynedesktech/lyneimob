"use client"

import { useActionState } from "react"
import { enviarContatoSite } from "@/actions/site-contato"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Send, CheckCircle2, AlertCircle } from "lucide-react"
import type { EstadoFormulario } from "@/types/formulario"

type Props = {
  organizacaoSlug: string
  imovelCodigo?: string
}

export function FormularioContato({ organizacaoSlug, imovelCodigo }: Props) {
  const [estado, formAction, enviando] = useActionState<
    EstadoFormulario,
    FormData
  >(async (_prev, formData) => {
    return await enviarContatoSite(formData)
  }, {})

  if (estado.sucesso) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-success/20 bg-success/5 p-8 text-center">
        <CheckCircle2 className="h-10 w-10 text-success" />
        <h3 className="text-lg font-semibold text-success">
          Mensagem enviada!
        </h3>
        <p className="text-sm text-success">{estado.sucesso}</p>
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="organizacao_slug" value={organizacaoSlug} />
      {imovelCodigo && (
        <input type="hidden" name="imovel_codigo" value={imovelCodigo} />
      )}

      {estado.erro && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {estado.erro}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="nome">Nome *</Label>
        <Input
          id="nome"
          name="nome"
          placeholder="Seu nome completo"
          required
          minLength={2}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="seu@email.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="telefone">Telefone</Label>
          <Input
            id="telefone"
            name="telefone"
            type="tel"
            placeholder="(11) 99999-9999"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="mensagem">Mensagem *</Label>
        <Textarea
          id="mensagem"
          name="mensagem"
          placeholder="Conte-nos como podemos ajudar..."
          rows={5}
          required
          minLength={5}
        />
      </div>

      <Button
        type="submit"
        disabled={enviando}
        className="w-full bg-[var(--site-primaria)] hover:bg-[var(--site-primaria)]/90"
        size="lg"
      >
        {enviando ? (
          "Enviando..."
        ) : (
          <>
            <Send className="mr-2 h-4 w-4" />
            Enviar mensagem
          </>
        )}
      </Button>
    </form>
  )
}
