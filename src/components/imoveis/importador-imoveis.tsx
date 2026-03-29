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
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { importarImoveis } from "@/actions/importacao-imoveis"
import { CAMPOS_OBRIGATORIOS } from "@/types/importacao"
import type { ResultadoValidacao, ResultadoImportacao } from "@/types/importacao"
import { labelsTipoImovel, labelsFinalidade } from "@/lib/constantes/imoveis"
import { baixarModelo, parsearArquivo, validarLinhas } from "./importador-helpers"

// ============================================================
// Componente
// ============================================================

type Etapa = "upload" | "preview" | "resultado"

export function ImportadorImoveis() {
  const [etapa, setEtapa] = useState<Etapa>("upload")
  const [arrastando, setArrastando] = useState(false)
  const [validacoes, setValidacoes] = useState<ResultadoValidacao[]>([])
  const [importando, setImportando] = useState(false)
  const [progresso, setProgresso] = useState(0)
  const [resultado, setResultado] = useState<ResultadoImportacao | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [nomeArquivo, setNomeArquivo] = useState("")
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

  const handleArquivo = useCallback(async (file: File) => {
    setErro(null)

    const tamanhoMax = 10 * 1024 * 1024 // 10MB
    if (file.size > tamanhoMax) {
      setErro("Arquivo muito grande. O limite é 10MB.")
      return
    }

    try {
      setNomeArquivo(file.name)
      const { dados } = await parsearArquivo(file)

      if (!dados.length) {
        setErro("O arquivo não contém dados.")
        return
      }

      // Verificar se tem os campos obrigatórios
      const camposEncontrados = new Set(Object.keys(dados[0]))
      const camposFaltando = CAMPOS_OBRIGATORIOS.filter(
        (c) => !camposEncontrados.has(c)
      )

      if (camposFaltando.length > 0) {
        setErro(
          `Colunas obrigatórias não encontradas: ${camposFaltando.join(", ")}. Use o modelo de planilha para referência.`
        )
        return
      }

      const resultados = validarLinhas(dados)
      setValidacoes(resultados)
      setPaginaPreview(1)
      setEtapa("preview")
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
      const res = await importarImoveis(linhasValidas)
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
          toast.success(`${res.resultado.criados} imóveis importados com sucesso!`)
        }
      }
    } catch {
      setErro("Erro inesperado ao importar. Tente novamente.")
      toast.error("Erro ao importar imóveis")
    } finally {
      setImportando(false)
    }
  }

  function resetar() {
    setEtapa("upload")
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
            {/* Área de drag-and-drop */}
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

            {/* Erro */}
            {erro && (
              <div className="mt-4 flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{erro}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card de ajuda */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Como funciona</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="shrink-0 mt-0.5">1</Badge>
              <p>Baixe o modelo de planilha e preencha com seus imóveis. Os campos obrigatórios são: Código, Título, Tipo, Finalidade, Cidade e Estado.</p>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="shrink-0 mt-0.5">2</Badge>
              <p>Faça upload do arquivo preenchido. O sistema vai validar cada linha e mostrar um preview antes de importar.</p>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="shrink-0 mt-0.5">3</Badge>
              <p>Confirme a importação. Apenas as linhas válidas serão importadas — as com erro serão listadas para correção.</p>
            </div>
            <Button variant="outline" size="sm" onClick={baixarModelo}>
              <Download className="mr-2 h-4 w-4" />
              Baixar modelo de planilha
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // =========================================================
  // Etapa 2 — Preview
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
                    <th className="px-3 py-2 text-left font-medium">Código</th>
                    <th className="px-3 py-2 text-left font-medium">Título</th>
                    <th className="px-3 py-2 text-left font-medium">Tipo</th>
                    <th className="px-3 py-2 text-left font-medium">Finalidade</th>
                    <th className="px-3 py-2 text-left font-medium">Cidade</th>
                    <th className="px-3 py-2 text-left font-medium">UF</th>
                    <th className="px-3 py-2 text-left font-medium">Preço Venda</th>
                  </tr>
                </thead>
                <tbody>
                  {validacoesVisiveis.map((v) => (
                    <tr
                      key={v.linha}
                      className={`border-b ${
                        v.valido ? "" : "bg-destructive/5"
                      }`}
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
                      <td className="px-3 py-2 font-mono text-xs">
                        {v.dados.codigo_interno || "—"}
                      </td>
                      <td className="max-w-[200px] truncate px-3 py-2">
                        {v.dados.titulo || "—"}
                      </td>
                      <td className="px-3 py-2">
                        {v.valido
                          ? labelsTipoImovel[v.dados.tipo] || v.dados.tipo
                          : v.dados.tipo || "—"}
                      </td>
                      <td className="px-3 py-2">
                        {v.valido
                          ? labelsFinalidade[v.dados.finalidade] || v.dados.finalidade
                          : v.dados.finalidade || "—"}
                      </td>
                      <td className="px-3 py-2">{v.dados.cidade || "—"}</td>
                      <td className="px-3 py-2">{v.dados.estado || "—"}</td>
                      <td className="px-3 py-2">
                        {v.dados.valor
                          ? Number(v.dados.valor).toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginação da tabela */}
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

        {/* Erro do servidor */}
        {erro && (
          <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{erro}</span>
          </div>
        )}

        {/* Ações */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={resetar}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Voltar
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
              Importar {validas.length} {validas.length === 1 ? "imóvel" : "imóveis"}
            </Button>
          </div>
        </div>

        {/* Progress durante importação */}
        {importando && (
          <div className="space-y-2">
            <Progress value={progresso} />
            <p className="text-center text-sm text-muted-foreground">
              Importando imóveis...
            </p>
          </div>
        )}
      </div>
    )
  }

  // =========================================================
  // Etapa 3 — Resultado
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
                {resultado.criados} {resultado.criados === 1 ? "imóvel importado" : "imóveis importados"} com sucesso!
              </p>
              <p className="text-sm text-muted-foreground">
                Todos os imóveis já estão disponíveis na listagem
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
                    <th className="px-3 py-2 text-left font-medium">Código</th>
                    <th className="px-3 py-2 text-left font-medium">Erro</th>
                  </tr>
                </thead>
                <tbody>
                  {resultado.erros.map((e, i) => (
                    <tr key={i} className="border-b">
                      <td className="px-3 py-2 text-muted-foreground">{e.linha}</td>
                      <td className="px-3 py-2 font-mono text-xs">{e.codigo_interno}</td>
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
        <Button render={<Link href="/imoveis" />}>
          Ver imóveis
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
