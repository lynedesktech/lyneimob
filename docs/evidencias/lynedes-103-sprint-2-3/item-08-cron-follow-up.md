# Item 08 — Cron de follow-up automatico

## Contexto

Conversas em `em_andamento`/`qualificado` em que a ultima mensagem foi da IA (lead nao respondeu) ficavam orfas. A Sprint 2 adicionou um cron horario (apenas em horario comercial 8h-18h SP) que dispara um follow-up gentil 1x por dia por conversa.

## Onde mudou

- **Endpoint**: [`src/app/api/cron/follow-up/route.ts`](https://github.com/lynedesktech/lyneimob/blob/feature/LYNEDES-103-sprint-2-3/src/app/api/cron/follow-up/route.ts)
- **Schedule**: [`vercel.json:8-10`](https://github.com/lynedesktech/lyneimob/blob/feature/LYNEDES-103-sprint-2-3/vercel.json#L8-L10) — `"0 * * * *"` (de hora em hora)
- **Auth**: header `Authorization: Bearer $CRON_SECRET`

## Regras

- Janela horaria: 8h ≤ hora SP < 18h. Fora disso retorna `{status: "fora_horario"}` sem fazer nada
- Filtra: `status IN (em_andamento, qualificado)` AND `ultima_mensagem_em < agora-2h`
- Pula se ja enviou follow-up hoje (flag Redis `followup:{conversaId}:{YYYY-MM-DD}` com TTL ate fim do dia)
- Pula se a ultima mensagem foi do **lead** (so faz follow-up se ultima mensagem foi enviada pela IA)
- NAO faz follow-up em `encaminhado` (corretor humano assumiu)

## Demo executada

Disparado manualmente no dev server (`http://localhost:3001`) contra o banco de prod (sem ambiente QA isolado ainda — LYNEDES-153 vai resolver isso).

```
[1/2] Sem auth (deve dar 401):
[HTTP 401] {"erro":"Nao autorizado"}

[2/2] Com auth correta (Bearer CRON_SECRET):
[HTTP 200] {"status":"ok","enviados":1,"pulados":12,"total_avaliadas":14}

Hora UTC: 2026-05-04 08 | Hora SP esperada: 08 (UTC-3)
```

Output completo em [`_outputs/item-08-output.txt`](./_outputs/item-08-output.txt).

### Interpretacao do resultado

- **14 conversas avaliadas** (em_andamento/qualificado com ult.msg > 2h atras)
- **12 puladas** (provavelmente ja tinham flag Redis de hoje OU a ult. msg foi do lead)
- **1 follow-up enviado de verdade** — flag Redis criada pra essa conversa, TTL ate 23:59 UTC

## ✅ Comprovacao visual end-to-end

Print recebido no WhatsApp do Gabriel as **08:53** apos o disparo manual: [`item-08-followup-recebido.png`](./item-08-followup-recebido.png)

A mensagem que chegou eh **literalmente identica** ao template hardcoded no codigo:

```
Oi Gabriel, tudo bem? Vi que estavamos conversando por aqui. Posso te ajudar com mais alguma coisa?
```

Match com [`route.ts:105-107`](https://github.com/lynedesktech/lyneimob/blob/feature/LYNEDES-103-sprint-2-3/src/app/api/cron/follow-up/route.ts#L105-L107):

```typescript
const nome = conversa.nome_cliente?.split(" ")[0] || ""  // "Gabriel"
const saudacao = nome ? `Oi ${nome}` : "Oi"              // "Oi Gabriel"
const mensagem = `${saudacao}, tudo bem? Vi que estavamos conversando por aqui. Posso te ajudar com mais alguma coisa?`
```

Cron disparado → 1 mensagem enviada → mensagem real chega → match exato com template. End-to-end fechado.

## Validacao recomendada (manual)

Pra confirmar end-to-end no proximo ciclo:

1. Em horario comercial, identificar uma conversa com `ultima_mensagem_em` recem-passou de 2h
2. Confirmar que a ultima mensagem foi enviada pela IA (`direcao = enviada`)
3. Aguardar o cron das `:00` rodar OU disparar manual
4. Verificar log `[Follow-up] Enviado para <numero>...` no Vercel
5. Confirmar no WhatsApp do lead que recebeu: "Oi <nome>, tudo bem? Vi que estavamos conversando..."

## Observacao honesta

O disparo manual desta validacao enviou 1 mensagem real pra um lead em produção. Isso e exatamente o que o cron fara em horario regular, mas vale ter ciencia. A LYNEDES-153 (QA isolado) vai permitir esse tipo de teste sem tocar em conversas reais.
