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
  MapPin,
  Calendar,
  DollarSign,
  ArrowLeft,
  MessageCircle,
  UserCheck,
  FileText,
} from "lucide-react"
import { labelsTipoNegocio } from "@/lib/constantes"
import { formatarPreco, formatarData } from "@/lib/formatadores"
import { StatusBadge } from "@/components/ui/status-badge"
import { configStatusNegocio } from "@/lib/constantes/status-configs"
import { AcoesNegocio } from "@/components/negocios/acoes-negocio"
import { ConfirmacaoExclusao } from "@/components/ui/confirmacao-exclusao"
import { excluirNegocio } from "@/actions/negocios"
import { IANegocio } from "@/components/negocios/ia-negocio"
import { CardSugestaoAcao } from "@/components/negocios/card-sugestao-acao"
import { ConversaNegocio } from "@/components/negocios/conversa-negocio"
import { buscarConversaPorNegocio } from "@/actions/whatsapp"
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
      "*, clientes(id, nome, telefone, email), imoveis(id, titulo, codigo, tipo), lotes(id, quadra, numero_lote, unidade, valor, loteamento_id, loteamentos(id, nome)), usuarios(id, nome), pipeline_etapas(*)"
    )
    .eq("id", id)
    .single()

  if (error || !negocio) redirect("/negocios")

  const n = negocio as unknown as NegocioComRelacoes

  // Busca conversa WhatsApp vinculada ao negócio
  const conversaWhatsapp = await buscarConversaPorNegocio(id)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" render={<Link href="/negocios" />}>
              <ArrowLeft className="mr-1 h-4 w-4" />
              Pipeline
            </Button>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{n.titulo}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={n.status} config={configStatusNegocio} />
            {n.pipeline_etapas && (
              <Badge variant="outline" style={{ borderColor: n.pipeline_etapas.cor }}>
                {n.pipeline_etapas.nome}
              </Badge>
            )}
            <Badge variant="outline">
              {labelsTipoNegocio[n.tipo]}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <AcoesNegocio negocio={n} />
          <Button variant="outline" size="sm" render={<Link href={`/negocios/${n.id}/editar`} />}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </Button>
          <ConfirmacaoExclusao
            titulo="Excluir negócio"
            descricao={`Tem certeza que deseja excluir o negócio "${n.titulo}"? Esta ação não pode ser desfeita.`}
            onConfirmar={excluirNegocio.bind(null, n.id)}
            tamanho="sm"
          />
        </div>
      </div>

      {/* Conteúdo com Tabs */}
      <Tabs defaultValue="informacoes">
        <TabsList>
          <TabsTrigger value="informacoes">Informações</TabsTrigger>
          <TabsTrigger value="conversas">Conversas</TabsTrigger>
          <TabsTrigger value="ia">IA</TabsTrigger>
        </TabsList>

        {/* Tab Informações — layout 2 colunas */}
        <TabsContent value="informacoes">
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">

            {/* Coluna principal (esquerda) */}
            <div className="space-y-4 lg:col-span-2">

              {/* Sugestão de próxima ação (apenas negócios abertos) */}
              {n.status === "aberto" && (
                <CardSugestaoAcao
                  negocioId={n.id}
                  sugestaoIA={n.sugestao_ia}
                  sugestaoResumo={n.sugestao_ia_resumo}
                />
              )}

              {/* Detalhes */}
              {(n.observacoes || n.motivo_perda) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <FileText className="h-4 w-4" />
                      Detalhes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    {n.observacoes && (
                      <div>
                        <p className="text-xs text-muted-foreground">Observações</p>
                        <p className="mt-1 whitespace-pre-wrap">{n.observacoes}</p>
                      </div>
                    )}
                    {n.motivo_perda && (
                      <div>
                        <p className="text-xs text-muted-foreground">Motivo da perda</p>
                        <p className="mt-1 text-destructive">{n.motivo_perda}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Estado vazio quando não há observações */}
              {!n.observacoes && !n.motivo_perda && n.status !== "aberto" && (
                <Card>
                  <CardContent className="py-8 text-center text-sm text-muted-foreground">
                    Nenhuma informação adicional registrada.
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar (direita) */}
            <div className="space-y-4">

              {/* Card Valor */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <DollarSign className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Valor</p>
                      <p className="text-xl font-bold">{formatarPreco(n.valor)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card Pessoas */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium">
                    <User className="h-4 w-4" />
                    Pessoas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Cliente</p>
                    {n.clientes ? (
                      <Link
                        href={`/clientes/${n.clientes.id}`}
                        className="font-medium hover:underline"
                      >
                        {n.clientes.nome}
                      </Link>
                    ) : (
                      <p className="text-muted-foreground">—</p>
                    )}
                  </div>
                  <Separator />
                  <div>
                    <p className="text-xs text-muted-foreground">Corretor</p>
                    <div className="flex items-center gap-1.5">
                      <UserCheck className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-medium">{n.usuarios?.nome || "—"}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card Imóvel */}
              {n.imoveis && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm font-medium">
                      <Building2 className="h-4 w-4" />
                      Imóvel vinculado
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm">
                    <Link
                      href={`/imoveis/${n.imoveis.id}`}
                      className="font-medium hover:underline"
                    >
                      {n.imoveis.codigo} — {n.imoveis.titulo}
                    </Link>
                  </CardContent>
                </Card>
              )}

              {/* Card Lote */}
              {n.lotes && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm font-medium">
                      <MapPin className="h-4 w-4" />
                      Lote vinculado
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm">
                    <Link
                      href={`/loteamentos/${n.lotes.loteamento_id}`}
                      className="font-medium hover:underline"
                    >
                      {n.lotes.loteamentos?.nome}
                    </Link>
                    <p className="text-muted-foreground">
                      Quadra {n.lotes.quadra}, Lote {n.lotes.numero_lote}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Card Datas */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium">
                    <Calendar className="h-4 w-4" />
                    Datas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {n.previsao_fechamento && (
                    <div>
                      <p className="text-xs text-muted-foreground">Previsão de fechamento</p>
                      <p className="font-medium">{formatarData(n.previsao_fechamento)}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground">Criado em</p>
                    <p className="font-medium">{formatarData(n.created_at)}</p>
                  </div>
                  {n.data_ganho && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-xs text-muted-foreground">Data do ganho</p>
                        <p className="font-medium text-success">{formatarData(n.data_ganho)}</p>
                      </div>
                    </>
                  )}
                  {n.data_perda && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-xs text-muted-foreground">Data da perda</p>
                        <p className="font-medium text-destructive">{formatarData(n.data_perda)}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="conversas">
          {conversaWhatsapp ? (
            <ConversaNegocio conversaId={conversaWhatsapp.id} />
          ) : (
            <div className="mt-4 flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
              <MessageCircle className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Nenhuma conversa WhatsApp vinculada a este negócio.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="ia">
          <IANegocio negocio={n} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
