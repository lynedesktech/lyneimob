import { redirect } from "next/navigation"
import { obterUsuarioAutenticado } from "@/lib/supabase/queries"

// Em modo produto unico (Duna), nao ha mais landing publica do LyneImob
// como pagina inicial. A landing antiga continua disponivel em /lyneimob
// pra preservacao (caso o produto SaaS volte um dia).
//
// Redireciona:
// - Logado -> /painel
// - Nao logado -> /login
export default async function PaginaInicial() {
  const user = await obterUsuarioAutenticado()
  if (user) {
    redirect("/painel")
  }
  redirect("/login")
}
