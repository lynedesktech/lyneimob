"use client"

import { useActionState } from "react"
import { useEffect } from "react"
import { atualizarMeuPerfil } from "@/actions/meu-perfil"
import type { EstadoFormulario } from "@/types/formulario"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Save } from "lucide-react"
import { toast } from "sonner"

type DadosPerfil = {
  id: string
  nome: string
  email: string
  telefone: string | null
  cargo: "admin" | "corretor" | "gerente"
  avatar_url: string | null
  creci: string | null
  created_at: string
}

const labelsCargo: Record<string, string> = {
  admin: "Administrador",
  gerente: "Gerente",
  corretor: "Corretor",
}

function obterIniciais(nome: string): string {
  return nome
    .split(" ")
    .map((parte) => parte[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

export function FormularioMeuPerfil({ perfil }: { perfil: DadosPerfil }) {
  const [estado, formAction, pendente] = useActionState<
    EstadoFormulario,
    FormData
  >(atualizarMeuPerfil, {})

  useEffect(() => {
    if (estado.sucesso) {
      toast.success(estado.sucesso)
    }
    if (estado.erro) {
      toast.error(estado.erro)
    }
  }, [estado])

  return (
    <div className="space-y-6">
      {/* Header com avatar e info */}
      <Card>
        <CardContent className="flex items-center gap-6 pt-6">
          <Avatar className="h-20 w-20 rounded-xl">
            <AvatarImage
              src={perfil.avatar_url ?? undefined}
              alt={perfil.nome}
            />
            <AvatarFallback className="rounded-xl bg-primary text-primary-foreground text-xl">
              {obterIniciais(perfil.nome)}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <h2 className="text-xl font-semibold">{perfil.nome}</h2>
            <p className="text-sm text-muted-foreground">{perfil.email}</p>
            <Badge variant="secondary">
              {labelsCargo[perfil.cargo] || perfil.cargo}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Formulário de edição */}
      <Card>
        <CardHeader>
          <CardTitle>Meus dados</CardTitle>
          <CardDescription>
            Atualize suas informações pessoais. O email e o cargo são gerenciados pelo administrador.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Nome */}
              <div className="space-y-2">
                <Label htmlFor="nome">Nome completo</Label>
                <Input
                  id="nome"
                  name="nome"
                  defaultValue={perfil.nome}
                  required
                />
              </div>

              {/* Email (somente leitura) */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={perfil.email}
                  disabled
                  className="opacity-60"
                />
                <p className="text-xs text-muted-foreground">
                  Gerenciado pela autenticação
                </p>
              </div>

              {/* Telefone */}
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  name="telefone"
                  defaultValue={perfil.telefone ?? ""}
                  placeholder="(00) 00000-0000"
                />
              </div>

              {/* CRECI */}
              <div className="space-y-2">
                <Label htmlFor="creci">CRECI</Label>
                <Input
                  id="creci"
                  name="creci"
                  defaultValue={perfil.creci ?? ""}
                  placeholder="Número do registro"
                />
              </div>
            </div>

            {/* Cargo (somente leitura) */}
            <div className="space-y-2">
              <Label>Cargo</Label>
              <Input
                value={labelsCargo[perfil.cargo] || perfil.cargo}
                disabled
                className="max-w-xs opacity-60"
              />
              <p className="text-xs text-muted-foreground">
                Apenas o administrador pode alterar seu cargo
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={pendente}>
                <Save className="mr-2 h-4 w-4" />
                {pendente ? "Salvando..." : "Salvar alterações"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
