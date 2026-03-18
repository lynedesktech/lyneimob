"use client"

import { useState, useCallback, useRef } from "react"
import Link from "next/link"
import { toast } from "sonner"
import {
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  ArrowLeftRight,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { importarLotes } from "@/actions/importacao-lotes"
import {
  parsearArquivoBruto,
  sugerirMapeamento,
  aplicarMapeamento,
  validarLinhasLotes,
  baixarModeloLotes,
  CAMPOS_SISTEMA,
} from "./importador-helpers-lotes"
import type {
  DadosBrutos,
  Mapeamento,
  ResultadoValidacaoLote,
} from "./importador-helpers-lotes"
import type { ResultadoImportacaoLotes } from "@/types/importacao-lotes"

// ============================================================
// Componente
// ============================================================

type Etapa = "upload" | "mapeamento" | "preview" | "resultado"

type ImportadorLotesProps = {
  loteamentoId: string
}

export function ImportadorLotes({ loteamentoId }: ImportadorLotesProps) {
  const [etapa, setEtapa] = useState<Etapa>("upload")
  const [arrastando, setArrastando] = useState(false)
  const [nomeArquivo, setNomeArquivo] = useState("")
  const [erro, setErro] = useState<string | null>(null)

  // Dados brutos do arquivo
  const [dadosBrutos, setDadosBrutos] = useState<DadosBrutos | null>(null)

  // Mapeamento definido pelo usuário
  const [mapeamento, setMapeamento] = useState<Mapeamento>({})

  // Preview e importação
  const [validacoes, setValidacoes] = useState<ResultadoValidacaoLote[]>([])
  const [importando, setImportando] = useState(false)
  const [progresso, setProgresso] = useState(0)
  const [resultado, setResultado] = useState<ResultadoImportacaoLotes | null>(null)
  const [paginaPreview, setPaginaPreview] = useState(1)

  const inputRef = useRef<HTMLInputElement>(null)

  const validas = validacoes.filter((v) => v.valido)
  const invalidas = validacoes.filter((v) => !v.valido)

  // Preview paginado (20 por página)
  const POR_PAGINA = 20
  const totalPaginas = Math.ceil(validacoes.length / POR_PAGINA)
  const validacoesVisiveis = validacoes.slice(
    (paginaPreview - 1) * POR_PAGINA,
    paginaPreview * POR_PAGINA
  )

  // Verificar se campos obrigatórios estão mapeados
  const obrigatoriosMapeados = CAMPOS_SISTEMA
    .filter((c) => c.obrigatorio)
    .every((c) => mapeamento[c.campo] !== null && mapeamento[c.campo] !== undefined)

  // ---- Handlers ----

  const handleArquivo = useCallback(async (file: File) => {
    setErro(null)

    const tamanhoMax = 10 * 1024 * 1024 // 10MB
    if (file.size > tamanhoMax) {
      setErro("Arquivo muito grande. O limite é 10MB.")
      return
    }

    try {
      setNomeArquivo(file.name)
      const dados = await parsearArquivoBruto(file)

      if (!dados.linhas.length) {
        setErro("O arquivo não contém dados.")
        return
      }

      setDadosBrutos(dados)

      // Sugerir mapeamento automático
      const sugestao = sugerirMapeamento(dados.cabecalhos)
      setMapeamento(sugestao)
      setEtapa("mapeamento")
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao processar arquivo.")
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setArrastando(false)
      const file = e.dataTransfer.files[0]
      if (file) handleArquivo(file)
    },
    [handleArquivo]
  )

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleArquivo(file)
    },
    [handleArquivo]
  )

  function handleAlterarMapeamento(campo: string, valor: string) {
    setMapeamento((prev) => ({
      ...prev,
      [campo]: valor === "__nao_mapear__" ? null : Number(valor),
    }))
  }

  function handleContinuarParaPreview() {
    if (!dadosBrutos) return

    const dados = aplicarMapeamento(dadosBrutos.linhas, mapeamento)
    const resultados = validarLinhasLotes(dados)
    setValidacoes(resultados)
    setPaginaPreview(1)
    setEtapa("preview")
  }

  async function handleImportar() {
    const linhasValidas = validas
      .map((v) => v.dadosValidados!)
      .filter(Boolean)

    if (!linhasValidas.length) return

    setImportando(true)
    setProgresso(20)
    setErro(null)

    try {
      setProgresso(50)
      const res = await importarLotes(loteamentoId, linhasValidas)
      setProgresso(100)

      if (res.erro && !res.resultado) {
        setErro(res.erro)
        toast.error(res.erro)
        setImportando(false)
        return
      }

      if (res.resultado) {
        setResultado(res.resultado)
        setEtapa("resultado")

        if (res.resultado.criados > 0) {
          toast.success(`${res.resultado.criados} lotes importados com sucesso!`)
        }
      }
    } catch {
      setErro("Erro inesperado ao importar. Tente novamente.")
      toast.error("Erro ao importar lotes")
    } finally {
      setImportando(false)
    }
  }

  function resetar() {
    setEtapa("upload")
    setDadosBrutos(null)
    setMapeamento({})
    setValidacoes([])
    setResultado(null)
    setErro(null)
    setNomeArquivo("")
    setProgresso(0)
    setPaginaPreview(1)
    if (inputRef.current) inputRef.current.value = ""
  }

  // =========================================================
  // Etapa 1 — Upload
  // =========================================================
  if (etapa === "upload") {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-6">
            <div
              className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors ${
                arrastando
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-primary/50"
              }`}
              onDragOver={(e) => {
                e.preventDefault()
                setArrastando(true)
              }}
              onDragLeave={() => setArrastando(false)}
              onDrop={handleDrop}
            >
              <Upload className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <p className="mb-2 text-lg font-medium">
                Arraste seu arquivo aqui
              </p>
              <p className="mb-4 text-sm text-muted-foreground">
                ou clique para selecionar — CSV, XLSX ou XLS (até 10MB)
              </p>
              <Button
                variant="outline"
                onClick={() => inputRef.current?.click()}
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Selecionar arquivo
              </Button>
              <input
                ref={inputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={handleInputChange}
              />
            </div>

            {erro && (
              <div className="mt-4 flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{erro}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Como funciona</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="shrink-0 mt-0.5">1</Badge>
              <p>Faça upload da sua planilha de lotes. Pode ser qualquer formato — o sistema aceita colunas com nomes diferentes.</p>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="shrink-0 mt-0.5">2</Badge>
              <p>Conecte cada coluna da sua planilha ao campo correspondente do sistema. Os campos obrigatórios são: Quadra, Número do Lote e Valor.</p>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="shrink-0 mt-0.5">3</Badge>
              <p>Confira o preview dos dados. Apenas as linhas válidas serão importadas — as com erro serão listadas para correção.</p>
            </div>
            <Button variant="outline" size="sm" onClick={baixarModeloLotes}>
              <Download className="mr-2 h-4 w-4" />
              Baixar modelo de planilha
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // =========================================================
  // Etapa 2 — Mapeamento
  // =========================================================
  if (etapa === "mapeamento" && dadosBrutos) {
    return (
      <div className="space-y-4">
        {/* Resumo do arquivo */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{nomeArquivo}</p>
                <p className="text-xs text-muted-foreground">
                  {dadosBrutos.linhas.length} linhas · {dadosBrutos.cabecalhos.length} colunas detectadas
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card de mapeamento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ArrowLeftRight className="h-4 w-4" />
              Mapeamento de campos
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Conecte cada campo do sistema à coluna correspondente da sua planilha
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {CAMPOS_SISTEMA.map(({ campo, label, obrigatorio }) => {
              const indiceSelecionado = mapeamento[campo]
              // Preview: 3 primeiros valores da coluna selecionada
              const previewValores =
                indiceSelecionado !== null && indiceSelecionado !== undefined
                  ? dadosBrutos.linhas
                      .slice(0, 5)
                      .map((l) => String(l[indiceSelecionado] ?? "").trim())
                      .filter(Boolean)
                  : []

              return (
                <div key={campo} className="rounded-lg border p-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {label}
                      </span>
                      {obrigatorio && (
                        <Badge variant="outline" className="text-xs">
                          obrigatório
                        </Badge>
                      )}
                    </div>
                    <Select
                      value={
                        indiceSelecionado !== null && indiceSelecionado !== undefined
                          ? String(indiceSelecionado)
                          : "__nao_mapear__"
                      }
                      onValueChange={(v) => handleAlterarMapeamento(campo, v ?? "__nao_mapear__")}
                    >
                      <SelectTrigger className="w-full sm:w-[240px]">
                        <SelectValue placeholder="Selecionar coluna..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__nao_mapear__">
                          Não mapear
                        </SelectItem>
                        {dadosBrutos.cabecalhos.map((cabecalho, idx) => (
                          <SelectItem key={idx} value={String(idx)}>
                            {cabecalho}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Preview dos valores */}
                  {previewValores.length > 0 && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Preview: {previewValores.join(", ")}
                      {dadosBrutos.linhas.length > 5 ? "..." : ""}
                    </p>
                  )}
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Ações */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={resetar}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <div className="flex items-center gap-2">
            {!obrigatoriosMapeados && (
              <p className="text-sm text-muted-foreground">
                Mapeie os campos obrigatórios para continuar
              </p>
            )}
            <Button
              onClick={handleContinuarParaPreview}
              disabled={!obrigatoriosMapeados}
            >
              Continuar
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // =========================================================
  // Etapa 3 — Preview
  // =========================================================
  if (etapa === "preview") {
    return (
      <div className="space-y-4">
        {/* Resumo */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{nomeArquivo}</p>
                  <p className="text-xs text-muted-foreground">
                    {validacoes.length} linhas encontradas
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="default" className="bg-success text-success-foreground">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  {validas.length} válidas
                </Badge>
                {invalidas.length > 0 && (
                  <Badge variant="destructive">
                    <AlertCircle className="mr-1 h-3 w-3" />
                    {invalidas.length} com erro
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de preview */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-3 py-2 text-left font-medium">#</th>
                    <th className="px-3 py-2 text-left font-medium">Status</th>
                    <th className="px-3 py-2 text-left font-medium">Quadra</th>
                    <th className="px-3 py-2 text-left font-medium">Lote</th>
                    <th className="px-3 py-2 text-left font-medium">Unidade</th>
                    <th className="px-3 py-2 text-right font-medium">Valor</th>
                    <th className="px-3 py-2 text-right font-medium">Área</th>
                    <th className="px-3 py-2 text-left font-medium">Comprador</th>
                    <th className="px-3 py-2 text-left font-medium">Data Venda</th>
                  </tr>
                </thead>
                <tbody>
                  {validacoesVisiveis.map((v) => (
                    <tr
                      key={v.linha}
                      className={`border-b ${v.valido ? "" : "bg-destructive/5"}`}
                    >
                      <td className="px-3 py-2 text-muted-foreground">
                        {v.linha}
                      </td>
                      <td className="px-3 py-2">
                        {v.valido ? (
                          <CheckCircle2 className="h-4 w-4 text-success" />
                        ) : (
                          <div className="flex items-center gap-1">
                            <AlertCircle className="h-4 w-4 text-destructive" />
                            <span
                              className="max-w-[200px] truncate text-xs text-destructive"
                              title={v.erros.join("; ")}
                            >
                              {v.erros[0]}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 font-medium">
                        {v.dados.quadra || "—"}
                      </td>
                      <td className="px-3 py-2">
                        {v.dados.numero_lote || "—"}
                      </td>
                      <td className="px-3 py-2">
                        {v.dados.unidade || "—"}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {v.dados.valor
                          ? Number(v.dados.valor).toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })
                          : "—"}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {v.dados.area ? `${v.dados.area} m²` : "—"}
                      </td>
                      <td className="px-3 py-2">
                        {v.dados.comprador || "—"}
                      </td>
                      <td className="px-3 py-2">
                        {v.dados.data_venda || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {totalPaginas > 1 && (
              <div className="flex items-center justify-center gap-2 border-t p-3">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={paginaPreview <= 1}
                  onClick={() => setPaginaPreview((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  Página {paginaPreview} de {totalPaginas}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={paginaPreview >= totalPaginas}
                  onClick={() => setPaginaPreview((p) => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Erro */}
        {erro && (
          <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{erro}</span>
          </div>
        )}

        {/* Ações */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => setEtapa("mapeamento")}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Voltar ao mapeamento
          </Button>
          <div className="flex items-center gap-2">
            {invalidas.length > 0 && (
              <p className="text-sm text-muted-foreground">
                Apenas linhas válidas serão importadas
              </p>
            )}
            <Button
              onClick={handleImportar}
              disabled={!validas.length || importando}
            >
              {importando ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="mr-2 h-4 w-4" />
              )}
              Importar {validas.length} {validas.length === 1 ? "lote" : "lotes"}
            </Button>
          </div>
        </div>

        {/* Progress */}
        {importando && (
          <div className="space-y-2">
            <Progress value={progresso} />
            <p className="text-center text-sm text-muted-foreground">
              Importando lotes...
            </p>
          </div>
        )}
      </div>
    )
  }

  // =========================================================
  // Etapa 4 — Resultado
  // =========================================================
  return (
    <div className="space-y-4">
      {/* Card de sucesso */}
      {resultado && resultado.criados > 0 && (
        <Card className="border-success/30 bg-success/5">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
              <CheckCircle2 className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-lg font-semibold">
                {resultado.criados} {resultado.criados === 1 ? "lote importado" : "lotes importados"} com sucesso!
              </p>
              <p className="text-sm text-muted-foreground">
                Os lotes já estão disponíveis na tabela do loteamento
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Card de erros */}
      {resultado && resultado.erros.length > 0 && (
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {resultado.erros.length} {resultado.erros.length === 1 ? "linha com erro" : "linhas com erro"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[300px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-3 py-2 text-left font-medium">Linha</th>
                    <th className="px-3 py-2 text-left font-medium">Lote</th>
                    <th className="px-3 py-2 text-left font-medium">Erro</th>
                  </tr>
                </thead>
                <tbody>
                  {resultado.erros.map((e, i) => (
                    <tr key={i} className="border-b">
                      <td className="px-3 py-2 text-muted-foreground">{e.linha}</td>
                      <td className="px-3 py-2 font-mono text-xs">{e.unidade}</td>
                      <td className="px-3 py-2 text-destructive">{e.erro}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Erro geral */}
      {erro && !resultado && (
        <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{erro}</span>
        </div>
      )}

      {/* Ações finais */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={resetar}>
          <Upload className="mr-2 h-4 w-4" />
          Importar mais
        </Button>
        <Button render={<Link href={`/loteamentos/${loteamentoId}`} />}>
          Ver loteamento
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
