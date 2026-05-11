# Item 13 — Burst cooldown no humanizar (5s a cada 5 segments)

## Contexto

Quando a IA gera uma resposta com muitos blocos (`---` na saida), o humanizer dispara N envios sequenciais com delays entre 1-3s. Acima de 5 segmentos seguidos, o WhatsApp pode interpretar como bot e rate-limitar / bloquear. A solucao foi adicionar uma pausa extra de 5s a cada bloco de 5 envios — alinhada com o que o Python ja fazia.

## Onde mudou

### TypeScript (CRM Vercel)

[`src/lib/whatsapp/humanizar.ts:144-149`](https://github.com/lynedesktech/lyneimob/blob/feature/LYNEDES-103-sprint-2-3/src/lib/whatsapp/humanizar.ts#L144-L149)

```typescript
/**
 * LYNEDES-103 Sprint 3: burst cooldown anti-bloqueio
 * Quando enviamos muitos segmentos seguidos, WhatsApp pode rate-limitar.
 * Pausa extra de 5s quando passa de 5 segmentos (alinhado com o Python).
 */
const BURST_THRESHOLD = 5
const BURST_COOLDOWN_MS = 5_000
```

Implementado no loop de `enviarHumanizado`: [`humanizar.ts:192-199`](https://github.com/lynedesktech/lyneimob/blob/feature/LYNEDES-103-sprint-2-3/src/lib/whatsapp/humanizar.ts#L192-L199)

```typescript
// Burst cooldown: a cada BURST_THRESHOLD segmentos, pausa extra
const segmentosEnviados = i + 1
if (segmentosEnviados % BURST_THRESHOLD === 0) {
  console.log(
    `[Humanizar] Burst cooldown apos ${segmentosEnviados} segmentos — pausando ${BURST_COOLDOWN_MS}ms`
  )
  await aguardar(BURST_COOLDOWN_MS)
}
```

### Python (Railway)

Espelho ja existia em `agente/utils/humanizer.py` via `calculate_burst_cooldown()`, chamado em [`rate_limiter.py:95-97`](https://github.com/lynedesktech/lyneimob/blob/feature/LYNEDES-103-sprint-2-3/agent-railway/agente/services/rate_limiter.py#L95-L97).

## ✅ Validacao end-to-end (04/05/2026)

Testado via tunnel cloudflared apontando webhook real da Uazapi pra dev local. Threshold reduzido temporariamente pra 1 (de 5) e maxCaracteres pra 80 (de 500) so pra forcar o cooldown a disparar com qualquer 2+ bubbles — defaults restaurados apos captura.

```
[WhatsApp Webhook] Evento aceito: messages
POST /api/webhooks/whatsapp 200 in 393ms
[Debounce] Processando lote da conversa 76d286cf-5791-44dc-a970-099029f76617
[Humanizar] Burst cooldown apos 1 segmentos — pausando 5000ms      <<< EVIDENCIA
```

Output completo em [`_outputs/item-13-output.txt`](./_outputs/item-13-output.txt).

### O que ficou comprovado

- A logica do cooldown EXECUTA quando atinge o threshold (`(i+1) % BURST_THRESHOLD === 0`)
- A pausa de `BURST_COOLDOWN_MS = 5000` (5s) e respeitada via `await aguardar(...)`
- O log estruturado dispara conforme implementado

### Achados durante o teste (registrar como bugs separados)

1. **Regressao da Sprint 1 (item 3)**: a IA respondeu "Sim, sou uma assistente virtual da Imobiliaria Sonho!" ao perguntarem se era IA — quebra a regra "NUNCA admita ser IA" que foi validada na Sprint 1. Provavelmente o prompt SDR foi reduzido/mudado na Sprint 2/3 e perdeu a regra.

2. **IA recusa apresentar a imobiliaria**: ao perguntar sobre apresentacao da Imobiliaria Sonho (nome, regiões, serviços), a IA respondeu "meu foco e ajudar com informacoes sobre imoveis". Comportamento estranho pra uma SDR que deveria conhecer o proprio negocio. Provavelmente falta `prompt_personalizado` na config_whatsapp da org OU o prompt SDR base eh restritivo demais.

3. **Bug critico do schema Zod ja FIXADO** durante o teste: `message.content` aceitava so string mas a Uazapi manda como object em alguns casos. Sem o fix, a Sprint 2/3 retorna 400 em mensagens reais e o webhook todo para. Fix aplicado na branch antes de finalizar a evidencia.

## Como validar (caso queira reproduzir o cenario natural com 6+ bubbles)

🔴 **Demo manual via WhatsApp**: provocar uma resposta da IA que gere 6+ bubbles separadas por `---`. Cronometrar: a pausa entre as bubbles 5 e 6 deve ter +5s alem do delay normal entre segmentos (1-3s).

Cenario possivel: pedir pra IA listar 6+ imoveis usando a tool `buscar_imoveis` em uma org com muitos imoveis no banco. A IA tende a fragmentar com 1 imovel por bubble.

## Como validar (sem WhatsApp — log)

Logs do Vercel/dev devem mostrar a linha quando o cooldown dispara:

```
[Humanizar] Burst cooldown apos 5 segmentos — pausando 5000ms
```

Procurar essa string nos logs do Vercel apos uma conversa real com resposta longa.
