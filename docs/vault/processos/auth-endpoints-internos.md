---
title: "Auth de endpoints internos"
date: 2026-04-28
tags: [seguranca, processos, api, auth]
---

# Auth de endpoints internos da Lynedesk

Documento criado a partir da LYNEDES-148. Define como proteger endpoints sensiveis e qual secret usar em cada chamador.

## Principio

**Endpoints internos da Lynedesk nao podem ser publicos.** Qualquer endpoint que use `criarClienteAdmin()` (service-role do Supabase) ou que dispare side-effects (mensagens WhatsApp, mudanca de toggle, etc.) precisa de auth obrigatorio.

Tres niveis de auth no projeto:

| Nivel | Endpoint | Secret usado | Header |
|---|---|---|---|
| Cron Vercel | `/api/cron/*` | `CRON_SECRET` | `Authorization: Bearer <secret>` |
| Interno (Vercel ↔ Vercel ↔ Railway) | `/api/interno/*` | `INTERNAL_API_SECRET` | `Authorization: Bearer <secret>` (preferencial) ou `x-internal-token` |
| Webhook externo | `/api/webhooks/*` | Token-by-cliente, signature, ou token Uazapi no body | varia |

## INTERNAL_API_SECRET

Secret dedicado para auth de endpoints internos. **Nao reutiliza** a `SUPABASE_SERVICE_ROLE_KEY` — se o secret de API vazar, basta trocar ele sem precisar rodar a key inteira do Supabase.

### Onde configurar

1. **Vercel (.env de producao)** — adicionar `INTERNAL_API_SECRET` com valor aleatorio forte (32+ caracteres, gerar com `openssl rand -hex 32`).
2. **Railway (env do agente Python)** — adicionar `INTERNAL_API_SECRET` com **o mesmo valor** do Vercel.
3. **`.env.local`** — copiar mesma chave do Vercel pra desenvolvimento local.

### Helper centralizado

`src/lib/auth-interna.ts` exporta `validarAuthInterna(request)` que:

- Aceita o secret em `Authorization: Bearer <secret>` (preferencial)
- Tambem aceita em `x-internal-token`
- Tambem aceita em `x-internal-secret` (compat com chamadores antigos — sera removido apos migracao do Railway)
- Tem **fallback de transicao** que aceita `SUPABASE_SERVICE_ROLE_KEY` em `x-internal-secret` enquanto Railway nao for atualizado. Quando todos os chamadores estiverem usando `INTERNAL_API_SECRET`, remover esse fallback.

### Endpoints protegidos por INTERNAL_API_SECRET

| Endpoint | Chamador esperado |
|---|---|
| `POST /api/interno/processar-debounce` | Webhook do WhatsApp (Vercel ↔ Vercel) |
| `POST /api/interno/criar-cliente-negocio` | Agente Python (Railway) |
| `GET/POST /api/interno/ai-toggle` | Admin tools |
| `POST /api/interno/ai-unblock` | Admin tools / Painel |

## Webhooks externos

Webhooks chamados por servicos de fora ja tem mecanismos proprios:

| Endpoint | Auth |
|---|---|
| `/api/webhooks/whatsapp` | Token Uazapi vem no body, validado via `config_whatsapp.uazapi_token` |
| `/api/webhooks/portais` | Token na tabela `integracoes_portais.token_webhook` ou identificacao via `org_slug` |
| `/api/webhooks/stripe` | Signature da Stripe via `stripe.webhooks.constructEvent` |

## Endpoint publico (intencional)

| Endpoint | Por que publico |
|---|---|
| `/api/xml/[slug]` | Feed XML pra portais (ZAP, OLX, etc.) consumirem. Slug funciona como identificador soft. |
| `/api/xml/[slug]/validar` | Mesmo motivo. |

## Smoke tests

Apos configurar `INTERNAL_API_SECRET` em prod:

```bash
# 1. Sem auth → 401
curl -i https://lyneimob.vercel.app/api/interno/ai-toggle

# 2. Com auth Bearer → 200
curl -i https://lyneimob.vercel.app/api/interno/ai-toggle \
  -H "Authorization: Bearer $INTERNAL_API_SECRET"

# 3. Com legado x-internal-secret + secret correto → 200 (compat)
curl -i https://lyneimob.vercel.app/api/interno/ai-toggle \
  -H "x-internal-secret: $INTERNAL_API_SECRET"
```

## Nao implementado nesta entrega

- **Rate limit por IP** em endpoints publicos (webhooks de portais). Adiado — escala atual nao justifica complexidade extra. Reavaliar quando passar de 5 clientes ativos OU quando observar tentativa de abuso.
- **Endpoint `/api/saude/ping`** mencionado na issue **nao existe** no codigo. Se algum dia for criado, deve ja nascer dentro de `/api/interno/saude/*` ou `/api/cron/saude/*`, **nunca publico**.
- **Migrar fallback legacy** (`SUPABASE_SERVICE_ROLE_KEY` em `x-internal-secret`). Manter ate Railway estar 100% rodando com `INTERNAL_API_SECRET` em prod por pelo menos 7 dias sem incidentes — depois abrir issue pra remover.
