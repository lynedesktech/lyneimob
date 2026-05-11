# LYNEDES-103 Sprint 2 e 3 — comprovacao visual por item

PR aberto: [#22](https://github.com/lynedesktech/lyneimob/pull/22) · branch `feature/LYNEDES-103-sprint-2-3` · commit `1b1b6cc`

Documentacao item-por-item das 8 entregas das Sprints 2 e 3 da LYNEDES-103.

## Sprint 2 — Automacoes e fluxos avancados

| Item | Tema | Comprovacao |
|------|------|-------------|
| **08** | Cron follow-up automatico (1h horario comercial) | [`item-08-cron-follow-up.md`](./item-08-cron-follow-up.md) |
| **09** | Cron auto-close conversas paradas (6h, fecha 24h+) | [`item-09-cron-auto-close.md`](./item-09-cron-auto-close.md) |
| **10** | Gestao de ciclos de retorno | [`item-10-ciclos-retorno.md`](./item-10-ciclos-retorno.md) |
| **11** | Toggle global IA + bloqueio por contato | [`item-11-toggle-ia-autoblock.md`](./item-11-toggle-ia-autoblock.md) |

## Sprint 3 — Robustez tecnica

| Item | Tema | Comprovacao |
|------|------|-------------|
| **12** | MAX_TOOL_ITERATIONS aumentado de 3 para 7 | [`item-12-max-iterations.md`](./item-12-max-iterations.md) |
| **13** | Burst cooldown no humanizar (5s a cada 5 segments) | [`item-13-burst-cooldown.md`](./item-13-burst-cooldown.md) |
| **14** | Privacidade WhatsApp na conexao (online/last/read) | [`item-14-privacidade-whatsapp.md`](./item-14-privacidade-whatsapp.md) |
| **15** | Logs estruturados no rate_limiter.py | [`item-15-logs-rate-limiter.md`](./item-15-logs-rate-limiter.md) |

## Tipos de comprovacao por item

- **Codigo + linha** (todos): linkando o GitHub na branch
- **Output operacional**: itens 8, 9, 11 — disparo via curl em ambiente local + capture do response
- **Demo visual real (precisa Gabriel via WhatsApp)**: itens 10 (ciclo retorno) e 13 (burst cooldown a 5+ bubbles)
- **Demo via API Uazapi**: item 14 (so faz sentido contra instancia real conectada)

Os itens marcados "precisa Gabriel" tem placeholder no md correspondente.
