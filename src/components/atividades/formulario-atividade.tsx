"use client"

import { useActionState, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { criarAtividade, atualizarAtividade } from "@/actions/atividades"
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
import { ComboboxCampo } from "@/components/ui/combobox-campo"
import { criarClienteBrowser } from "@/lib/supabase/client"
import { useTiposAtividade } from "@/hooks/use-tipos-atividade"
import { schemaCriarAtividade } from "@/types/atividades"
import type { CriarAtividadeInput } from "@/types/atividades"
import type { AtividadeComRelacoes } from "@/types/database"

interface ValoresIniciais {
  titulo?: string
  tipo?: string
  negocio_id?: string
}

interface FormularioAtividadeProps {
  atividade?: AtividadeComRelacoes | null
  valoresIniciais?: ValoresIniciais
}

type ClienteSimples = { id: string; nome: string }
type NegocioSimples = { id: string; titulo: string }
type ImovelSimples = { id: string; titulo: string; codigo: string }

// Formatar data para input datetime-local
function formatarParaInput(data: string | null) {
  if (!data) return ""
  return new Date(data).toISOString().slice(0, 16)
}

export function FormularioAtividade({ atividade, valoresIniciais }: FormularioAtividadeProps) {
  const editando = !!atividade
  const action = editando ? atualizarAtividade : criarAtividade
  const router = useRouter()
  const { tipos, carregando: carregandoTipos } = useTiposAtividade()

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CriarAtividadeInput>({
    resolver: zodResolver(schemaCriarAtividade),
    defaultValues: {
      titulo: atividade?.titulo || valoresIniciais?.titulo || "",
      tipo: atividade?.tipo || valoresIniciais?.tipo || "",
      prioridade: (atividade?.prioridade || "media") as CriarAtividadeInput["prioridade"],
      data_inicio: formatarParaInput(atividade?.data_inicio ?? null),
      data_fim: formatarParaInput(atividade?.data_fim ?? null),
      lembrete: formatarParaInput(atividade?.lembrete ?? null),
      descricao: atividade?.descricao || "",
      cliente_id: atividade?.cliente_id || "",
      negocio_id: atividade?.negocio_id || valoresIniciais?.negocio_id || "",
      imovel_id: atividade?.imovel_id || "",
    },
  })

  const [estado, formAction, pendente] = useActionState(action, {})
  const [clientes, setClientes] = useState<ClienteSimples[]>([])
  const [negocios, setNegocios] = useState<NegocioSimples[]>([])
  const [imoveis, setImoveis] = useState<ImovelSimples[]>([])

  useEffect(() => {
    const supabase = criarClienteBrowser()

    async function carregar() {
      const [resClientes, resNegocios, resImoveis] = await Promise.all([
        supabase
          .from("clientes")
          .select("id, nome")
          .in("status", ["ativo", "negociando"])
          .order("nome"),
        supabase
          .from("negocios")
          .select("id, titulo")
          .eq("status", "aberto")
          .order("titulo"),
        supabase
          .from("imoveis")
          .select("id, titulo, codigo")
          .in("status", ["disponivel", "reservado"])
          .order("codigo"),
      ])

      setClientes((resClientes.data as ClienteSimples[]) || [])
      setNegocios((resNegocios.data as NegocioSimples[]) || [])
      setImoveis((resImoveis.data as ImovelSimples[]) || [])
    }

    carregar()
  }, [])

  useEffect(() => {
    if (estado.erro) toast.error(estado.erro)
    if (estado.sucesso && estado.id) {
      toast.success(estado.sucesso)
      router.push(`/atividades/${estado.id}`)
    }
  }, [estado, router])

  function onSubmit(dados: CriarAtividadeInput) {
    const formData = new FormData()
    if (editando) formData.set("id", atividade.id)
    formData.set("titulo", dados.titulo)
    formData.set("tipo", dados.tipo)
    formData.set("prioridade", dados.prioridade)
    formData.set("data_inicio", dados.data_inicio)
    if (dados.data_fim) formData.set("data_fim", dados.data_fim)
    if (dados.descricao) formData.set("descricao", dados.descricao)
    if (dados.cliente_id) formData.set("cliente_id", dados.cliente_id)
    if (dados.negocio_id) formData.set("negocio_id", dados.negocio_id)
    if (dados.imovel_id) formData.set("imovel_id", dados.imovel_id)
    if (dados.lembrete) formData.set("lembrete", dados.lembrete)
    formAction(formData)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Dados da atividade */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dados da Atividade</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field className="sm:col-span-2">
              <FieldLabel htmlFor="titulo">Título *</FieldLabel>
              <Input
                id="titulo"
                placeholder="Ex: Visita ao apto 3Q com João"
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
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="tipo" aria-invalid={!!errors.tipo}>
                      <SelectValue placeholder={carregandoTipos ? "Carregando..." : "Selecione"} />
                    </SelectTrigger>
                    <SelectContent>
                      {tipos.map((tipo) => (
                        <SelectItem key={tipo.id} value={tipo.slug}>
                          <span className="flex items-center gap-2">
                            <span
                              className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: tipo.cor }}
                            />
                            {tipo.nome}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={[errors.tipo]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="prioridade">Prioridade</FieldLabel>
              <Controller
                name="prioridade"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="prioridade" aria-invalid={!!errors.prioridade}>
                      <SelectValue placeholder="Média" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baixa">Baixa</SelectItem>
                      <SelectItem value="media">Média</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={[errors.prioridade]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="data_inicio">Data e Hora *</FieldLabel>
              <Input
                id="data_inicio"
                type="datetime-local"
                {...register("data_inicio")}
                aria-invalid={!!errors.data_inicio}
              />
              <FieldError errors={[errors.data_inicio]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="data_fim">Término (opcional)</FieldLabel>
              <Input
                id="data_fim"
                type="datetime-local"
                {...register("data_fim")}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="lembrete">Lembrete por email (opcional)</FieldLabel>
              <Input
                id="lembrete"
                type="datetime-local"
                {...register("lembrete")}
              />
            </Field>
          </div>
        </CardContent>
      </Card>

      {/* Vinculações */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Vinculações (opcional)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field>
              <FieldLabel>Cliente</FieldLabel>
              <Controller
                name="cliente_id"
                control={control}
                render={({ field }) => (
                  <ComboboxCampo
                    opcoes={clientes.map((c) => ({ value: c.id, label: c.nome }))}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Selecionar cliente..."
                    placeholderBusca="Buscar por nome..."
                    permitirVazio
                    labelVazio="Nenhum"
                  />
                )}
              />
            </Field>

            <Field>
              <FieldLabel>Negócio</FieldLabel>
              <Controller
                name="negocio_id"
                control={control}
                render={({ field }) => (
                  <ComboboxCampo
                    opcoes={negocios.map((n) => ({ value: n.id, label: n.titulo }))}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Selecionar negócio..."
                    placeholderBusca="Buscar por título..."
                    permitirVazio
                    labelVazio="Nenhum"
                  />
                )}
              />
            </Field>

            <Field>
              <FieldLabel>Imóvel</FieldLabel>
              <Controller
                name="imovel_id"
                control={control}
                render={({ field }) => (
                  <ComboboxCampo
                    opcoes={imoveis.map((i) => ({ value: i.id, label: `${i.codigo} — ${i.titulo}` }))}
                    value={field.value}
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

      {/* Descrição */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Descrição</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Detalhes sobre a atividade..."
            rows={4}
            {...register("descricao")}
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
              : "Criar Atividade"}
        </Button>
      </div>
    </form>
  )
}
