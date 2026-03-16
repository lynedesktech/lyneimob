"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { cadastrarViaConvite, aceitarConviteLogado } from "@/actions/convites"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

interface FormularioConviteProps {
  token: string
  email: string
  cargo: string
  organizacaoNome: string
  jaLogado: boolean
  emailLogado: string | null
}

export function FormularioConvite({
  token,
  email,
  cargo,
  organizacaoNome,
  jaLogado,
  emailLogado,
}: FormularioConviteProps) {
  const router = useRouter()
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  // Usuario ja logado — aceitar direto
  if (jaLogado) {
    const emailCompativel = emailLogado?.toLowerCase() === email.toLowerCase()

    return (
      <div className="space-y-4">
        <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
          <p className="text-sm">
            <span className="text-muted-foreground">Logado como:</span>{" "}
            <strong>{emailLogado}</strong>
          </p>
          <p className="text-sm">
            <span className="text-muted-foreground">Convite para:</span>{" "}
            <strong>{email}</strong>
          </p>
          <p className="text-sm">
            <span className="text-muted-foreground">Cargo:</span>{" "}
            <Badge variant="secondary">{cargo}</Badge>
          </p>
        </div>

        {!emailCompativel ? (
          <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
            O email da sua conta nao corresponde ao email do convite.
            Faca logout e crie uma conta com o email <strong>{email}</strong>.
          </div>
        ) : (
          <>
            {erro && (
              <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {erro}
              </div>
            )}
            <Button
              className="w-full"
              disabled={carregando}
              onClick={async () => {
                setCarregando(true)
                setErro(null)
                const resultado = await aceitarConviteLogado(token)
                if (resultado.erro) {
                  setErro(resultado.erro)
                } else {
                  toast.success(resultado.sucesso)
                  router.push("/")
                }
                setCarregando(false)
              }}
            >
              {carregando ? "Aceitando..." : `Entrar em ${organizacaoNome}`}
            </Button>
          </>
        )}
      </div>
    )
  }

  // Usuario nao logado — formulario de cadastro
  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-muted/30 p-4 space-y-1">
        <p className="text-sm">
          <span className="text-muted-foreground">Organizacao:</span>{" "}
          <strong>{organizacaoNome}</strong>
        </p>
        <p className="text-sm">
          <span className="text-muted-foreground">Cargo:</span>{" "}
          <Badge variant="secondary">{cargo}</Badge>
        </p>
      </div>

      {erro && (
        <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {erro}
        </div>
      )}

      <form
        onSubmit={async (e) => {
          e.preventDefault()
          setCarregando(true)
          setErro(null)
          const formData = new FormData(e.currentTarget)
          const resultado = await cadastrarViaConvite(token, {}, formData)
          if (resultado.erro) {
            setErro(resultado.erro)
            setCarregando(false)
          }
          // Se sucesso, o redirect vai redirecionar automaticamente
        }}
        className="space-y-4"
      >
        <div className="space-y-2">
          <Label htmlFor="nome">Seu nome</Label>
          <Input
            id="nome"
            name="nome"
            type="text"
            placeholder="Joao Silva"
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
            value={email}
            readOnly
            className="bg-muted"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="senha">Senha</Label>
          <Input
            id="senha"
            name="senha"
            type="password"
            placeholder="Minimo 6 caracteres"
            required
            minLength={6}
            autoComplete="new-password"
          />
        </div>

        <Button type="submit" className="w-full" disabled={carregando}>
          {carregando ? "Criando conta..." : "Criar conta e entrar"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Ja tem conta?{" "}
        <Link href="/login" className="text-primary hover:underline">
          Faca login
        </Link>{" "}
        e acesse este link novamente.
      </p>
    </div>
  )
}
