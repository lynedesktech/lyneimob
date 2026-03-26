"use client"

import { useActionState, useEffect, useTransition } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Save, Building2, Phone, Mail, MapPin, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel, FieldError } from "@/components/ui/field"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { InputTelefone } from "@/components/ui/input-telefone"
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
    control,
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

  const [estado, formAction] = useActionState(
    salvarConfiguracoesOrganizacao,
    {}
  )
  const [transitando, iniciarTransicao] = useTransition()
  const pendente = transitando

  useEffect(() => {
    if (estado.sucesso) toast.success(estado.sucesso)
    if (estado.erro) toast.error(estado.erro)
  }, [estado])

  function onSubmit(dados: FormConfigOrg) {
    const formData = new FormData()
    formData.set("dados", JSON.stringify(dados))
    iniciarTransicao(() => {
      formAction(formData)
    })
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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" id="onborda-form-empresa">
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
            <Field>
              <FieldLabel htmlFor="nome">Nome da imobiliária *</FieldLabel>
              <Input id="nome" {...register("nome")} />
              <FieldError errors={[errors.nome]} />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="telefone">
                  <Phone className="mr-1.5 inline h-3.5 w-3.5" />
                  Telefone
                </FieldLabel>
                <Controller
                  name="telefone"
                  control={control}
                  render={({ field }) => (
                    <InputTelefone
                      id="telefone"
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="(11) 99999-9999"
                    />
                  )}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="email">
                  <Mail className="mr-1.5 inline h-3.5 w-3.5" />
                  Email
                </FieldLabel>
                <Input id="email" type="email" {...register("email")} placeholder="contato@imobiliaria.com" />
                <FieldError errors={[errors.email]} />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="creci">
                <FileText className="mr-1.5 inline h-3.5 w-3.5" />
                CRECI
              </FieldLabel>
              <Input id="creci" {...register("creci")} placeholder="CRECI-SP 12345-J" />
            </Field>
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
              <Field className="sm:col-span-2">
                <FieldLabel htmlFor="logradouro">Logradouro</FieldLabel>
                <Input id="logradouro" {...register("logradouro")} placeholder="Rua, Avenida..." />
              </Field>
              <Field>
                <FieldLabel htmlFor="numero">Número</FieldLabel>
                <Input id="numero" {...register("numero")} placeholder="123" />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field>
                <FieldLabel htmlFor="bairro">Bairro</FieldLabel>
                <Input id="bairro" {...register("bairro")} />
              </Field>
              <Field>
                <FieldLabel htmlFor="cidade">Cidade</FieldLabel>
                <Input id="cidade" {...register("cidade")} />
              </Field>
              <Field>
                <FieldLabel htmlFor="estado">Estado</FieldLabel>
                <Input id="estado" {...register("estado")} placeholder="SP" />
              </Field>
            </div>
            <Field className="sm:max-w-[200px]">
              <FieldLabel htmlFor="cep">CEP</FieldLabel>
              <Input id="cep" {...register("cep")} placeholder="00000-000" />
            </Field>
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
            <Field className="sm:max-w-[300px]">
              <FieldLabel htmlFor="whatsapp_numero">Número do WhatsApp</FieldLabel>
              <Input
                id="whatsapp_numero"
                {...register("whatsapp_numero")}
                placeholder="5511999999999"
              />
              <p className="text-xs text-muted-foreground">
                Formato: código do país + DDD + número (ex: 5511999999999)
              </p>
            </Field>
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
