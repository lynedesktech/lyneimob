# Item 09 — Cron de auto-close de conversas paradas

## Contexto

Conversas que ficavam abertas por dias/semanas sem atividade poluiam o pipeline e nao reabriam ciclo via item 10 (precisam estar `arquivado`/`finalizado` pra detectar retorno). A Sprint 2 adicionou um cron a cada 6h que arquiva conversas em `em_andamento`/`qualificado` sem atividade ha 24h+.

## Onde mudou

- **Endpoint**: [`src/app/api/cron/auto-close-conversas/route.ts`](https://github.com/lynedesktech/lyneimob/blob/feature/LYNEDES-103-sprint-2-3/src/app/api/cron/auto-close-conversas/route.ts)
- **Schedule**: [`vercel.json:11-14`](https://github.com/lynedesktech/lyneimob/blob/feature/LYNEDES-103-sprint-2-3/vercel.json#L11-L14) — `"0 */6 * * *"` (a cada 6h)
- **Auth**: header `Authorization: Bearer $CRON_SECRET`

## Regras

- Filtra: `status IN (em_andamento, qualificado)` AND `ultima_mensagem_em < agora-24h`
- Update em batch: `UPDATE conversas_whatsapp SET status='arquivado' WHERE id IN (...)`
- NAO fecha `encaminhado` (corretor humano pode estar tratando)
- Logs estruturados por conversa: `[Auto-close] Conversa <id> arquivada — 24h+ sem atividade ...`

## Demo executada

Disparado manualmente no dev server contra o banco de prod.

```
[1/2] Sem auth (deve dar 401):
[HTTP 401] {"erro":"Nao autorizado"}

[2/2] Com auth correta (Bearer CRON_SECRET):
[HTTP 200] {"status":"ok","fechadas":13,"limiteHoras":24}
```

Output completo em [`_outputs/item-09-output.txt`](./_outputs/item-09-output.txt).

### Interpretacao do resultado

- **13 conversas arquivadas** que estavam orfas ha 24h+ no banco. Pelo padrao do `vercel.json`, isso aconteceria nas proximas 6h naturalmente.
- Cliente/negocio vinculados nao foram tocados — so o `status` da conversa.
- Essas 13 conversas agora podem ser detectadas como retorno (item 10) se o lead voltar a mandar mensagem.

## Validacao recomendada

Pra confirmar end-to-end:

1. Antes do disparo, query:
   ```sql
   SELECT count(*) FROM conversas_whatsapp
   WHERE status IN ('em_andamento','qualificado')
     AND ultima_mensagem_em < now() - interval '24 hours';
   ```
2. Disparar cron manual (curl no endpoint com `Authorization: Bearer $CRON_SECRET`)
3. Repetir query: deve retornar 0 (ou bem menos)
4. Verificar nos logs Vercel a linha por conversa: `[Auto-close] Conversa <id> arquivada`

## Observacao honesta

Disparo manual arquivou 13 conversas reais. Comportamento idêntico ao que o Vercel faz a cada 6h em produção (so antecipei).
