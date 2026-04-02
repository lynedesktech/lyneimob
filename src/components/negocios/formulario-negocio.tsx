"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import Link from "next/link"
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
import { InputMonetario } from "@/components/ui/input-monetario"
import { ComboboxCampo } from "@/components/ui/combobox-campo"
import { labelsTipoNegocio } from "@/lib/constantes"
import { criarClienteBrowser } from "@/lib/supabase/client"
import type { NegocioComRelacoes } from "@/types/database"

interface FormularioNegocioProps {
  negocio?: NegocioComRelacoes | null
}

type ClienteSimples = { id: string; nome: string }
type ImovelSimples = { id: string; titulo: string; codigo_interno: string }
type EtapaSimples = { id: string; nome: string; cor: string; tipo: string; ordem: number }

export function FormularioNegocio({ negocio }: FormularioNegocioProps) {
  const editando = !!negocio
  const action = editando ? atualizarNegocio : criarNegocio
  const router = useRouter()

  const [tituloValue, setTituloValue] = useState(negocio?.titulo ?? "")
  const [tipoValue, setTipoValue] = useState(negocio?.tipo ?? "")
  const [etapaId, setEtapaId] = useState(negocio?.etapa_id ?? "")
  const [clienteId, setClienteId] = useState(negocio?.cliente_id ?? "")
  const [imovelId, setImovelId] = useState(negocio?.imovel_id ?? "")
  const [valorMonetario, setValorMonetario] = useState<number | null>(negocio?.valor ?? null)
  const [pendente, setPendente] = useState(false)
  const [clientes, setClientes] = useState<ClienteSimples[]>([])
  const [imoveis, setImoveis] = useState<ImovelSimples[]>([])
  const [etapas, setEtapas] = useState<EtapaSimples[]>([])
  const [carregandoDados, setCarregandoDados] = useState(true)

  // Carregar dados para os selects
  useEffect(() => {
    const supabase = criarClienteBrowser()

    async function carregar() {
      const [resClientes, resImoveis, resEtapas] = await Promise.all([
        supabase
          .from("clientes")
          .select("id, nome")
          .eq("status", "ativo")
          .order("nome"),
        supabase
          .from("imoveis")
          .select("id, titulo, codigo_interno")
          .in("status", ["disponivel", "reservado"])
          .order("codigo_interno"),
        supabase
          .from("pipeline_etapas")
          .select("id, nome, cor, tipo, ordem")
          .order("ordem", { ascending: true }),
      ])

      setClientes((resClientes.data as ClienteSimples[]) || [])
      setImoveis((resImoveis.data as ImovelSimples[]) || [])

      const etapasCarregadas = (resEtapas.data as EtapaSimples[]) || []
      setEtapas(etapasCarregadas)

      // Se não está editando e não tem etapa selecionada, selecionar a primeira etapa normal
      if (!editando && !etapaId && etapasCarregadas.length > 0) {
        const primeiraNormal = etapasCarregadas.find((e) => e.tipo === "normal")
        if (primeiraNormal) {
          setEtapaId(primeiraNormal.id)
        }
      }

      setCarregandoDados(false)
    }

    carregar()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleAction(formData: FormData) {
    // Adicionar campos de Select e Combobox (não são inputs nativos)
    formData.set("tipo", tipoValue)
    formData.set("etapa_id", etapaId)
    formData.set("cliente_id", clienteId)
    if (imovelId) formData.set("imovel_id", imovelId)
    if (editando) formData.set("id", negocio.id)
    // O valor já vem do hidden input do InputMonetario via name="valor"

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
      if (!msg.includes("NEXT_REDIRECT")) {
        toast.error("Erro inesperado: " + msg)
      }
    } finally {
      setPendente(false)
    }
  }

  const [erros, setErros] = useState<Record<string, string>>({})

  function handleSubmitForm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const novosErros: Record<string, string> = {}
    const formData = new FormData(e.currentTarget)

    if (!tituloValue.trim()) novosErros.titulo = "Campo obrigatório"
    if (!tipoValue) novosErros.tipo = "Campo obrigatório"
    if (!etapaId) novosErros.etapa_id = "Campo obrigatório"
    if (!clienteId) novosErros.cliente_id = "Campo obrigatório"

    if (Object.keys(novosErros).length > 0) {
      setErros(novosErros)
      return
    }

    setErros({})
    handleAction(formData)
  }

  // Filtrar etapas normais para o select (não mostrar ganho/perdido na criação)
  const etapasNormais = etapas.filter((e) => e.tipo === "normal")

  return (
    <form onSubmit={handleSubmitForm} className="space-y-6">
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
                name="titulo"
                placeholder="Ex: Venda apto 3Q - João Silva"
                value={tituloValue}
                onChange={(e) => setTituloValue(e.target.value)}
                className={erros.titulo ? "border-destructive" : ""}
              />
              {erros.titulo && <FieldError>{erros.titulo}</FieldError>}
            </Field>

            <Field>
              <FieldLabel htmlFor="tipo">Tipo *</FieldLabel>
              <Select
                value={tipoValue}
                onValueChange={(v) => v && setTipoValue(v)}
              >
                <SelectTrigger id="tipo" className={erros.tipo ? "border-destructive" : ""}>
                  <SelectValue placeholder="Selecione">{tipoValue ? labelsTipoNegocio[tipoValue] : null}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(labelsTipoNegocio).map(([valor, label]) => (
                    <SelectItem key={valor} value={valor}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {erros.tipo && <FieldError>{erros.tipo}</FieldError>}
            </Field>

            <Field>
              <FieldLabel htmlFor="valor">Valor</FieldLabel>
              <InputMonetario
                id="valor"
                name="valor"
                valor={valorMonetario}
                onValorChange={setValorMonetario}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="etapa_id">Etapa *</FieldLabel>
              <Select
                value={etapaId}
                onValueChange={(v) => v && setEtapaId(v)}
              >
                <SelectTrigger id="etapa_id" className={erros.etapa_id ? "border-destructive" : ""}>
                  <SelectValue placeholder="Selecione a etapa">{etapaId ? etapasNormais.find(e => e.id === etapaId)?.nome : null}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {etapasNormais.map((etapa) => (
                    <SelectItem key={etapa.id} value={etapa.id}>
                      {etapa.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {erros.etapa_id && <FieldError>{erros.etapa_id}</FieldError>}
            </Field>

            <Field>
              <FieldLabel htmlFor="previsao_fechamento">Previsão de Fechamento</FieldLabel>
              <Input
                id="previsao_fechamento"
                name="previsao_fechamento"
                type="date"
                defaultValue={negocio?.previsao_fechamento ?? ""}
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
              <ComboboxCampo
                opcoes={clientes.map((c) => ({ value: c.id, label: c.nome }))}
                value={clienteId}
                onChange={setClienteId}
                placeholder="Selecionar cliente..."
                placeholderBusca="Buscar por nome..."
                className={erros.cliente_id ? "border-destructive" : ""}
              />
              {erros.cliente_id && <FieldError>{erros.cliente_id}</FieldError>}
            </Field>

            <Field>
              <FieldLabel>Imóvel (opcional)</FieldLabel>
              <ComboboxCampo
                opcoes={imoveis.map((i) => ({ value: i.id, label: `${i.codigo_interno} — ${i.titulo}` }))}
                value={imovelId}
                onChange={setImovelId}
                placeholder="Selecionar imóvel..."
                placeholderBusca="Buscar por código ou título..."
                permitirVazio
                labelVazio="Nenhum"
              />
            </Field>
          </div>
        </CardContent>
      </Card>

      {/* Notas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Notas</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            id="observacoes"
            name="observacoes"
            placeholder="Anotações internas sobre o negócio..."
            rows={4}
            defaultValue={negocio?.observacoes ?? ""}
          />
        </CardContent>
      </Card>

      {/* Ações */}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="lg" render={<Link href="/negocios" />}>
          Cancelar
        </Button>
        <Button type="submit" disabled={pendente || carregandoDados} size="lg">
          {carregandoDados
            ? "Carregando..."
            : pendente
              ? "Salvando..."
              : editando
                ? "Salvar Alterações"
                : "Criar Negócio"}
        </Button>
      </div>
    </form>
  )
}
