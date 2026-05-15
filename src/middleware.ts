import { NextResponse, type NextRequest } from "next/server"
import { atualizarSessao } from "@/lib/supabase/middleware"
import { resolverDominioCustomizado } from "@/lib/dominio-customizado"
import { MODO_PRODUTO_UNICO } from "@/lib/produto"

// Extrair hostname do domínio principal (sem protocolo e sem porta)
function obterDominioPrincipal(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  try {
    return new URL(url).hostname
  } catch {
    return "localhost"
  }
}

const dominioPrincipal = obterDominioPrincipal()

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || ""
  // Remover porta para comparação (ex: "localhost:3000" → "localhost")
  const hostnameBase = hostname.split(":")[0]

  // Em modo produto unico (Duna), nao tem cadastro de novas contas
  if (MODO_PRODUTO_UNICO && request.nextUrl.pathname === "/cadastro") {
    return NextResponse.redirect(new URL("/login", request.url), 308)
  }

  // Se é o domínio principal ou domínio Vercel → fluxo normal (auth, dashboard, etc.)
  const ehVercel = hostnameBase.endsWith(".vercel.app")
  if (hostnameBase === dominioPrincipal || ehVercel) {
    // Redirect permanente da rota antiga após renomeação em LYNEDES-154
    // (rota /meu-perfil virou /minha-conta/meu-perfil)
    if (request.nextUrl.pathname === "/meu-perfil") {
      return NextResponse.redirect(
        new URL("/minha-conta/meu-perfil", request.url),
        308
      )
    }

    return await atualizarSessao(request)
  }

  // Hostname diferente do principal → pode ser domínio customizado.
  // Tenta primeiro como digitado, depois sem "www." (apex = sem www no banco).
  let resultado = await resolverDominioCustomizado(hostnameBase)
  if (!resultado && hostnameBase.startsWith("www.")) {
    resultado = await resolverDominioCustomizado(hostnameBase.slice(4))
  }

  if (!resultado) {
    // Domínio não reconhecido → retornar 404
    return new NextResponse("Não encontrado", { status: 404 })
  }

  // Domínio customizado verificado → rewrite para /{slug}{pathname}
  const url = request.nextUrl.clone()
  const pathname = request.nextUrl.pathname

  // Links do site publico ja incluem o slug (/{slug}/imoveis/...). Quando
  // o path ja comeca com /{slug}, deixa Next.js rotear direto (sem rewrite),
  // evitando o /slug/slug/... e tambem o delay de um redirect.
  const prefixoSlug = `/${resultado.slug}`
  if (pathname === prefixoSlug || pathname.startsWith(prefixoSlug + "/")) {
    return NextResponse.next()
  }

  // Reescrever internamente: /imoveis → /slug/imoveis
  // A raiz / vira /slug (home do site público)
  url.pathname = `/${resultado.slug}${pathname}`

  return NextResponse.rewrite(url)
}

export const config = {
  matcher: [
    /*
     * Roda em todas as rotas EXCETO:
     * - _next/static (arquivos estáticos)
     * - _next/image (otimização de imagens)
     * - favicon.ico, sitemap.xml, robots.txt
     * - Arquivos públicos (imagens, fontes, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
}
