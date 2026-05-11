# Cron de reconciliacao do callback Railway

## Contexto

Quando o agente Python (Railway) cria uma conversa WhatsApp nova, ele dispara um **callback** pro endpoint `POST /api/interno/criar-cliente-negocio` no CRM. Esse callback eh o que cria o `cliente` e o `negocio` no banco e os linka na conversa.

O callback tem retry interno (2 tentativas), mas se **ambos falharem** (rede caiu, Vercel reiniciou, banco off, etc), a `conversas_whatsapp` fica com `cliente_id = NULL` e `negocio_id = NULL`. Pior: na proxima mensagem do mesmo lead, o webhook detecta `isNova=false` (a conversa ja existe) e nao tenta criar de novo. Resultado: a conversa fica orfa pra sempre — agente continua atendendo (usa `numero_cliente` pra contexto), mas no Pipeline/CRM nao aparece nada.

A LYNEDES-150 entrega uma **rede de seguranca** que roda diariamente pra reconciliar essas conversas orfas.

## Como funciona

### Schedule

Configurado no [`vercel.json`](https://github.com/lynedesktech/lyneimob/blob/main/vercel.json):

```json
{
  "path": "/api/cron/reconciliar-conversas",
  "schedule": "0 5 * * *"
}
```

`0 5 * * *` = todo dia as 5h UTC (= 2h da manha SP). Horario escolhido pra coincidir com baixa carga.

### Endpoint

[`src/app/api/cron/reconciliar-conversas/route.ts`](https://github.com/lynedesktech/lyneimob/blob/main/src/app/api/cron/reconciliar-conversas/route.ts)

- **Auth**: header `Authorization: Bearer $CRON_SECRET` (padrao Vercel cron)
- **Lookback**: 7 dias (configuravel via `DIAS_LOOKBACK`)
- **Filtro**: `cliente_id IS NULL AND negocio_id IS NULL AND criado_em > now() - 7 days`
- **Acao**: pra cada conversa orfa, busca a `config_whatsapp` ativa da org, chama `criarClienteENegocioInicial(supabase, orgId, numeroCliente, conversaId, config, { nomeCliente })`
- **Logs**: prefixo `[CRON-RECONCILIACAO]` em todas as linhas

### Resposta

```json
{
  "status": "ok",
  "reconciliadas": 3,
  "falhas": 1,
  "total_avaliadas": 4,
  "lookback_dias": 7,
  "detalhes": [
    { "id": "uuid", "status": "ok" },
    { "id": "uuid", "status": "fail", "motivo": "config_whatsapp_inativa" }
  ]
}
```

## Como debugar

### "Cron nao esta rodando"

1. Confirmar que `vercel.json` tem o entry e o deploy passou
2. Em `Vercel Dashboard > Project > Settings > Cron Jobs` deve aparecer o schedule
3. `CRON_SECRET` precisa estar configurada nas env vars do projeto

### "Cron rodou mas reconciliadas=0"

Esperado na maior parte dos dias — significa que nenhum callback Railway falhou. Bom sinal.

### "reconciliadas > 0 todo dia"

Sintoma de que o callback Railway esta falhando com frequencia. Investigar via [`/admin/observabilidade/callback-railway`](http://localhost:3000/admin/observabilidade/callback-railway) (LYNEDES-151) — `taxa_sucesso_pct` deve estar baixa.

### "falhas > 0"

Olhar `motivo` no payload OU `[CRON-RECONCILIACAO]` nos logs do Vercel. Causas possiveis:
- `config_whatsapp_inativa`: org ficou sem instancia ativa. Conversa nao pode reconciliar — manualmente ativar config.
- `criarClienteENegocioInicial_retornou_null`: bug em `conversa-utils.ts` (etapa pre-atendimento sumiu, corretor nao encontrado, etc). Olhar os logs `[conversa-utils]`.

## Como testar manual

```bash
curl https://<seu-domain>/api/cron/reconciliar-conversas \
  -H "Authorization: Bearer $CRON_SECRET"
```

Pra forcar uma reconciliacao em uma conversa especifica (smoke test):

```sql
-- Cria conversa orfa fake (simular callback que falhou)
UPDATE conversas_whatsapp
SET cliente_id = NULL, negocio_id = NULL
WHERE id = '<conversa_id_de_teste>';
```

Apos rodar o cron manual, query:

```sql
SELECT id, cliente_id, negocio_id FROM conversas_whatsapp WHERE id = '<conversa_id>';
```

`cliente_id` e `negocio_id` devem estar populados.

## Referencias

- Issue: [LYNEDES-150](https://linear.app/joao-lucas-ucceli/issue/LYNEDES-150)
- Issue-mae: [LYNEDES-110](https://linear.app/joao-lucas-ucceli/issue/LYNEDES-110)
- Decisao arquitetural: `docs/vault/decisoes/callback-railway-criar-cliente-negocio.md`
- Endpoint complementar: `src/app/api/interno/criar-cliente-negocio/route.ts` (callback original)
- Funcao reutilizada: `src/lib/whatsapp/conversa-utils.ts::criarClienteENegocioInicial`
