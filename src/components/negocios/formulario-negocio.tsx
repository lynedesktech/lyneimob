"use client"

import { useActionState, useEffect, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { criarNegocio, atualizarNegocio } from "@/actions/negocios"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  }, [estado])

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
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="titulo">Título *</Label>
              <Input
                id="titulo"
                placeholder="Ex: Venda apto 3Q - João Silva"
                {...register("titulo")}
                aria-invalid={!!errors.titulo}
              />
              {errors.titulo && (
                <p className="text-xs text-destructive">{errors.titulo.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo *</Label>
              <Controller
                name="tipo"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
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
              {errors.tipo && (
                <p className="text-xs text-destructive">{errors.tipo.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor">Valor (R$)</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                placeholder="0,00"
                {...register("valor")}
                aria-invalid={!!errors.valor}
              />
              {errors.valor && (
                <p className="text-xs text-destructive">{errors.valor.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="etapa_id">Etapa do Pipeline *</Label>
              <Controller
                name="etapa_id"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
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
              {errors.etapa_id && (
                <p className="text-xs text-destructive">{errors.etapa_id.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="previsao_fechamento">Previsão de Fechamento</Label>
              <Input
                id="previsao_fechamento"
                type="date"
                {...register("previsao_fechamento")}
              />
            </div>
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
            <div className="space-y-2">
              <Label htmlFor="cliente_id">Cliente *</Label>
              <Controller
                name="cliente_id"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="cliente_id" aria-invalid={!!errors.cliente_id}>
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientes.map((cliente) => (
                        <SelectItem key={cliente.id} value={cliente.id}>
                          {cliente.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.cliente_id && (
                <p className="text-xs text-destructive">{errors.cliente_id.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="imovel_id">Imóvel (opcional)</Label>
              <Controller
                name="imovel_id"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="imovel_id">
                      <SelectValue placeholder="Selecione um imóvel" />
                    </SelectTrigger>
                    <SelectContent>
                      {imoveis.map((imovel) => (
                        <SelectItem key={imovel.id} value={imovel.id}>
                          {imovel.codigo} — {imovel.titulo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
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
