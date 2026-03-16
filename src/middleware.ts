import { NextResponse, type NextRequest } from "next/server"
import { atualizarSessao } from "@/lib/supabase/middleware"
import { resolverDominioCustomizado } from "@/lib/dominio-customizado"

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

  // Se é o domínio principal → fluxo normal (auth, dashboard, etc.)
  if (hostnameBase === dominioPrincipal) {
    return await atualizarSessao(request)
  }

  // Hostname diferente do principal → pode ser domínio customizado
  const resultado = await resolverDominioCustomizado(hostnameBase)

  if (!resultado) {
    // Domínio não reconhecido → retornar 404
    return new NextResponse("Não encontrado", { status: 404 })
  }

  // Domínio customizado verificado → rewrite para /{slug}{pathname}
  const url = request.nextUrl.clone()
  const pathname = request.nextUrl.pathname

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
