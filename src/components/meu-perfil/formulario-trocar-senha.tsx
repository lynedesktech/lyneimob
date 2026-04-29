"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff, Loader2, Save } from "lucide-react"
import { toast } from "sonner"
import { trocarSenha } from "@/actions/seguranca"
import { schemaTrocarSenha, type DadosTrocarSenha } from "@/types/seguranca"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"

export function FormularioTrocarSenha() {
  const [mostrarAtual, setMostrarAtual] = useState(false)
  const [mostrarNova, setMostrarNova] = useState(false)
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false)
  const [enviando, setEnviando] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<DadosTrocarSenha>({
    resolver: zodResolver(schemaTrocarSenha),
    mode: "onChange",
    defaultValues: { senhaAtual: "", novaSenha: "", confirmarSenha: "" },
  })

  async function onSubmit(dados: DadosTrocarSenha) {
    setEnviando(true)
    const resultado = await trocarSenha(dados)
    setEnviando(false)

    if (resultado.erro) {
      toast.error(resultado.erro)
      return
    }
    toast.success(resultado.sucesso ?? "Senha alterada com sucesso!")
    reset()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Alterar senha</CardTitle>
        <CardDescription>
          Para sua segurança, informe a senha atual antes de definir uma nova.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Senha atual */}
          <div className="space-y-2">
            <Label htmlFor="senhaAtual">Senha atual</Label>
            <div className="relative">
              <Input
                id="senhaAtual"
                type={mostrarAtual ? "text" : "password"}
                autoFocus
                autoComplete="current-password"
                aria-invalid={!!errors.senhaAtual}
                className="pr-10"
                {...register("senhaAtual")}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setMostrarAtual((v) => !v)}
                aria-label={mostrarAtual ? "Ocultar senha" : "Mostrar senha"}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {mostrarAtual ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.senhaAtual && (
              <p className="text-xs text-destructive">{errors.senhaAtual.message}</p>
            )}
          </div>

          {/* Nova senha */}
          <div className="space-y-2">
            <Label htmlFor="novaSenha">Nova senha</Label>
            <div className="relative">
              <Input
                id="novaSenha"
                type={mostrarNova ? "text" : "password"}
                autoComplete="new-password"
                aria-invalid={!!errors.novaSenha}
                className="pr-10"
                {...register("novaSenha")}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setMostrarNova((v) => !v)}
                aria-label={mostrarNova ? "Ocultar senha" : "Mostrar senha"}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {mostrarNova ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.novaSenha ? (
              <p className="text-xs text-destructive">{errors.novaSenha.message}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Mínimo 8 caracteres, com pelo menos 1 letra e 1 número.
              </p>
            )}
          </div>

          {/* Confirmar nova senha */}
          <div className="space-y-2">
            <Label htmlFor="confirmarSenha">Confirmar nova senha</Label>
            <div className="relative">
              <Input
                id="confirmarSenha"
                type={mostrarConfirmar ? "text" : "password"}
                autoComplete="new-password"
                aria-invalid={!!errors.confirmarSenha}
                className="pr-10"
                {...register("confirmarSenha")}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setMostrarConfirmar((v) => !v)}
                aria-label={mostrarConfirmar ? "Ocultar senha" : "Mostrar senha"}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {mostrarConfirmar ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirmarSenha && (
              <p className="text-xs text-destructive">{errors.confirmarSenha.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => reset()}
              disabled={enviando}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={!isValid || enviando}>
              {enviando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
