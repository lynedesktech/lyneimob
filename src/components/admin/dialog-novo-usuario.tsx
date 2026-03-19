"use client"

import { useState } from "react"
import { toast } from "sonner"
import { UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { criarUsuarioPlataforma } from "@/actions/usuarios-plataforma"

interface DialogNovoUsuarioProps {
  organizacoes: { id: string; nome: string }[]
  // Pré-selecionar org e fixar tipo "organizacao" (usado no detalhe da org)
  organizacaoFixa?: { id: string; nome: string }
}

export function DialogNovoUsuario({ organizacoes, organizacaoFixa }: DialogNovoUsuarioProps) {
  const [aberto, setAberto] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [tipo, setTipo] = useState<"plataforma" | "organizacao">(organizacaoFixa ? "organizacao" : "plataforma")
  const [nome, setNome] = useState("")
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [perfilPlataforma, setPerfilPlataforma] = useState<string>("")
  const [cargo, setCargo] = useState<string>("corretor")
  const [organizacaoId, setOrganizacaoId] = useState<string>(organizacaoFixa?.id ?? "")

  function limpar() {
    setNome("")
    setEmail("")
    setSenha("")
    setPerfilPlataforma("")
    setCargo("corretor")
    setOrganizacaoId(organizacaoFixa?.id ?? "")
    setTipo(organizacaoFixa ? "organizacao" : "plataforma")
  }

  function fechar() {
    setAberto(false)
    limpar()
  }

  async function handleCriar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setEnviando(true)

    const resultado = await criarUsuarioPlataforma({
      nome,
      email,
      senha,
      tipo,
      perfil_plataforma: tipo === "plataforma" ? perfilPlataforma as "super_admin" | "desenvolvedor" | "investidor" : undefined,
      cargo: tipo === "organizacao" ? cargo as "admin" | "gerente" | "corretor" : undefined,
      organizacao_id: tipo === "organizacao" ? organizacaoId : undefined,
    })

    if (resultado.erro) {
      toast.error(resultado.erro)
    } else {
      toast.success(resultado.sucesso)
      fechar()
    }
    setEnviando(false)
  }

  return (
    <Dialog open={aberto} onOpenChange={(open) => {
      if (!open) fechar()
      else setAberto(true)
    }}>
      <DialogTrigger
        render={
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            {organizacaoFixa ? "Adicionar membro" : "Novo usuário"}
          </Button>
        }
      />
      <DialogContent>
        <form onSubmit={handleCriar}>
          <DialogHeader>
            <DialogTitle>
              {organizacaoFixa ? `Adicionar membro em ${organizacaoFixa.nome}` : "Novo usuário"}
            </DialogTitle>
            <DialogDescription>
              {organizacaoFixa
                ? "Crie um novo usuário vinculado a esta organização."
                : "Crie um novo usuário na plataforma."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Tipo — só mostra se não tem org fixa */}
            {!organizacaoFixa && (
              <div className="space-y-2">
                <Label>Tipo de usuário</Label>
                <Select
                  value={tipo}
                  onValueChange={(val) => val && setTipo(val as "plataforma" | "organizacao")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="organizacao">Membro de organização</SelectItem>
                    <SelectItem value="plataforma">Perfil plataforma</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Nome */}
            <div className="space-y-2">
              <Label htmlFor="novo-nome">Nome</Label>
              <Input
                id="novo-nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Nome completo"
                required
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="novo-email">Email</Label>
              <Input
                id="novo-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@exemplo.com"
                required
              />
            </div>

            {/* Senha */}
            <div className="space-y-2">
              <Label htmlFor="novo-senha">Senha</Label>
              <Input
                id="novo-senha"
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                minLength={6}
                required
              />
            </div>

            {/* Campos específicos por tipo */}
            {tipo === "plataforma" ? (
              <div className="space-y-2">
                <Label>Perfil plataforma</Label>
                <Select
                  value={perfilPlataforma || undefined}
                  onValueChange={(val) => val && setPerfilPlataforma(val)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o perfil" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                    <SelectItem value="desenvolvedor">Desenvolvedor</SelectItem>
                    <SelectItem value="investidor">Investidor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Cargo</Label>
                  <Select
                    value={cargo || undefined}
                    onValueChange={(val) => val && setCargo(val)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione o cargo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="corretor">Corretor</SelectItem>
                      <SelectItem value="gerente">Gerente</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Organização — só mostra se não tem org fixa */}
                {!organizacaoFixa && (
                  <div className="space-y-2">
                    <Label>Organização</Label>
                    <Select
                      value={organizacaoId || undefined}
                      onValueChange={(val) => val && setOrganizacaoId(val)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione a organização" />
                      </SelectTrigger>
                      <SelectContent>
                        {organizacoes.map((org) => (
                          <SelectItem key={org.id} value={org.id}>
                            {org.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={fechar}>
              Cancelar
            </Button>
            <Button type="submit" disabled={enviando}>
              {enviando ? "Criando..." : "Criar usuário"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
