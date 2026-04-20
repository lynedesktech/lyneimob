/**
 * Seed de imoveis pra tests E2E.
 *
 * Rodar: `node tests/e2e/seed-imoveis.mjs [slug-da-org]`
 * Default: `qa-lynedesk`
 *
 * Cria 3 imoveis na org informada (ou reaproveita se ja existirem),
 * pra os specs `imoveis.spec.ts` terem dados consistentes.
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const ORG_SLUG = process.argv[2] ?? 'qa-lynedesk'

const env = readFileSync('.env.local', 'utf8')
const SUPABASE_URL = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim()
const SERVICE_KEY = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim()

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('[seed] Falta NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY no .env.local')
  process.exit(1)
}

const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

const { data: org, error: erroOrg } = await sb
  .from('organizacoes')
  .select('id, nome')
  .eq('slug', ORG_SLUG)
  .single()
if (erroOrg || !org) {
  console.error(`[seed] Organizacao com slug "${ORG_SLUG}" nao encontrada`)
  process.exit(1)
}

// Pega o primeiro usuario admin/corretor da org pra ser o corretor_id (campo NOT NULL)
const { data: corretor } = await sb
  .from('usuarios')
  .select('id')
  .eq('organizacao_id', org.id)
  .limit(1)
  .single()
if (!corretor) {
  console.error(`[seed] Nenhum usuario encontrado na org ${org.nome}`)
  process.exit(1)
}

const IMOVEIS_SEED = [
  {
    codigo_interno: 'SEED-001',
    titulo: 'Apartamento 3 quartos Centro (seed)',
    tipo: 'apartamento',
    finalidade: 'venda',
    cidade: 'Sao Paulo',
    estado: 'SP',
    bairro: 'Centro',
    valor: 500000,
    quartos: 3,
    banheiros: 2,
    vagas: 1,
    area_total: 85,
  },
  {
    codigo_interno: 'SEED-002',
    titulo: 'Casa 4 quartos Jardins (seed)',
    tipo: 'casa',
    finalidade: 'venda',
    cidade: 'Sao Paulo',
    estado: 'SP',
    bairro: 'Jardins',
    valor: 1200000,
    quartos: 4,
    suites: 2,
    banheiros: 3,
    vagas: 2,
    area_total: 220,
    area_construida: 180,
  },
  {
    codigo_interno: 'SEED-003',
    titulo: 'Kitnet aluguel Bela Vista (seed)',
    tipo: 'kitnet',
    finalidade: 'aluguel',
    cidade: 'Sao Paulo',
    estado: 'SP',
    bairro: 'Bela Vista',
    valor: 1800,
    quartos: 1,
    banheiros: 1,
    vagas: 0,
    area_total: 28,
  },
]

let criados = 0
let ignorados = 0

for (const dados of IMOVEIS_SEED) {
  const { data: existente } = await sb
    .from('imoveis')
    .select('id')
    .eq('organizacao_id', org.id)
    .eq('codigo_interno', dados.codigo_interno)
    .maybeSingle()

  if (existente) {
    ignorados++
    continue
  }

  const { error } = await sb.from('imoveis').insert({
    organizacao_id: org.id,
    corretor_id: corretor.id,
    status: 'disponivel',
    destaque: false,
    publicar_site: true,
    publicar_portais: false,
    ...dados,
  })

  if (error) {
    console.error(`[seed] Erro ao criar ${dados.codigo_interno}:`, error.message)
    continue
  }

  criados++
}

console.log(`[seed] org ${org.nome} (${ORG_SLUG}): ${criados} criados, ${ignorados} ja existiam`)
