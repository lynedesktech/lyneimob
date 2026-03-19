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
import { StatusBadge } from "@/components/ui/status-badge"
import { configStatusCliente, configStatusNegocio } from "@/lib/constantes/status-configs"
import { ScoreBadge } from "@/components/clientes/score-badge"
import { InteressesCliente } from "@/components/clientes/interesses-cliente"
import { TimelineInteracoes } from "@/components/clientes/timeline-interacoes"
import { MatchImoveis } from "@/components/clientes/match-imoveis"
import { DefinirContextoIA } from "@/components/ia/definir-contexto-ia"
import { ConfirmacaoExclusao } from "@/components/ui/confirmacao-exclusao"
import { excluirCliente } from "@/actions/clientes"
import {
  ArrowLeft,
  Pencil,
  Phone,
  Mail,
  MessageCircle,
  User,
  FileText,
  Handshake,
  ExternalLink,
} from "lucide-react"
import { labelsTipoCliente, labelsOrigem, labelsTipoNegocio } from "@/lib/constantes"
import { formatarPreco } from "@/lib/formatadores"

type Params = Promise<{ id: string }>

export default async function DetalheClientePage({
  params,
}: {
  params: Params
}) {
  const { id } = await params
  const supabase = await criarClienteServer()

  const { data: cliente } = await supabase
    .from("clientes")
    .select("*, cliente_interesses(*), cliente_interacoes(*, usuarios(nome)), negocios(id, titulo, valor, status, tipo, created_at)")
    .eq("id", id)
    .order("data", { referencedTable: "cliente_interacoes", ascending: false })
    .single()

  if (!cliente) {
    redirect("/clientes")
  }

  const negocios = (cliente as { negocios?: { id: string; titulo: string; valor: number | null; status: string; tipo: string }[] }).negocios ?? []

  return (
    <div className="space-y-6">
      <DefinirContextoIA
        modulo="cliente"
        entidadeId={id}
        dados={{ score_lead: cliente.score_lead, resumo_ia: cliente.resumo_ia }}
      />
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
              <StatusBadge status={cliente.status} config={configStatusCliente} />
              {cliente.score_lead > 0 && (
                <ScoreBadge score={cliente.score_lead} />
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {labelsTipoCliente[cliente.tipo] ?? cliente.tipo} • Origem:{" "}
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
          <ConfirmacaoExclusao
            titulo="Excluir cliente"
            descricao="Tem certeza que deseja excluir este cliente? Todos os interesses, interações e dados serão perdidos. Esta ação não pode ser desfeita."
            onConfirmar={excluirCliente.bind(null, id)}
          />
        </div>
      </div>

      {/* Duas colunas */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Coluna esquerda — informações, preferências, match */}
        <div className="space-y-6 lg:col-span-3">
          {/* Dados pessoais + Contato */}
          <div className="grid gap-4 sm:grid-cols-2">
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
                    {labelsTipoCliente[cliente.tipo] ?? cliente.tipo}
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
                  <p className="text-sm text-muted-foreground">Email não informado</p>
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
                  <p className="text-sm text-muted-foreground">Telefone não informado</p>
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
                  <p className="text-sm text-muted-foreground">WhatsApp não informado</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Observações */}
          {cliente.observacoes && (
            <Card>
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

          {/* Preferências */}
          <InteressesCliente
            clienteId={id}
            interesses={cliente.cliente_interesses ?? []}
          />

          {/* Match automático */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Match de Imóveis</CardTitle>
            </CardHeader>
            <CardContent>
              <MatchImoveis
                organizacaoId={cliente.organizacao_id}
                interesses={cliente.cliente_interesses ?? []}
              />
            </CardContent>
          </Card>
        </div>

        {/* Coluna direita — negócios */}
        <div className="space-y-6 lg:col-span-2">
          {/* Negócios */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Handshake className="h-4 w-4" />
                Negócios ({negocios.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {negocios.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    Nenhum negócio vinculado
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    render={<Link href="/negocios/novo" />}
                  >
                    Criar negócio
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {negocios.map((neg) => (
                    <div
                      key={neg.id}
                      className="flex items-center justify-between rounded-lg border bg-card p-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <StatusBadge status={neg.status} config={configStatusNegocio} />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{neg.titulo}</p>
                          <p className="text-xs text-muted-foreground">
                            {labelsTipoNegocio[neg.tipo as keyof typeof labelsTipoNegocio] ?? neg.tipo}
                            {neg.valor ? ` · ${formatarPreco(neg.valor)}` : ""}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" render={<Link href={`/negocios/${neg.id}`} />}>
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Timeline — largura total */}
      <TimelineInteracoes
        clienteId={id}
        interacoes={cliente.cliente_interacoes ?? []}
      />
    </div>
  )
}
