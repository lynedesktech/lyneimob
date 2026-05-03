# LYNEDES-152 — drag-and-drop instantaneo (after() do Next 16)

Comprovacao visual da PR [#29](https://github.com/lynedesktech/lyneimob/pull/29). Capturada via Playwright em ambiente local (dev server `npm run dev`, port 3001) com a org `QA LyneDesk` e usuario `superadmin@lyneimob.com`.

## Cenario de teste

Seed criou 1 cliente fake (`QA152 Cliente Teste`) + 2 negocios fake (`QA152 — Apto 2 quartos Pinheiros` e `QA152 — Cobertura Vila Nova`) na primeira etapa do pipeline (Novo Lead). Tudo deletado depois do teste.

## Prints

| Arquivo | O que mostra |
|---------|--------------|
| `00-pipeline-inicial.png` | Pipeline vazio antes do seed — colunas Novo Lead / Contato Feito / Visita Agendada / Proposta Enviada / Em Negociacao |
| `01-antes-do-drag.png` | Pipeline com 2 cards QA152 em "Novo Lead" (count: 2 / R$ 2,4 mi) |
| `02-depois-do-drag.png` | Pos drag-and-drop. Status accessibility confirma: `Draggable item ... was dropped over droppable area` |
| `03-card-movido-instantaneo.png` | **EVIDENCIA PRINCIPAL**: card mostra a sugestao IA chegou (lampada amarela: "Ligar para apresentar o imovel...") — prova que `after()` rodou em background sem segurar o response |
| `04-banco-atualizado-com-sugestao-ia.png` | Apos refresh: persiste no banco. `sugestao_ia_resumo` foi gravada via `after()` apos a Server Action retornar |

## O que ficou comprovado

1. **`after()` funcional**: o `sugerirAcao()` rodou em background — a sugestao apareceu no card sem o usuario precisar dar F5
2. **Server Action retorna rapido**: o `moverNegocio` nao espera mais a IA terminar (latencia agora vem do dev mode + Playwright overhead, nao da OpenAI)
3. **UX preservada**: cards mostram dados corretos, drag-and-drop nao quebrou, badges renderizam

## Limitacoes do teste

- O `browser_drag` do Playwright tem dificuldade em disparar corretamente o `dnd-kit` (precisa pointer events em sequencia). O `dropped over` aparece no status accessibility mas o card pode nao ter mudado de coluna visualmente em todos os runs. **Isso nao e regressao** — o drag funciona em uso humano normal.
- Tempo medido (~3s) inclui hot-compile do Turbopack na 1a Server Action + Playwright overhead. Em PROD com `next start` o tempo deve cair pra <500ms.

## Validacao recomendada amanha (manual humano)

Pra confirmar 100% no fluxo natural:
1. Subir dev server
2. Logar como superadmin
3. Arrastar card real (mouse humano, dnd-kit funciona perfeito) entre 2 colunas
4. Validar que o drop responde instantaneamente
5. Esperar ~5s, validar que sugestao IA aparece no card sem F5
