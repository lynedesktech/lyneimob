"use client"

import { useActionState, useEffect, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import Link from "next/link"
import { criarCliente, atualizarCliente } from "@/actions/clientes"
import { schemaCriarCliente } from "@/types/clientes"
import type { CriarClienteInput } from "@/types/clientes"
import type { Cliente } from "@/types/database"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import { labelsTipoCliente, labelsOrigem, labelsStatusCliente, opcoesDeLabels } from "@/lib/constantes"

const opcoesTipo = opcoesDeLabels(labelsTipoCliente)
const opcoesOrigem = opcoesDeLabels(labelsOrigem)
const opcoesStatus = opcoesDeLabels(labelsStatusCliente)

type FormularioClienteProps = {
  cliente?: Cliente
}

export function FormularioCliente({ cliente }: FormularioClienteProps) {
  const editando = !!cliente
  const action = editando ? atualizarCliente : criarCliente

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CriarClienteInput>({
    resolver: zodResolver(schemaCriarCliente),
    defaultValues: {
      nome: cliente?.nome ?? "",
      email: cliente?.email ?? "",
      telefone: cliente?.telefone ?? "",
      whatsapp: cliente?.whatsapp ?? "",
      cpf_cnpj: cliente?.cpf_cnpj ?? "",
      tipo: (cliente?.tipo ?? "") as CriarClienteInput["tipo"],
      origem: (cliente?.origem ?? "outro") as CriarClienteInput["origem"],
      observacoes: cliente?.observacoes ?? "",
    },
  })

  // Status é controlado separadamente (só existe em edição)
  const [statusValue, setStatusValue] = useState(cliente?.status ?? "ativo")

  const [estado, formAction, pendente] = useActionState(action, {})

  useEffect(() => {
    if (estado.erro) toast.error(estado.erro)
  }, [estado])

  function onSubmit(dados: CriarClienteInput) {
    const formData = new FormData()
    if (editando) formData.set("id", cliente.id)
    formData.set("nome", dados.nome)
    formData.set("tipo", dados.tipo)
    formData.set("origem", dados.origem)
    if (dados.email) formData.set("email", dados.email)
    if (dados.telefone) formData.set("telefone", dados.telefone)
    if (dados.whatsapp) formData.set("whatsapp", dados.whatsapp)
    if (dados.cpf_cnpj) formData.set("cpf_cnpj", dados.cpf_cnpj)
    if (dados.observacoes) formData.set("observacoes", dados.observacoes)
    if (editando) formData.set("status", statusValue)
    formAction(formData)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" render={<Link href="/clientes" />}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {cliente ? "Editar cliente" : "Novo cliente"}
          </h1>
          <p className="text-muted-foreground">
            {cliente
              ? "Atualize as informações do cliente"
              : "Preencha os dados para cadastrar um novo cliente"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Dados Pessoais */}
        <Card>
          <CardHeader>
            <CardTitle>Dados pessoais</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome completo *</Label>
              <Input
                id="nome"
                placeholder="Ex: João da Silva"
                {...register("nome")}
                aria-invalid={!!errors.nome}
              />
              {errors.nome && (
                <p className="text-xs text-destructive">{errors.nome.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cpf_cnpj">CPF / CNPJ</Label>
              <Input
                id="cpf_cnpj"
                placeholder="000.000.000-00"
                {...register("cpf_cnpj")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Contato */}
        <Card>
          <CardHeader>
            <CardTitle>Contato</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="joao@email.com"
                {...register("email")}
                aria-invalid={!!errors.email}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                placeholder="(11) 99999-9999"
                {...register("telefone")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                placeholder="(11) 99999-9999"
                {...register("whatsapp")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Classificação */}
        <Card>
          <CardHeader>
            <CardTitle>Classificação</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo *</Label>
              <Controller
                name="tipo"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full" aria-invalid={!!errors.tipo}>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {opcoesTipo.map((opcao) => (
                        <SelectItem key={opcao.value} value={opcao.value}>
                          {opcao.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.tipo && (
                <p className="text-xs text-destructive">{errors.tipo.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="origem">Origem</Label>
              <Controller
                name="origem"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione a origem" />
                    </SelectTrigger>
                    <SelectContent>
                      {opcoesOrigem.map((opcao) => (
                        <SelectItem key={opcao.value} value={opcao.value}>
                          {opcao.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {editando && (
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={statusValue} onValueChange={(v) => v && setStatusValue(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    {opcoesStatus.map((opcao) => (
                      <SelectItem key={opcao.value} value={opcao.value}>
                        {opcao.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                placeholder="Notas sobre o cliente..."
                rows={3}
                {...register("observacoes")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Ações */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" render={<Link href="/clientes" />}>
            Cancelar
          </Button>
          <Button type="submit" disabled={pendente}>
            {pendente
              ? cliente
                ? "Salvando..."
                : "Cadastrando..."
              : cliente
                ? "Salvar alterações"
                : "Cadastrar cliente"}
          </Button>
        </div>
      </form>
    </div>
  )
}
