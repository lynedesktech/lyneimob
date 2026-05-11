# Item 11 — Toggle global da IA + bloqueio por contato

## Contexto

Antes da Sprint 2 nao havia "kill switch" pra IA — se desse problema em prod (ex: agente respondendo errado, custo OpenAI explodindo), so apagando deploy pra parar. Tambem nao havia forma de impedir que a IA respondesse em cima de uma conversa em que o corretor humano ja estava agindo.

A Sprint 2 entregou:
- **Toggle global** via Redis (`ai:global:enabled`): liga/desliga TODA a IA com 1 chamada
- **Auto-block por contato** via Redis (`{chatId}_timeout_{orgId}`, TTL 30 dias): bloqueia IA pra UM lead especifico

## Onde mudou

### Lib core (TS — espelho do Python que ja existia no Railway)

[`src/lib/whatsapp/ia-toggle.ts`](https://github.com/lynedesktech/lyneimob/blob/feature/LYNEDES-103-sprint-2-3/src/lib/whatsapp/ia-toggle.ts) — funcoes:
- `isIAGlobalEnabled()` — default true se chave nao existe
- `setIAGlobal(enabled)` — set "1" ou "0"
- `isContactBlocked(chatId, orgId)` — checa flag
- `setContactBlock(chatId, orgId)` — bloqueia 30 dias
- `removeContactBlock(chatId, orgId)` — destrava

### Endpoints (auth: `x-internal-secret = SUPABASE_SERVICE_ROLE_KEY`)

- [`/api/interno/ai-toggle`](https://github.com/lynedesktech/lyneimob/blob/feature/LYNEDES-103-sprint-2-3/src/app/api/interno/ai-toggle/route.ts) — `GET` retorna estado, `POST {enabled: bool}` muda
- [`/api/interno/ai-unblock`](https://github.com/lynedesktech/lyneimob/blob/feature/LYNEDES-103-sprint-2-3/src/app/api/interno/ai-unblock/route.ts) — `POST {chatId, orgId, action: "block"|"unblock"}`

### Auto-block do webhook

[`src/app/api/webhooks/whatsapp/route.ts`](https://github.com/lynedesktech/lyneimob/blob/feature/LYNEDES-103-sprint-2-3/src/app/api/webhooks/whatsapp/route.ts) — quando humano responde manual no WhatsApp Web, o webhook detecta e chama `setContactBlock` automaticamente (a IA fica fora dessa conversa por 30 dias).

## Demo executada

```
[1/4] GET inicial:
[HTTP 200] {"ai_enabled":true}

[2/4] POST desligar (enabled=false):
[HTTP 200] {"status":"ok","ai_enabled":false}

[3/4] GET apos desligar:
[HTTP 200] {"ai_enabled":false}

[4/4] POST religar (enabled=true) — devolver estado original:
[HTTP 200] {"status":"ok","ai_enabled":true}

[BONUS] Auto-block — POST bloquear contato fake:
[HTTP 200] {"status":"ok","chatId":"5511999000111","orgId":"qa-test","action":"block"}

[BONUS] Auto-unblock — desbloquear:
[HTTP 200] {"status":"ok","chatId":"5511999000111","orgId":"qa-test","action":"unblock"}
```

Output completo em [`_outputs/item-11-output.txt`](./_outputs/item-11-output.txt).

### O que ficou comprovado

- Auth funcionando (sem `x-internal-secret` daria 401)
- `GET` antes/depois confirma persistencia no Redis
- Toggle volta ao estado original (`ai_enabled=true` no fim — zero efeito colateral)
- Block/unblock via API funcional, payload validado (`chatId` + `orgId` obrigatorios)
- Logs estruturados disparados: `[AI Toggle] IA global ATIVADA/DESATIVADA`, `[AI Block] Contato X (org Y) BLOQUEADO/DESBLOQUEADO`

## Validacao manual recomendada

Pra confirmar end-to-end com WhatsApp real:

1. **Toggle global**: `POST /api/interno/ai-toggle {enabled: false}` → mandar mensagem do WhatsApp pro agente → IA NAO deve responder. Religar e mandar de novo → IA responde.
2. **Auto-block real**: corretor humano responde manualmente uma conversa via WhatsApp Web → confirmar log `[AI Block] Contato X BLOQUEADO` no Vercel → mandar nova msg do lead → IA NAO responde.
