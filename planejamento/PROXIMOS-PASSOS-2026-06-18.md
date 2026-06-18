# Próximos passos — 18/06/2026 (handoff p/ continuar em casa)

Resumo do que foi feito hoje e o que falta. Começar pelo **Pendente 1** (mais urgente).

---

## ✅ JÁ FEITO — site mobile (no ar em produção, PR #37 mergeado)

Dois problemas reportados num vídeo do site no celular, **corrigidos e testados (funcionou)**:

1. **Botão de WhatsApp quebrado** — o link era montado sem o código do país (55),
   gerando `wa.me/85997752500` em vez de `wa.me/5585997752500`, e o WhatsApp recusava.
   - Agora usa a função `normalizarTelefoneWhatsApp` (que adiciona o 55).
   - Ela foi extraída para um módulo puro: `src/lib/whatsapp/normalizar-telefone.ts`
     (sem dependência de servidor, pode ser usada no navegador).
   - Corrigido em: `src/app/[slug]/imoveis/[id]/page.tsx`,
     `src/app/[slug]/loteamentos/[id]/page.tsx`, `src/app/[slug]/contato/page.tsx`
     e `src/components/site/botao-whatsapp-flutuante.tsx`.

2. **Layout cortado no celular (overflow horizontal)** — as telas de detalhe estouravam
   a largura da tela.
   - `grid-cols-1` + `min-w-0` nas telas de detalhe, `break-words` nas descrições,
     `viewport` explícita no `src/app/layout.tsx` e `overflow-x-clip` no `<main>`
     do `src/app/[slug]/layout.tsx` (cobre TODAS as páginas do site contra corte).

---

## 🔴 PENDENTE 1 — Follow-up da IA parou (BUG achado; correção já mapeada)

**Sintoma (áudio do corretor):** "a IA tá estagnada, os follow-ups pararam".

**Causa raiz (bug de fuso horário):**
- Arquivo: `src/app/api/cron/follow-up/route.ts` + `vercel.json`.
- O `vercel.json` agenda o cron em **UTC**: `0 12,13,18,19 * * 1,3,5`
  → isso equivale a **09h, 10h, 15h, 16h** no horário de Brasília (UTC-3).
- Mas o código (route.ts, linhas ~23-52) valida uma segunda janela em horário de
  Brasília: `JANELAS_VALIDAS` = 12h-14h e 18h-20h BRT.
- Como os horários nunca batem, **toda execução retorna `fora_janela` e NÃO envia
  nenhum follow-up**. Por isso "pararam" (na prática nunca saíram desde essa validação).

**Correção (escolher uma):**
- (A) **Recomendada** — ajustar o schedule no `vercel.json` para o UTC equivalente:
  `0 15,16,21,22 * * 1,3,5` (cobre 12/13/18/19h BRT).
- (B) Ou relaxar/remover a validação `JANELAS_VALIDAS` no `route.ts`.

**Extra a avaliar:** o cron de follow-up NÃO checa `isIAGlobalEnabled()` nem
`isContactBlocked()` (só o agente ao vivo checa, em `src/lib/whatsapp/agente-sdr.ts`).
Considerar adicionar esses gates pra não disparar com a IA desligada/contato bloqueado.

**Como testar depois do deploy:** esperar a janela certa ou chamar a rota manualmente;
conferir no Redis as chaves `followup:count:<conversaId>`.

---

## 🟡 PENDENTE 2 — Treinar a IA para a campanha do Guarujá (ainda NÃO investigado)

**Pedido (áudio):** vão rodar anúncio do loteamento Guarujá mandando os leads direto
pro WhatsApp; querem a IA preparada pra atender bem esses leads específicos.

**A investigar em casa:**
- Como funciona o `prompt_personalizado` em `config_whatsapp` e o `origem_lead`.
- Como dar ao agente o contexto/conhecimento do loteamento Guarujá no prompt.
- Arquivos prováveis: `src/lib/whatsapp/prompt-sdr.ts`, `src/lib/whatsapp/agente-sdr.ts`,
  tabela `config_whatsapp`.

---

## 🟢 PENDENTE 3 — Polir layout das outras páginas (opcional, baixo impacto)

A proteção `overflow-x-clip` já evita o corte em todas as páginas. Polimento fino:
- `src/app/[slug]/page.tsx:147` (descrição "Sobre a empresa") → adicionar `break-words`.
- `src/app/[slug]/sobre/page.tsx` (linhas ~77, 99, 116, 133) → adicionar `break-words`.
- `src/components/site/resumo-lotes-publico.tsx:33` — `grid grid-cols-3` →
  `grid grid-cols-1 sm:grid-cols-3` se apertar no celular.

---

## Como retomar em casa
1. `git pull` na branch `main` (o site corrigido já está lá).
2. Criar uma branch nova pra cada frente (ex: `fix/follow-up-timezone`).
3. Atacar o **Pendente 1** primeiro (urgente e simples).
4. Rodar `npm install` (as dependências não estavam instaladas) antes de `npm run build`.
