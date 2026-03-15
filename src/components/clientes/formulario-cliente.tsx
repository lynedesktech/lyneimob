"use client"

import { useActionState } from "react"
import Link from "next/link"
import { criarCliente, atualizarCliente } from "@/actions/clientes"
import type { EstadoFormulario } from "@/types/formulario"
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

const opcoesTipo = [
  { value: "comprador", label: "Comprador" },
  { value: "vendedor", label: "Vendedor" },
  { value: "locatario", label: "Locatário" },
  { value: "proprietario", label: "Proprietário" },
]

const opcoesOrigem = [
  { value: "indicacao", label: "Indicação" },
  { value: "portal", label: "Portal" },
  { value: "site", label: "Site" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "outro", label: "Outro" },
]

const opcoesStatus = [
  { value: "ativo", label: "Ativo" },
  { value: "inativo", label: "Inativo" },
  { value: "negociando", label: "Negociando" },
  { value: "fechado", label: "Fechado" },
]

type FormularioClienteProps = {
  cliente?: Cliente
}

export function FormularioCliente({ cliente }: FormularioClienteProps) {
  const action = cliente ? atualizarCliente : criarCliente
  const [estado, formAction, pendente] = useActionState<
    EstadoFormulario,
    FormData
  >(action, {})

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

      <form action={formAction} className="space-y-6">
        {cliente && <input type="hidden" name="id" value={cliente.id} />}

        {estado.erro && (
          <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {estado.erro}
          </div>
        )}

        {/* Dados Pessoais */}
        <Card>
          <CardHeader>
            <CardTitle>Dados pessoais</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome completo</Label>
              <Input
                id="nome"
                name="nome"
                placeholder="Ex: João da Silva"
                defaultValue={cliente?.nome ?? ""}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cpf_cnpj">CPF / CNPJ</Label>
              <Input
                id="cpf_cnpj"
                name="cpf_cnpj"
                placeholder="000.000.000-00"
                defaultValue={cliente?.cpf_cnpj ?? ""}
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
                name="email"
                type="email"
                placeholder="joao@email.com"
                defaultValue={cliente?.email ?? ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                name="telefone"
                placeholder="(11) 99999-9999"
                defaultValue={cliente?.telefone ?? ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                name="whatsapp"
                placeholder="(11) 99999-9999"
                defaultValue={cliente?.whatsapp ?? ""}
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
              <Label htmlFor="tipo">Tipo</Label>
              <Select name="tipo" defaultValue={cliente?.tipo} required>
                <SelectTrigger className="w-full">
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="origem">Origem</Label>
              <Select name="origem" defaultValue={cliente?.origem ?? "outro"}>
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
            </div>

            {cliente && (
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select name="status" defaultValue={cliente.status}>
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
                name="observacoes"
                placeholder="Notas sobre o cliente..."
                rows={3}
                defaultValue={cliente?.observacoes ?? ""}
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
