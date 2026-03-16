import { validarConvite } from "@/actions/convites"
import { criarClienteServer } from "@/lib/supabase/server"
import { FormularioConvite } from "@/components/usuarios/formulario-convite"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface ConvitePageProps {
  params: Promise<{ token: string }>
}

export default async function ConvitePage({ params }: ConvitePageProps) {
  const { token } = await params

  // Validar convite
  const resultado = await validarConvite(token)

  if (resultado.erro) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Convite invalido</CardTitle>
          <CardDescription>{resultado.erro}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const { email, cargo, organizacao_nome } = resultado.dados!

  // Verificar se usuario ja esta logado
  const supabase = await criarClienteServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Convite para {organizacao_nome}</CardTitle>
        <CardDescription>
          Voce foi convidado como <strong>{cargo}</strong> para a organizacao{" "}
          <strong>{organizacao_nome}</strong>.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FormularioConvite
          token={token}
          email={email}
          cargo={cargo}
          organizacaoNome={organizacao_nome}
          jaLogado={!!user}
          emailLogado={user?.email ?? null}
        />
      </CardContent>
    </Card>
  )
}
