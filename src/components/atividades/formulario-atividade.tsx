"use client"

import { useActionState, useEffect, useState } from "react"
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

export function FormularioAtividade({ atividade, valoresIniciais }: FormularioAtividadeProps) {
  const editando = !!atividade
  const action = editando ? atualizarAtividade : criarAtividade

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

  // Formatar data para input datetime-local
  const formatarParaInput = (data: string | null) => {
    if (!data) return ""
    return new Date(data).toISOString().slice(0, 16)
  }

  return (
    <form action={formAction} className="space-y-6">
      {editando && <input type="hidden" name="id" value={atividade.id} />}

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
                name="titulo"
                placeholder="Ex: Visita ao apto 3Q com João"
                defaultValue={atividade?.titulo || valoresIniciais?.titulo || ""}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo *</Label>
              <Select name="tipo" defaultValue={atividade?.tipo || valoresIniciais?.tipo || ""}>
                <SelectTrigger id="tipo">
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="prioridade">Prioridade</Label>
              <Select name="prioridade" defaultValue={atividade?.prioridade || "media"}>
                <SelectTrigger id="prioridade">
                  <SelectValue placeholder="Média" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_inicio">Data e Hora *</Label>
              <Input
                id="data_inicio"
                name="data_inicio"
                type="datetime-local"
                defaultValue={formatarParaInput(atividade?.data_inicio ?? null)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_fim">Término (opcional)</Label>
              <Input
                id="data_fim"
                name="data_fim"
                type="datetime-local"
                defaultValue={formatarParaInput(atividade?.data_fim ?? null)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lembrete">Lembrete por email (opcional)</Label>
              <Input
                id="lembrete"
                name="lembrete"
                type="datetime-local"
                defaultValue={formatarParaInput(atividade?.lembrete ?? null)}
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
              <Select
                name="cliente_id"
                defaultValue={atividade?.cliente_id || ""}
              >
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="negocio_id">Negócio</Label>
              <Select
                name="negocio_id"
                defaultValue={atividade?.negocio_id || valoresIniciais?.negocio_id || ""}
              >
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="imovel_id">Imóvel</Label>
              <Select
                name="imovel_id"
                defaultValue={atividade?.imovel_id || ""}
              >
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
            name="descricao"
            placeholder="Detalhes sobre a atividade..."
            rows={4}
            defaultValue={atividade?.descricao || ""}
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
