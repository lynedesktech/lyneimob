"use client"

import { useActionState, useEffect, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { criarAtividade, atualizarAtividade } from "@/actions/atividades"
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
import { criarClienteBrowser } from "@/lib/supabase/client"
import { labelsTipoAtividade } from "@/lib/constantes"
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

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CriarAtividadeInput>({
    resolver: zodResolver(schemaCriarAtividade),
    defaultValues: {
      titulo: atividade?.titulo || valoresIniciais?.titulo || "",
      tipo: (atividade?.tipo || valoresIniciais?.tipo || "") as CriarAtividadeInput["tipo"],
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
  }, [estado])

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
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="titulo">Título *</Label>
              <Input
                id="titulo"
                placeholder="Ex: Visita ao apto 3Q com João"
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
                      {Object.entries(labelsTipoAtividade).map(([valor, label]) => (
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
              <Label htmlFor="prioridade">Prioridade</Label>
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
              {errors.prioridade && (
                <p className="text-xs text-destructive">{errors.prioridade.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_inicio">Data e Hora *</Label>
              <Input
                id="data_inicio"
                type="datetime-local"
                {...register("data_inicio")}
                aria-invalid={!!errors.data_inicio}
              />
              {errors.data_inicio && (
                <p className="text-xs text-destructive">{errors.data_inicio.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_fim">Término (opcional)</Label>
              <Input
                id="data_fim"
                type="datetime-local"
                {...register("data_fim")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lembrete">Lembrete por email (opcional)</Label>
              <Input
                id="lembrete"
                type="datetime-local"
                {...register("lembrete")}
              />
            </div>
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
            <div className="space-y-2">
              <Label htmlFor="cliente_id">Cliente</Label>
              <Controller
                name="cliente_id"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="cliente_id">
                      <SelectValue placeholder="Nenhum" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nenhum</SelectItem>
                      {clientes.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="negocio_id">Negócio</Label>
              <Controller
                name="negocio_id"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="negocio_id">
                      <SelectValue placeholder="Nenhum" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nenhum</SelectItem>
                      {negocios.map((n) => (
                        <SelectItem key={n.id} value={n.id}>
                          {n.titulo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="imovel_id">Imóvel</Label>
              <Controller
                name="imovel_id"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="imovel_id">
                      <SelectValue placeholder="Nenhum" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nenhum</SelectItem>
                      {imoveis.map((i) => (
                        <SelectItem key={i.id} value={i.id}>
                          {i.codigo} — {i.titulo}
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
