# Observabilidade do callback Railway → CRM

## Contexto

O agente Python (Railway) chama o endpoint `POST /api/interno/criar-cliente-negocio` no CRM (Next.js) toda vez que cria uma conversa nova. Antes da LYNEDES-151 só haviam logs estruturados — sem dashboard, sem latencia medida, sem alerta de falha.

A LYNEDES-151 instrumenta o endpoint pra gravar metricas no Redis e expoe esses numeros numa pagina admin.

## O que e gravado

### Counters horarios (TTL 48h)

Uma chave por hora UTC, por status:

```
crm:callback:success:hourly:YYYY-MM-DD-HH
crm:callback:fail:hourly:YYYY-MM-DD-HH
crm:callback:already_exists:hourly:YYYY-MM-DD-HH
```

Pra ler "ultimas 24h" o lib `lerMetricasCallback` faz `MGET` das 24 chaves horarias mais recentes e soma. TTL de 48h da margem se a hora UTC virar durante a leitura.

### Lista de latencias (rolling 1000)

```
crm:callback:latencia_ms     // LPUSH + LTRIM 0 999
```

Mantem as 1000 ultimas latencias em ms. P50/P95/P99 sao calculados no servidor ao ler (sort + percentil). Pra produtos com mais trafego pode valer migrar pra HDR Histogram.

### Timestamp do ultimo callback

```
crm:callback:ultimo_em       // ISO 8601
```

Mostra "ha quanto tempo" o ultimo callback rodou.

## O que define cada status

- **success**: `criarClienteENegocioInicial` retornou cliente_id + negocio_id novos
- **already_exists**: a conversa ja tinha cliente_id + negocio_id (idempotencia funcionando — NAO eh erro)
- **fail**: config WhatsApp nao encontrada OU `criarClienteENegocioInicial` retornou null

`taxa_sucesso_pct` considera `(success + already_exists) / total` — porque `already_exists` significa que o sistema ja tinha tudo, nao houve falha.

## O que NAO e contado

- 401 (auth invalida) — falha do chamador, nao do CRM
- 400 (JSON invalido / campos faltando) — idem

A latencia comeca a contar APOS validar input/auth — mede so o tempo de processamento real.

## Como ler

### UI (preferido)

Acesse [`/admin/observabilidade/callback-railway`](http://localhost:3000/admin/observabilidade/callback-railway) (super_admin ou desenvolvedor).

### Endpoint API

```
GET /api/admin/observabilidade/callback-railway
```

Retorna JSON com todos os numeros. Util pra dashboards externos ou alertas (ex: cron checa taxa_sucesso_pct < 95%, dispara alerta).

## Como debugar

### "Os numeros estao zerados"

1. Confirme que `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN` estao setadas no Vercel
2. A pagina mostra um banner vermelho se `redis_disponivel: false`
3. Force um callback do Railway: rode uma conversa nova de WhatsApp ou bata curl no endpoint interno (precisa do `INTERNAL_API_SECRET`)

### "Quero ver os valores brutos no Redis"

```bash
# CLI do Upstash (ou MCP supabase/redis se configurado)
redis-cli -u $UPSTASH_REDIS_REST_URL --tls

KEYS crm:callback:*
GET crm:callback:success:hourly:2026-05-03-18
LRANGE crm:callback:latencia_ms 0 10
GET crm:callback:ultimo_em
```

### "Counter nao incrementa"

Olhe `[OBSERVABILIDADE]` nos logs do Vercel. Se Redis falhar, o erro e logado e o endpoint principal continua funcionando — observabilidade nunca quebra o fluxo.

## Referencias

- Issue: [LYNEDES-151](https://linear.app/joao-lucas-ucceli/issue/LYNEDES-151)
- Issue-mae: [LYNEDES-110](https://linear.app/joao-lucas-ucceli/issue/LYNEDES-110)
- Lib: `src/lib/observabilidade/callback-railway.ts`
- Endpoint instrumentado: `src/app/api/interno/criar-cliente-negocio/route.ts`
- Endpoint admin: `src/app/api/admin/observabilidade/callback-railway/route.ts`
- Pagina admin: `src/app/(dashboard)/admin/observabilidade/callback-railway/page.tsx`
