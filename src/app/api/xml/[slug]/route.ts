import { NextResponse } from "next/server"
import { criarClienteAdmin } from "@/lib/supabase/admin"
import { gerarFeedXml } from "@/lib/xml/vrsync"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  if (!slug) {
    return NextResponse.json({ erro: "Slug não informado" }, { status: 400 })
  }

  const supabase = criarClienteAdmin()

  // Buscar organização pelo slug
  const { data: organizacao, error: erroOrg } = await supabase
    .from("organizacoes")
    .select("id, nome, email, telefone, slug")
    .eq("slug", slug)
    .single()

  if (erroOrg || !organizacao) {
    return NextResponse.json(
      { erro: "Organização não encontrada" },
      { status: 404 }
    )
  }

  // Buscar imóveis publicáveis com fotos
  const { data: imoveis, error: erroImoveis } = await supabase
    .from("imoveis")
    .select("*, imovel_fotos(*)")
    .eq("organizacao_id", organizacao.id)
    .eq("status", "disponivel")
    .eq("publicar_portais", true)
    .order("created_at", { ascending: false })

  if (erroImoveis) {
    return NextResponse.json(
      { erro: "Erro ao buscar imóveis" },
      { status: 500 }
    )
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  // Buscar domínio customizado verificado (se existir)
  const { data: dominio } = await supabase
    .from("dominios_customizados")
    .select("dominio")
    .eq("organizacao_id", organizacao.id)
    .eq("status", "verificado")
    .single()

  const resultado = gerarFeedXml(
    imoveis || [],
    organizacao,
    appUrl,
    dominio?.dominio
  )

  return new Response(resultado.xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  })
}
