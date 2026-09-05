"use client"

import { Suspense, useState, useActionState } from "react"
import { useSearchParams } from "next/navigation"
import { redefinirSenha } from "@/actions/auth"
import type { EstadoFormulario } from "@/types/formulario"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertaFormulario } from "@/components/ui/alerta-formulario"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Eye, EyeOff } from "lucide-react"

function FormularioSenha() {
  // ?convite=1: primeiro acesso de quem foi convidado por e-mail. Mesma tela,
  // mas o texto muda e, ao salvar, a pessoa entra direto no painel.
  const ehConvite = useSearchParams().get("convite") === "1"

  const [estado, formAction, pendente] = useActionState<EstadoFormulario, FormData>(
    redefinirSenha,
    {}
  )
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">
          {ehConvite ? "Bem-vinda ao LyneImob" : "Redefinir senha"}
        </CardTitle>
        <CardDescription>
          {ehConvite
            ? "Sua conta já está criada. Escolha a senha que você vai usar para entrar."
            : "Digite sua nova senha abaixo"}
        </CardDescription>
      </CardHeader>

      <form action={formAction}>
        <CardContent className="space-y-5">
          {ehConvite && <input type="hidden" name="convite" value="1" />}
          {estado.erro && (
            <AlertaFormulario tipo="erro" mensagem={estado.erro} />
          )}

          <div className="space-y-2">
            <Label htmlFor="senha">Nova senha</Label>
            <div className="relative">
              <Input
                id="senha"
                name="senha"
                type={mostrarSenha ? "text" : "password"}
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setMostrarSenha(!mostrarSenha)}
                tabIndex={-1}
              >
                {mostrarSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmarSenha">Confirmar nova senha</Label>
            <div className="relative">
              <Input
                id="confirmarSenha"
                name="confirmarSenha"
                type={mostrarConfirmar ? "text" : "password"}
                placeholder="Repita a nova senha"
                required
                minLength={6}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setMostrarConfirmar(!mostrarConfirmar)}
                tabIndex={-1}
              >
                {mostrarConfirmar ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </CardContent>

        <CardFooter>
          <Button type="submit" className="w-full" disabled={pendente}>
            {pendente
              ? "Salvando..."
              : ehConvite
                ? "Definir senha e entrar"
                : "Salvar nova senha"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

export default function RedefinirSenhaPage() {
  // useSearchParams exige Suspense em pagina pre-renderizada (mesmo padrao do login)
  return (
    <Suspense>
      <FormularioSenha />
    </Suspense>
  )
}
