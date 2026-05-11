# Adiar alerta automatico (Sentry / Vercel Log Drain) no webhook de portais

**Data:** 2026-04-29
**Decidido por:** Vitoria (com base na auditoria pos-LYNEDES-119)
**Issue:** LYNEDES-146

## Contexto

A LYNEDES-146 pediu pra avaliar Sentry ou Vercel Log Drain pra alertar automaticamente em qualquer 5xx no `/api/webhooks/portais/*`. A motivacao da spec foi: a LYNEDES-119 (erro 500 em producao) so foi descoberta porque um teste E2E do Playwright tropecou nela — sem o teste, ninguem teria visto.

## Decisao

**Adiar a implementacao de alerta automatico.** Em vez disso, a LYNEDES-146 entrega:

- `error_code` padronizado em todas as respostas de erro (clientes integradores podem distinguir falhas)
- Log estruturado de **toda** chamada com latencia + status + organizacao + portal
- `console.error` automatico pra qualquer 5xx (filtravel no painel de logs do hosting)
- Documentacao do formato em [`docs/vault/processos/webhook-portais.md`](../processos/webhook-portais.md)
- Smoke test pos-deploy obrigatorio (curl `{}` vazio → 400 esperado)

## Por que adiar

1. **Zero trafego real hoje.** Validei via banco em 29/04: 3 organizacoes tem `configuracoes_integracoes` populado, mas todas so com WhatsApp + OpenAI — **nenhum portal imobiliario esta integrado**. Os 6 leads em `leads_portais` sao todos da org de teste "QA LyneDesk", inseridos em 16 segundos no dia 20/04 (teste E2E).
2. **Custo de Sentry / Log Drain** nao se justifica sem trafego — tanto financeiro quanto de manutencao (rate limits, configuracao de regras, ruido de alerta).
3. **Smoke test pos-deploy + console.error com prefix** ja resolvem o gap principal hoje (regressao silenciosa). O painel de logs do hosting (Vercel) ja agrupa erros estruturados por prefix e severidade.
4. **Toda chamada gera log** agora — qualquer regressao aparece imediatamente no painel sem precisar de servico externo.

## Quando reabrir

Reavaliar **antes do primeiro cliente real ativar um portal** (provavelmente Jader ou Angelo, dependendo do que o Mateus alinhar). Sinais que indicam que e hora:

- Mais de 1 imobiliaria com portal externo configurado
- Trafego diario consistente no endpoint (>10 reqs/dia)
- Necessidade de SLA formal pra leads (ex: cliente exigiu por contrato)

Nesse momento, abrir issue nova com o estudo de Sentry vs Vercel Log Drain vs alternativa nativa do Supabase Edge.

## Trade-off aceito

**Risco residual:** se um 500 acontecer hoje sem ninguem olhar o painel de logs, a regressao pode passar despercebida ate o smoke test do proximo deploy.

**Mitigacao:** o ciclo de deploys e curto (varios por semana) e o smoke test virou parte do checklist. Alem disso, sem trafego real, a janela de impacto e baixa.

## Referencias

- Handler: [src/app/api/webhooks/portais/route.ts](../../../src/app/api/webhooks/portais/route.ts)
- Doc do endpoint: [`docs/vault/processos/webhook-portais.md`](../processos/webhook-portais.md)
- Issue: LYNEDES-146
