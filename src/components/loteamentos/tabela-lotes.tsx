"use client"

import { useState, useMemo, useEffect } from "react"
import { toast } from "sonner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button, buttonVariants } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { StatusBadge } from "@/components/ui/status-badge"
import { configStatusLote } from "@/lib/constantes/status-configs"
import { ConfirmacaoExclusao } from "@/components/ui/confirmacao-exclusao"
import { EstadoVazio } from "@/components/ui/estado-vazio"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { InputMonetario } from "@/components/ui/input-monetario"
import { ComboboxCampo } from "@/components/ui/combobox-campo"
import type { OpcaoCombobox } from "@/components/ui/combobox-campo"
import { criarClienteBrowser } from "@/lib/supabase/client"
import { alterarStatusLote, excluirLote, criarLote, atualizarLote } from "@/actions/loteamentos"
import { formatarPreco, formatarData } from "@/lib/formatadores"
import { labelsStatusLote } from "@/lib/constantes"
import Link from "next/link"
import { ModalAssociarCliente } from "@/components/loteamentos/modal-associar-cliente"
import {
  Search,
  MoreHorizontal,
  Layers,
  X,
  FileSpreadsheet,
  Plus,
  Pencil,
  Eye,
  MapPin,
  User,
  Ruler,
  Calendar,
  DollarSign,
  FileText,
  Hash,
} from "lucide-react"
import type { LoteComCliente } from "@/types/database"

type TabelaLotesProps = {
  lotes: LoteComCliente[]
  loteamentoId: string
}

export function TabelaLotes({ lotes, loteamentoId }: TabelaLotesProps) {
  const [busca, setBusca] = useState("")
  const [filtroQuadra, setFiltroQuadra] = useState<string | null>(null)
  const [filtroStatus, setFiltroStatus] = useState<string | null>(null)
  const [dialogAberto, setDialogAberto] = useState(false)
  const [salvandoLote, setSalvandoLote] = useState(false)
  const [valorLote, setValorLote] = useState<number | null>(null)

  // Estado para edição
  const [dialogEditarAberto, setDialogEditarAberto] = useState(false)
  const [loteEditando, setLoteEditando] = useState<LoteComCliente | null>(null)
  const [salvandoEdicao, setSalvandoEdicao] = useState(false)
  const [valorEdicao, setValorEdicao] = useState<number | null>(null)

  // Estado para visualização de detalhes
  const [dialogDetalhesAberto, setDialogDetalhesAberto] = useState(false)
  const [loteDetalhes, setLoteDetalhes] = useState<LoteComCliente | null>(null)

  // Estado para modal de associar cliente (reservado/vendido)
  const [modalClienteAberto, setModalClienteAberto] = useState(false)
  const [loteParaAssociar, setLoteParaAssociar] = useState<string | null>(null)
  const [statusDestinoModal, setStatusDestinoModal] = useState<"reservado" | "vendido">("reservado")

  // Opções de clientes para o combobox de comprador (edição)
  const [opcoesClientes, setOpcoesClientes] = useState<OpcaoCombobox[]>([])
  const [clienteIdEdicao, setClienteIdEdicao] = useState<string>("")

  useEffect(() => {
    async function carregarClientes() {
      const supabase = criarClienteBrowser()
      const { data } = await supabase
        .from("clientes")
        .select("id, nome")
        .order("nome")
        .limit(500)
      if (data) {
        setOpcoesClientes(data.map((c) => ({ value: c.id, label: c.nome })))
      }
    }
    carregarClientes()
  }, [])

  async function handleCriarLote(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    formData.set("loteamento_id", loteamentoId)
    if (valorLote !== null) formData.set("valor", String(valorLote))

    setSalvandoLote(true)
    const resultado = await criarLote({}, formData)
    setSalvandoLote(false)

    if (resultado.erro) {
      toast.error(resultado.erro)
    } else {
      toast.success(resultado.sucesso)
      setDialogAberto(false)
      setValorLote(null)
      form.reset()
    }
  }

  async function handleEditarLote(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!loteEditando) return

    const form = e.currentTarget
    const formData = new FormData(form)
    formData.set("id", loteEditando.id)
    formData.set("loteamento_id", loteamentoId)
    if (valorEdicao !== null) formData.set("valor", String(valorEdicao))

    // Setar comprador a partir do cliente selecionado
    if (clienteIdEdicao) {
      formData.set("cliente_id", clienteIdEdicao)
      const clienteSelecionado = opcoesClientes.find((c) => c.value === clienteIdEdicao)
      if (clienteSelecionado) formData.set("comprador", clienteSelecionado.label)
    } else {
      formData.delete("comprador")
      formData.delete("cliente_id")
    }

    setSalvandoEdicao(true)
    const resultado = await atualizarLote({}, formData)
    setSalvandoEdicao(false)

    if (resultado.erro) {
      toast.error(resultado.erro)
    } else {
      toast.success(resultado.sucesso)
      setDialogEditarAberto(false)
      setLoteEditando(null)
      setValorEdicao(null)
      setClienteIdEdicao("")
    }
  }

  function abrirModalCliente(loteId: string, status: "reservado" | "vendido") {
    setLoteParaAssociar(loteId)
    setStatusDestinoModal(status)
    setModalClienteAberto(true)
  }

  function abrirEdicao(lote: LoteComCliente) {
    setLoteEditando(lote)
    setValorEdicao(lote.valor)
    setClienteIdEdicao(lote.cliente_id ?? "")
    setDialogEditarAberto(true)
  }

  function abrirDetalhes(lote: LoteComCliente) {
    setLoteDetalhes(lote)
    setDialogDetalhesAberto(true)
  }

  // Quadras únicas para o filtro
  const quadras = useMemo(() => {
    const set = new Set(lotes.map((l) => l.quadra))
    return Array.from(set).sort()
  }, [lotes])

  // Lotes filtrados
  const lotesFiltrados = useMemo(() => {
    return lotes.filter((lote) => {
      if (filtroQuadra && lote.quadra !== filtroQuadra) return false
      if (filtroStatus && lote.status !== filtroStatus) return false
      if (busca) {
        const termo = busca.toLowerCase()
        return (
          lote.quadra.toLowerCase().includes(termo) ||
          lote.numero_lote.toLowerCase().includes(termo) ||
          lote.unidade.toLowerCase().includes(termo) ||
          (lote.comprador && lote.comprador.toLowerCase().includes(termo))
        )
      }
      return true
    })
  }, [lotes, busca, filtroQuadra, filtroStatus])

  const temFiltros = busca || filtroQuadra || filtroStatus

  async function handleAlterarStatus(id: string, status: string) {
    const resultado = await alterarStatusLote(id, status)
    if (resultado.erro) {
      toast.error(resultado.erro)
    } else {
      toast.success(resultado.sucesso)
    }
  }

  // Dialog de cadastro manual
  const dialogCadastroManual = (
    <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
      <DialogTrigger render={<Button variant="outline" />}>
        <Plus className="mr-2 h-4 w-4" />
        Cadastrar manualmente
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleCriarLote}>
          <DialogHeader>
            <DialogTitle>Cadastrar lote</DialogTitle>
            <DialogDescription>Preencha os dados do lote manualmente.</DialogDescription>
          </DialogHeader>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label htmlFor="quadra-manual">Quadra *</Label>
              <Input id="quadra-manual" name="quadra" placeholder="A" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="numero-lote-manual">Lote *</Label>
              <Input id="numero-lote-manual" name="numero_lote" placeholder="01" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="unidade-manual">Unidade *</Label>
              <Input id="unidade-manual" name="unidade" placeholder="A-01" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="area-manual">Área (m²)</Label>
              <Input id="area-manual" name="area" type="number" step="0.01" min="0" placeholder="300" />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="valor-manual">Valor</Label>
              <InputMonetario id="valor-manual" valor={valorLote} onValorChange={setValorLote} />
            </div>
            <div className="space-y-1 sm:col-span-3">
              <Label htmlFor="obs-manual">Observações</Label>
              <Textarea id="obs-manual" name="observacoes" placeholder="Observações sobre o lote..." rows={2} />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => setDialogAberto(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={salvandoLote}>
              {salvandoLote ? "Salvando..." : "Cadastrar lote"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )

  // Dialog de edição
  const dialogEdicao = (
    <Dialog open={dialogEditarAberto} onOpenChange={(aberto) => {
      setDialogEditarAberto(aberto)
      if (!aberto) {
        setLoteEditando(null)
        setValorEdicao(null)
      }
    }}>
      <DialogContent>
        {loteEditando && (
          <form onSubmit={handleEditarLote}>
            <DialogHeader>
              <DialogTitle>Editar lote</DialogTitle>
              <DialogDescription>
                Editando lote {loteEditando.quadra}-{loteEditando.numero_lote}
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <Label htmlFor="quadra-editar">Quadra *</Label>
                <Input
                  id="quadra-editar"
                  name="quadra"
                  placeholder="A"
                  defaultValue={loteEditando.quadra}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="numero-lote-editar">Lote *</Label>
                <Input
                  id="numero-lote-editar"
                  name="numero_lote"
                  placeholder="01"
                  defaultValue={loteEditando.numero_lote}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="unidade-editar">Unidade *</Label>
                <Input
                  id="unidade-editar"
                  name="unidade"
                  placeholder="A-01"
                  defaultValue={loteEditando.unidade}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="status-editar">Status</Label>
                <Select name="status" defaultValue={loteEditando.status}>
                  <SelectTrigger id="status-editar">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(labelsStatusLote).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label>Comprador</Label>
                <ComboboxCampo
                  opcoes={opcoesClientes}
                  value={clienteIdEdicao}
                  onChange={setClienteIdEdicao}
                  placeholder="Selecionar cliente..."
                  placeholderBusca="Buscar cliente..."
                  vazio="Nenhum cliente encontrado."
                  permitirVazio
                  labelVazio="Sem comprador"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="area-editar">Área (m²)</Label>
                <Input
                  id="area-editar"
                  name="area"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="300"
                  defaultValue={loteEditando.area ?? ""}
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="valor-editar">Valor</Label>
                <InputMonetario
                  id="valor-editar"
                  valor={valorEdicao}
                  onValorChange={setValorEdicao}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="data-venda-editar">Data de venda</Label>
                <Input
                  id="data-venda-editar"
                  name="data_venda"
                  type="date"
                  defaultValue={loteEditando.data_venda ?? ""}
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="obs-editar">Observações</Label>
                <Textarea
                  id="obs-editar"
                  name="observacoes"
                  placeholder="Observações sobre o lote..."
                  rows={2}
                  defaultValue={loteEditando.observacoes ?? ""}
                />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setDialogEditarAberto(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={salvandoEdicao}>
                {salvandoEdicao ? "Salvando..." : "Salvar alterações"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )

  // Dialog de detalhes
  const dialogDetalhes = (
    <Dialog open={dialogDetalhesAberto} onOpenChange={(aberto) => {
      setDialogDetalhesAberto(aberto)
      if (!aberto) setLoteDetalhes(null)
    }}>
      <DialogContent className="sm:max-w-[520px]">
        {loteDetalhes && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3">
                <DialogTitle>
                  Lote {loteDetalhes.quadra}-{loteDetalhes.numero_lote}
                </DialogTitle>
                <StatusBadge status={loteDetalhes.status} config={configStatusLote} />
              </div>
              <DialogDescription>
                Unidade {loteDetalhes.unidade}
              </DialogDescription>
            </DialogHeader>

            <div className="mt-2 grid gap-4 sm:grid-cols-2">
              {/* Identificação */}
              <div className="flex items-start gap-3 rounded-lg border p-3">
                <Hash className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Quadra</p>
                  <p className="text-sm font-medium">{loteDetalhes.quadra}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg border p-3">
                <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Lote / Unidade</p>
                  <p className="text-sm font-medium">{loteDetalhes.numero_lote} / {loteDetalhes.unidade}</p>
                </div>
              </div>

              {/* Valor */}
              <div className="flex items-start gap-3 rounded-lg border p-3">
                <DollarSign className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Valor</p>
                  <p className="text-sm font-medium">{formatarPreco(loteDetalhes.valor)}</p>
                </div>
              </div>

              {/* Área */}
              <div className="flex items-start gap-3 rounded-lg border p-3">
                <Ruler className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Área</p>
                  <p className="text-sm font-medium">{loteDetalhes.area ? `${loteDetalhes.area} m²` : "Não informada"}</p>
                </div>
              </div>

              {/* Comprador */}
              <div className="flex items-start gap-3 rounded-lg border p-3">
                <User className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Comprador</p>
                  {loteDetalhes.cliente_id && loteDetalhes.cliente ? (
                    <Link
                      href={`/clientes/${loteDetalhes.cliente_id}`}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      {loteDetalhes.cliente.nome}
                    </Link>
                  ) : (
                    <p className="text-sm font-medium">{loteDetalhes.comprador || "Sem comprador"}</p>
                  )}
                </div>
              </div>

              {/* Data de venda */}
              <div className="flex items-start gap-3 rounded-lg border p-3">
                <Calendar className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Data de venda</p>
                  <p className="text-sm font-medium">{loteDetalhes.data_venda ? formatarData(loteDetalhes.data_venda) : "Sem data"}</p>
                </div>
              </div>

              {/* Observações */}
              {loteDetalhes.observacoes && (
                <div className="flex items-start gap-3 rounded-lg border p-3 sm:col-span-2">
                  <FileText className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Observações</p>
                    <p className="whitespace-pre-wrap text-sm">{loteDetalhes.observacoes}</p>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="mt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setDialogDetalhesAberto(false)
                  abrirEdicao(loteDetalhes)
                }}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Editar lote
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )

  if (lotes.length === 0) {
    return (
      <>
        <EstadoVazio
          icone={Layers}
          titulo="Nenhum lote cadastrado"
          descricao="Importe lotes via CSV ou cadastre manualmente"
          acao={
            <div className="flex gap-2">
              {dialogCadastroManual}
              <Button render={<Link href={`/loteamentos/${loteamentoId}/importar`} />}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Importar lotes
              </Button>
            </div>
          }
        />
        {dialogEdicao}
        {dialogDetalhes}
        {loteParaAssociar && (
          <ModalAssociarCliente
            aberto={modalClienteAberto}
            onFechar={() => {
              setModalClienteAberto(false)
              setLoteParaAssociar(null)
            }}
            loteId={loteParaAssociar}
            statusDestino={statusDestinoModal}
          />
        )}
      </>
    )
  }

  return (
    <div className="space-y-4">
      {/* Botões de ação — sempre visíveis */}
      <div className="flex gap-2">
        {dialogCadastroManual}
        <Button variant="outline" render={<Link href={`/loteamentos/${loteamentoId}/importar`} />}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Importar CSV
        </Button>
      </div>

      {/* Filtros inline */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="relative w-[220px]">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar lote..."
            className="pl-8"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        {quadras.length > 1 && (
          <Select
            value={filtroQuadra ?? undefined}
            onValueChange={(v) => setFiltroQuadra(v || null)}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Quadra" />
            </SelectTrigger>
            <SelectContent>
              {quadras.map((q) => (
                <SelectItem key={q} value={q}>
                  Quadra {q}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select
          value={filtroStatus ?? undefined}
          onValueChange={(v) => setFiltroStatus(v || null)}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(labelsStatusLote).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {temFiltros && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setBusca("")
              setFiltroQuadra(null)
              setFiltroStatus(null)
            }}
          >
            <X className="mr-1 h-4 w-4" />
            Limpar
          </Button>
        )}

        <span className="ml-auto text-sm text-muted-foreground">
          {lotesFiltrados.length} de {lotes.length} lotes
        </span>
      </div>

      {/* Tabela */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Quadra</TableHead>
              <TableHead>Lote</TableHead>
              <TableHead>Unidade</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Comprador</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="text-right">Área</TableHead>
              <TableHead>Data Venda</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {lotesFiltrados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                  Nenhum lote encontrado com os filtros selecionados
                </TableCell>
              </TableRow>
            ) : (
              lotesFiltrados.map((lote) => (
                <TableRow
                  key={lote.id}
                  className="cursor-pointer"
                  onClick={() => abrirDetalhes(lote)}
                >
                  <TableCell className="font-medium">{lote.quadra}</TableCell>
                  <TableCell>{lote.numero_lote}</TableCell>
                  <TableCell>{lote.unidade}</TableCell>
                  <TableCell>
                    <StatusBadge status={lote.status} config={configStatusLote} />
                  </TableCell>
                  <TableCell>
                    {lote.cliente_id && lote.cliente ? (
                      <Link
                        href={`/clientes/${lote.cliente_id}`}
                        className="text-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {lote.cliente.nome}
                      </Link>
                    ) : (
                      lote.comprador ?? "—"
                    )}
                  </TableCell>
                  <TableCell className="text-right">{formatarPreco(lote.valor)}</TableCell>
                  <TableCell className="text-right">
                    {lote.area ? `${lote.area} m²` : "—"}
                  </TableCell>
                  <TableCell>
                    {lote.data_venda ? formatarData(lote.data_venda) : "—"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        className={buttonVariants({ variant: "ghost", size: "icon", className: "h-8 w-8" })}
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                        <DropdownMenuItem onClick={() => abrirDetalhes(lote)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => abrirEdicao(lote)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar lote
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {lote.status !== "disponivel" && (
                          <DropdownMenuItem onClick={() => handleAlterarStatus(lote.id, "disponivel")}>
                            Marcar como Disponível
                          </DropdownMenuItem>
                        )}
                        {lote.status !== "reservado" && (
                          <DropdownMenuItem onClick={() => abrirModalCliente(lote.id, "reservado")}>
                            Marcar como Reservado
                          </DropdownMenuItem>
                        )}
                        {lote.status !== "vendido" && (
                          <DropdownMenuItem onClick={() => abrirModalCliente(lote.id, "vendido")}>
                            Marcar como Vendido
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <ConfirmacaoExclusao
                          titulo="Excluir lote"
                          descricao={`Tem certeza que deseja excluir o lote ${lote.quadra}-${lote.numero_lote}? Esta ação não pode ser desfeita.`}
                          onConfirmar={excluirLote.bind(null, lote.id)}
                          tamanho="sm"
                          trigger={
                            <button className="relative flex w-full cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive outline-none hover:bg-accent">
                              Excluir lote
                            </button>
                          }
                        />
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialogs renderizados fora da tabela */}
      {dialogEdicao}
      {dialogDetalhes}

      {/* Modal de associar cliente ao mudar status */}
      {loteParaAssociar && (
        <ModalAssociarCliente
          aberto={modalClienteAberto}
          onFechar={() => {
            setModalClienteAberto(false)
            setLoteParaAssociar(null)
          }}
          loteId={loteParaAssociar}
          statusDestino={statusDestinoModal}
        />
      )}
    </div>
  )
}
