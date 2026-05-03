# LYNEDES-151 — observabilidade do callback Railway -> CRM

Comprovacao visual da PR [#30](https://github.com/lynedesktech/lyneimob/pull/30). Capturada via Playwright em ambiente local (dev server `npm run dev`, port 3001) com usuario `superadmin@lyneimob.com` (perfil `super_admin`).

## Cenario de teste

1. Acesso a `/admin/observabilidade/callback-railway` — confirma auth (super_admin/desenvolvedor) e que pagina existe
2. Estado inicial: counters zerados (Redis vazio para essas chaves)
3. Seed via script: 38 callbacks distribuidos nas ultimas 12h (30 success / 6 already_exists / 2 fail) + 38 latencias com distribuicao log-normal (180-3500ms)
4. Refresh: pagina mostra todos os numeros computados em tempo real

## Prints

| Arquivo | O que mostra |
|---------|--------------|
| `01-pagina-vazia.png` | Estado inicial — todos os counters em 0, "Nenhum callback registrado", latencias `—`. Layout dos 5 cards (Taxa de Sucesso / Sucessos / Falhas / Ultimo Callback / Latencia P50/P95/P99) renderiza correto |
| `02-pagina-com-dados.png` | **EVIDENCIA PRINCIPAL**: apos seed, todos os numeros aparecem: Taxa 94.7% / 30 sucessos + 6 ja existentes / 2 falhas / Latencias P50=416ms P95=1743ms P99=1955ms / amostra de 38 latencias |

## O que ficou comprovado

1. **Pagina renderiza correto** com layout dos 5 KPIs
2. **Lib `lerMetricasCallback`** soma 24 chaves horarias (3 status x 24h) e calcula percentis sem erro
3. **`registrarCallback`** grava no Redis no formato esperado (counters + lista de latencia + timestamp)
4. **Auth funcionando**: usuarios sem perfil de plataforma sao redirecionados pra `/painel`
5. **`taxa_sucesso_pct`** considera (success + already_exists) / total como esperado
6. **Latencias**: P50/P95/P99 calculados via sort + percentil sobre lista de 1000 mais recentes

## Validacao recomendada amanha (manual humano)

Pra confirmar end-to-end com callbacks reais:
1. Disparar conversa real do Railway -> CRM (mensagem WhatsApp pra org de QA)
2. Observar counter incrementando na UI sem refresh manual (basta ir e voltar na pagina)
3. Validar que `crm:callback:ultimo_em` aparece com timestamp recente
