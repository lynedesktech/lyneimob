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
  ArrowLeft,
  Clock,
  User,
  Building2,
  Handshake,
  MoreHorizontal,
  AlertTriangle,
} from "lucide-react"
import { AcoesAtividade } from "@/components/atividades/acoes-atividade"
import { ConfirmacaoExclusao } from "@/components/ui/confirmacao-exclusao"
import { excluirAtividade } from "@/actions/atividades"
import { IAAtividade } from "@/components/atividades/ia-atividade"
import { labelsTipoAtividade, labelsPrioridade, iconesTipoAtividade } from "@/lib/constantes"
import { formatarData, formatarDataHora } from "@/lib/formatadores"
import { StatusBadge } from "@/components/ui/status-badge"
import { configStatusAtividade } from "@/lib/constantes/status-configs"
import type { AtividadeComRelacoes } from "@/types/database"

interface Props {
  params: Promise<{ id: string }>
}

const iconesTipo = iconesTipoAtividade

export default async function DetalheAtividadePage({ params }: Props) {
  const { id } = await params
  const supabase = await criarClienteServer()

  const { data: atividade, error } = await supabase
    .from("atividades")
    .select(
      "*, clientes(id, nome, telefone), imoveis(id, titulo, codigo), negocios(id, titulo, status), usuarios(id, nome)"
    )
    .eq("id", id)
    .single()

  if (error || !atividade) redirect("/atividades")

  const a = atividade as unknown as AtividadeComRelacoes
  const Icone = iconesTipo[a.tipo] || MoreHorizontal

  const estaAtrasada =
    a.status === "pendente" && new Date(a.data_inicio) < new Date()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" render={<Link href="/atividades" />}>
              <ArrowLeft className="mr-1 h-4 w-4" />
              Atividades
            </Button>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{a.titulo}</h1>
          <div className="flex items-center gap-2">
            <StatusBadge status={a.status} config={configStatusAtividade} />
            <Badge variant="outline">
              <Icone className="mr-1 h-3 w-3" />
              {labelsTipoAtividade[a.tipo]}
            </Badge>
            <Badge
              variant="outline"
              className={
                a.prioridade === "alta"
                  ? "border-destructive/30 text-destructive"
                  : a.prioridade === "baixa"
                    ? "border-border text-muted-foreground"
                    : ""
              }
            >
              {labelsPrioridade[a.prioridade]}
            </Badge>
            {estaAtrasada && (
              <Badge variant="destructive">
                <AlertTriangle className="mr-1 h-3 w-3" />
                Atrasada
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <AcoesAtividade atividade={a} />
          <Button variant="outline" size="sm" render={<Link href={`/atividades/${a.id}/editar`} />}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </Button>
          <ConfirmacaoExclusao
              titulo="Excluir atividade"
              descricao={`Tem certeza que deseja excluir a atividade "${a.titulo}"? Esta ação não pode ser desfeita.`}
              onConfirmar={excluirAtividade.bind(null, a.id)}
              tamanho="sm"
            />
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
                <Clock className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Data/Hora</p>
                  <p className="text-sm font-medium">
                    {formatarDataHora(a.data_inicio)}
                  </p>
                  {a.data_fim && (
                    <p className="text-xs text-muted-foreground">
                      até {formatarDataHora(a.data_fim)}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <User className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Cliente</p>
                  {a.clientes ? (
                    <Link
                      href={`/clientes/${a.clientes.id}`}
                      className="text-sm font-medium hover:underline"
                    >
                      {a.clientes.nome}
                    </Link>
                  ) : (
                    <p className="text-sm">Não vinculado</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <Building2 className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Imóvel</p>
                  {a.imoveis ? (
                    <Link
                      href={`/imoveis/${a.imoveis.id}`}
                      className="text-sm font-medium hover:underline"
                    >
                      {a.imoveis.codigo}
                    </Link>
                  ) : (
                    <p className="text-sm">Não vinculado</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <Handshake className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Negócio</p>
                  {a.negocios ? (
                    <Link
                      href={`/negocios/${a.negocios.id}`}
                      className="text-sm font-medium hover:underline"
                    >
                      {a.negocios.titulo}
                    </Link>
                  ) : (
                    <p className="text-sm">Não vinculado</p>
                  )}
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
                <span className="text-muted-foreground">Responsável</span>
                <span>{a.usuarios?.nome || "—"}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Criado em</span>
                <span>{formatarData(a.created_at)}</span>
              </div>
              {a.data_conclusao && (
                <>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Concluída em</span>
                    <span className="text-success font-medium">
                      {formatarDataHora(a.data_conclusao)}
                    </span>
                  </div>
                </>
              )}
              {a.lembrete && (
                <>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Lembrete</span>
                    <span>{formatarDataHora(a.lembrete)}</span>
                  </div>
                </>
              )}
              {a.descricao && (
                <>
                  <Separator />
                  <div>
                    <span className="text-muted-foreground">Descrição</span>
                    <p className="mt-1 whitespace-pre-wrap">{a.descricao}</p>
                  </div>
                </>
              )}
              {a.notas_pos_atividade && (
                <>
                  <Separator />
                  <div>
                    <span className="text-muted-foreground">
                      Notas pós-atividade
                    </span>
                    <p className="mt-1 whitespace-pre-wrap">
                      {a.notas_pos_atividade}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ia">
          <IAAtividade atividade={a} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
