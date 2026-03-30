"use client"

import { useState } from "react"
import { toast } from "sonner"
import Link from "next/link"
import { criarImovel, atualizarImovel } from "@/actions/imoveis"
import type { Imovel } from "@/types/database"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { InputCep } from "@/components/ui/input-cep"
import { Textarea } from "@/components/ui/textarea"
import { Field, FieldLabel } from "@/components/ui/field"
import { InputGroup, InputGroupAddon, InputGroupText, InputGroupInput } from "@/components/ui/input-group"
import { InputMonetario } from "@/components/ui/input-monetario"
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
import { Switch } from "@/components/ui/switch"
import { labelsTipoImovel, labelsFinalidade, labelsStatusImovel, opcoesDeLabels } from "@/lib/constantes"

const opcoesTipo = opcoesDeLabels(labelsTipoImovel)
const opcoesFinalidade = opcoesDeLabels(labelsFinalidade)
const opcoesStatus = opcoesDeLabels(labelsStatusImovel)

const estadosBr = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO",
]

type FormularioImovelProps = {
  imovel?: Imovel
}

// Helper: acessa campo real do DB (pode diferir do tipo TypeScript manual em database.ts)
function campo(imovel: Imovel | undefined, ...nomes: string[]): string {
  if (!imovel) return ""
  const obj = imovel as Record<string, unknown>
  for (const nome of nomes) {
    if (obj[nome] !== undefined && obj[nome] !== null) return String(obj[nome])
  }
  return ""
}

function campoNum(imovel: Imovel | undefined, ...nomes: string[]): number | string {
  if (!imovel) return ""
  const obj = imovel as Record<string, unknown>
  for (const nome of nomes) {
    if (obj[nome] !== undefined && obj[nome] !== null) return Number(obj[nome])
  }
  return ""
}

export function FormularioImovel({ imovel }: FormularioImovelProps) {
  const editando = !!imovel
  const action = editando ? atualizarImovel : criarImovel

  const [tipoValue, setTipoValue] = useState(campo(imovel, "tipo"))
  const [finalidadeValue, setFinalidadeValue] = useState(campo(imovel, "finalidade"))
  const [estadoValue, setEstadoValue] = useState(campo(imovel, "estado"))
  const [statusValue, setStatusValue] = useState(campo(imovel, "status") || "disponivel")
  const [destaqueValue, setDestaqueValue] = useState(Boolean((imovel as Record<string, unknown> | undefined)?.destaque))
  const [valorValue, setValorValue] = useState<number | null>(campoNum(imovel, "valor", "valor") as number || null)
  const [valorCondominioValue, setValorCondominioValue] = useState<number | null>(campoNum(imovel, "valor_condominio", "condominio") as number || null)
  const [valorIptuValue, setValorIptuValue] = useState<number | null>(campoNum(imovel, "valor_iptu", "iptu") as number || null)
  const [pendente, setPendente] = useState(false)

  async function handleAction(formData: FormData) {
    // Adicionar campos de Select (não são inputs nativos)
    formData.set("tipo", tipoValue)
    formData.set("finalidade", finalidadeValue)
    formData.set("estado", estadoValue)
    if (editando) {
      formData.set("id", imovel.id)
      formData.set("status", statusValue)
    }
    if (destaqueValue) formData.set("destaque", "on")

    setPendente(true)
    try {
      const resultado = await action({}, formData)
      if (resultado?.erro) toast.error(resultado.erro)
      if (resultado?.sucesso) toast.success(resultado.sucesso)
    } catch {
      // redirect() lança um erro especial que o Next.js intercepta
    } finally {
      setPendente(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" render={<Link href="/imoveis" />}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {imovel ? "Editar imóvel" : "Novo imóvel"}
          </h1>
          <p className="text-muted-foreground">
            {imovel
              ? "Atualize as informações do imóvel"
              : "Preencha os dados para cadastrar um novo imóvel"}
          </p>
        </div>
      </div>

      <form action={handleAction} className="space-y-6" id="onborda-form-imovel">
        {/* Dados Básicos */}
        <Card id="onborda-imovel-basico">
          <CardHeader>
            <CardTitle>Dados básicos</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="codigo_interno">Código interno *</FieldLabel>
              <Input
                id="codigo_interno"
                name="codigo_interno"
                placeholder="Ex: APT-001"
                defaultValue={campo(imovel, "codigo_interno", "codigo")}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="titulo">Título do anúncio *</FieldLabel>
              <Input
                id="titulo"
                name="titulo"
                placeholder="Ex: Apartamento 3 quartos no Centro"
                defaultValue={campo(imovel, "titulo")}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="tipo">Tipo *</FieldLabel>
              <Select value={tipoValue} onValueChange={(v) => v && setTipoValue(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {opcoesTipo.map((opcao) => (
                    <SelectItem key={opcao.value} value={opcao.value}>
                      {opcao.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor="finalidade">Finalidade *</FieldLabel>
              <Select value={finalidadeValue} onValueChange={(v) => v && setFinalidadeValue(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione a finalidade" />
                </SelectTrigger>
                <SelectContent>
                  {opcoesFinalidade.map((opcao) => (
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
                name="descricao"
                placeholder="Descreva o imóvel em detalhes..."
                rows={4}
                defaultValue={campo(imovel, "descricao")}
              />
            </Field>
          </CardContent>
        </Card>

        {/* Endereço */}
        <Card id="onborda-imovel-endereco">
          <CardHeader>
            <CardTitle>Endereço</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field>
              <FieldLabel htmlFor="cep">CEP</FieldLabel>
              <InputCep id="cep" name="cep" defaultValue={campo(imovel, "cep")} />
            </Field>

            <Field className="sm:col-span-2">
              <FieldLabel htmlFor="logradouro">Logradouro</FieldLabel>
              <Input id="logradouro" name="logradouro" placeholder="Rua, Avenida, etc." defaultValue={campo(imovel, "logradouro")} />
            </Field>

            <Field>
              <FieldLabel htmlFor="numero">Número</FieldLabel>
              <Input id="numero" name="numero" placeholder="123" defaultValue={campo(imovel, "numero")} />
            </Field>

            <Field>
              <FieldLabel htmlFor="complemento">Complemento</FieldLabel>
              <Input id="complemento" name="complemento" placeholder="Apto 101, Bloco A" defaultValue={campo(imovel, "complemento")} />
            </Field>

            <Field>
              <FieldLabel htmlFor="bairro">Bairro</FieldLabel>
              <Input id="bairro" name="bairro" placeholder="Centro" defaultValue={campo(imovel, "bairro")} />
            </Field>

            <Field>
              <FieldLabel htmlFor="cidade">Cidade *</FieldLabel>
              <Input id="cidade" name="cidade" placeholder="São Paulo" defaultValue={campo(imovel, "cidade")} />
            </Field>

            <Field>
              <FieldLabel htmlFor="estado_uf">Estado *</FieldLabel>
              <Select value={estadoValue} onValueChange={(v) => v && setEstadoValue(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="UF" />
                </SelectTrigger>
                <SelectContent>
                  {estadosBr.map((uf) => (
                    <SelectItem key={uf} value={uf}>
                      {uf}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </CardContent>
        </Card>

        {/* Valores */}
        <Card>
          <CardHeader>
            <CardTitle>Valores</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field>
              <FieldLabel htmlFor="valor">Preço</FieldLabel>
              <InputMonetario
                id="valor"
                name="valor"
                valor={valorValue}
                onValorChange={setValorValue}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="valor_condominio">Condomínio /mês</FieldLabel>
              <InputMonetario
                id="valor_condominio"
                name="valor_condominio"
                valor={valorCondominioValue}
                onValorChange={setValorCondominioValue}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="valor_iptu">IPTU /ano</FieldLabel>
              <InputMonetario
                id="valor_iptu"
                name="valor_iptu"
                valor={valorIptuValue}
                onValorChange={setValorIptuValue}
              />
            </Field>
          </CardContent>
        </Card>

        {/* Características */}
        <Card>
          <CardHeader>
            <CardTitle>Características</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field>
              <FieldLabel htmlFor="area_total">Área total</FieldLabel>
              <InputGroup>
                <InputGroupInput
                  id="area_total"
                  name="area_total"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="120"
                  defaultValue={campoNum(imovel, "area_total")}
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupText>m²</InputGroupText>
                </InputGroupAddon>
              </InputGroup>
            </Field>

            <Field>
              <FieldLabel htmlFor="area_construida">Área construída</FieldLabel>
              <InputGroup>
                <InputGroupInput
                  id="area_construida"
                  name="area_construida"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="90"
                  defaultValue={campoNum(imovel, "area_construida")}
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupText>m²</InputGroupText>
                </InputGroupAddon>
              </InputGroup>
            </Field>

            <Field>
              <FieldLabel htmlFor="quartos">Quartos</FieldLabel>
              <Input id="quartos" name="quartos" type="number" min="0" placeholder="3" defaultValue={campoNum(imovel, "quartos") || 0} />
            </Field>

            <Field>
              <FieldLabel htmlFor="suites">Suítes</FieldLabel>
              <Input id="suites" name="suites" type="number" min="0" placeholder="1" defaultValue={campoNum(imovel, "suites") || 0} />
            </Field>

            <Field>
              <FieldLabel htmlFor="banheiros">Banheiros</FieldLabel>
              <Input id="banheiros" name="banheiros" type="number" min="0" placeholder="2" defaultValue={campoNum(imovel, "banheiros") || 0} />
            </Field>

            <Field>
              <FieldLabel htmlFor="vagas">Vagas de garagem</FieldLabel>
              <Input id="vagas" name="vagas" type="number" min="0" placeholder="2" defaultValue={campoNum(imovel, "vagas", "vagas") || 0} />
            </Field>
          </CardContent>
        </Card>

        {/* Destaque */}
        <Card>
          <CardHeader>
            <CardTitle>Destaque</CardTitle>
          </CardHeader>
          <CardContent>
            <label className="flex items-center gap-3 cursor-pointer">
              <Switch
                checked={destaqueValue}
                onCheckedChange={setDestaqueValue}
              />
              <div>
                <p className="text-sm font-medium">Imóvel em destaque</p>
                <p className="text-xs text-muted-foreground">Aparece em destaque no site da imobiliária</p>
              </div>
            </label>
          </CardContent>
        </Card>

        {/* Ações */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" render={<Link href="/imoveis" />}>
            Cancelar
          </Button>
          <Button type="submit" disabled={pendente} id="onborda-imovel-salvar">
            {pendente
              ? imovel
                ? "Salvando..."
                : "Cadastrando..."
              : imovel
                ? "Salvar alterações"
                : "Cadastrar imóvel"}
          </Button>
        </div>
      </form>
    </div>
  )
}
