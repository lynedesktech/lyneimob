"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import Link from "next/link"
import { criarImovel, atualizarImovel } from "@/actions/imoveis"
import type { Imovel } from "@/types/database"
import { useContextoIA } from "@/components/ia/contexto-ia"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { InputCep } from "@/components/ui/input-cep"
import { Textarea } from "@/components/ui/textarea"
import { Field, FieldLabel, FieldError } from "@/components/ui/field"
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Sparkles,
  ChevronLeft,
} from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { labelsTipoImovel, labelsFinalidade, labelsStatusImovel, opcoesDeLabels } from "@/lib/constantes"
import { useBuscaCep } from "@/hooks/use-busca-cep"

const opcoesTipo = opcoesDeLabels(labelsTipoImovel)
const opcoesFinalidade = opcoesDeLabels(labelsFinalidade)
const opcoesStatus = opcoesDeLabels(labelsStatusImovel)

const estadosBr = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO",
]

const ETAPAS = [
  { numero: 1, nome: "Básicos" },
  { numero: 2, nome: "Endereço" },
  { numero: 3, nome: "Características" },
  { numero: 4, nome: "Valores" },
  { numero: 5, nome: "IA & Publicação" },
  { numero: 6, nome: "Revisão" },
]

// Opções dos dropdowns (resolvem o pedido "quartos/suites/banheiros/vagas como select")
const opcoesQuartos = ["0", "1", "2", "3", "4", "5+"]
const opcoesSuites = ["0", "1", "2", "3+"]
const opcoesBanheiros = ["1", "2", "3", "4+"]
const opcoesVagas = ["0", "1", "2", "3+"]

type FormularioImovelProps = {
  imovel?: Imovel
}

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

// Converte número puro (5, 6, 7...) em valor do dropdown (4+, 5+, etc.)
function toOpcaoNumerica(valor: number, limite: number): string {
  if (valor >= limite) return `${limite}+`
  return String(valor)
}

// Indicador de progresso — adaptado do WizardWhatsapp
function IndicadorProgresso({ etapa, irParaEtapa }: { etapa: number; irParaEtapa: (n: number) => void }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-0 pb-2">
      {ETAPAS.map((passo, i) => {
        const concluido = etapa > passo.numero
        const atual = etapa === passo.numero
        const clicavel = passo.numero < etapa
        return (
          <div key={passo.numero} className="flex items-center">
            <button
              type="button"
              disabled={!clicavel}
              onClick={() => clicavel && irParaEtapa(passo.numero)}
              className="flex flex-col items-center gap-1 disabled:cursor-default"
              aria-label={`Etapa ${passo.numero}: ${passo.nome}`}
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  concluido
                    ? "bg-primary text-primary-foreground"
                    : atual
                      ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {concluido ? <CheckCircle2 className="h-4 w-4" /> : passo.numero}
              </div>
              <span
                className={`text-[11px] font-medium leading-none ${
                  atual ? "text-primary" : concluido ? "text-primary/70" : "text-muted-foreground"
                }`}
              >
                {passo.nome}
              </span>
            </button>
            {i < ETAPAS.length - 1 && (
              <div
                className={`mx-2 mb-4 h-0.5 w-6 transition-colors sm:w-10 ${
                  etapa > passo.numero ? "bg-primary" : "bg-muted"
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

export function FormularioImovel({ imovel }: FormularioImovelProps) {
  const editando = !!imovel
  const action = editando ? atualizarImovel : criarImovel
  const router = useRouter()

  const [etapa, setEtapa] = useState(1)

  // Básicos
  const [codigoInternoValue, setCodigoInternoValue] = useState(campo(imovel, "codigo_interno", "codigo"))
  const [tituloValue, setTituloValue] = useState(campo(imovel, "titulo"))
  const [tipoValue, setTipoValue] = useState(campo(imovel, "tipo"))
  const [finalidadeValue, setFinalidadeValue] = useState(campo(imovel, "finalidade"))
  const [statusValue, setStatusValue] = useState(campo(imovel, "status") || "disponivel")

  // Endereço
  const [cepValue, setCepValue] = useState(campo(imovel, "cep"))
  const [logradouroValue, setLogradouroValue] = useState(campo(imovel, "logradouro"))
  const [numeroValue, setNumeroValue] = useState(campo(imovel, "numero"))
  const [complementoValue, setComplementoValue] = useState(campo(imovel, "complemento"))
  const [bairroValue, setBairroValue] = useState(campo(imovel, "bairro"))
  const [cidadeValue, setCidadeValue] = useState(campo(imovel, "cidade"))
  const [estadoValue, setEstadoValue] = useState(campo(imovel, "estado"))

  // Características (dropdowns)
  const [quartosValue, setQuartosValue] = useState(
    imovel ? toOpcaoNumerica(Number(campoNum(imovel, "quartos") || 0), 5) : ""
  )
  const [suitesValue, setSuitesValue] = useState(
    imovel ? toOpcaoNumerica(Number(campoNum(imovel, "suites") || 0), 3) : ""
  )
  const [banheirosValue, setBanheirosValue] = useState(
    imovel ? toOpcaoNumerica(Number(campoNum(imovel, "banheiros") || 0), 4) : ""
  )
  const [vagasValue, setVagasValue] = useState(
    imovel ? toOpcaoNumerica(Number(campoNum(imovel, "vagas") || 0), 3) : ""
  )
  const [areaTotalValue, setAreaTotalValue] = useState(String(campoNum(imovel, "area_total") || ""))
  const [areaConstruidaValue, setAreaConstruidaValue] = useState(String(campoNum(imovel, "area_construida") || ""))

  // Valores
  const [valorValue, setValorValue] = useState<number | null>(campoNum(imovel, "valor", "valor") as number || null)
  const [valorCondominioValue, setValorCondominioValue] = useState<number | null>(campoNum(imovel, "valor_condominio", "condominio") as number || null)
  const [valorIptuValue, setValorIptuValue] = useState<number | null>(campoNum(imovel, "valor_iptu", "iptu") as number || null)

  // IA + Publicação
  const [descricaoValue, setDescricaoValue] = useState(campo(imovel, "descricao"))
  const [publicarSiteValue, setPublicarSiteValue] = useState((imovel as Record<string, unknown> | undefined)?.publicar_site !== false)
  const [publicarPortaisValue, setPublicarPortaisValue] = useState((imovel as Record<string, unknown> | undefined)?.publicar_portais !== false)
  const [destaqueValue, setDestaqueValue] = useState(Boolean((imovel as Record<string, unknown> | undefined)?.destaque))

  const [pendente, setPendente] = useState(false)
  const [erros, setErros] = useState<Record<string, string>>({})

  const { buscandoCep, preenchidoPorCep, buscarCep, limparPreenchimento } = useBuscaCep()

  // Registra o imovel no contexto da IA pra o widget conseguir aplicar
  // descricao/titulo gerados diretamente no formulario (LYNEDES-72)
  const { definirEntidade } = useContextoIA()
  const tituloRef = useRef(tituloValue)
  const descricaoRef = useRef(descricaoValue)
  tituloRef.current = tituloValue
  descricaoRef.current = descricaoValue

  useEffect(() => {
    if (!imovel?.id) return
    definirEntidade({
      modulo: "imovel",
      entidadeId: imovel.id,
      dados: {
        descricao_ia: campo(imovel, "descricao_ia"),
        titulo_ia: campo(imovel, "titulo_ia"),
        get descricao() {
          return descricaoRef.current
        },
        get titulo() {
          return tituloRef.current
        },
        onAplicar: (c: "descricao" | "titulo", texto: string) => {
          if (c === "descricao") setDescricaoValue(texto)
          if (c === "titulo") setTituloValue(texto)
        },
      },
    })
    return () => definirEntidade(null)
  }, [imovel, definirEntidade])

  async function handleBuscarCep(cep: string) {
    const dados = await buscarCep(cep)
    if (dados) {
      setLogradouroValue(dados.logradouro)
      setBairroValue(dados.bairro)
      setCidadeValue(dados.cidade)
      setEstadoValue(dados.estado)
    }
  }

  // Validação por etapa
  function validarEtapa(n: number): boolean {
    const novosErros: Record<string, string> = {}
    if (n === 1) {
      if (!tituloValue.trim()) novosErros.titulo = "Campo obrigatório"
      if (!tipoValue) novosErros.tipo = "Campo obrigatório"
      if (!finalidadeValue) novosErros.finalidade = "Campo obrigatório"
    }
    if (n === 2) {
      if (!cidadeValue.trim()) novosErros.cidade = "Campo obrigatório"
      if (!estadoValue) novosErros.estado = "Campo obrigatório"
    }
    setErros(novosErros)
    return Object.keys(novosErros).length === 0
  }

  function proximaEtapa() {
    if (!validarEtapa(etapa)) return
    setEtapa((e) => Math.min(e + 1, ETAPAS.length))
  }
  function etapaAnterior() {
    setEtapa((e) => Math.max(e - 1, 1))
  }

  // Converte valor do dropdown pra número (ex "5+" → 5, "3" → 3)
  function parseOpcaoNumerica(valor: string): number {
    if (!valor) return 0
    return parseInt(valor.replace("+", ""), 10) || 0
  }

  async function handleSalvar() {
    // Valida etapas 1 e 2 (as outras são opcionais)
    if (!validarEtapa(1)) {
      setEtapa(1)
      return
    }
    if (!validarEtapa(2)) {
      setEtapa(2)
      return
    }

    const formData = new FormData()
    formData.set("codigo_interno", codigoInternoValue)
    formData.set("titulo", tituloValue)
    formData.set("tipo", tipoValue)
    formData.set("finalidade", finalidadeValue)
    formData.set("descricao", descricaoValue)
    formData.set("cep", cepValue)
    formData.set("logradouro", logradouroValue)
    formData.set("numero", numeroValue)
    formData.set("complemento", complementoValue)
    formData.set("bairro", bairroValue)
    formData.set("cidade", cidadeValue)
    formData.set("estado", estadoValue)
    formData.set("quartos", String(parseOpcaoNumerica(quartosValue)))
    formData.set("suites", String(parseOpcaoNumerica(suitesValue)))
    formData.set("banheiros", String(parseOpcaoNumerica(banheirosValue)))
    formData.set("vagas", String(parseOpcaoNumerica(vagasValue)))
    if (areaTotalValue) formData.set("area_total", areaTotalValue)
    if (areaConstruidaValue) formData.set("area_construida", areaConstruidaValue)

    if (editando && imovel) {
      formData.set("id", imovel.id)
      formData.set("status", statusValue)
    }
    if (destaqueValue) formData.set("destaque", "on")
    if (publicarSiteValue) formData.set("publicar_site", "on")
    if (publicarPortaisValue) formData.set("publicar_portais", "on")

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

  // Se etapas 1-3 (básicos, endereço, características) estão preenchidas, IA é habilitada
  const etapasParaIAOk =
    tituloValue.trim() !== "" &&
    tipoValue !== "" &&
    finalidadeValue !== "" &&
    cidadeValue.trim() !== "" &&
    estadoValue !== "" &&
    (quartosValue !== "" || banheirosValue !== "" || vagasValue !== "")

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
            {imovel ? "Atualize as informações do imóvel" : "Preencha os dados em 6 etapas rápidas"}
          </p>
        </div>
      </div>

      <IndicadorProgresso etapa={etapa} irParaEtapa={setEtapa} />

      <Card>
        <CardHeader>
          <CardTitle>{ETAPAS[etapa - 1].nome}</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Etapa 1 — Dados básicos */}
          {etapa === 1 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="codigo_interno">Código interno</FieldLabel>
                <Input
                  id="codigo_interno"
                  placeholder="Gerado automaticamente (ex: IMO-001)"
                  value={codigoInternoValue}
                  onChange={(e) => setCodigoInternoValue(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="titulo">Título do anúncio *</FieldLabel>
                <Input
                  id="titulo"
                  placeholder="Ex: Apartamento 3 quartos no Centro"
                  value={tituloValue}
                  onChange={(e) => setTituloValue(e.target.value)}
                  className={erros.titulo ? "border-destructive" : ""}
                />
                {erros.titulo && <FieldError>{erros.titulo}</FieldError>}
              </Field>
              <Field>
                <FieldLabel htmlFor="tipo">Tipo *</FieldLabel>
                <Select value={tipoValue} onValueChange={(v) => v && setTipoValue(v)}>
                  <SelectTrigger className={`w-full ${erros.tipo ? "border-destructive" : ""}`}>
                    <SelectValue placeholder="Selecione o tipo">
                      {tipoValue ? opcoesTipo.find((o) => o.value === tipoValue)?.label : null}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {opcoesTipo.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {erros.tipo && <FieldError>{erros.tipo}</FieldError>}
              </Field>
              <Field>
                <FieldLabel htmlFor="finalidade">Finalidade *</FieldLabel>
                <Select value={finalidadeValue} onValueChange={(v) => v && setFinalidadeValue(v)}>
                  <SelectTrigger className={`w-full ${erros.finalidade ? "border-destructive" : ""}`}>
                    <SelectValue placeholder="Selecione a finalidade">
                      {finalidadeValue ? opcoesFinalidade.find((o) => o.value === finalidadeValue)?.label : null}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {opcoesFinalidade.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {erros.finalidade && <FieldError>{erros.finalidade}</FieldError>}
              </Field>
              {editando && (
                <Field>
                  <FieldLabel htmlFor="status">Status</FieldLabel>
                  <Select value={statusValue} onValueChange={(v) => v && setStatusValue(v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione o status">
                        {statusValue ? opcoesStatus.find((o) => o.value === statusValue)?.label : null}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {opcoesStatus.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            </div>
          )}

          {/* Etapa 2 — Endereço */}
          {etapa === 2 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field>
                <FieldLabel htmlFor="cep">CEP</FieldLabel>
                <div className="relative">
                  <InputCep
                    id="cep"
                    value={cepValue}
                    onChange={(valor) => {
                      setCepValue(valor)
                      if (valor.replace(/\D/g, "").length < 8) {
                        limparPreenchimento()
                      }
                    }}
                    disabled={buscandoCep}
                    onComplete={handleBuscarCep}
                  />
                  {buscandoCep && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
              </Field>
              <Field className="sm:col-span-2">
                <FieldLabel htmlFor="logradouro">Logradouro</FieldLabel>
                <Input
                  id="logradouro"
                  placeholder="Rua, Avenida, etc."
                  value={logradouroValue}
                  onChange={(e) => !preenchidoPorCep && setLogradouroValue(e.target.value)}
                  readOnly={preenchidoPorCep}
                  className={preenchidoPorCep ? "bg-muted" : ""}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="numero">Número</FieldLabel>
                <Input id="numero" placeholder="123" value={numeroValue} onChange={(e) => setNumeroValue(e.target.value)} />
              </Field>
              <Field>
                <FieldLabel htmlFor="complemento">Complemento</FieldLabel>
                <Input id="complemento" placeholder="Apto 101, Bloco A" value={complementoValue} onChange={(e) => setComplementoValue(e.target.value)} />
              </Field>
              <Field>
                <FieldLabel htmlFor="bairro">Bairro</FieldLabel>
                <Input
                  id="bairro"
                  placeholder="Centro"
                  value={bairroValue}
                  onChange={(e) => !preenchidoPorCep && setBairroValue(e.target.value)}
                  readOnly={preenchidoPorCep}
                  className={preenchidoPorCep ? "bg-muted" : ""}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="cidade">Cidade *</FieldLabel>
                <Input
                  id="cidade"
                  placeholder="São Paulo"
                  value={cidadeValue}
                  onChange={(e) => !preenchidoPorCep && setCidadeValue(e.target.value)}
                  readOnly={preenchidoPorCep}
                  className={`${preenchidoPorCep ? "bg-muted" : ""} ${erros.cidade ? "border-destructive" : ""}`}
                />
                {erros.cidade && <FieldError>{erros.cidade}</FieldError>}
              </Field>
              <Field>
                <FieldLabel htmlFor="estado">Estado *</FieldLabel>
                <Select value={estadoValue} onValueChange={(v) => v && !preenchidoPorCep && setEstadoValue(v)} disabled={preenchidoPorCep}>
                  <SelectTrigger className={`w-full ${erros.estado ? "border-destructive" : ""}`}>
                    <SelectValue placeholder="UF">{estadoValue || null}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {estadosBr.map((uf) => (
                      <SelectItem key={uf} value={uf}>
                        {uf}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {erros.estado && <FieldError>{erros.estado}</FieldError>}
              </Field>
            </div>
          )}

          {/* Etapa 3 — Características */}
          {etapa === 3 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field>
                <FieldLabel htmlFor="quartos">Quartos</FieldLabel>
                <Select value={quartosValue} onValueChange={(v) => v && setQuartosValue(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione">{quartosValue || null}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {opcoesQuartos.map((o) => (
                      <SelectItem key={o} value={o}>
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="suites">Suítes</FieldLabel>
                <Select value={suitesValue} onValueChange={(v) => v && setSuitesValue(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione">{suitesValue || null}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {opcoesSuites.map((o) => (
                      <SelectItem key={o} value={o}>
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="banheiros">Banheiros</FieldLabel>
                <Select value={banheirosValue} onValueChange={(v) => v && setBanheirosValue(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione">{banheirosValue || null}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {opcoesBanheiros.map((o) => (
                      <SelectItem key={o} value={o}>
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="vagas">Vagas de garagem</FieldLabel>
                <Select value={vagasValue} onValueChange={(v) => v && setVagasValue(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione">{vagasValue || null}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {opcoesVagas.map((o) => (
                      <SelectItem key={o} value={o}>
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="area_total">Área total</FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    id="area_total"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="120"
                    value={areaTotalValue}
                    onChange={(e) => setAreaTotalValue(e.target.value)}
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
                    value={areaConstruidaValue}
                    onChange={(e) => setAreaConstruidaValue(e.target.value)}
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupText>m²</InputGroupText>
                  </InputGroupAddon>
                </InputGroup>
              </Field>
            </div>
          )}

          {/* Etapa 4 — Valores */}
          {etapa === 4 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field>
                <FieldLabel htmlFor="valor">Preço</FieldLabel>
                <InputMonetario id="valor" valor={valorValue} onValorChange={setValorValue} />
              </Field>
              <Field>
                <FieldLabel htmlFor="valor_condominio">Condomínio /mês</FieldLabel>
                <InputMonetario id="valor_condominio" valor={valorCondominioValue} onValorChange={setValorCondominioValue} />
              </Field>
              <Field>
                <FieldLabel htmlFor="valor_iptu">IPTU /ano</FieldLabel>
                <InputMonetario id="valor_iptu" valor={valorIptuValue} onValorChange={setValorIptuValue} />
              </Field>
            </div>
          )}

          {/* Etapa 5 — IA + Publicação */}
          {etapa === 5 && (
            <div className="space-y-6">
              <div className="rounded-lg border bg-primary/5 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-medium">Descrição do imóvel</h3>
                </div>
                <p className="mb-3 text-xs text-muted-foreground">
                  Use a IA (botão flutuante) para gerar uma descrição profissional, ou preencha manualmente.
                </p>
                {!etapasParaIAOk && (
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <div className="inline-block">
                          <Button type="button" size="sm" variant="outline" disabled>
                            <Sparkles className="mr-2 h-3 w-3" />
                            Gerar descrição com IA
                          </Button>
                        </div>
                      }
                    />
                    <TooltipContent>
                      Preencha dados básicos, endereço e características primeiro
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
              <Field>
                <FieldLabel htmlFor="descricao">Descrição</FieldLabel>
                <Textarea
                  id="descricao"
                  placeholder="Descreva o imóvel em detalhes..."
                  rows={6}
                  value={descricaoValue}
                  onChange={(e) => setDescricaoValue(e.target.value)}
                />
              </Field>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <Switch checked={publicarSiteValue} onCheckedChange={setPublicarSiteValue} />
                  <div>
                    <p className="text-sm font-medium">Publicar no site</p>
                    <p className="text-xs text-muted-foreground">Imóvel aparece no site público da imobiliária</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <Switch checked={publicarPortaisValue} onCheckedChange={setPublicarPortaisValue} />
                  <div>
                    <p className="text-sm font-medium">Publicar em portais</p>
                    <p className="text-xs text-muted-foreground">Imóvel aparece nos portais (OLX, VivaReal, etc.)</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <Switch checked={destaqueValue} onCheckedChange={setDestaqueValue} />
                  <div>
                    <p className="text-sm font-medium">Imóvel em destaque</p>
                    <p className="text-xs text-muted-foreground">Aparece em destaque no site da imobiliária</p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Etapa 6 — Revisão */}
          {etapa === 6 && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <ItemRevisao rotulo="Título" valor={tituloValue} />
                <ItemRevisao rotulo="Tipo" valor={opcoesTipo.find((o) => o.value === tipoValue)?.label || "—"} />
                <ItemRevisao rotulo="Finalidade" valor={opcoesFinalidade.find((o) => o.value === finalidadeValue)?.label || "—"} />
                <ItemRevisao rotulo="Código interno" valor={codigoInternoValue || "—"} />
                <ItemRevisao
                  rotulo="Endereço"
                  valor={[logradouroValue, numeroValue && `, ${numeroValue}`, bairroValue && ` — ${bairroValue}`, cidadeValue && `, ${cidadeValue}/${estadoValue}`].filter(Boolean).join("") || "—"}
                />
                <ItemRevisao rotulo="CEP" valor={cepValue || "—"} />
                <ItemRevisao rotulo="Quartos / suítes / banheiros / vagas" valor={`${quartosValue || 0} / ${suitesValue || 0} / ${banheirosValue || 0} / ${vagasValue || 0}`} />
                <ItemRevisao rotulo="Área total / construída" valor={`${areaTotalValue || 0} m² / ${areaConstruidaValue || 0} m²`} />
                <ItemRevisao rotulo="Preço" valor={valorValue ? `R$ ${valorValue.toLocaleString("pt-BR")}` : "—"} />
                <ItemRevisao rotulo="Condomínio / IPTU" valor={`R$ ${valorCondominioValue || 0} / R$ ${valorIptuValue || 0}`} />
                <ItemRevisao rotulo="Publicação" valor={[publicarSiteValue && "Site", publicarPortaisValue && "Portais", destaqueValue && "Destaque"].filter(Boolean).join(", ") || "—"} />
              </div>
              {descricaoValue && (
                <div className="rounded-lg border bg-muted/40 p-3">
                  <p className="text-xs font-medium text-muted-foreground">Descrição</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm">{descricaoValue}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navegação */}
      <div className="flex items-center justify-between gap-3">
        <div>
          {etapa > 1 && (
            <Button type="button" variant="outline" onClick={etapaAnterior}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              Anterior
            </Button>
          )}
        </div>
        <div className="flex gap-3">
          <Button type="button" variant="outline" render={<Link href="/imoveis" />}>
            Cancelar
          </Button>
          {etapa < ETAPAS.length ? (
            <Button type="button" onClick={proximaEtapa}>
              Próximo
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button type="button" onClick={handleSalvar} disabled={pendente}>
              {pendente ? (imovel ? "Salvando..." : "Cadastrando...") : imovel ? "Salvar alterações" : "Cadastrar imóvel"}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function ItemRevisao({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{rotulo}</p>
      <p className="text-sm">{valor}</p>
    </div>
  )
}
