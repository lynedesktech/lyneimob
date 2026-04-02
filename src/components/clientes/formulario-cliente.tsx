"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import Link from "next/link"
import { criarCliente, atualizarCliente } from "@/actions/clientes"
import { schemaCriarCliente } from "@/types/clientes"
import type { Cliente } from "@/types/database"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { InputCpfCnpj } from "@/components/ui/input-cpf-cnpj"
import { InputTelefone } from "@/components/ui/input-telefone"
import { Field, FieldLabel, FieldError } from "@/components/ui/field"
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
  const router = useRouter()

  const [nomeValue, setNomeValue] = useState(cliente?.nome ?? "")
  const [tipoValue, setTipoValue] = useState(cliente?.tipo ?? "")
  const [origemValue, setOrigemValue] = useState(cliente?.origem ?? "outro")
  const [statusValue, setStatusValue] = useState(cliente?.status ?? "ativo")
  const [pendente, setPendente] = useState(false)
  const [erros, setErros] = useState<Record<string, string>>({})

  function handleSubmitForm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const novosErros: Record<string, string> = {}
    const formData = new FormData(e.currentTarget)

    if (!nomeValue.trim()) novosErros.nome = "Campo obrigatório"
    if (!tipoValue) novosErros.tipo = "Campo obrigatório"

    if (Object.keys(novosErros).length > 0) {
      setErros(novosErros)
      return
    }

    setErros({})
    handleAction(formData)
  }

  async function handleAction(formData: FormData) {
    // Adicionar campos do Select (que não são inputs nativos)
    formData.set("tipo", tipoValue)
    formData.set("origem", origemValue)
    if (editando) {
      formData.set("id", cliente.id)
      formData.set("status", statusValue)
    }

    setPendente(true)
    try {
      const resultado = await action({}, formData)
      if (resultado?.erro) {
        toast.error(resultado.erro)
      } else if (resultado?.sucesso) {
        toast.success(resultado.sucesso)
        if (resultado.redirectUrl) {
          router.push(resultado.redirectUrl)
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error("[FORM CLIENTE] catch:", msg, err)
      if (!msg.includes("NEXT_REDIRECT")) {
        toast.error("Erro inesperado: " + msg)
      }
    } finally {
      setPendente(false)
    }
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

      <form onSubmit={handleSubmitForm} className="space-y-6">
        {/* Dados Pessoais */}
        <Card id="onborda-cliente-dados">
          <CardHeader>
            <CardTitle>Dados pessoais</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="nome">Nome completo *</FieldLabel>
              <Input
                id="nome"
                name="nome"
                placeholder="Ex: João da Silva"
                value={nomeValue}
                onChange={(e) => setNomeValue(e.target.value)}
                className={erros.nome ? "border-destructive" : ""}
              />
              {erros.nome && <FieldError>{erros.nome}</FieldError>}
            </Field>

            <Field>
              <FieldLabel htmlFor="cpf_cnpj">CPF / CNPJ</FieldLabel>
              <InputCpfCnpj
                id="cpf_cnpj"
                name="cpf_cnpj"
                placeholder="000.000.000-00"
                defaultValue={cliente?.cpf_cnpj ?? ""}
              />
            </Field>
          </CardContent>
        </Card>

        {/* Contato */}
        <Card>
          <CardHeader>
            <CardTitle>Contato</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="joao@email.com"
                defaultValue={cliente?.email ?? ""}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="telefone">Telefone</FieldLabel>
              <InputTelefone
                id="telefone"
                name="telefone"
                placeholder="(11) 99999-9999"
                defaultValue={cliente?.telefone ?? ""}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="whatsapp">WhatsApp</FieldLabel>
              <InputTelefone
                id="whatsapp"
                name="whatsapp"
                placeholder="(11) 99999-9999"
                defaultValue={cliente?.whatsapp ?? ""}
              />
            </Field>
          </CardContent>
        </Card>

        {/* Classificação */}
        <Card>
          <CardHeader>
            <CardTitle>Classificação</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="tipo">Tipo *</FieldLabel>
              <Select
                value={tipoValue}
                onValueChange={(v) => v && setTipoValue(v)}
              >
                <SelectTrigger className={`w-full ${erros.tipo ? "border-destructive" : ""}`}>
                  <SelectValue placeholder="Selecione o tipo">{tipoValue ? opcoesTipo.find(o => o.value === tipoValue)?.label : null}</SelectValue>
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false}>
                  {opcoesTipo.map((opcao) => (
                    <SelectItem key={opcao.value} value={opcao.value}>
                      {opcao.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {erros.tipo && <FieldError>{erros.tipo}</FieldError>}
            </Field>

            <Field>
              <FieldLabel htmlFor="origem">Origem</FieldLabel>
              <Select
                value={origemValue}
                onValueChange={(v) => v && setOrigemValue(v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione a origem">{origemValue ? opcoesOrigem.find(o => o.value === origemValue)?.label : null}</SelectValue>
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false}>
                  {opcoesOrigem.map((opcao) => (
                    <SelectItem key={opcao.value} value={opcao.value}>
                      {opcao.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {editando && (
              <Field>
                <FieldLabel htmlFor="status">Status</FieldLabel>
                <Select value={statusValue} onValueChange={(v) => v && setStatusValue(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o status">{statusValue ? opcoesStatus.find(o => o.value === statusValue)?.label : null}</SelectValue>
                  </SelectTrigger>
                  <SelectContent alignItemWithTrigger={false}>
                    {opcoesStatus.map((opcao) => (
                      <SelectItem key={opcao.value} value={opcao.value}>
                        {opcao.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}

            <Field className="sm:col-span-2">
              <FieldLabel htmlFor="observacoes">Observações</FieldLabel>
              <Textarea
                id="observacoes"
                name="observacoes"
                placeholder="Notas sobre o cliente..."
                rows={3}
                defaultValue={cliente?.observacoes ?? ""}
              />
            </Field>
          </CardContent>
        </Card>

        {/* Ações */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" render={<Link href="/clientes" />}>
            Cancelar
          </Button>
          <Button type="submit" disabled={pendente} id="onborda-cliente-salvar">
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
