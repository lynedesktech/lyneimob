"use client"

import { Suspense, useActionState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { recuperarSenha } from "@/actions/auth"
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

function AlertaLinkExpirado() {
  const searchParams = useSearchParams()
  const erro = searchParams.get("erro")

  if (erro === "link-expirado") {
    return (
      <AlertaFormulario
        tipo="erro"
        mensagem="O link de recuperação expirou ou é inválido. Solicite um novo abaixo."
      />
    )
  }

  return null
}

export default function EsqueciSenhaPage() {
  const [estado, formAction, pendente] = useActionState<EstadoFormulario, FormData>(
    recuperarSenha,
    {}
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Esqueci minha senha</CardTitle>
        <CardDescription>
          Informe seu email e enviaremos um link para redefinir sua senha
        </CardDescription>
      </CardHeader>

      {estado.sucesso ? (
        <CardContent className="space-y-5">
          <AlertaFormulario tipo="sucesso" mensagem={estado.sucesso} />

          <p className="text-center text-sm text-muted-foreground">
            <Link href="/login" className="text-primary hover:underline">
              Voltar ao login
            </Link>
          </p>
        </CardContent>
      ) : (
        <form action={formAction}>
          <CardContent className="space-y-5">
            <Suspense>
              <AlertaLinkExpirado />
            </Suspense>

            {estado.erro && (
              <AlertaFormulario tipo="erro" mensagem={estado.erro} />
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="seu@email.com"
                required
                autoComplete="email"
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={pendente}>
              {pendente ? "Enviando..." : "Enviar link de recuperação"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Lembrou a senha?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Voltar ao login
              </Link>
            </p>
          </CardFooter>
        </form>
      )}
    </Card>
  )
}
