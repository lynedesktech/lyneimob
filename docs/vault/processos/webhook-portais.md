# Webhook de portais imobiliarios

Documentacao do endpoint que recebe leads dos portais (ZAP, OLX, VivaReal, Imovelweb, site proprio, etc).

## Endpoint

```
POST /api/webhooks/portais
```

URL completa em producao: `{NEXT_PUBLIC_APP_URL}/api/webhooks/portais`

## Identificacao da organizacao (obrigatorio)

A request precisa identificar **qual imobiliaria** esta recebendo o lead. Aceita 2 formatos, em ordem de prioridade:

### 1. Por slug (recomendado)

| Local | Campo |
|---|---|
| Header | `x-org-slug` |
| Body | `org_slug` |
| Body | `organizacao_slug` |

O slug pode ser visto no painel: Configuracoes → Meu Site → URL publica (`{slug}` no final).

### 2. Por UUID (avancado)

| Local | Campo |
|---|---|
| Header | `x-org-id` |
| Body | `org_id` |
| Body | `organizacao_id` |
| Body | `empresa_id` |

Usado quando o portal externo permite enviar UUID custom no payload — evita uma busca a mais no banco.

## Identificacao do portal de origem (opcional)

Se enviado, pula a deteccao automatica:

| Local | Campo |
|---|---|
| Header | `x-portal` |
| Body | `portal` |

Se nao enviado, o normalizador tenta detectar por `payload.leadOrigin`, `payload.source` ou cai em `"outro"`.

## Portais suportados

| Portal | Slug interno | Formato de payload |
|---|---|---|
| ZAP Imoveis | `zap` (ou `zapimoveis`) | `customer.name/email/phone/message` + `listing.id` |
| OLX | `olx` | mesmo do ZAP, com fallback pra `lead.*` ou raiz |
| VivaReal | `vivareal` | mesmo do ZAP |
| Imovelweb | `imovelweb` | `contact.name/email/phone/message` + `property.id` |
| Site proprio | `site` | generico (`nome`, `email`, `telefone`, `mensagem`, `imovel_codigo`) |
| WhatsApp | `whatsapp` | generico |
| Outro / desconhecido | `outro` | generico (fallback) |

Codigo: [src/lib/leads/normalizador.ts](../../../src/lib/leads/normalizador.ts).

## Exemplo de payload (formato ZAP)

```bash
curl -X POST https://lyneimob.com.br/api/webhooks/portais \
  -H "Content-Type: application/json" \
  -H "x-org-slug: minha-imobiliaria" \
  -H "x-portal: zap" \
  -d '{
    "customer": {
      "name": "Maria Silva",
      "email": "maria@exemplo.com",
      "phone": "11999999999",
      "message": "Tenho interesse no imovel"
    },
    "listing": { "id": "IMV123" }
  }'
```

Resposta de sucesso (HTTP 201):

```json
{ "lead_id": "uuid-gerado", "status": "processado" }
```

## Validacao minima

O lead precisa ter pelo menos **um** de: `nome`, `email` ou `telefone`. Sem isso, retorna 422 (`lead_sem_dados_minimos`) sem salvar.

## Codigos de erro padronizados

Todo erro retorna body JSON com `error_code` (string) + `erro` (mensagem em portugues).

| HTTP | error_code | Significado |
|---|---|---|
| 400 | `payload_invalido` | Body nao eh JSON valido ou nao eh objeto |
| 400 | `org_nao_identificada` | Faltou slug ou id da organizacao |
| 404 | `org_nao_encontrada` | Slug ou id nao correspondem a nenhuma imobiliaria |
| 422 | `lead_sem_dados_minimos` | Payload chegou mas sem nome/email/telefone |
| 500 | `erro_salvar_lead` | Insert no banco falhou (ver `detalhe`) |
| 500 | `erro_interno` | Erro nao previsto (ver `detalhe` + log do servidor) |

## Logs

Toda chamada gera 1 linha no log com prefixo `[Portais Webhook] requisicao`:

```json
{
  "status": 201,
  "duracao_ms": 87,
  "organizacao_id": "uuid",
  "portal": "zap",
  "error_code": null
}
```

Severidade automatica: `console.error` (5xx), `console.warn` (4xx), `console.log` (2xx). Permite filtrar por status no painel de logs do hosting.

## Smoke test em producao

Apos cada deploy que mexa neste endpoint, rodar:

```bash
curl -X POST https://lyneimob.com.br/api/webhooks/portais \
  -H "Content-Type: application/json" \
  -d "{}" -w "\nHTTP %{http_code}\n"
```

Esperado: `HTTP 400` + `{"error_code":"org_nao_identificada", ...}`. Se vier 500, o handler quebrou e tem regressao.

## Configuracao por cliente nos portais externos

> **Status atual (29/04/2026):** zero clientes com portal imobiliario configurado. Quando o primeiro for cadastrar (Mateus conduz), use a URL `https://lyneimob.com.br/api/webhooks/portais` com `x-org-slug` no header configurado no painel do portal externo.

Quando houver clientes ativos, manter aqui a tabela: `cliente | portal | URL configurada | data ativacao`.

## Referencias

- Handler: [src/app/api/webhooks/portais/route.ts](../../../src/app/api/webhooks/portais/route.ts)
- Normalizador: [src/lib/leads/normalizador.ts](../../../src/lib/leads/normalizador.ts)
- Migration da tabela `leads_portais`: [supabase/migrations/006_leads_portais.sql](../../../supabase/migrations/006_leads_portais.sql)
- Issue de hardening: LYNEDES-146 (esta task)
- Issue-mae do fix do 500: LYNEDES-119
