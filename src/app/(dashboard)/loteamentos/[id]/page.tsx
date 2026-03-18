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
import { StatusBadge, configStatusLoteamento } from "@/components/ui/status-badge"
import { ConfirmacaoExclusao } from "@/components/ui/confirmacao-exclusao"
import { ResumoLoteamento } from "@/components/loteamentos/resumo-loteamento"
import { TabelaLotes } from "@/components/loteamentos/tabela-lotes"
import { GaleriaFotosLoteamento } from "@/components/loteamentos/galeria-fotos-loteamento"
import { IALoteamento } from "@/components/loteamentos/ia-loteamento"
import { excluirLoteamento } from "@/actions/loteamentos"
import { ArrowLeft, Pencil, MapPin, Globe, FileSpreadsheet } from "lucide-react"

type Params = Promise<{ id: string }>

export default async function DetalheLoteamentoPage({
  params,
}: {
  params: Params
}) {
  const { id } = await params
  const supabase = await criarClienteServer()

  const { data: loteamento } = await supabase
    .from("loteamentos")
    .select("*, lotes(*), loteamento_fotos(*)")
    .eq("id", id)
    .single()

  if (!loteamento) {
    redirect("/loteamentos")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            render={<Link href="/loteamentos" />}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">
                {loteamento.nome}
              </h1>
              <StatusBadge status={loteamento.status} config={configStatusLoteamento} />
            </div>
            <p className="text-sm text-muted-foreground">
              {loteamento.bairro ? `${loteamento.bairro}, ` : ""}
              {loteamento.cidade} - {loteamento.estado}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            render={<Link href={`/loteamentos/${id}/importar`} />}
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Importar CSV
          </Button>
          <Button
            variant="outline"
            render={<Link href={`/loteamentos/${id}/editar`} />}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </Button>
          <ConfirmacaoExclusao
            titulo="Excluir loteamento"
            descricao="Tem certeza que deseja excluir este loteamento? Todos os lotes e fotos serão removidos permanentemente. Esta ação não pode ser desfeita."
            onConfirmar={excluirLoteamento.bind(null, id)}
          />
        </div>
      </div>

      {/* Resumo */}
      <ResumoLoteamento loteamento={loteamento} />

      {/* Tabs */}
      <Tabs defaultValue="lotes">
        <TabsList>
          <TabsTrigger value="lotes">
            Lotes ({loteamento.lotes?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="fotos">
            Fotos ({loteamento.loteamento_fotos?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="ia">IA</TabsTrigger>
          <TabsTrigger value="informacoes">Informações</TabsTrigger>
        </TabsList>

        {/* Tab Lotes */}
        <TabsContent value="lotes">
          <TabelaLotes
            lotes={loteamento.lotes ?? []}
            loteamentoId={id}
          />
        </TabsContent>

        {/* Tab Fotos */}
        <TabsContent value="fotos">
          <GaleriaFotosLoteamento
            loteamentoId={id}
            fotos={loteamento.loteamento_fotos ?? []}
          />
        </TabsContent>

        {/* Tab IA */}
        <TabsContent value="ia">
          <IALoteamento
            loteamentoId={id}
            descricaoIA={loteamento.descricao_ia}
          />
        </TabsContent>

        {/* Tab Informações */}
        <TabsContent value="informacoes">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Endereço */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPin className="h-4 w-4" />
                  Endereço
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                {loteamento.logradouro && (
                  <p>
                    {loteamento.logradouro}
                    {loteamento.numero ? `, ${loteamento.numero}` : ""}
                  </p>
                )}
                {loteamento.complemento && <p>{loteamento.complemento}</p>}
                {loteamento.bairro && <p>{loteamento.bairro}</p>}
                <p>
                  {loteamento.cidade} - {loteamento.estado}
                </p>
                {loteamento.cep && (
                  <p className="text-muted-foreground">CEP: {loteamento.cep}</p>
                )}
              </CardContent>
            </Card>

            {/* Publicação */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Globe className="h-4 w-4" />
                  Publicação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>Site público</span>
                  </div>
                  <span className={loteamento.publicar_site ? "font-medium text-primary" : "text-muted-foreground"}>
                    {loteamento.publicar_site ? "Sim" : "Não"}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Descrição */}
            {loteamento.descricao && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">Descrição</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-sm">
                    {loteamento.descricao}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Observações internas */}
            {loteamento.observacoes_internas && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">
                    Observações internas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                    {loteamento.observacoes_internas}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
