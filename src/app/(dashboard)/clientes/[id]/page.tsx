import Link from "next/link"
import { redirect } from "next/navigation"
import { criarClienteServer } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StatusBadgeCliente } from "@/components/clientes/status-badge-cliente"
import { ScoreBadge } from "@/components/clientes/score-badge"
import { InteressesCliente } from "@/components/clientes/interesses-cliente"
import { TimelineInteracoes } from "@/components/clientes/timeline-interacoes"
import { MatchImoveis } from "@/components/clientes/match-imoveis"
import { IACliente } from "@/components/clientes/ia-cliente"
import { BotaoExcluirCliente } from "@/components/clientes/botao-excluir-cliente"
import {
  ArrowLeft,
  Pencil,
  Phone,
  Mail,
  MessageCircle,
  User,
  FileText,
  Sparkles,
} from "lucide-react"

type Params = Promise<{ id: string }>

const labelsTipo: Record<string, string> = {
  comprador: "Comprador",
  vendedor: "Vendedor",
  locatario: "Locatário",
  proprietario: "Proprietário",
}

const labelsOrigem: Record<string, string> = {
  indicacao: "Indicação",
  portal: "Portal",
  site: "Site",
  whatsapp: "WhatsApp",
  outro: "Outro",
}

export default async function DetalheClientePage({
  params,
}: {
  params: Params
}) {
  const { id } = await params
  const supabase = await criarClienteServer()

  const { data: cliente } = await supabase
    .from("clientes")
    .select("*, cliente_interesses(*), cliente_interacoes(*, usuarios(nome))")
    .eq("id", id)
    .order("data", { referencedTable: "cliente_interacoes", ascending: false })
    .single()

  if (!cliente) {
    redirect("/clientes")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            render={<Link href="/clientes" />}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">
                {cliente.nome}
              </h1>
              <StatusBadgeCliente status={cliente.status} />
              {cliente.score_lead > 0 && (
                <ScoreBadge score={cliente.score_lead} />
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {labelsTipo[cliente.tipo] ?? cliente.tipo} • Origem:{" "}
              {labelsOrigem[cliente.origem] ?? cliente.origem}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            render={<Link href={`/clientes/${id}/editar`} />}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </Button>
          <BotaoExcluirCliente clienteId={id} />
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="informacoes">
        <TabsList>
          <TabsTrigger value="informacoes">Informações</TabsTrigger>
          <TabsTrigger value="interesses">
            Interesses ({cliente.cliente_interesses?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="timeline">
            Timeline ({cliente.cliente_interacoes?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="match">Match</TabsTrigger>
          <TabsTrigger value="ia">IA</TabsTrigger>
        </TabsList>

        {/* Tab Informações */}
        <TabsContent value="informacoes">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Dados Pessoais */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <User className="h-4 w-4" />
                  Dados pessoais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Nome</p>
                  <p className="font-medium">{cliente.nome}</p>
                </div>
                {cliente.cpf_cnpj && (
                  <div>
                    <p className="text-sm text-muted-foreground">CPF / CNPJ</p>
                    <p className="font-medium">{cliente.cpf_cnpj}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Tipo</p>
                  <p className="font-medium">
                    {labelsTipo[cliente.tipo] ?? cliente.tipo}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Origem</p>
                  <p className="font-medium">
                    {labelsOrigem[cliente.origem] ?? cliente.origem}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cadastrado em</p>
                  <p className="font-medium">
                    {new Date(cliente.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Contato */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Phone className="h-4 w-4" />
                  Contato
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {cliente.email ? (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{cliente.email}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Email não informado
                  </p>
                )}

                {cliente.telefone ? (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Telefone</p>
                      <p className="font-medium">{cliente.telefone}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Telefone não informado
                  </p>
                )}

                {cliente.whatsapp ? (
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">WhatsApp</p>
                      <p className="font-medium">{cliente.whatsapp}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    WhatsApp não informado
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Observações */}
            {cliente.observacoes && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileText className="h-4 w-4" />
                    Observações
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                    {cliente.observacoes}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Resumo IA */}
            {cliente.resumo_ia && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Sparkles className="h-4 w-4" />
                    Resumo IA
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-sm">
                    {cliente.resumo_ia}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Tab Interesses */}
        <TabsContent value="interesses">
          <InteressesCliente
            clienteId={id}
            interesses={cliente.cliente_interesses ?? []}
          />
        </TabsContent>

        {/* Tab Timeline */}
        <TabsContent value="timeline">
          <TimelineInteracoes
            clienteId={id}
            interacoes={cliente.cliente_interacoes ?? []}
          />
        </TabsContent>

        {/* Tab Match */}
        <TabsContent value="match">
          <MatchImoveis
            organizacaoId={cliente.organizacao_id}
            interesses={cliente.cliente_interesses ?? []}
          />
        </TabsContent>

        {/* Tab IA */}
        <TabsContent value="ia">
          <IACliente
            clienteId={id}
            scoreAtual={cliente.score_lead}
            resumoAtual={cliente.resumo_ia}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
