import Link from "next/link"
import { redirect } from "next/navigation"
import { criarClienteServer } from "@/lib/supabase/server"
import { buscarUsuarioLogado } from "@/lib/buscar-usuario-logado"
import { temPermissao } from "@/lib/permissoes"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StatusBadge } from "@/components/ui/status-badge"
import { configStatusImovel } from "@/lib/constantes/status-configs"
import { GaleriaFotos } from "@/components/imoveis/galeria-fotos"
import { IAImovel } from "@/components/imoveis/ia-imovel"
import { ConfirmacaoExclusao } from "@/components/ui/confirmacao-exclusao"
import { excluirImovel } from "@/actions/imoveis"
import {
  ArrowLeft,
  Pencil,
  MapPin,
  BedDouble,
  Bath,
  Car,
  Maximize,
  Building,
  Layers,
  Globe,
  Rss,
} from "lucide-react"
import { labelsTipoImovel, labelsFinalidade } from "@/lib/constantes"
import { formatarPreco } from "@/lib/formatadores"

type Params = Promise<{ id: string }>

export default async function DetalheImovelPage({
  params,
}: {
  params: Params
}) {
  const { id } = await params
  const supabase = await criarClienteServer()
  const usuario = await buscarUsuarioLogado()
  const podeExcluir = usuario
    ? temPermissao(usuario.cargo as "admin" | "corretor" | "gerente", "excluir_registros", usuario.perfil_plataforma ?? usuario.super_admin)
    : false

  const { data: imovel } = await supabase
    .from("imoveis")
    .select("*, imovel_fotos(*)")
    .eq("id", id)
    .single()

  if (!imovel) {
    redirect("/imoveis")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            render={<Link href="/imoveis" />}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">
                {imovel.titulo}
              </h1>
              <StatusBadge status={imovel.status} config={configStatusImovel} />
            </div>
            <p className="text-sm text-muted-foreground">
              Código: {imovel.codigo} • {labelsTipoImovel[imovel.tipo]} •{" "}
              {labelsFinalidade[imovel.finalidade]}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            render={<Link href={`/imoveis/${id}/editar`} />}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </Button>
          {podeExcluir && (
            <ConfirmacaoExclusao
              titulo="Excluir imóvel"
              descricao="Tem certeza que deseja excluir este imóvel? Todas as fotos e dados serão removidos permanentemente. Esta ação não pode ser desfeita."
              onConfirmar={excluirImovel.bind(null, id)}
            />
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="informacoes">
        <TabsList>
          <TabsTrigger value="informacoes">Informações</TabsTrigger>
          <TabsTrigger value="fotos">
            Fotos ({imovel.imovel_fotos?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="ia">IA</TabsTrigger>
        </TabsList>

        {/* Tab Informações */}
        <TabsContent value="informacoes">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Valores */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Valores</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Preço de venda</p>
                  <p className="text-lg font-bold">
                    {formatarPreco(imovel.preco_venda)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Aluguel</p>
                  <p className="text-lg font-bold">
                    {formatarPreco(imovel.preco_aluguel)}
                    {imovel.preco_aluguel ? (
                      <span className="text-sm font-normal text-muted-foreground">
                        /mês
                      </span>
                    ) : null}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">IPTU</p>
                  <p className="font-medium">
                    {formatarPreco(imovel.iptu)}
                    {imovel.iptu ? (
                      <span className="text-sm font-normal text-muted-foreground">
                        /ano
                      </span>
                    ) : null}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Condomínio</p>
                  <p className="font-medium">
                    {formatarPreco(imovel.condominio)}
                    {imovel.condominio ? (
                      <span className="text-sm font-normal text-muted-foreground">
                        /mês
                      </span>
                    ) : null}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Endereço */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPin className="h-4 w-4" />
                  Endereço
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                {imovel.logradouro && (
                  <p>
                    {imovel.logradouro}
                    {imovel.numero ? `, ${imovel.numero}` : ""}
                  </p>
                )}
                {imovel.complemento && <p>{imovel.complemento}</p>}
                {imovel.bairro && <p>{imovel.bairro}</p>}
                <p>
                  {imovel.cidade} - {imovel.estado}
                </p>
                {imovel.cep && (
                  <p className="text-muted-foreground">CEP: {imovel.cep}</p>
                )}
              </CardContent>
            </Card>

            {/* Características */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Características</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {imovel.area_total && (
                    <div className="flex items-center gap-2">
                      <Maximize className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Área total</p>
                        <p className="font-medium">{imovel.area_total} m²</p>
                      </div>
                    </div>
                  )}
                  {imovel.area_construida && (
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Área construída
                        </p>
                        <p className="font-medium">
                          {imovel.area_construida} m²
                        </p>
                      </div>
                    </div>
                  )}
                  {imovel.quartos > 0 && (
                    <div className="flex items-center gap-2">
                      <BedDouble className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Quartos</p>
                        <p className="font-medium">
                          {imovel.quartos}
                          {imovel.suites > 0
                            ? ` (${imovel.suites} suíte${imovel.suites > 1 ? "s" : ""})`
                            : ""}
                        </p>
                      </div>
                    </div>
                  )}
                  {imovel.banheiros > 0 && (
                    <div className="flex items-center gap-2">
                      <Bath className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Banheiros
                        </p>
                        <p className="font-medium">{imovel.banheiros}</p>
                      </div>
                    </div>
                  )}
                  {imovel.vagas_garagem > 0 && (
                    <div className="flex items-center gap-2">
                      <Car className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Vagas de garagem
                        </p>
                        <p className="font-medium">{imovel.vagas_garagem}</p>
                      </div>
                    </div>
                  )}
                  {imovel.andares && (
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Andares</p>
                        <p className="font-medium">{imovel.andares}</p>
                      </div>
                    </div>
                  )}
                </div>
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
                  <span className={imovel.publicar_site ? "font-medium text-primary" : "text-muted-foreground"}>
                    {imovel.publicar_site ? "Sim" : "Não"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Rss className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>Portais (OLX, VivaReal...)</span>
                  </div>
                  <span className={imovel.publicar_portais ? "font-medium text-primary" : "text-muted-foreground"}>
                    {imovel.publicar_portais ? "Sim" : "Não"}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Descrição */}
            {imovel.descricao && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">Descrição</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-sm">
                    {imovel.descricao}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Observações internas */}
            {imovel.observacoes_internas && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">
                    Observações internas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                    {imovel.observacoes_internas}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Tab Fotos */}
        <TabsContent value="fotos">
          <GaleriaFotos
            imovelId={id}
            fotos={imovel.imovel_fotos ?? []}
          />
        </TabsContent>

        {/* Tab IA */}
        <TabsContent value="ia">
          <IAImovel
            imovelId={id}
            tituloIA={imovel.titulo_ia}
            descricaoIA={imovel.descricao_ia}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
