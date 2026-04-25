# Testes E2E (LYNEDES-67)

Testes automatizados com Playwright que cobrem os fluxos críticos do LyneImob.

## Como rodar

### Pré-requisitos

1. Dev server rodando: `npm run dev`
2. Perfis de teste criados no banco (ver `fixtures/test-data.ts`) — ajuste as env vars se os usuarios do seu ambiente forem outros

### Comandos

```bash
# Roda tudo no CLI (headless)
npm run test:e2e

# Abre a UI interativa (recomendado em dev)
npm run test:e2e:ui

# Debug passo a passo
npm run test:e2e:debug

# Um spec so
npx playwright test --config=tests/e2e/playwright.config.ts auth.spec.ts
```

## Specs disponiveis

| Spec | Cobre |
|---|---|
| `auth.spec.ts` | Login valido (admin/gerente/corretor), senha errada, redefinir senha |
| `imoveis.spec.ts` | CRUD de imoveis |
| `clientes.spec.ts` | CRUD de clientes |
| `negocios.spec.ts` | Pipeline de negocios |
| `atividades.spec.ts` | Criacao e listagem de atividades |
| `agente-whatsapp.spec.ts` | Conexao + fluxo do agente IA |
| `widget-ia.spec.ts` | Widget flutuante + acoes de IA |
| `site-publico.spec.ts` | Site publico por slug da org |
| `portais.spec.ts` | Integracao com portais externos |
| `loteamentos.spec.ts` | CRUD de loteamentos |
| `configuracoes.spec.ts` | Paginas de configuracao |
| `admin.spec.ts` | Area de super admin |

## Relatorio de validacao manual (2026-04-19)

Ao longo das tasks da semana (LYNEDES-65 a 79), os seguintes fluxos foram
validados manualmente ou via Playwright durante o desenvolvimento:

- [x] Login/cadastro (conta QA criada via `/cadastro`, login funcionando)
- [x] Criar imovel (via formulario e via script direto no banco)
- [x] Editar imovel (fluxo validado no teste da LYNEDES-72)
- [x] Widget IA (gerar descricao testado ponta a ponta, com IA retornando
      descricao real do imovel criado — LYNEDES-72)
- [x] Dashboard (abre limpo sem onboarding — LYNEDES-75)
- [x] Build de producao (`npm run build` OK em todas as branches)
- [x] Responsividade mobile (sidebar 16rem, grid com `md:cols-3` — LYNEDES-78)
- [x] Dark mode (dashboard testado em light e dark — LYNEDES-76)

## Pendente (requer execucao dedicada)

- [ ] Rodar toda a suite `npm run test:e2e` contra ambiente de staging
  com seeds carregadas
- [ ] CRUD completo de clientes/negocios/atividades via UI
- [ ] Pipeline kanban (drag and drop entre etapas)
- [ ] Agente WhatsApp SDR (precisa instancia UAZAPI configurada)
- [ ] Billing Stripe (precisa Stripe em modo teste)
- [ ] Integracao com portais externos

## CI

Nao rodamos os testes E2E no CI automatico (LYNEDES-65) por 3 motivos:

1. Precisam de dev server + banco populado — custo alto pra cada PR
2. Flakiness comum em E2E contra SaaS com muitas deps externas
3. Manutencao dos testes precisaria evoluir em paralelo com a UI

Sugestao: rodar a suite manualmente antes de cada release, ou colocar num
workflow noturno com ambiente dedicado.
