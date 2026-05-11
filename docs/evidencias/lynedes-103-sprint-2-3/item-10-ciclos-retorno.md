# Item 10 — Gestao de ciclos de retorno

## Contexto

Lead que volta a mandar mensagem apos a conversa ter sido encerrada (encaminhado/finalizado/arquivado) hoje gerava uma conversa NOVA do zero. Isso tirava contexto e fazia o agente cumprimentar como se fosse primeiro contato. A Sprint 2 adicionou deteccao de retorno: a mesma conversa eh REABERTA e um contador de ciclo eh incrementado, permitindo que o agente personalize a saudacao ("oi, voce voltou!").

## Onde mudou

### Migration

[`supabase/migrations/039_whatsapp_ciclos_retorno.sql`](https://github.com/lynedesktech/lyneimob/blob/feature/LYNEDES-103-sprint-2-3/supabase/migrations/039_whatsapp_ciclos_retorno.sql) — adiciona 2 colunas:

```sql
ALTER TABLE conversas_whatsapp
  ADD COLUMN IF NOT EXISTS ciclo_atual INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS eh_retorno BOOLEAN NOT NULL DEFAULT false;
```

### Logica de deteccao

[`src/lib/whatsapp/conversa-utils.ts:56-84`](https://github.com/lynedesktech/lyneimob/blob/feature/LYNEDES-103-sprint-2-3/src/lib/whatsapp/conversa-utils.ts#L56-L84)

```typescript
// LYNEDES-103 Sprint 2: detectar retorno
// Antes de criar nova, verificar se ja existiu conversa anterior encerrada
// (encaminhado/finalizado/arquivado). Se sim, abrir novo ciclo nessa conversa.
const { data: conversaAnterior } = await supabase
  .from("conversas_whatsapp")
  .select("id, ciclo_atual")
  .eq("organizacao_id", organizacaoId)
  .eq("numero_cliente", numeroCliente)
  .in("status", ["finalizado", "arquivado"])
  .order("criado_em", { ascending: false })
  .limit(1)
  .single()

if (conversaAnterior) {
  const novoCiclo = (conversaAnterior.ciclo_atual ?? 1) + 1
  await supabase
    .from("conversas_whatsapp")
    .update({
      status: "em_andamento",
      eh_retorno: true,
      ciclo_atual: novoCiclo,
      ultima_mensagem_em: new Date().toISOString(),
      nome_cliente: nomeCliente || undefined,
    })
    .eq("id", conversaAnterior.id)

  console.log(`[Conversa] Retorno detectado para ${numeroCliente} — ciclo ${novoCiclo} aberto`)
  return { id: conversaAnterior.id, isNova: false }
}
```

### Prompt do agente

O prompt SDR foi atualizado pra reconhecer `eh_retorno: true` e mudar a saudacao. Ver [`src/lib/whatsapp/prompt-sdr.ts`](https://github.com/lynedesktech/lyneimob/blob/feature/LYNEDES-103-sprint-2-3/src/lib/whatsapp/prompt-sdr.ts) na seção de status da conversa.

## ✅ Validacao end-to-end concluida (04/05/2026)

Cenario testado via tunnel cloudflared apontando webhook real da Uazapi pra dev local rodando codigo da branch sprint-2-3:

```
ANTES (eu arquivei a conversa via SQL):
{ id: 76d286cf, status: 'arquivado', ciclo_atual: 1, eh_retorno: false, ultima_mensagem_em: '11:52' }

GABRIEL MANDOU "Oi" no WhatsApp
   ↓
LOG do webhook handler:
  [WhatsApp Webhook] Evento aceito: messages
  [WhatsApp Webhook] Zod OK, processando...
  [WhatsApp Webhook] Config encontrada, org: 1f03e678-...
  [Conversa] Retorno detectado para 5527997178981 — ciclo 2 aberto
  POST /api/webhooks/whatsapp 200 in 844ms

DEPOIS:
{ id: 76d286cf, status: 'em_andamento', ciclo_atual: 2, eh_retorno: true, ultima_mensagem_em: '12:14' }

A mesma conversa foi REABERTA (mesmo id 76d286cf, ciclo 2)
em vez de criar uma nova do zero.
```

Output completo em [`_outputs/item-10-output.txt`](./_outputs/item-10-output.txt).

### Bugs encontrados durante o teste

1. **Schema Zod do webhook bloqueia 100% das mensagens reais** — `src/types/whatsapp.ts:160` define `message.content` como `z.string()`, mas a Uazapi as vezes manda como objeto (ex: imagem, documento). Se PR #22 for mergeado como esta, **o webhook todo retorna 400 e o agente para de funcionar**. Fix: trocar pra `z.union([z.string(), z.object({}).passthrough()])`. **Critico — fazer no PR #22 antes de mergear.**

2. **Middleware bloqueia hosts nao-conhecidos com 404** — pra teste local via tunnel precisa allowlist. Nao e bug em prod, so atrapalha desenvolvimento. Vale considerar adicionar uma flag dev-only.

## Como validar (caso queira reproduzir)

🔴 **Demo manual via WhatsApp**:

1. Mandar conversa real pro agente
2. Quando IA responder, fechar a conversa via UI (marcar como arquivado/finalizado)
3. Mandar outra mensagem do mesmo numero
4. Verificar no banco:
   ```sql
   SELECT id, ciclo_atual, eh_retorno, status, ultima_mensagem_em
   FROM conversas_whatsapp
   WHERE numero_cliente = '<seu_numero>'
   ORDER BY criado_em DESC LIMIT 5;
   ```
5. Esperado: 1 unica linha com `ciclo_atual = 2`, `eh_retorno = true`, `status = em_andamento`
6. Bonus: agente cumprimentar de forma diferente ("oi de novo", "vi que voce voltou", etc.)

Log esperado nos logs do Vercel: `[Conversa] Retorno detectado para <numero> — ciclo 2 aberto`
