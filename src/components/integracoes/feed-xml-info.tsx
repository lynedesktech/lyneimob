"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Rss, Copy, Check, ExternalLink, ShieldCheck, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

interface ImovelExcluido {
  codigo: string
  titulo: string
  motivos: string[]
}

interface ResultadoValidacao {
  total_publicaveis: number
  total_excluidos: number
  excluidos: ImovelExcluido[]
}

interface FeedXmlInfoProps {
  slug: string
}

export function FeedXmlInfo({ slug }: FeedXmlInfoProps) {
  const [copiado, setCopiado] = useState(false)
  const [validando, setValidando] = useState(false)
  const [resultado, setResultado] = useState<ResultadoValidacao | null>(null)

  const appUrl = typeof window !== "undefined"
    ? window.location.origin
    : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  const feedUrl = `${appUrl}/api/xml/${slug}`

  async function copiarUrl() {
    await navigator.clipboard.writeText(feedUrl)
    setCopiado(true)
    toast.success("URL copiada!")
    setTimeout(() => setCopiado(false), 2000)
  }

  async function validarFeed() {
    setValidando(true)
    setResultado(null)
    try {
      const resposta = await fetch(`${appUrl}/api/xml/${slug}/validar`)
      if (!resposta.ok) {
        toast.error("Erro ao validar feed")
        return
      }
      const dados = await resposta.json() as ResultadoValidacao
      setResultado(dados)

      if (dados.total_excluidos === 0) {
        toast.success(`Feed OK — ${dados.total_publicaveis} imóveis publicados`)
      } else {
        toast.warning(`${dados.total_excluidos} imóvel(is) excluído(s) do feed`)
      }
    } catch {
      toast.error("Erro ao validar feed")
    } finally {
      setValidando(false)
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
            <Rss className="h-6 w-6" />
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <h3 className="font-semibold text-lg">Feed XML VRSync</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Use esta URL para publicar seus imóveis nos portais. Cole no painel do ZAP, OLX ou VivaReal na seção de integração XML.
              </p>
            </div>

            <div className="flex gap-2">
              <Input
                readOnly
                value={feedUrl}
                className="font-mono text-sm bg-muted/50"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={copiarUrl}
                className="shrink-0"
              >
                {copiado ? (
                  <Check className="h-4 w-4 text-success" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0"
                onClick={() => window.open(feedUrl, "_blank")}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                onClick={validarFeed}
                disabled={validando}
                className="shrink-0"
              >
                {validando ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <ShieldCheck className="h-4 w-4 mr-2" />
                )}
                Validar
              </Button>
            </div>

            {resultado && (
              <div className={`rounded-lg p-3 text-sm space-y-2 ${
                resultado.total_excluidos === 0
                  ? "bg-success/10 text-success-foreground"
                  : "bg-warning/10 text-warning-foreground"
              }`}>
                <div className="flex items-center gap-2 font-medium">
                  {resultado.total_excluidos === 0 ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      {resultado.total_publicaveis} imóvel(is) no feed — tudo OK
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4 text-warning" />
                      {resultado.total_publicaveis} no feed, {resultado.total_excluidos} excluído(s)
                    </>
                  )}
                </div>

                {resultado.excluidos.length > 0 && (
                  <div className="space-y-1 text-xs">
                    {resultado.excluidos.map((item) => (
                      <div key={item.codigo} className="flex items-start gap-2 py-1 border-t border-current/10">
                        <span className="font-mono font-medium shrink-0">{item.codigo}</span>
                        <span className="text-muted-foreground">{item.titulo}</span>
                        <span className="ml-auto shrink-0">{item.motivos.join(", ")}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
              <p><strong>Como funciona:</strong></p>
              <p>1. Copie a URL acima</p>
              <p>2. Acesse o painel do portal (ZAP, OLX, VivaReal)</p>
              <p>3. Cole na seção &quot;Integração XML&quot; ou &quot;Feed de imóveis&quot;</p>
              <p>4. O portal sincroniza automaticamente a cada 12-24 horas</p>
              <p className="mt-2">Apenas imóveis com status &quot;Disponível&quot;, pelo menos 1 foto e descrição com 20+ caracteres aparecem no feed.</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
