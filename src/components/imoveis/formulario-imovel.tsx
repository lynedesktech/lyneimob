"use client"

import { useActionState, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import Link from "next/link"
import { criarImovel, atualizarImovel } from "@/actions/imoveis"
import { schemaCriarImovel } from "@/types/imoveis"
import type { CriarImovelInput } from "@/types/imoveis"
import type { Imovel } from "@/types/database"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Field, FieldLabel, FieldError } from "@/components/ui/field"
import { InputGroup, InputGroupAddon, InputGroupText, InputGroupInput } from "@/components/ui/input-group"
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
import { ArrowLeft, Globe, Rss } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { labelsTipoImovel, labelsFinalidade, labelsStatusImovel, opcoesDeLabels } from "@/lib/constantes"

const opcoesTipo = opcoesDeLabels(labelsTipoImovel)
const opcoesFinalidade = opcoesDeLabels(labelsFinalidade)
const opcoesStatus = opcoesDeLabels(labelsStatusImovel)

const estados = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO",
]

type FormularioImovelProps = {
  imovel?: Imovel
}

export function FormularioImovel({ imovel }: FormularioImovelProps) {
  const editando = !!imovel
  const action = editando ? atualizarImovel : criarImovel
  const router = useRouter()

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CriarImovelInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schemaCriarImovel) as any,
    defaultValues: {
      codigo: imovel?.codigo ?? "",
      titulo: imovel?.titulo ?? "",
      descricao: imovel?.descricao ?? "",
      tipo: (imovel?.tipo ?? "") as CriarImovelInput["tipo"],
      finalidade: (imovel?.finalidade ?? "") as CriarImovelInput["finalidade"],
      cep: imovel?.cep ?? "",
      logradouro: imovel?.logradouro ?? "",
      numero: imovel?.numero ?? "",
      complemento: imovel?.complemento ?? "",
      bairro: imovel?.bairro ?? "",
      cidade: imovel?.cidade ?? "",
      estado: imovel?.estado ?? "",
      preco_venda: imovel?.preco_venda ?? undefined,
      preco_aluguel: imovel?.preco_aluguel ?? undefined,
      iptu: imovel?.iptu ?? undefined,
      condominio: imovel?.condominio ?? undefined,
      area_total: imovel?.area_total ?? undefined,
      area_construida: imovel?.area_construida ?? undefined,
      quartos: imovel?.quartos ?? 0,
      suites: imovel?.suites ?? 0,
      banheiros: imovel?.banheiros ?? 0,
      vagas_garagem: imovel?.vagas_garagem ?? 0,
      andares: imovel?.andares ?? undefined,
      observacoes_internas: imovel?.observacoes_internas ?? "",
      publicar_site: imovel?.publicar_site ?? true,
      publicar_portais: imovel?.publicar_portais ?? true,
    },
  })

  // Status é controlado separadamente (só existe em edição)
  const [statusValue, setStatusValue] = useState(imovel?.status ?? "disponivel")

  const [retorno, formAction, pendente] = useActionState(action, {})

  useEffect(() => {
    if (retorno.erro) toast.error(retorno.erro)
    if (retorno.sucesso && retorno.id) {
      toast.success(retorno.sucesso)
      router.push(`/imoveis/${retorno.id}`)
    }
  }, [retorno, router])

  function onSubmit(dados: CriarImovelInput) {
    const formData = new FormData()
    if (editando) formData.set("id", imovel.id)
    formData.set("codigo", dados.codigo)
    formData.set("titulo", dados.titulo)
    formData.set("tipo", dados.tipo)
    formData.set("finalidade", dados.finalidade)
    formData.set("cidade", dados.cidade)
    formData.set("estado", dados.estado)
    if (dados.descricao) formData.set("descricao", dados.descricao)
    if (dados.cep) formData.set("cep", dados.cep)
    if (dados.logradouro) formData.set("logradouro", dados.logradouro)
    if (dados.numero) formData.set("numero", dados.numero)
    if (dados.complemento) formData.set("complemento", dados.complemento)
    if (dados.bairro) formData.set("bairro", dados.bairro)
    if (dados.preco_venda !== undefined) formData.set("preco_venda", String(dados.preco_venda))
    if (dados.preco_aluguel !== undefined) formData.set("preco_aluguel", String(dados.preco_aluguel))
    if (dados.iptu !== undefined) formData.set("iptu", String(dados.iptu))
    if (dados.condominio !== undefined) formData.set("condominio", String(dados.condominio))
    if (dados.area_total !== undefined) formData.set("area_total", String(dados.area_total))
    if (dados.area_construida !== undefined) formData.set("area_construida", String(dados.area_construida))
    formData.set("quartos", String(dados.quartos))
    formData.set("suites", String(dados.suites))
    formData.set("banheiros", String(dados.banheiros))
    formData.set("vagas_garagem", String(dados.vagas_garagem))
    if (dados.andares !== undefined) formData.set("andares", String(dados.andares))
    if (dados.observacoes_internas) formData.set("observacoes_internas", dados.observacoes_internas)
    formData.set("publicar_site", dados.publicar_site ? "on" : "")
    formData.set("publicar_portais", dados.publicar_portais ? "on" : "")
    if (editando) formData.set("status", statusValue)
    formAction(formData)
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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Dados Básicos */}
        <Card>
          <CardHeader>
            <CardTitle>Dados básicos</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="codigo">Código interno *</FieldLabel>
              <Input
                id="codigo"
                placeholder="Ex: APT-001"
                {...register("codigo")}
                aria-invalid={!!errors.codigo}
              />
              <FieldError errors={[errors.codigo]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="titulo">Título do anúncio *</FieldLabel>
              <Input
                id="titulo"
                placeholder="Ex: Apartamento 3 quartos no Centro"
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
                    <SelectTrigger className="w-full" aria-invalid={!!errors.tipo}>
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
                )}
              />
              <FieldError errors={[errors.tipo]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="finalidade">Finalidade *</FieldLabel>
              <Controller
                name="finalidade"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full" aria-invalid={!!errors.finalidade}>
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
                )}
              />
              <FieldError errors={[errors.finalidade]} />
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
                placeholder="Descreva o imóvel em detalhes..."
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
                placeholder="Apto 101, Bloco A"
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

        {/* Valores */}
        <Card>
          <CardHeader>
            <CardTitle>Valores</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field>
              <FieldLabel htmlFor="preco_venda">Preço de venda</FieldLabel>
              <InputGroup>
                <InputGroupAddon>
                  <InputGroupText>R$</InputGroupText>
                </InputGroupAddon>
                <InputGroupInput
                  id="preco_venda"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="500000"
                  {...register("preco_venda")}
                  aria-invalid={!!errors.preco_venda}
                />
              </InputGroup>
              <FieldError errors={[errors.preco_venda]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="preco_aluguel">Aluguel /mês</FieldLabel>
              <InputGroup>
                <InputGroupAddon>
                  <InputGroupText>R$</InputGroupText>
                </InputGroupAddon>
                <InputGroupInput
                  id="preco_aluguel"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="2500"
                  {...register("preco_aluguel")}
                  aria-invalid={!!errors.preco_aluguel}
                />
              </InputGroup>
              <FieldError errors={[errors.preco_aluguel]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="iptu">IPTU /ano</FieldLabel>
              <InputGroup>
                <InputGroupAddon>
                  <InputGroupText>R$</InputGroupText>
                </InputGroupAddon>
                <InputGroupInput
                  id="iptu"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="1200"
                  {...register("iptu")}
                  aria-invalid={!!errors.iptu}
                />
              </InputGroup>
              <FieldError errors={[errors.iptu]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="condominio">Condomínio /mês</FieldLabel>
              <InputGroup>
                <InputGroupAddon>
                  <InputGroupText>R$</InputGroupText>
                </InputGroupAddon>
                <InputGroupInput
                  id="condominio"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="800"
                  {...register("condominio")}
                  aria-invalid={!!errors.condominio}
                />
              </InputGroup>
              <FieldError errors={[errors.condominio]} />
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
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="120"
                  {...register("area_total")}
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
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="90"
                  {...register("area_construida")}
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupText>m²</InputGroupText>
                </InputGroupAddon>
              </InputGroup>
            </Field>

            <Field>
              <FieldLabel htmlFor="quartos">Quartos</FieldLabel>
              <Input
                id="quartos"
                type="number"
                min="0"
                placeholder="3"
                {...register("quartos")}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="suites">Suítes</FieldLabel>
              <Input
                id="suites"
                type="number"
                min="0"
                placeholder="1"
                {...register("suites")}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="banheiros">Banheiros</FieldLabel>
              <Input
                id="banheiros"
                type="number"
                min="0"
                placeholder="2"
                {...register("banheiros")}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="vagas_garagem">Vagas de garagem</FieldLabel>
              <Input
                id="vagas_garagem"
                type="number"
                min="0"
                placeholder="2"
                {...register("vagas_garagem")}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="andares">Andares</FieldLabel>
              <Input
                id="andares"
                type="number"
                min="1"
                placeholder="Apenas para comercial"
                {...register("andares")}
              />
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
              placeholder="Notas privadas sobre o imóvel (só visíveis para sua equipe)..."
              rows={3}
              {...register("observacoes_internas")}
            />
          </CardContent>
        </Card>

        {/* Canais de Publicação */}
        <Card>
          <CardHeader>
            <CardTitle>Canais de publicação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Escolha onde este imóvel ficará visível. Apenas imóveis com status &quot;Disponível&quot; aparecem nos canais selecionados.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:gap-8">
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
              <label className="flex items-center gap-3 cursor-pointer">
                <Controller
                  name="publicar_portais"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <div className="flex items-center gap-2">
                  <Rss className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Portais imobiliários</p>
                    <p className="text-xs text-muted-foreground">Aparece no OLX, VivaReal, etc. via feed XML</p>
                  </div>
                </div>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Ações */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" render={<Link href="/imoveis" />}>
            Cancelar
          </Button>
          <Button type="submit" disabled={pendente}>
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
