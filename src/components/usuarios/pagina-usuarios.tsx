"use client"

import { useState, useMemo } from "react"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"
import { UserPlus, Copy, Check, Mail, AlertCircle } from "lucide-react"
import { useListaUsuarios } from "@/hooks/use-lista-usuarios"
import { criarUsuario, alterarCargo, alternarStatusUsuario, removerUsuario } from "@/actions/usuarios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { TabelaEquipe } from "@/components/usuarios/tabela-equipe"
import { FiltrosEquipe, type FiltrosEquipeValores } from "@/components/usuarios/filtros-equipe"
import { PaginacaoListagem } from "@/components/ui/paginacao-listagem"
import type { Usuario } from "@/types/database"

const POR_PAGINA = 12

// Helper para extrair erro de resultado de server action
function temErro(resultado: Record<string, unknown>): string | null {
  if ("erro" in resultado && resultado.erro) return resultado.erro as string
  return null
}

// Helper para extrair sucesso de resultado de server action
function obterSucesso(resultado: Record<string, unknown>): string | null {
  if ("sucesso" in resultado && resultado.sucesso) return resultado.sucesso as string
  return null
}

const CARGOS_LABELS: Record<string, { label: string }> = {
  admin: { label: "Admin" },
  gerente: { label: "Gerente" },
  corretor: { label: "Corretor" },
}

interface PaginaUsuariosProps {
  ehAdmin: boolean
  usuarioLogadoId: string
}

export function PaginaUsuarios({ ehAdmin, usuarioLogadoId }: PaginaUsuariosProps) {
  const { usuarios, carregando } = useListaUsuarios()
  const queryClient = useQueryClient()
  const [filtros, setFiltros] = useState<FiltrosEquipeValores>({ busca: "", cargo: "", status: "" })
  const [pagina, setPagina] = useState(1)
  const [usuarioAlterarCargo, setUsuarioAlterarCargo] = useState<Usuario | null>(null)
  const [usuarioRemover, setUsuarioRemover] = useState<Usuario | null>(null)

  function invalidar() {
    queryClient.invalidateQueries({ queryKey: ["usuarios-equipe"] })
  }

  function mudarFiltro(chave: keyof FiltrosEquipeValores, valor: string) {
    setFiltros((prev) => ({ ...prev, [chave]: valor }))
    setPagina(1)
  }

  function limparFiltros() {
    setFiltros({ busca: "", cargo: "", status: "" })
    setPagina(1)
  }

  // Filtragem client-side
  const usuariosFiltrados = useMemo(() => {
    let resultado = usuarios
    if (filtros.busca) {
      const termo = filtros.busca.toLowerCase()
      resultado = resultado.filter(
        (u) => u.nome.toLowerCase().includes(termo) || u.email.toLowerCase().includes(termo)
      )
    }
    if (filtros.cargo) {
      resultado = resultado.filter((u) => u.cargo === filtros.cargo)
    }
    if (filtros.status) {
      resultado = resultado.filter((u) =>
        filtros.status === "ativo" ? u.ativo : !u.ativo
      )
    }
    return resultado
  }, [usuarios, filtros])

  // Paginação client-side
  const totalPaginas = Math.max(1, Math.ceil(usuariosFiltrados.length / POR_PAGINA))
  const paginaAtual = Math.min(pagina, totalPaginas)
  const usuariosPagina = usuariosFiltrados.slice(
    (paginaAtual - 1) * POR_PAGINA,
    paginaAtual * POR_PAGINA
  )

  async function handleAlternarStatus(usuario: Usuario) {
    const resultado = await alternarStatusUsuario(usuario.id)
    const erro = temErro(resultado)
    if (erro) {
      toast.error(erro)
    } else {
      toast.success(obterSucesso(resultado) ?? "Status alterado.")
      invalidar()
    }
  }

  if (carregando) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-64 bg-muted animate-pulse rounded" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Equipe</h1>
          <p className="text-muted-foreground">
            {usuarios.length} {usuarios.length === 1 ? "membro" : "membros"} na organização
          </p>
        </div>
        {ehAdmin && (
          <DialogCriarMembro onCriar={invalidar} />
        )}
      </div>

      {/* Tabela de equipe */}
      <TabelaEquipe
        usuarios={usuariosPagina}
        total={usuariosFiltrados.length}
        ehAdmin={ehAdmin}
        usuarioLogadoId={usuarioLogadoId}
        filtros={
          <FiltrosEquipe
            filtros={filtros}
            onMudarFiltro={mudarFiltro}
            onLimpar={limparFiltros}
          />
        }
        paginacao={
          <PaginacaoListagem
            pagina={paginaAtual}
            totalPaginas={totalPaginas}
            onMudarPagina={setPagina}
          />
        }
        onAlterarCargo={(u) => setUsuarioAlterarCargo(u)}
        onAlternarStatus={handleAlternarStatus}
        onRemover={(u) => setUsuarioRemover(u)}
      />

      {/* Dialog: Alterar cargo */}
      {usuarioAlterarCargo && (
        <DialogAlterarCargo
          usuario={usuarioAlterarCargo}
          aberto={!!usuarioAlterarCargo}
          onFechar={() => setUsuarioAlterarCargo(null)}
          onAlterar={invalidar}
        />
      )}

      {/* Dialog: Remover usuario */}
      {usuarioRemover && (
        <DialogRemoverUsuario
          usuario={usuarioRemover}
          aberto={!!usuarioRemover}
          onFechar={() => setUsuarioRemover(null)}
          onRemover={invalidar}
        />
      )}
    </div>
  )
}

// ============================================================
// Dialog: Criar membro
// ============================================================

function DialogCriarMembro({ onCriar }: { onCriar: () => void }) {
  const [aberto, setAberto] = useState(false)
  const [criando, setCriando] = useState(false)
  const [copiado, setCopiado] = useState(false)
  // Depois de criar, o dialog vira a tela do convite: mostra o link de primeiro
  // acesso. E o plano B se o e-mail nao chegar (spam, endereco errado, envio
  // fora do ar) — quem criou manda o link pelo WhatsApp.
  const [convite, setConvite] = useState<{
    email: string
    link: string
    emailEnviado: boolean
  } | null>(null)

  function alternar(abrir: boolean) {
    setAberto(abrir)
    if (!abrir) {
      setConvite(null)
      setCopiado(false)
    }
  }

  async function handleCriar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setCriando(true)

    const formData = new FormData(e.currentTarget)
    const resultado = await criarUsuario(formData)
    const erro = temErro(resultado)

    if (erro) {
      toast.error(erro)
    } else {
      toast.success(obterSucesso(resultado) ?? "Membro criado!")
      const dados = (resultado as {
        dados?: { email: string; linkConvite: string; emailEnviado: boolean }
      }).dados
      if (dados?.linkConvite) {
        setConvite({ email: dados.email, link: dados.linkConvite, emailEnviado: dados.emailEnviado })
      } else {
        setAberto(false)
      }
      onCriar()
    }
    setCriando(false)
  }

  async function copiarLink() {
    if (!convite) return
    try {
      await navigator.clipboard.writeText(convite.link)
      setCopiado(true)
      toast.success("Link copiado!")
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      toast.error("Não foi possível copiar. Selecione o link e copie manualmente.")
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={alternar}>
      <DialogTrigger
        render={
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Criar membro
          </Button>
        }
      />
      <DialogContent>
        {convite ? (
          <>
            <DialogHeader>
              <DialogTitle>
                {convite.emailEnviado ? "Convite enviado" : "Conta criada, mas o e-mail não saiu"}
              </DialogTitle>
              <DialogDescription>
                {convite.emailEnviado
                  ? `Enviamos para ${convite.email} um e-mail com o link para definir a senha. Se não chegar em alguns minutos, mande o link abaixo pelo WhatsApp.`
                  : `A conta de ${convite.email} foi criada, mas o e-mail de primeiro acesso não pôde ser enviado. Mande o link abaixo pelo WhatsApp para a pessoa definir a senha.`}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-4">
              <div
                className={`flex items-start gap-3 rounded-lg p-3 text-sm ${
                  convite.emailEnviado ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                }`}
              >
                {convite.emailEnviado ? (
                  <Mail className="mt-0.5 h-4 w-4 shrink-0" />
                ) : (
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                )}
                <p>
                  O link é de uso único. Se expirar, a pessoa clica em <strong>Esqueci minha senha</strong> na
                  tela de login e informa este mesmo e-mail.
                </p>
              </div>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={convite.link}
                  className="font-mono text-xs bg-muted/50"
                  onFocus={(e) => e.currentTarget.select()}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={copiarLink}
                  className="shrink-0"
                  aria-label="Copiar link de primeiro acesso"
                >
                  {copiado ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" onClick={() => alternar(false)}>
                Concluir
              </Button>
            </DialogFooter>
          </>
        ) : (
          <form onSubmit={handleCriar}>
            <DialogHeader>
              <DialogTitle>Criar membro</DialogTitle>
              <DialogDescription>
                A pessoa recebe um e-mail com o link para definir a própria senha e já entra no sistema.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome</Label>
                <Input id="nome" name="nome" type="text" placeholder="Nome completo" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="email@exemplo.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cargo">Cargo</Label>
                <Select name="cargo" defaultValue="corretor">
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="corretor">Corretor</SelectItem>
                    <SelectItem value="gerente">Gerente</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => alternar(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={criando}>
                {criando ? "Enviando convite..." : "Criar e enviar convite"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ============================================================
// Dialog: Alterar cargo
// ============================================================

function DialogAlterarCargo({
  usuario,
  aberto,
  onFechar,
  onAlterar,
}: {
  usuario: Usuario
  aberto: boolean
  onFechar: () => void
  onAlterar: () => void
}) {
  const [novoCargo, setNovoCargo] = useState(usuario.cargo)
  const [alterando, setAlterando] = useState(false)

  async function handleAlterar() {
    if (novoCargo === usuario.cargo) {
      onFechar()
      return
    }
    setAlterando(true)
    const resultado = await alterarCargo(usuario.id, novoCargo)
    const erro = temErro(resultado)
    if (erro) {
      toast.error(erro)
    } else {
      toast.success(obterSucesso(resultado) ?? "Cargo alterado.")
      onAlterar()
    }
    setAlterando(false)
    onFechar()
  }

  return (
    <Dialog open={aberto} onOpenChange={(open) => { if (!open) onFechar() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Alterar cargo</DialogTitle>
          <DialogDescription>
            Alterar o cargo de {usuario.nome}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Select value={novoCargo} onValueChange={(val) => setNovoCargo(val as typeof novoCargo)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="corretor">Corretor</SelectItem>
              <SelectItem value="gerente">Gerente</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onFechar}>
            Cancelar
          </Button>
          <Button onClick={handleAlterar} disabled={alterando}>
            {alterando ? "Alterando..." : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================
// Dialog: Remover usuario
// ============================================================

function DialogRemoverUsuario({
  usuario,
  aberto,
  onFechar,
  onRemover,
}: {
  usuario: Usuario
  aberto: boolean
  onFechar: () => void
  onRemover: () => void
}) {
  const [removendo, setRemovendo] = useState(false)

  async function handleRemover() {
    setRemovendo(true)
    const resultado = await removerUsuario(usuario.id)
    const erro = temErro(resultado)
    if (erro) {
      toast.error(erro)
    } else {
      toast.success(obterSucesso(resultado) ?? "Usuário removido.")
      onRemover()
    }
    setRemovendo(false)
    onFechar()
  }

  return (
    <Dialog open={aberto} onOpenChange={(open) => { if (!open) onFechar() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remover usuário</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja remover {usuario.nome} da organização?
            Esta ação não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onFechar}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleRemover} disabled={removendo}>
            {removendo ? "Removendo..." : "Remover"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

