"use client"

import { Suspense, useActionState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { login } from "@/actions/auth"
import type { EstadoFormulario } from "@/types/formulario"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { InputSenha } from "@/components/ui/input-senha"
import { AlertaFormulario } from "@/components/ui/alerta-formulario"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const mensagensErro: Record<string, string> = {
  "sessao-invalida": "Sua sessão expirou. Faça login novamente.",
  "usuario-nao-encontrado": "Conta não encontrada. Entre em contato com o suporte.",
  "organizacao-nao-encontrada": "Organização não encontrada. Entre em contato com o suporte.",
}

function AlertasSessao() {
  const searchParams = useSearchParams()
  const erroSessao = searchParams.get("erro")
  const senhaRedefinida = searchParams.has("senha-redefinida")

  return (
    <>
      {erroSessao && mensagensErro[erroSessao] && (
        <AlertaFormulario tipo="erro" mensagem={mensagensErro[erroSessao]} />
      )}
      {senhaRedefinida && (
        <AlertaFormulario tipo="sucesso" mensagem="Senha redefinida com sucesso! Faça login com sua nova senha." />
      )}
    </>
  )
}

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
        <CardContent className="space-y-5">
          <Suspense>
            <AlertasSessao />
          </Suspense>

          {estado.erro && (
            <AlertaFormulario tipo="erro" mensagem={estado.erro}>
              {estado.erro.includes("Senha incorreta") && (
                <Link
                  href="/esqueci-senha"
                  className="ml-1 font-medium underline hover:text-destructive/80"
                >
                  Esqueci minha senha
                </Link>
              )}
            </AlertaFormulario>
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
              defaultValue={estado.email ?? ""}
              key={estado.email ?? ""}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="senha">Senha</Label>
              <Link
                href="/esqueci-senha"
                className="text-sm text-primary hover:underline"
              >
                Esqueci minha senha
              </Link>
            </div>
            <InputSenha
              id="senha"
              name="senha"
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
