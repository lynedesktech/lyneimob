import { test, expect } from '@playwright/test'

// ============================================================
// Sprint 10 — Agente WhatsApp (testes de API via webhook)
// ============================================================

const BASE_URL = process.env.BASE_URL ?? 'https://lyne-imob.vercel.app'
const WEBHOOK_URL = `${BASE_URL}/api/webhooks/whatsapp`

/**
 * Gera um payload Uazapi valido para testes.
 * Cada chamada gera um messageid unico para evitar dedup.
 */
function payloadUazapi(overrides: Record<string, unknown> = {}) {
  const base = {
    EventType: 'messages.upsert',
    event: 'messages.upsert',
    instanceName: 'lyneimob-test',
    instance: 'test-instance-id',
    token: `test-token-${Date.now()}`,
    message: {
      chatid: '5511999998888@s.whatsapp.net',
      fromMe: false,
      messageid: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      senderName: 'Cliente Teste',
      isGroup: false,
      type: 'text',
      text: 'Ola, gostaria de saber sobre apartamentos',
    },
  }

  // Permite override profundo no campo message
  if (overrides.message && typeof overrides.message === 'object') {
    return {
      ...base,
      ...overrides,
      message: { ...base.message, ...(overrides.message as Record<string, unknown>) },
    }
  }

  return { ...base, ...overrides }
}

test.describe('Agente WhatsApp — Webhook', () => {
  test('evento nao-mensagem e ignorado', async ({ request }) => {
    const response = await request.post(WEBHOOK_URL, {
      data: {
        EventType: 'connection.update',
        event: 'connection.update',
      },
    })

    const body = await response.json()
    expect(body.status).toBe('ignorado')
  })

  test('payload sem campo message e ignorado', async ({ request }) => {
    const response = await request.post(WEBHOOK_URL, {
      data: {
        EventType: 'messages.upsert',
        event: 'messages.upsert',
        instanceName: 'lyneimob-test',
        instance: 'test-instance-id',
        token: 'test-token',
        // sem campo message
      },
    })

    // Pode retornar 400 ou { status: "ignorado" }
    const status = response.status()
    if (status === 200) {
      const body = await response.json()
      expect(body.status).toBe('ignorado')
    } else {
      expect(status).toBe(400)
    }
  })

  test('mensagem fromMe e ignorada', async ({ request }) => {
    const response = await request.post(WEBHOOK_URL, {
      data: payloadUazapi({
        message: { fromMe: true },
      }),
    })

    const body = await response.json()
    expect(body.status).toBe('ignorado')
    expect(body.motivo).toBe('mensagem_propria')
  })

  test('mensagem de grupo e ignorada — isGroup true', async ({ request }) => {
    const response = await request.post(WEBHOOK_URL, {
      data: payloadUazapi({
        message: {
          isGroup: true,
          chatid: '5511999998888-1234567890@g.us',
        },
      }),
    })

    const body = await response.json()
    expect(body.status).toBe('ignorado')
    expect(body.motivo).toBe('grupo')
  })

  test('mensagem de grupo e ignorada — chatid com @g.us', async ({ request }) => {
    const response = await request.post(WEBHOOK_URL, {
      data: payloadUazapi({
        message: {
          chatid: '120363123456789012@g.us',
          isGroup: false, // chatid com @g.us deve ser detectado mesmo sem flag
        },
      }),
    })

    const body = await response.json()
    expect(body.status).toBe('ignorado')
    expect(body.motivo).toBe('grupo')
  })

  test('payload invalido retorna erro 400 (validacao Zod)', async ({ request }) => {
    const response = await request.post(WEBHOOK_URL, {
      data: {
        EventType: 'messages.upsert',
        event: 'messages.upsert',
        instanceName: 'lyneimob-test',
        instance: 'test-instance-id',
        token: 'test-token',
        message: {
          chatid: 123, // tipo errado — deveria ser string
          fromMe: 'nao', // tipo errado — deveria ser boolean
        },
      },
    })

    const status = response.status()
    expect(status).toBe(400)

    const body = await response.json()
    expect(body.erro).toMatch(/payload inv[aá]lido/i)
  })

  test('config whatsapp nao encontrada retorna 404', async ({ request }) => {
    // Usa token/instance que certamente nao existem no banco
    const response = await request.post(WEBHOOK_URL, {
      data: payloadUazapi({
        token: `token-inexistente-${Date.now()}`,
        instance: `instance-inexistente-${Date.now()}`,
        instanceName: 'instancia-fantasma',
      }),
    })

    const status = response.status()
    expect(status).toBe(404)

    const body = await response.json()
    expect(body.erro).toMatch(/configura[cç][aã]o/i)
  })

  test('mensagem com texto vazio ainda e processada (nao ignorada)', async ({ request }) => {
    // Mensagens de tipos como imagem/audio podem nao ter texto,
    // mas o webhook deve aceitar o payload se a estrutura for valida
    const response = await request.post(WEBHOOK_URL, {
      data: payloadUazapi({
        token: `token-inexistente-${Date.now()}`,
        instance: `instance-inexistente-${Date.now()}`,
        message: { text: '' },
      }),
    })

    // Nao deve retornar "ignorado" — deve tentar processar
    // (vai falhar na busca de config, mas nao deve ser filtrado antes)
    const status = response.status()
    // 404 = chegou ate a busca de config (bom, nao foi ignorado)
    // 200 = processou (improvavel sem config real)
    expect([200, 404]).toContain(status)
  })
})
