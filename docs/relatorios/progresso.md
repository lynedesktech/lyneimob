# Log de progresso — LyneImob (transicao pra produto Duna)

Cada linha = 1 mudanca commitada. Formato: `YYYY-MM-DD HH:MM | acao curta | link/commit`.

Sem transcricao detalhada — pra ver o que mudou de fato, abrir o commit/PR linkado.

## 2026-05-04

| Hora | Acao | Onde |
|------|------|------|
| ~10h | Sprint 1 da 103 (prompt + humanizacao agente) — comprovacao visual concluida | LYNEDES-103 (PR #21 ja em main) |
| ~14h | LYNEDES-152 — drag-drop instantaneo no Kanban (after() Next 16) | PR #29 mergeado |
| ~14h | LYNEDES-151 — observabilidade callback Railway | PR #30 mergeado |
| ~16h | LYNEDES-103 Sprint 2/3 — automacoes (cron follow-up, auto-close, ciclos retorno, toggle IA, max iter, burst cooldown, privacidade Uazapi, logs) + fix critico Zod do webhook | PR #22 mergeado |
| ~17h | Restaurar 19 regras do prompt SDR perdidas na refatoracao da Sprint 2/3 (entre elas "NUNCA admita ser IA" + Regra de Ouro + diretrizes de midia) | commit `469fc43` |
| ~18h | 3 fixes do Angelo: wizard de imovel com navegacao livre por clique nos icones, salvar valores (preco/condominio/IPTU), sidebar dark mode legivel | PR #31 mergeado |
| ~18h | 8 lugares no app trocados de `bg-primary/10` pra `bg-accent` — icones de cards ficavam invisiveis no dark mode (pattern recorrente) | PR #32 mergeado |
| ~19h | LYNEDES-146 hardening do webhook de portais (error_code + log estruturado) | PR #28 mergeado |
| ~19h | LYNEDES-150 cron diario de reconciliacao callback Railway (5h UTC, varre conversas orfas e dispara callback) | PR #33 mergeado |
| ~19h | PR #23 (docs estrategia SaaS Eduardo) fechado sem merge — pivot pra produto unico Duna |
| ~20h | Fix raiz do dark mode: --accent subiu de 0.269 pra 0.35 no globals.css. Resolve invisibilidade dos icones dos cards na origem | PR #34 mergeado |
| ~20h | Duna Fase 1: flag MODO_PRODUTO_UNICO + bloqueio de /admin/* e /financeiro + sidebar so com grupos da org | PR #34 mergeado |

## Marco do dia

- **7 PRs mergeados** em main (29, 30, 22, 31, 32, 28, 33)
- **1 PR descartado** (#23 — estrategia SaaS nao se aplica mais)
- **Bug critico do Zod** descoberto e fixado dentro do PR #22 (sem ele, webhook quebraria em prod)
- **Regressao da Sprint 1** detectada (IA admitia ser IA) — corrigida no commit `469fc43`
- **3 bugs do Angelo** atacados (wizard nav, valores nao salvos, sidebar dark)
- **8 lugares de dark mode invisivel** corrigidos
- **Pivot estrategico** registrado: LyneImob deixa de ser SaaS, vira produto unico da Duna

## Como gerar relatorio formatado

Pegar este arquivo + `git log --since "data" --oneline` = relatorio.
