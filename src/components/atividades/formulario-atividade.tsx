"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
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
import { Field, FieldLabel } from "@/components/ui/field"
import { ComboboxCampo } from "@/components/ui/combobox-campo"
import { criarClienteBrowser } from "@/lib/supabase/client"
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
type ImovelSimples = { id: string; titulo: string; codigo_interno: string }

// Tipos de atividade padrão (usado quando a tabela tipos_atividade não existe no banco)
const TIPOS_ATIVIDADE_PADRAO = [
  { slug: "visita", nome: "Visita", cor: "#3b82f6" },
  { slug: "ligacao", nome: "Ligação", cor: "#22c55e" },
  { slug: "email", nome: "Email", cor: "#f59e0b" },
  { slug: "reuniao", nome: "Reunião", cor: "#8b5cf6" },
  { slug: "follow_up", nome: "Follow-up", cor: "#ec4899" },
  { slug: "proposta", nome: "Proposta", cor: "#06b6d4" },
  { slug: "outro", nome: "Outro", cor: "#6b7280" },
]

// Formatar data para input datetime-local
function formatarParaInput(data: string | null | undefined) {
  if (!data) return ""
  return new Date(data).toISOString().slice(0, 16)
}

export function FormularioAtividade({ atividade, valoresIniciais }: FormularioAtividadeProps) {
  const editando = !!atividade
  const action = editando ? atualizarAtividade : criarAtividade
  const router = useRouter()

  // Acessar data_vencimento com fallback para data_vencimento (DB pode ter nomes diferentes)
  const atv = atividade as (AtividadeComRelacoes & Record<string, unknown>) | null | undefined

  const [tipoValue, setTipoValue] = useState(atividade?.tipo ?? valoresIniciais?.tipo ?? "")
  const [prioridadeValue, setPrioridadeValue] = useState(atividade?.prioridade ?? "media")
  const [clienteId, setClienteId] = useState(atividade?.cliente_id ?? "")
  const [negocioId, setNegocioId] = useState(atividade?.negocio_id ?? valoresIniciais?.negocio_id ?? "")
  const [imovelId, setImovelId] = useState(atividade?.imovel_id ?? "")
  const [pendente, setPendente] = useState(false)
  const [clientes, setClientes] = useState<ClienteSimples[]>([])
  const [negocios, setNegocios] = useState<NegocioSimples[]>([])
  const [imoveis, setImoveis] = useState<ImovelSimples[]>([])
  const [carregandoDados, setCarregandoDados] = useState(true)

  // Tipos de atividade — carrega do banco ou usa fallback
  const [tipos, setTipos] = useState(TIPOS_ATIVIDADE_PADRAO)

  useEffect(() => {
    const supabase = criarClienteBrowser()

    async function carregar() {
      // Tentar carregar tipos de atividade do banco (pode não existir)
      const resTipos = await supabase
        .from("tipos_atividade")
        .select("slug, nome, cor")
        .eq("ativo", true)
        .order("ordem", { ascending: true })

      if (resTipos.data?.length) {
        setTipos(resTipos.data as typeof TIPOS_ATIVIDADE_PADRAO)
      }

      // Carregar dados para os combobox
      const [resClientes, resNegocios, resImoveis] = await Promise.all([
        supabase
          .from("clientes")
          .select("id, nome")
          .eq("status", "ativo")
          .order("nome"),
        supabase
          .from("negocios")
          .select("id, titulo")
          .eq("status", "aberto")
          .order("titulo"),
        supabase
          .from("imoveis")
          .select("id, titulo, codigo_interno")
          .in("status", ["disponivel", "reservado"])
          .order("codigo_interno"),
      ])

      setClientes((resClientes.data as ClienteSimples[]) || [])
      setNegocios((resNegocios.data as NegocioSimples[]) || [])
      setImoveis((resImoveis.data as ImovelSimples[]) || [])
      setCarregandoDados(false)
    }

    carregar()
  }, [])

  async function handleAction(formData: FormData) {
    // Adicionar campos de Select e Combobox (não são inputs nativos)
    formData.set("tipo", tipoValue)
    formData.set("prioridade", prioridadeValue)
    if (clienteId) formData.set("cliente_id", clienteId)
    if (negocioId) formData.set("negocio_id", negocioId)
    if (imovelId) formData.set("imovel_id", imovelId)
    if (editando) formData.set("id", atividade.id)

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

  return (
    <form action={handleAction} className="space-y-6">
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
                name="titulo"
                placeholder="Ex: Visita ao apto 3Q com João"
                defaultValue={atividade?.titulo ?? valoresIniciais?.titulo ?? ""}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="tipo">Tipo *</FieldLabel>
              <Select value={tipoValue} onValueChange={(v) => v && setTipoValue(v)}>
                <SelectTrigger id="tipo">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {tipos.map((tipo) => (
                    <SelectItem key={tipo.slug} value={tipo.slug}>
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
            </Field>

            <Field>
              <FieldLabel htmlFor="prioridade">Prioridade</FieldLabel>
              <Select value={prioridadeValue} onValueChange={(v) => v && setPrioridadeValue(v)}>
                <SelectTrigger id="prioridade">
                  <SelectValue placeholder="Média" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor="data_vencimento">Data e Hora *</FieldLabel>
              <Input
                id="data_vencimento"
                name="data_vencimento"
                type="datetime-local"
                defaultValue={formatarParaInput(
                  (atv?.data_vencimento as string) ?? (atv?.data_vencimento as string) ?? null
                )}
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
              <ComboboxCampo
                opcoes={clientes.map((c) => ({ value: c.id, label: c.nome }))}
                value={clienteId}
                onChange={setClienteId}
                placeholder="Selecionar cliente..."
                placeholderBusca="Buscar por nome..."
                permitirVazio
                labelVazio="Nenhum"
              />
            </Field>

            <Field>
              <FieldLabel>Negócio</FieldLabel>
              <ComboboxCampo
                opcoes={negocios.map((n) => ({ value: n.id, label: n.titulo }))}
                value={negocioId}
                onChange={setNegocioId}
                placeholder="Selecionar negócio..."
                placeholderBusca="Buscar por título..."
                permitirVazio
                labelVazio="Nenhum"
              />
            </Field>

            <Field>
              <FieldLabel>Imóvel</FieldLabel>
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

      {/* Descrição */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Descrição</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            id="descricao"
            name="descricao"
            placeholder="Detalhes sobre a atividade..."
            rows={4}
            defaultValue={atividade?.descricao ?? ""}
          />
        </CardContent>
      </Card>

      {/* Botão submit */}
      <div className="flex justify-end">
        <Button type="submit" disabled={pendente || carregandoDados} size="lg">
          {carregandoDados
            ? "Carregando..."
            : pendente
              ? "Salvando..."
              : editando
                ? "Salvar Alterações"
                : "Criar Atividade"}
        </Button>
      </div>
    </form>
  )
}
