import { createClient } from "@supabase/supabase-js"

// Cache em memória: domínio → { slug, orgId, timestamp }
// TTL de 5 minutos para evitar query a cada requisição
const TTL = 5 * 60 * 1000 // 5 minutos em ms

type CacheDominio = {
  slug: string
  orgId: string
  timestamp: number
}

const cache = new Map<string, CacheDominio>()

// Cache negativo: domínios que não existem (evita queries repetidas para domínios inválidos)
const cacheNegativo = new Map<string, number>()

/**
 * Resolve um domínio customizado para o slug da organização.
 * Usa cache em memória com TTL de 5 minutos.
 * Retorna { slug, orgId } se o domínio é válido e verificado, ou null.
 */
export async function resolverDominioCustomizado(
  hostname: string
): Promise<{ slug: string; orgId: string } | null> {
  // Verificar cache positivo
  const cached = cache.get(hostname)
  if (cached && Date.now() - cached.timestamp < TTL) {
    return { slug: cached.slug, orgId: cached.orgId }
  }

  // Verificar cache negativo
  const negativoTimestamp = cacheNegativo.get(hostname)
  if (negativoTimestamp && Date.now() - negativoTimestamp < TTL) {
    return null
  }

  // Buscar no banco via função SQL (acessível com anon key)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data, error } = await supabase.rpc("buscar_org_por_dominio", {
    dominio_busca: hostname,
  })

  if (error || !data || data.length === 0) {
    // Salvar no cache negativo para evitar queries repetidas
    cacheNegativo.set(hostname, Date.now())
    return null
  }

  const resultado = {
    slug: data[0].slug as string,
    orgId: data[0].organizacao_id as string,
  }

  // Salvar no cache positivo
  cache.set(hostname, { ...resultado, timestamp: Date.now() })

  return resultado
}
