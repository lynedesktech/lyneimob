"use client"

import { useState } from "react"
import { Bot, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { gerarAnaliseRoadmap } from "@/actions/roadmap"
import type { AnaliseRoadmap } from "@/types/roadmap"

interface AnaliseIaProps {
  analiseInicial: AnaliseRoadmap | null
}

export function AnaliseIa({ analiseInicial }: AnaliseIaProps) {
  const [analise, setAnalise] = useState(analiseInicial)
  const [gerando, setGerando] = useState(false)

  async function handleGerar() {
    setGerando(true)
    try {
      const resultado = await gerarAnaliseRoadmap()
      if (resultado.erro) {
        toast.error(resultado.erro)
      } else {
        toast.success("Análise gerada com sucesso.")
        setAnalise({
          id: crypto.randomUUID(),
          conteudo: resultado.conteudo || "",
          dados_resumo: {} as AnaliseRoadmap["dados_resumo"],
          created_at: new Date().toISOString(),
        })
      }
    } catch {
      toast.error("Erro ao gerar análise.")
    } finally {
      setGerando(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Bot className="h-4 w-4 text-muted-foreground" />
            Análise da IA
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleGerar}
            disabled={gerando}
          >
            <RefreshCw className={`mr-2 h-3.5 w-3.5 ${gerando ? "animate-spin" : ""}`} />
            {gerando ? "Gerando..." : analise ? "Regenerar" : "Gerar análise"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {analise ? (
          <div className="space-y-3">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              {analise.conteudo.split("\n").map((paragrafo, i) => (
                <p key={i} className="text-sm text-foreground leading-relaxed">
                  {paragrafo}
                </p>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Gerada em{" "}
              {new Date(analise.created_at).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-6">
            Clique em &quot;Gerar análise&quot; para a IA avaliar o progresso do projeto.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
