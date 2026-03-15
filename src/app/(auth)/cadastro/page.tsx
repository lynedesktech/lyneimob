"use client"

import { useActionState } from "react"
import Link from "next/link"
import { cadastrar, type EstadoFormulario } from "@/actions/auth"
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

export default function CadastroPage() {
  const [estado, formAction, pendente] = useActionState<EstadoFormulario, FormData>(
    cadastrar,
    {}
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Criar conta</CardTitle>
        <CardDescription>
          Comece a usar o LyneImob gratuitamente por 14 dias
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
            <Label htmlFor="nome">Seu nome</Label>
            <Input
              id="nome"
              name="nome"
              type="text"
              placeholder="João Silva"
              required
              autoComplete="name"
            />
          </div>

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
            <Label htmlFor="senha">Senha</Label>
            <Input
              id="senha"
              name="senha"
              type="password"
              placeholder="Mínimo 6 caracteres"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nomeOrganizacao">Nome da imobiliária</Label>
            <Input
              id="nomeOrganizacao"
              name="nomeOrganizacao"
              type="text"
              placeholder="Ex: Imobiliária Copacabana"
              required
            />
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={pendente}>
            {pendente ? "Criando conta..." : "Criar conta grátis"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Já tem conta?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Entrar
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
