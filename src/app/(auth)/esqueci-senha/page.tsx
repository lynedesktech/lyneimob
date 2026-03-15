"use client"

import { useActionState } from "react"
import Link from "next/link"
import { recuperarSenha, type EstadoFormulario } from "@/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

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

      <form action={formAction}>
        <CardContent className="space-y-4">
          {estado.erro && (
            <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {estado.erro}
            </div>
          )}

          {estado.sucesso && (
            <div className="rounded-md bg-green-50 px-4 py-3 text-sm text-green-700">
              {estado.sucesso}
            </div>
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
    </Card>
  )
}
