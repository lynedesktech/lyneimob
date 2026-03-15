"use client"

import { useActionState, useState } from "react"
import { criarInteresse, excluirInteresse } from "@/actions/clientes"
import type { EstadoFormulario } from "@/types/formulario"
import type { ClienteInteresse } from "@/types/database"
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
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Home, MapPin, DollarSign } from "lucide-react"
import { toast } from "sonner"

const opcoesTipoImovel = [
  { value: "apartamento", label: "Apartamento" },
  { value: "casa", label: "Casa" },
  { value: "terreno", label: "Terreno" },
  { value: "sala_comercial", label: "Sala Comercial" },
  { value: "galpao", label: "Galpão" },
  { value: "cobertura", label: "Cobertura" },
  { value: "kitnet", label: "Kitnet" },
  { value: "fazenda", label: "Fazenda" },
  { value: "sitio", label: "Sítio" },
  { value: "loja", label: "Loja" },
  { value: "outro", label: "Outro" },
]

const opcoesFinalidade = [
  { value: "venda", label: "Comprar" },
  { value: "aluguel", label: "Alugar" },
  { value: "venda_e_aluguel", label: "Comprar ou Alugar" },
]

const labelsTipoImovel: Record<string, string> = Object.fromEntries(
  opcoesTipoImovel.map((o) => [o.value, o.label])
)

type InteressesClienteProps = {
  clienteId: string
  interesses: ClienteInteresse[]
}

export function InteressesCliente({ clienteId, interesses }: InteressesClienteProps) {
  const [mostrarForm, setMostrarForm] = useState(false)
  const [excluindoId, setExcluindoId] = useState<string | null>(null)

  const [estado, formAction, pendente] = useActionState<
    EstadoFormulario,
    FormData
  >(async (estado, formData) => {
    const resultado = await criarInteresse(estado, formData)
    if (resultado.sucesso) {
      toast.success(resultado.sucesso)
      setMostrarForm(false)
    } else if (resultado.erro) {
      toast.error(resultado.erro)
    }
    return resultado
  }, {})

  async function handleExcluir(interesseId: string) {
    setExcluindoId(interesseId)
    const resultado = await excluirInteresse(interesseId, clienteId)
    if (resultado.erro) {
      toast.error(resultado.erro)
    } else {
      toast.success(resultado.sucesso)
    }
    setExcluindoId(null)
  }

  return (
    <div className="space-y-4">
      {/* Lista de interesses existentes */}
      {interesses.length === 0 && !mostrarForm && (
        <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
          <Home className="mb-2 h-8 w-8" />
          <p>Nenhum interesse cadastrado</p>
          <p className="text-sm">Registre o que este cliente busca</p>
        </div>
      )}

      {interesses.map((interesse) => (
        <Card key={interesse.id}>
          <CardContent className="pt-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {interesse.tipo_imovel && (
                    <Badge variant="outline">
                      <Home className="mr-1 h-3 w-3" />
                      {labelsTipoImovel[interesse.tipo_imovel] ?? interesse.tipo_imovel}
                    </Badge>
                  )}
                  {interesse.finalidade && (
                    <Badge variant="secondary">
                      {interesse.finalidade === "venda" ? "Comprar" : interesse.finalidade === "aluguel" ? "Alugar" : "Comprar ou Alugar"}
                    </Badge>
                  )}
                </div>

                {(interesse.cidade || interesse.bairros_interesse) && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    {interesse.bairros_interesse && interesse.bairros_interesse.length > 0
                      ? interesse.bairros_interesse.join(", ")
                      : ""}
                    {interesse.cidade && ` — ${interesse.cidade}`}
                    {interesse.estado && ` - ${interesse.estado}`}
                  </div>
                )}

                {(interesse.preco_min || interesse.preco_max) && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <DollarSign className="h-3.5 w-3.5" />
                    {interesse.preco_min
                      ? `R$ ${Number(interesse.preco_min).toLocaleString("pt-BR")}`
                      : "Sem mínimo"}
                    {" — "}
                    {interesse.preco_max
                      ? `R$ ${Number(interesse.preco_max).toLocaleString("pt-BR")}`
                      : "Sem máximo"}
                  </div>
                )}

                {interesse.quartos_min && (
                  <p className="text-sm text-muted-foreground">
                    Mín. {interesse.quartos_min} quartos
                  </p>
                )}

                {interesse.observacoes && (
                  <p className="text-sm text-muted-foreground italic">
                    {interesse.observacoes}
                  </p>
                )}
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleExcluir(interesse.id)}
                disabled={excluindoId === interesse.id}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Formulário para adicionar novo interesse */}
      {mostrarForm ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Novo interesse</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={formAction} className="space-y-4">
              <input type="hidden" name="cliente_id" value={clienteId} />

              {estado.erro && (
                <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {estado.erro}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="tipo_imovel">Tipo de imóvel</Label>
                  <Select name="tipo_imovel">
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Qualquer tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {opcoesTipoImovel.map((opcao) => (
                        <SelectItem key={opcao.value} value={opcao.value}>
                          {opcao.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="finalidade">Finalidade</Label>
                  <Select name="finalidade">
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Qualquer finalidade" />
                    </SelectTrigger>
                    <SelectContent>
                      {opcoesFinalidade.map((opcao) => (
                        <SelectItem key={opcao.value} value={opcao.value}>
                          {opcao.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input
                    id="cidade"
                    name="cidade"
                    placeholder="São Paulo"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bairros_interesse">Bairros (separados por vírgula)</Label>
                  <Input
                    id="bairros_interesse"
                    name="bairros_interesse"
                    placeholder="Centro, Jardins, Vila Mariana"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="preco_min">Preço mínimo (R$)</Label>
                  <Input
                    id="preco_min"
                    name="preco_min"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="200000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="preco_max">Preço máximo (R$)</Label>
                  <Input
                    id="preco_max"
                    name="preco_max"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="500000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quartos_min">Quartos (mínimo)</Label>
                  <Input
                    id="quartos_min"
                    name="quartos_min"
                    type="number"
                    min="0"
                    placeholder="2"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="area_min">Área mínima (m²)</Label>
                  <Input
                    id="area_min"
                    name="area_min"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="60"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  name="observacoes"
                  placeholder="Detalhes adicionais sobre o que o cliente busca..."
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setMostrarForm(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={pendente}>
                  {pendente ? "Salvando..." : "Salvar interesse"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Button onClick={() => setMostrarForm(true)} variant="outline" className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          Adicionar interesse
        </Button>
      )}
    </div>
  )
}
