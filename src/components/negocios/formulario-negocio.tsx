"use client"

import { useActionState, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { criarNegocio, atualizarNegocio } from "@/actions/negocios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldLabel, FieldError } from "@/components/ui/field"
import { InputGroup, InputGroupAddon, InputGroupText, InputGroupInput } from "@/components/ui/input-group"
import { ComboboxCampo } from "@/components/ui/combobox-campo"
import { labelsTipoNegocio } from "@/lib/constantes"
import { criarClienteBrowser } from "@/lib/supabase/client"
import { schemaCriarNegocio } from "@/types/negocios"
import type { CriarNegocioInput } from "@/types/negocios"
import type { NegocioComRelacoes, PipelineEtapa } from "@/types/database"

interface FormularioNegocioProps {
  negocio?: NegocioComRelacoes | null
}

type ClienteSimples = { id: string; nome: string }
type ImovelSimples = { id: string; titulo: string; codigo: string }

export function FormularioNegocio({ negocio }: FormularioNegocioProps) {
  const editando = !!negocio
  const action = editando ? atualizarNegocio : criarNegocio
  const router = useRouter()

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CriarNegocioInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schemaCriarNegocio) as any,
    defaultValues: {
      titulo: negocio?.titulo || "",
      tipo: (negocio?.tipo || "") as CriarNegocioInput["tipo"],
      valor: negocio?.valor ?? undefined,
      etapa_id: negocio?.etapa_id || "",
      cliente_id: negocio?.cliente_id || "",
      imovel_id: negocio?.imovel_id || "",
      previsao_fechamento: negocio?.previsao_fechamento || "",
      observacoes: negocio?.observacoes || "",
    },
  })

  const [estado, formAction, pendente] = useActionState(action, {})
  const [clientes, setClientes] = useState<ClienteSimples[]>([])
  const [imoveis, setImoveis] = useState<ImovelSimples[]>([])
  const [etapas, setEtapas] = useState<PipelineEtapa[]>([])

  // Carregar dados para os selects
  useEffect(() => {
    const supabase = criarClienteBrowser()

    async function carregar() {
      const [resClientes, resImoveis, resEtapas] = await Promise.all([
        supabase
          .from("clientes")
          .select("id, nome")
          .in("status", ["ativo", "negociando"])
          .order("nome"),
        supabase
          .from("imoveis")
          .select("id, titulo, codigo")
          .in("status", ["disponivel", "reservado"])
          .order("codigo"),
        supabase
          .from("pipeline_etapas")
          .select("*")
          .eq("tipo", "normal")
          .order("ordem"),
      ])

      setClientes((resClientes.data as ClienteSimples[]) || [])
      setImoveis((resImoveis.data as ImovelSimples[]) || [])
      setEtapas((resEtapas.data as PipelineEtapa[]) || [])
    }

    carregar()
  }, [])

  useEffect(() => {
    if (estado.erro) toast.error(estado.erro)
    if (estado.sucesso && estado.id) {
      toast.success(estado.sucesso)
      router.push(`/negocios/${estado.id}`)
    }
  }, [estado, router])

  function onSubmit(dados: CriarNegocioInput) {
    const formData = new FormData()
    if (editando) formData.set("id", negocio.id)
    formData.set("titulo", dados.titulo)
    formData.set("tipo", dados.tipo)
    formData.set("cliente_id", dados.cliente_id)
    formData.set("etapa_id", dados.etapa_id)
    if (dados.imovel_id) formData.set("imovel_id", dados.imovel_id)
    if (dados.valor !== undefined) formData.set("valor", String(dados.valor))
    if (dados.previsao_fechamento) formData.set("previsao_fechamento", dados.previsao_fechamento)
    if (dados.observacoes) formData.set("observacoes", dados.observacoes)
    formAction(formData)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Dados do negócio */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dados do Negócio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field className="sm:col-span-2">
              <FieldLabel htmlFor="titulo">Título *</FieldLabel>
              <Input
                id="titulo"
                placeholder="Ex: Venda apto 3Q - João Silva"
                {...register("titulo")}
                aria-invalid={!!errors.titulo}
              />
              <FieldError errors={[errors.titulo]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="tipo">Tipo *</FieldLabel>
              <Controller
                name="tipo"
                control={control}
                render={({ field }) => (
                  <Select value={field.value ?? ""} onValueChange={field.onChange}>
                    <SelectTrigger id="tipo" aria-invalid={!!errors.tipo}>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(labelsTipoNegocio).map(([valor, label]) => (
                        <SelectItem key={valor} value={valor}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={[errors.tipo]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="valor">Valor</FieldLabel>
              <InputGroup>
                <InputGroupAddon>
                  <InputGroupText>R$</InputGroupText>
                </InputGroupAddon>
                <InputGroupInput
                  id="valor"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  {...register("valor")}
                  aria-invalid={!!errors.valor}
                />
              </InputGroup>
              <FieldError errors={[errors.valor]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="etapa_id">Etapa do Pipeline *</FieldLabel>
              <Controller
                name="etapa_id"
                control={control}
                render={({ field }) => (
                  <Select value={field.value ?? ""} onValueChange={field.onChange}>
                    <SelectTrigger id="etapa_id" aria-invalid={!!errors.etapa_id}>
                      <SelectValue placeholder="Selecione a etapa" />
                    </SelectTrigger>
                    <SelectContent>
                      {etapas.map((etapa) => (
                        <SelectItem key={etapa.id} value={etapa.id}>
                          {etapa.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={[errors.etapa_id]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="previsao_fechamento">Previsão de Fechamento</FieldLabel>
              <Input
                id="previsao_fechamento"
                type="date"
                {...register("previsao_fechamento")}
              />
            </Field>
          </div>
        </CardContent>
      </Card>

      {/* Vinculações */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Vinculações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel>Cliente *</FieldLabel>
              <Controller
                name="cliente_id"
                control={control}
                render={({ field }) => (
                  <ComboboxCampo
                    opcoes={clientes.map((c) => ({ value: c.id, label: c.nome }))}
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    placeholder="Selecionar cliente..."
                    placeholderBusca="Buscar por nome..."
                  />
                )}
              />
              <FieldError errors={[errors.cliente_id]} />
            </Field>

            <Field>
              <FieldLabel>Imóvel (opcional)</FieldLabel>
              <Controller
                name="imovel_id"
                control={control}
                render={({ field }) => (
                  <ComboboxCampo
                    opcoes={imoveis.map((i) => ({ value: i.id, label: `${i.codigo} — ${i.titulo}` }))}
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    placeholder="Selecionar imóvel..."
                    placeholderBusca="Buscar por código ou título..."
                    permitirVazio
                    labelVazio="Nenhum"
                  />
                )}
              />
            </Field>
          </div>
        </CardContent>
      </Card>

      {/* Observações */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Observações</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Anotações internas sobre o negócio..."
            rows={4}
            {...register("observacoes")}
          />
        </CardContent>
      </Card>

      {/* Botão submit */}
      <div className="flex justify-end">
        <Button type="submit" disabled={pendente} size="lg">
          {pendente
            ? "Salvando..."
            : editando
              ? "Salvar Alterações"
              : "Criar Negócio"}
        </Button>
      </div>
    </form>
  )
}
