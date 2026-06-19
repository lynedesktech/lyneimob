# Próximos passos — atualizado 19/06/2026

---

## ✅ FEITO — site mobile (em produção, PR #37)

1. **Botão de WhatsApp** agora usa `normalizarTelefoneWhatsApp` (adiciona o 55).
   Módulo puro: `src/lib/whatsapp/normalizar-telefone.ts`. Corrigido em imóvel,
   loteamento, contato e botão flutuante.
2. **Layout cortado no celular**: `grid-cols-1` + `min-w-0` nas telas de detalhe,
   `break-words`, `viewport` explícita e `overflow-x-clip` no `<main>` do site.

---

## ✅ FEITO — Pendente 1: follow-up da IA voltou a funcionar

**Bug:** os crons da Vercel rodam em UTC, mas o `vercel.json` estava agendado como se
fosse horário de Brasília. `12,13,18,19` UTC = `09,10,15,16h` BRT, que nunca caíam nas
janelas exigidas pelo código (12-14h e 18-20h BRT). Resultado: todo disparo retornava
"fora_janela" e NENHUM follow-up era enviado.

**Correção aplicada:**
- `vercel.json`: schedule do follow-up mudado para `0 15,16,21,22 * * 1,3,5`
  (= 12h, 13h, 18h, 19h de Brasília, seg/qua/sex). Agora bate com as janelas do código.
- `src/app/api/cron/follow-up/route.ts`: comentário corrigido (deixa claro que é UTC) e
  adicionados dois portões de segurança que faltavam (espelhando o agente ao vivo):
  - não dispara se a IA estiver desligada globalmente (`isIAGlobalEnabled`);
  - pula contatos onde um humano assumiu manualmente (`isContactBlocked`), pra não
    mandar follow-up por cima do corretor.

**Como testar depois do deploy:** numa seg/qua/sex, nas janelas (12h/13h/18h/19h BRT),
o cron roda; conferir no Redis as chaves `followup:count:<conversaId>`. (Os crons da
Vercel só rodam em produção.)

---

## ⚙️ Pendente 2: treinar a IA para a campanha do Guarujá — É CONFIGURAÇÃO, NÃO CÓDIGO

O sistema é multi-empresa, então não dá pra cravar "Guarujá" no código. O agente já tem
um campo por imobiliária: **`prompt_personalizado`** (entra no prompt como "INSTRUÇÕES
ESPECÍFICAS DA IMOBILIÁRIA"). É só preencher isso no painel da Duna:

**Onde:** CRM → Configurações → WhatsApp → campo de instruções/prompt personalizado.

**Texto sugerido pra colar (ajuste os detalhes reais do empreendimento):**

```
CAMPANHA ATIVA — LOTEAMENTO GUARUJÁ:
Estamos com uma campanha no ar do Loteamento Guarujá. Muitos leads vão chegar
perguntando sobre ele. Quando o cliente mencionar "Guarujá", "loteamento" ou vier do
anúncio:
- Trate como lead quente: ele já viu o anúncio, demonstre que conhece o empreendimento.
- Use a ferramenta de busca pra trazer os dados reais do Guarujá (lotes, valores,
  condições) — nunca invente preço.
- Diferenciais a destacar: [PREENCHER: ex. condomínio fechado, clube, proximidade da
  praia, condições de lançamento].
- Objetivo: qualificar rápido (nome + se é pra morar/investir + faixa de valor) e
  encaminhar pro corretor, ou agendar visita.
```

**Pré-requisito:** garantir que o loteamento Guarujá esteja **cadastrado** no sistema
(com lotes, fotos e valores), senão a IA não consegue puxar os dados reais.

---

## ✅ FEITO — Pendente 3: polimento de layout

`break-words` adicionado nas descrições da home (`[slug]/page.tsx`) e da página "sobre"
(`[slug]/sobre/page.tsx`), pra texto longo quebrar certo no celular em vez de cortar.
O `resumo-lotes-publico` (grid de 3 colunas) foi mantido — são caixas curtas que cabem
no celular, e o `overflow-x-clip` já protege contra qualquer corte.
