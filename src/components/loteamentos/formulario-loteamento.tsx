"use client"

import { useActionState, useEffect, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import Link from "next/link"
import { criarLoteamento, atualizarLoteamento } from "@/actions/loteamentos"
import { schemaCriarLoteamento } from "@/types/loteamentos"
import type { CriarLoteamentoInput } from "@/types/loteamentos"
import type { Loteamento } from "@/types/database"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Globe } from "lucide-react"
import { labelsStatusLoteamento, opcoesDeLabels } from "@/lib/constantes"

const opcoesStatus = opcoesDeLabels(labelsStatusLoteamento)

const estados = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO",
]

type FormularioLoteamentoProps = {
  loteamento?: Loteamento
}

export function FormularioLoteamento({ loteamento }: FormularioLoteamentoProps) {
  const editando = !!loteamento
  const action = editando ? atualizarLoteamento : criarLoteamento

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CriarLoteamentoInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schemaCriarLoteamento) as any,
    defaultValues: {
      nome: loteamento?.nome ?? "",
      descricao: loteamento?.descricao ?? "",
      status: (loteamento?.status ?? "em_vendas") as CriarLoteamentoInput["status"],
      cep: loteamento?.cep ?? "",
      logradouro: loteamento?.logradouro ?? "",
      numero: loteamento?.numero ?? "",
      complemento: loteamento?.complemento ?? "",
      bairro: loteamento?.bairro ?? "",
      cidade: loteamento?.cidade ?? "",
      estado: loteamento?.estado ?? "",
      publicar_site: loteamento?.publicar_site ?? true,
      observacoes_internas: loteamento?.observacoes_internas ?? "",
    },
  })

  const [statusValue, setStatusValue] = useState(loteamento?.status ?? "em_vendas")
  const [retorno, formAction, pendente] = useActionState(action, {})

  useEffect(() => {
    if (retorno.erro) toast.error(retorno.erro)
  }, [retorno])

  function onSubmit(dados: CriarLoteamentoInput) {
    const formData = new FormData()
    if (editando) formData.set("id", loteamento.id)
    formData.set("nome", dados.nome)
    formData.set("cidade", dados.cidade)
    formData.set("estado", dados.estado)
    if (dados.descricao) formData.set("descricao", dados.descricao)
    if (dados.cep) formData.set("cep", dados.cep)
    if (dados.logradouro) formData.set("logradouro", dados.logradouro)
    if (dados.numero) formData.set("numero", dados.numero)
    if (dados.complemento) formData.set("complemento", dados.complemento)
    if (dados.bairro) formData.set("bairro", dados.bairro)
    if (dados.observacoes_internas) formData.set("observacoes_internas", dados.observacoes_internas)
    formData.set("publicar_site", dados.publicar_site ? "on" : "")
    if (editando) formData.set("status", statusValue)
    formAction(formData)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" render={<Link href="/loteamentos" />}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {loteamento ? "Editar loteamento" : "Novo loteamento"}
          </h1>
          <p className="text-muted-foreground">
            {loteamento
              ? "Atualize as informações do loteamento"
              : "Preencha os dados para cadastrar um novo loteamento"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Dados Básicos */}
        <Card>
          <CardHeader>
            <CardTitle>Dados básicos</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field className="sm:col-span-2">
              <FieldLabel htmlFor="nome">Nome do loteamento *</FieldLabel>
              <Input
                id="nome"
                placeholder="Ex: Reserva Mar"
                {...register("nome")}
                aria-invalid={!!errors.nome}
              />
              <FieldError errors={[errors.nome]} />
            </Field>

            {editando && (
              <Field>
                <FieldLabel htmlFor="status">Status</FieldLabel>
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
              </Field>
            )}

            <Field className="sm:col-span-2">
              <FieldLabel htmlFor="descricao">Descrição</FieldLabel>
              <Textarea
                id="descricao"
                placeholder="Descreva o loteamento em detalhes..."
                rows={4}
                {...register("descricao")}
              />
            </Field>
          </CardContent>
        </Card>

        {/* Endereço */}
        <Card>
          <CardHeader>
            <CardTitle>Endereço</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field>
              <FieldLabel htmlFor="cep">CEP</FieldLabel>
              <Input
                id="cep"
                placeholder="00000-000"
                {...register("cep")}
              />
            </Field>

            <Field className="sm:col-span-2">
              <FieldLabel htmlFor="logradouro">Logradouro</FieldLabel>
              <Input
                id="logradouro"
                placeholder="Rua, Avenida, etc."
                {...register("logradouro")}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="numero">Número</FieldLabel>
              <Input
                id="numero"
                placeholder="123"
                {...register("numero")}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="complemento">Complemento</FieldLabel>
              <Input
                id="complemento"
                placeholder="Bloco A"
                {...register("complemento")}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="bairro">Bairro</FieldLabel>
              <Input
                id="bairro"
                placeholder="Centro"
                {...register("bairro")}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="cidade">Cidade *</FieldLabel>
              <Input
                id="cidade"
                placeholder="São Paulo"
                {...register("cidade")}
                aria-invalid={!!errors.cidade}
              />
              <FieldError errors={[errors.cidade]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="estado_uf">Estado *</FieldLabel>
              <Controller
                name="estado"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full" aria-invalid={!!errors.estado}>
                      <SelectValue placeholder="UF" />
                    </SelectTrigger>
                    <SelectContent>
                      {estados.map((uf) => (
                        <SelectItem key={uf} value={uf}>
                          {uf}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={[errors.estado]} />
            </Field>
          </CardContent>
        </Card>

        {/* Observações */}
        <Card>
          <CardHeader>
            <CardTitle>Observações internas</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              id="observacoes_internas"
              placeholder="Notas privadas sobre o loteamento (só visíveis para sua equipe)..."
              rows={3}
              {...register("observacoes_internas")}
            />
          </CardContent>
        </Card>

        {/* Publicação */}
        <Card>
          <CardHeader>
            <CardTitle>Publicação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Escolha se este loteamento ficará visível no site público da imobiliária.
            </p>
            <label className="flex items-center gap-3 cursor-pointer">
              <Controller
                name="publicar_site"
                control={control}
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Site público</p>
                  <p className="text-xs text-muted-foreground">Aparece no site da imobiliária</p>
                </div>
              </div>
            </label>
          </CardContent>
        </Card>

        {/* Ações */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" render={<Link href="/loteamentos" />}>
            Cancelar
          </Button>
          <Button type="submit" disabled={pendente}>
            {pendente
              ? loteamento
                ? "Salvando..."
                : "Cadastrando..."
              : loteamento
                ? "Salvar alterações"
                : "Cadastrar loteamento"}
          </Button>
        </div>
      </form>
    </div>
  )
}
