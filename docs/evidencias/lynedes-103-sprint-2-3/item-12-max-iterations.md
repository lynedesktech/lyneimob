# Item 12 — MAX_TOOL_ITERATIONS: 3 → 7

## Contexto

Fluxos complexos (buscar imovel + qualificar + agendar + encaminhar) precisam de mais iteracoes do loop de tool-calling do agente. Antes da Sprint 3 estava em 3 e cortava conversas pela metade.

## Onde mudou

### Python (Railway)

[`agent-railway/agente/core/agent.py:18-21`](https://github.com/lynedesktech/lyneimob/blob/feature/LYNEDES-103-sprint-2-3/agent-railway/agente/core/agent.py#L18-L21)

```python
# LYNEDES-103 Sprint 3: aumentado de 3 para 7
# Fluxos complexos (buscar imovel + qualificar + agendar + encaminhar) precisam de mais iteracoes
MAX_TOOL_ITERATIONS = 7
```

Aplicado no loop: [`agent.py:228`](https://github.com/lynedesktech/lyneimob/blob/feature/LYNEDES-103-sprint-2-3/agent-railway/agente/core/agent.py#L228) (`for iteration in range(MAX_TOOL_ITERATIONS + 1)`) e proteger break: [`agent.py:284`](https://github.com/lynedesktech/lyneimob/blob/feature/LYNEDES-103-sprint-2-3/agent-railway/agente/core/agent.py#L284) (`if iteration >= MAX_TOOL_ITERATIONS`).

### TypeScript (CRM Vercel)

[`src/lib/whatsapp/agente-sdr.ts:9-12`](https://github.com/lynedesktech/lyneimob/blob/feature/LYNEDES-103-sprint-2-3/src/lib/whatsapp/agente-sdr.ts#L9-L12)

```typescript
// LYNEDES-103 Sprint 3: aumentado de 3 para 7
// Fluxos complexos (buscar imovel + qualificar + agendar + encaminhar) precisam de mais iteracoes
const MAX_ITERACOES_TOOLS = 7
```

Aplicado no loop: [`agente-sdr.ts:331`](https://github.com/lynedesktech/lyneimob/blob/feature/LYNEDES-103-sprint-2-3/src/lib/whatsapp/agente-sdr.ts#L331) (`for (let iteracao = 0; iteracao < MAX_ITERACOES_TOOLS + 1; iteracao++)`).

## Como validar

Comparativo: pegar uma conversa que antes ia ate o limite e cortava (logs: `[AGENT] MAX_TOOL_ITERATIONS atingido`). Apos a Sprint 3, conversas similares concluem o ciclo completo (qualificar → buscar → encaminhar).

Sem cenario reproduzivel sem dados reais, comprovacao adicional fica manual via observacao em prod (logs Railway).
