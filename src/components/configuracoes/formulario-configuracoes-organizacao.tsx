"use client"

import { useActionState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Save, Building2, Phone, Mail, MapPin, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { salvarConfiguracoesOrganizacao } from "@/actions/configuracoes-organizacao"
import { toast } from "sonner"

// ============================================================
// Schema de validação
// ============================================================

const schemaConfigOrg = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  telefone: z.string(),
  email: z.string().email("Email inválido").or(z.literal("")),
  logradouro: z.string(),
  numero: z.string(),
  bairro: z.string(),
  cidade: z.string(),
  estado: z.string(),
  cep: z.string(),
  creci: z.string(),
  whatsapp_numero: z.string(),
})

type FormConfigOrg = z.infer<typeof schemaConfigOrg>

// ============================================================
// Props
// ============================================================

type Props = {
  organizacao: {
    id: string
    nome: string
    telefone: string | null
    email: string | null
    endereco: Record<string, unknown> | null
    creci: string | null
    whatsapp_numero: string | null
  }
}

// ============================================================
// Componente
// ============================================================

export function FormularioConfiguracoesOrganizacao({ organizacao }: Props) {
  const endereco = (organizacao.endereco ?? {}) as Record<string, string>

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormConfigOrg>({
    resolver: zodResolver(schemaConfigOrg),
    defaultValues: {
      nome: organizacao.nome ?? "",
      telefone: organizacao.telefone ?? "",
      email: organizacao.email ?? "",
      logradouro: endereco.logradouro ?? "",
      numero: endereco.numero ?? "",
      bairro: endereco.bairro ?? "",
      cidade: endereco.cidade ?? "",
      estado: endereco.estado ?? "",
      cep: endereco.cep ?? "",
      creci: organizacao.creci ?? "",
      whatsapp_numero: organizacao.whatsapp_numero ?? "",
    },
  })

  const [estado, formAction, pendente] = useActionState(
    salvarConfiguracoesOrganizacao,
    {}
  )

  useEffect(() => {
    if (estado.sucesso) toast.success(estado.sucesso)
    if (estado.erro) toast.error(estado.erro)
  }, [estado])

  function onSubmit(dados: FormConfigOrg) {
    const formData = new FormData()
    formData.set("dados", JSON.stringify(dados))
    formAction(formData)
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="text-sm text-muted-foreground">
          Dados da sua imobiliária
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Dados básicos */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle>Dados da imobiliária</CardTitle>
                <CardDescription>Informações básicas que identificam sua empresa</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome da imobiliária *</Label>
              <Input id="nome" {...register("nome")} />
              {errors.nome && (
                <p className="text-xs text-destructive">{errors.nome.message}</p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="telefone">
                  <Phone className="mr-1.5 inline h-3.5 w-3.5" />
                  Telefone
                </Label>
                <Input id="telefone" {...register("telefone")} placeholder="(11) 99999-9999" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">
                  <Mail className="mr-1.5 inline h-3.5 w-3.5" />
                  Email
                </Label>
                <Input id="email" type="email" {...register("email")} placeholder="contato@imobiliaria.com" />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="creci">
                <FileText className="mr-1.5 inline h-3.5 w-3.5" />
                CRECI
              </Label>
              <Input id="creci" {...register("creci")} placeholder="CRECI-SP 12345-J" />
            </div>
          </CardContent>
        </Card>

        {/* Endereço */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle>Endereço</CardTitle>
                <CardDescription>Localização da imobiliária</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="logradouro">Logradouro</Label>
                <Input id="logradouro" {...register("logradouro")} placeholder="Rua, Avenida..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="numero">Número</Label>
                <Input id="numero" {...register("numero")} placeholder="123" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="bairro">Bairro</Label>
                <Input id="bairro" {...register("bairro")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cidade">Cidade</Label>
                <Input id="cidade" {...register("cidade")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estado">Estado</Label>
                <Input id="estado" {...register("estado")} placeholder="SP" />
              </div>
            </div>
            <div className="space-y-2 sm:max-w-[200px]">
              <Label htmlFor="cep">CEP</Label>
              <Input id="cep" {...register("cep")} placeholder="00000-000" />
            </div>
          </CardContent>
        </Card>

        {/* WhatsApp */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle>WhatsApp</CardTitle>
                <CardDescription>Número do WhatsApp da imobiliária para contato de clientes</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 sm:max-w-[300px]">
              <Label htmlFor="whatsapp_numero">Número do WhatsApp</Label>
              <Input
                id="whatsapp_numero"
                {...register("whatsapp_numero")}
                placeholder="5511999999999"
              />
              <p className="text-xs text-muted-foreground">
                Formato: código do país + DDD + número (ex: 5511999999999)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Botão salvar */}
        <div className="flex justify-end">
          <Button type="submit" disabled={pendente}>
            <Save className="mr-1.5 h-4 w-4" />
            {pendente ? "Salvando..." : "Salvar configurações"}
          </Button>
        </div>
      </form>
    </div>
  )
}
