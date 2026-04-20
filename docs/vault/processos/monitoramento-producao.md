# Monitoramento de produção — LyneImob

> Protocolo de verificação periódica pra garantir que nada cai silenciosamente.
>
> Criado em LYNEDES-61. Revisar a cada 2 semanas ou quando surgir incidente.

---

## Endpoints de health check

### Público (sem auth) — `/api/saude/ping`

- **Uso:** monitores externos (BetterStack, UptimeRobot, StatusCake)
- **Frequência:** a cada 1 min
- **Alerta:** quando 3 falhas consecutivas
- **Valida:** app up + banco respondendo
- **Não expõe:** nada sensível

### Privado (super_admin) — `/api/saude-integracoes`

- **Uso:** dashboard interno, debug on-demand
- **Valida:** Stripe, Uazapi, Redis, OpenAI — usa credenciais da org logada
- **Acesso:** perfil_plataforma = super_admin ou desenvolvedor

## Checklist semanal (toda segunda, 9h — Vitoria)

- [ ] Acessar `/api/saude-integracoes` autenticado como super_admin → todos verdes?
- [ ] Painel Vercel → Logs da última semana sem erro 5xx recorrente?
- [ ] Supabase → Query Performance sem queries > 5s?
- [ ] Supabase → Storage 80% ou menos?
- [ ] Stripe dashboard → Webhook delivery 100%?
- [ ] Uazapi dashboard → instâncias ativas iguais ao número de orgs com WhatsApp?
- [ ] Redis Upstash → command count dentro do free tier?

Se algum item falhar → abrir task urgente no Linear com label `producao`.

## Logs e tracking

| Sistema | Onde checar | Retention |
|---------|-------------|-----------|
| Next.js runtime | Vercel → Logs | 3 dias (free) |
| Supabase | Dashboard → Logs | 7 dias |
| Stripe webhook | Dashboard Stripe → Developers → Webhooks | Indefinido |
| Uazapi | Dashboard do provedor | Varia |

## Incidentes conhecidos (para referência)

| Data | Sintoma | Causa raiz | Fix |
|------|---------|-----------|-----|
| 20/04/2026 | Portais recebendo 500 | Insert usava campos que não existem no schema (`portal_id`, `dados_brutos`...) | LYNEDES-119 / PR #15 |
| 20/04/2026 | CRUD imóveis timeout 540s | Spec desatualizado após wizard + remoção onboarding | LYNEDES-124 / PR #16 |

## Roadmap de alertas (ainda NÃO configurado)

Pendente de implementação:

- [ ] Webhook pra Slack/Discord quando `/api/saude/ping` retorna 503
- [ ] Sentry pra erros runtime
- [ ] Alerta quando query Supabase > 5s recorrente
- [ ] Cron diário rodando `npm run test:e2e -- smoke` contra produção

**Prioridade:** baixa até ter 3+ clientes pagantes. Por agora, checklist manual semanal é suficiente.
