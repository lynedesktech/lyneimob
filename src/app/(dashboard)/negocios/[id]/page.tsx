import { redirect } from "next/navigation"
import Link from "next/link"
import { criarClienteServer } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import {
  Pencil,
  User,
  Building2,
  Calendar,
  DollarSign,
  ArrowLeft,
} from "lucide-react"
import { AcoesNegocio } from "@/components/negocios/acoes-negocio"
import { BotaoExcluirNegocio } from "@/components/negocios/botao-excluir-negocio"
import { IANegocio } from "@/components/negocios/ia-negocio"
import type { NegocioComRelacoes } from "@/types/database"

interface Props {
  params: Promise<{ id: string }>
}

export default async function DetalheNegocioPage({ params }: Props) {
  const { id } = await params
  const supabase = await criarClienteServer()

  const { data: negocio, error } = await supabase
    .from("negocios")
    .select(
      "*, clientes(id, nome, telefone, email), imoveis(id, titulo, codigo, tipo), usuarios(id, nome), pipeline_etapas(*)"
    )
    .eq("id", id)
    .single()

  if (error || !negocio) redirect("/negocios")

  const n = negocio as unknown as NegocioComRelacoes

  const formatarValor = (valor: number | null) => {
    if (!valor) return "Não definido"
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor)
  }

  const formatarData = (data: string | null) => {
    if (!data) return "—"
    return new Intl.DateTimeFormat("pt-BR").format(new Date(data))
  }

  const corStatus = {
    aberto: "default" as const,
    ganho: "default" as const,
    perdido: "destructive" as const,
  }

  const labelStatus = {
    aberto: "Aberto",
    ganho: "Ganho",
    perdido: "Perdido",
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" render={<Link href="/negocios" />}>
              <ArrowLeft className="mr-1 h-4 w-4" />
              Pipeline
            </Button>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{n.titulo}</h1>
          <div className="flex items-center gap-2">
            <Badge variant={corStatus[n.status]}>
              {n.status === "ganho" && "✓ "}
              {labelStatus[n.status]}
            </Badge>
            {n.pipeline_etapas && (
              <Badge variant="outline" style={{ borderColor: n.pipeline_etapas.cor }}>
                {n.pipeline_etapas.nome}
              </Badge>
            )}
            <Badge variant="outline">
              {n.tipo === "venda" ? "Venda" : "Aluguel"}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <AcoesNegocio negocio={n} />
          <Button variant="outline" size="sm" render={<Link href={`/negocios/${n.id}/editar`} />}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </Button>
          <BotaoExcluirNegocio negocioId={n.id} titulo={n.titulo} />
        </div>
      </div>

      {/* Conteúdo com Tabs */}
      <Tabs defaultValue="informacoes">
        <TabsList>
          <TabsTrigger value="informacoes">Informações</TabsTrigger>
          <TabsTrigger value="ia">IA</TabsTrigger>
        </TabsList>

        <TabsContent value="informacoes" className="space-y-4">
          {/* Cards de resumo */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <DollarSign className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Valor</p>
                  <p className="text-lg font-bold">{formatarValor(n.valor)}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <User className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Cliente</p>
                  {n.clientes ? (
                    <Link
                      href={`/clientes/${n.clientes.id}`}
                      className="text-sm font-medium hover:underline"
                    >
                      {n.clientes.nome}
                    </Link>
                  ) : (
                    <p className="text-sm">—</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <Building2 className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Imóvel</p>
                  {n.imoveis ? (
                    <Link
                      href={`/imoveis/${n.imoveis.id}`}
                      className="text-sm font-medium hover:underline"
                    >
                      {n.imoveis.codigo}
                    </Link>
                  ) : (
                    <p className="text-sm">Não vinculado</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <Calendar className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Previsão</p>
                  <p className="text-sm font-medium">
                    {formatarData(n.previsao_fechamento)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detalhes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Detalhes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Corretor</span>
                <span>{n.usuarios?.nome || "—"}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Criado em</span>
                <span>{formatarData(n.created_at)}</span>
              </div>
              {n.data_ganho && (
                <>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Data do ganho</span>
                    <span className="text-green-600 font-medium">
                      {formatarData(n.data_ganho)}
                    </span>
                  </div>
                </>
              )}
              {n.data_perda && (
                <>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Data da perda</span>
                    <span className="text-destructive font-medium">
                      {formatarData(n.data_perda)}
                    </span>
                  </div>
                </>
              )}
              {n.motivo_perda && (
                <>
                  <Separator />
                  <div>
                    <span className="text-muted-foreground">Motivo da perda</span>
                    <p className="mt-1">{n.motivo_perda}</p>
                  </div>
                </>
              )}
              {n.observacoes && (
                <>
                  <Separator />
                  <div>
                    <span className="text-muted-foreground">Observações</span>
                    <p className="mt-1 whitespace-pre-wrap">{n.observacoes}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ia">
          <IANegocio negocio={n} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
