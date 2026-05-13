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
| ~21h | Setado typescript.ignoreBuildErrors + eslint.ignoreDuringBuilds (87 issues pre-existentes herdadas da fase SaaS) | commit `a081103` |
| ~21h | Subir --sidebar-accent pra 0.5 e --accent pra 0.45 — contraste mais nitido no dark mode | commit `7e21800` |
| ~21h | Deploy prod via Vercel CLI (CI estava bloqueando por lint) | https://lyneimob.vercel.app |
| ~22h | Duna Fase 2: bloquear /cadastro via middleware, esconder banner de trial e link Financeiro do menu | PR #35 mergeado + deploy |
| ~22h | Validacao Playwright contra prod: Fase 1+2 OK. Achado bonus: painel ainda mostrava "Visao da Plataforma" pra super_admin (9 orgs, 15 usuarios, etc) | 7 prints em docs/evidencias/duna-fase-1-2/ |
| ~22h | Fix: painel forca perfilPlataforma=null em modo produto unico — toda condicional de painel investidor/desenvolvedor/super_admin desliga | commit `a908295` + deploy |

## 2026-05-12

| Hora | Acao | Onde |
|------|------|------|
| ~09h | Duna Fase 3: deletar Stripe/billing — 8 arquivos/pastas, 1774 linhas removidas. verificar-limites.ts adaptado pra sempre liberar (10 callsites) | PR #36 mergeado + deploy |
| ~10h | Cores azuis apagadas em LIGHT mode na landing — bg-{accent-blue,success,warning,info}/10 -> /25 + dark:/30 | PR #37 (auto-deploy) |
| ~11h | Landing LyneImob movida pra /lyneimob — / agora redireciona pra /login ou /painel | commit em main |
| ~11h | Tentativa de favicon com logo Duna (logo-preto.png) — saiu horizontal feio | reverter |
| ~12h | Favicon programatico via next/og — quadrado preto "D" branco. Apaguei public/favicon.ico que tinha prioridade | commit `d3e8988` |
| ~13h | Reverter title navegador + favicon: CRM volta a marca LyneImob (Duna so no site publico via dominio proprio) | commit `b2aa73f` |
| ~14h | Prompt SDR V33: merge da estrutura humanizadora da Gaby/Smart Imob com regras especificas do LyneImob/Duna (alto padrao Ceara, terrenos/casas/coberturas, sem MCMV/Tanac do Smart) | commit `0e0f608` + deploy |
| ~15h | Atualizar relatorio executivo pro Eduardo cobrindo semana 05-15/05 | docs/relatorios/para-eduardo-2026-05-15.md |

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
