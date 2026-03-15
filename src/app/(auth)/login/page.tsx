"use client"

import { useActionState } from "react"
import Link from "next/link"
import { login, type EstadoFormulario } from "@/actions/auth"
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

export default function LoginPage() {
  const [estado, formAction, pendente] = useActionState<EstadoFormulario, FormData>(
    login,
    {}
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Entrar</CardTitle>
        <CardDescription>
          Acesse sua conta para gerenciar sua imobiliária
        </CardDescription>
      </CardHeader>

      <form action={formAction}>
        <CardContent className="space-y-4">
          {estado.erro && (
            <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {estado.erro}
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

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="senha">Senha</Label>
              <Link
                href="/esqueci-senha"
                className="text-xs text-muted-foreground hover:text-primary"
              >
                Esqueci minha senha
              </Link>
            </div>
            <Input
              id="senha"
              name="senha"
              type="password"
              placeholder="••••••"
              required
              autoComplete="current-password"
            />
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={pendente}>
            {pendente ? "Entrando..." : "Entrar"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Não tem conta?{" "}
            <Link href="/cadastro" className="text-primary hover:underline">
              Criar conta grátis
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
