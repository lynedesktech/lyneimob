import { test, expect } from '@playwright/test'

// ============================================================
// Testes E2E — Integracao de Portais Imobiliarios
// Webhook de recebimento de leads + Feed XML
// ============================================================

const BASE_URL = process.env.BASE_URL ?? 'https://lyne-imob.vercel.app'
const ORG_SLUG = process.env.ORG_SLUG ?? 'imobiliaria-teste'
const WEBHOOK_URL = `${BASE_URL}/api/webhooks/portais`
const XML_URL = `${BASE_URL}/api/xml/${ORG_SLUG}`
const VALIDAR_URL = `${XML_URL}/validar`

// ============================================================
// Helpers — payloads de cada portal
// ============================================================

function payloadZap(overrides: Record<string, unknown> = {}) {
  return {
    customer: {
      name: `Lead ZAP ${Date.now()}`,
      email: `zap.${Date.now()}@teste.com`,
      phone: '11999001122',
      message: 'Gostaria de agendar uma visita ao apartamento',
    },
    listing: {
      id: 'QA-ZAP-001',
    },
    leadOrigin: 'zap',
    ...overrides,
  }
}

function payloadOlx(overrides: Record<string, unknown> = {}) {
  return {
    lead: {
      name: `Lead OLX ${Date.now()}`,
      email: `olx.${Date.now()}@teste.com`,
      phone: '21988776655',
      message: 'Tenho interesse nesse imovel',
    },
    listing_id: 'QA-OLX-001',
    portal: 'olx',
    ...overrides,
  }
}

function payloadVivaReal(overrides: Record<string, unknown> = {}) {
  return {
    customer: {
      name: `Lead VivaReal ${Date.now()}`,
      email: `vivareal.${Date.now()}@teste.com`,
      phone: '31977665544',
      message: 'Quero saber mais detalhes do imovel',
    },
    listing: {
      id: 'QA-VR-001',
    },
    source: 'vivareal',
    ...overrides,
  }
}

function payloadImovelweb(overrides: Record<string, unknown> = {}) {
  return {
    contact: {
      name: `Lead Imovelweb ${Date.now()}`,
      email: `imovelweb.${Date.now()}@teste.com`,
      phone: '85987654321',
      message: 'Gostaria de agendar uma visita',
    },
    property: {
      id: 'QA-IW-001',
      code: 'PROP-IW-001',
    },
    portal: 'imovelweb',
    ...overrides,
  }
}

function payloadGenerico(overrides: Record<string, unknown> = {}) {
  return {
    nome: `Lead Generico ${Date.now()}`,
    email: `generico.${Date.now()}@teste.com`,
    telefone: '62991234567',
    mensagem: 'Interesse pelo imovel anunciado',
    imovel_codigo: 'QA-GEN-001',
    ...overrides,
  }
}

// ============================================================
// 1. WEBHOOK DE PORTAIS — Recebimento de Leads
// ============================================================

test.describe('Webhook Portais — Recebimento de Leads', () => {

  // --- Validacoes de erro ---

  test('rejeita payload vazio sem org com erro', async ({ request }) => {
    const response = await request.post(WEBHOOK_URL, {
      data: {},
    })
    // Sem org_slug e sem x-org-slug => deve retornar erro (400 ou 404)
    expect(response.ok()).toBe(false)
  })

  test('rejeita sem identificacao de organizacao', async ({ request }) => {
    const response = await request.post(WEBHOOK_URL, {
      data: {
        customer: { name: 'Teste', email: 'teste@teste.com' },
        // sem org_slug, sem header x-org-slug
      },
    })
    // O webhook precisa identificar a org — sem ela, erro
    expect(response.ok()).toBe(false)
    expect([400, 404]).toContain(response.status())
  })

  test('retorna 404 para organizacao inexistente via slug', async ({ request }) => {
    const response = await request.post(WEBHOOK_URL, {
      headers: { 'x-org-slug': `org-fantasma-${Date.now()}` },
      data: payloadZap(),
    })
    expect(response.status()).toBe(404)
  })

  test('rejeita lead sem dados de contato com 422', async ({ request }) => {
    const response = await request.post(WEBHOOK_URL, {
      headers: { 'x-org-slug': ORG_SLUG },
      data: {
        leadOrigin: 'zap',
        customer: {
          // sem nome, email ou telefone
        },
        listing: { id: 'QA-001' },
      },
    })
    expect(response.status()).toBe(422)
  })

  // --- Testes de sucesso por portal ---

  test('recebe lead do ZAP Imoveis com sucesso (201)', async ({ request }) => {
    const response = await request.post(WEBHOOK_URL, {
      headers: {
        'x-org-slug': ORG_SLUG,
        'x-portal': 'zap',
      },
      data: payloadZap(),
    })

    expect(response.status()).toBe(201)
    const body = await response.json()
    expect(body.lead_id).toBeTruthy()
    expect(body.status).toBe('processado')
  })

  test('recebe lead da OLX com sucesso (201)', async ({ request }) => {
    const response = await request.post(WEBHOOK_URL, {
      headers: { 'x-org-slug': ORG_SLUG },
      data: payloadOlx(),
    })

    expect(response.status()).toBe(201)
    const body = await response.json()
    expect(body.lead_id).toBeTruthy()
    expect(body.status).toBe('processado')
  })

  test('recebe lead do VivaReal com sucesso (201)', async ({ request }) => {
    const response = await request.post(WEBHOOK_URL, {
      headers: { 'x-org-slug': ORG_SLUG },
      data: payloadVivaReal(),
    })

    expect(response.status()).toBe(201)
    const body = await response.json()
    expect(body.lead_id).toBeTruthy()
    expect(body.status).toBe('processado')
  })

  test('recebe lead do Imovelweb com sucesso (201)', async ({ request }) => {
    const response = await request.post(WEBHOOK_URL, {
      headers: { 'x-org-slug': ORG_SLUG },
      data: payloadImovelweb(),
    })

    expect(response.status()).toBe(201)
    const body = await response.json()
    expect(body.lead_id).toBeTruthy()
    expect(body.status).toBe('processado')
  })

  test('recebe lead generico com sucesso (201)', async ({ request }) => {
    const response = await request.post(WEBHOOK_URL, {
      headers: { 'x-org-slug': ORG_SLUG },
      data: payloadGenerico(),
    })

    expect(response.status()).toBe(201)
    const body = await response.json()
    expect(body.lead_id).toBeTruthy()
    expect(body.status).toBe('processado')
  })

  // --- Testes de identificacao alternativa ---

  test('aceita org_slug no body em vez de header', async ({ request }) => {
    const payload = {
      ...payloadGenerico(),
      org_slug: ORG_SLUG,
    }
    const response = await request.post(WEBHOOK_URL, {
      data: payload,
    })

    expect(response.status()).toBe(201)
    const body = await response.json()
    expect(body.lead_id).toBeTruthy()
  })

  test('aceita lead so com nome (sem email/telefone)', async ({ request }) => {
    const response = await request.post(WEBHOOK_URL, {
      headers: { 'x-org-slug': ORG_SLUG },
      data: {
        nome: `Lead Minimo ${Date.now()}`,
      },
    })
    expect(response.status()).toBe(201)
  })

  test('aceita lead so com email (sem nome/telefone)', async ({ request }) => {
    const response = await request.post(WEBHOOK_URL, {
      headers: { 'x-org-slug': ORG_SLUG },
      data: {
        email: `somente-email-${Date.now()}@teste.com`,
      },
    })
    expect(response.status()).toBe(201)
  })

  test('aceita lead so com telefone (sem nome/email)', async ({ request }) => {
    const response = await request.post(WEBHOOK_URL, {
      headers: { 'x-org-slug': ORG_SLUG },
      data: {
        telefone: '11900001111',
      },
    })
    expect(response.status()).toBe(201)
  })

  // --- Teste de deteccao automatica de portal ---

  test('detecta portal pelo campo leadOrigin no payload', async ({ request }) => {
    const response = await request.post(WEBHOOK_URL, {
      headers: { 'x-org-slug': ORG_SLUG },
      data: {
        leadOrigin: 'zap',
        customer: {
          name: `Auto Detect ${Date.now()}`,
          email: `autodetect.${Date.now()}@teste.com`,
        },
      },
    })
    expect(response.status()).toBe(201)
  })

  test('detecta portal pelo campo source no payload', async ({ request }) => {
    const response = await request.post(WEBHOOK_URL, {
      headers: { 'x-org-slug': ORG_SLUG },
      data: {
        source: 'vivareal',
        customer: {
          name: `Source Detect ${Date.now()}`,
          phone: '11988887777',
        },
      },
    })
    expect(response.status()).toBe(201)
  })

  // --- Teste de resposta com lead_id valido (UUID) ---

  test('lead_id retornado e um UUID valido', async ({ request }) => {
    const response = await request.post(WEBHOOK_URL, {
      headers: { 'x-org-slug': ORG_SLUG },
      data: payloadZap(),
    })

    expect(response.status()).toBe(201)
    const body = await response.json()
    // UUID v4 pattern
    expect(body.lead_id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    )
  })
})

// ============================================================
// 2. FEED XML — Geracao e Validacao
// ============================================================

test.describe('Feed XML — Geracao de XML para Portais', () => {

  test('gera feed XML valido para organizacao existente', async ({ request }) => {
    const response = await request.get(XML_URL)

    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toContain('application/xml')

    const xml = await response.text()
    expect(xml).toContain('<?xml')
    expect(xml).toContain('ListingDataFeed')
    expect(xml).toContain('Header')
    expect(xml).toContain('LyneImob')
  })

  test('feed XML tem cache de 1 hora', async ({ request }) => {
    const response = await request.get(XML_URL)
    expect(response.status()).toBe(200)

    const cacheControl = response.headers()['cache-control'] ?? ''
    expect(cacheControl).toContain('max-age=3600')
  })

  test('feed XML retorna 404 para slug inexistente', async ({ request }) => {
    const url = `${BASE_URL}/api/xml/org-fantasma-${Date.now()}`
    const response = await request.get(url)
    expect(response.status()).toBe(404)
  })

  test('feed XML contem estrutura VRSync correta', async ({ request }) => {
    const response = await request.get(XML_URL)
    expect(response.status()).toBe(200)

    const xml = await response.text()
    expect(xml).toContain('Listings')
    expect(xml).toContain('Provider')
    expect(xml).toContain('PublishDate')

    // Se tiver imoveis, deve ter a estrutura completa de Listing
    if (xml.includes('<Listing>')) {
      expect(xml).toContain('ListingID')
      expect(xml).toContain('TransactionType')
      expect(xml).toContain('Location')
      expect(xml).toContain('Details')
      expect(xml).toContain('ContactInfo')
    }
  })

  test('feed XML contem Content-Type correto com charset utf-8', async ({ request }) => {
    const response = await request.get(XML_URL)
    expect(response.status()).toBe(200)

    const contentType = response.headers()['content-type'] ?? ''
    expect(contentType).toContain('application/xml')
    expect(contentType).toContain('utf-8')
  })
})

// ============================================================
// 3. VALIDACAO DO FEED — Endpoint de debug
// ============================================================

test.describe('Validacao do Feed XML', () => {

  test('endpoint de validacao retorna JSON com contadores', async ({ request }) => {
    const response = await request.get(VALIDAR_URL)
    expect(response.status()).toBe(200)

    const body = await response.json()
    expect(body).toHaveProperty('total_publicaveis')
    expect(body).toHaveProperty('total_excluidos')
    expect(body).toHaveProperty('excluidos')

    expect(typeof body.total_publicaveis).toBe('number')
    expect(typeof body.total_excluidos).toBe('number')
    expect(Array.isArray(body.excluidos)).toBe(true)
  })

  test('validacao retorna 404 para slug inexistente', async ({ request }) => {
    const url = `${BASE_URL}/api/xml/org-fantasma-${Date.now()}/validar`
    const response = await request.get(url)
    expect(response.status()).toBe(404)
  })

  test('imoveis excluidos tem motivos explicados', async ({ request }) => {
    const response = await request.get(VALIDAR_URL)
    expect(response.status()).toBe(200)

    const body = await response.json()
    if (body.excluidos.length > 0) {
      for (const excluido of body.excluidos) {
        expect(excluido).toHaveProperty('motivos')
        expect(Array.isArray(excluido.motivos)).toBe(true)
        expect(excluido.motivos.length).toBeGreaterThan(0)
      }
    }
  })

  test('total_excluidos bate com tamanho do array excluidos', async ({ request }) => {
    const response = await request.get(VALIDAR_URL)
    expect(response.status()).toBe(200)

    const body = await response.json()
    expect(body.total_publicaveis).toBeGreaterThanOrEqual(0)
    expect(body.total_excluidos).toBe(body.excluidos.length)
  })
})
