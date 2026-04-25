# LyneImob

CRM imobiliario SaaS com IA integrada em todos os modulos. Ajuda corretores e imobiliarias a vender mais — do cadastro do imovel ao fechamento do negocio.

**Publico:** corretores autonomos e imobiliarias
**Modelo:** SaaS multi-tenant
**Stack:** Next.js 16 + React 19 + TypeScript + Supabase + Tailwind CSS 4

---

## Pre-requisitos

- **Node.js** 20.x ou superior
- **npm** 10.x ou superior
- **Git**

---

## Setup local

### 1. Clonar o repositorio

```bash
git clone https://github.com/lynedesktech/lyneimob.git
cd lyneimob
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variaveis de ambiente

Copie o `.env.example` pra `.env.local`:

```bash
cp .env.example .env.local
```

Preencha as variaveis em `.env.local`. Nunca commitar esse arquivo.

Onde conseguir cada credencial:

| Variavel | Onde pegar |
|----------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` + `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API |
| `OPENAI_API_KEY` | platform.openai.com/api-keys |
| `STRIPE_*` | Stripe Dashboard → Developers → API keys + Products |
| `UPSTASH_REDIS_REST_*` | Upstash Console → Redis Database → REST API |
| `RESEND_API_KEY` | resend.com/api-keys |
| `AGENT_RAILWAY_URL` | Railway → projeto do agente → Domains |
| `CRON_SECRET` | Gerar manualmente (qualquer string aleatoria) |

### 4. Rodar em desenvolvimento

```bash
npm run dev
```

Abre em http://localhost:3000

### 5. Verificar build

```bash
npm run build
```

Build deve passar sem erros antes de qualquer push.

---

## Comandos

| Comando | O que faz |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento (hot reload) |
| `npm run build` | Build de producao |
| `npm run start` | Servidor de producao (apos build) |
| `npm run lint` | Lint do codigo |

---

## Estrutura do projeto

```
src/
  app/                  — Rotas Next.js (App Router)
    (dashboard)/        — Area logada
    (site)/             — Site publico
    api/                — API routes + webhooks + crons
  components/           — Componentes UI
  actions/              — Server Actions
  lib/                  — Utilities e integracoes
    whatsapp/           — Agente SDR TypeScript
  types/                — TypeScript types
supabase/
  migrations/           — Migrations SQL versionadas
agent-railway/          — Agente Python (producao no Railway)
  agente/               — Codigo do agente FastAPI
docs/                   — Documentacao tecnica
  agente-ia-documentacao.md
```

---

## Fluxo de trabalho (Git)

Seguir o protocolo Lynedesk:

1. **Branch:** `feature/LYNEDES-XX-descricao-curta`
2. **Commits:** `prefixo: LYNEDES-XX descricao` — prefixos permitidos: `feat | fix | refactor | chore | docs`
3. **PR:** abrir contra `main`, aguardar review do Joao
4. **Merge:** so apos aprovacao
5. **Nunca commitar:** credenciais, `.env.local`, chaves privadas

---

## Documentacao tecnica

- **Agente IA:** [docs/agente-ia-documentacao.md](./docs/agente-ia-documentacao.md)
- **Auditoria do sistema:** [docs/AUDITORIA_SISTEMA.md](./docs/AUDITORIA_SISTEMA.md)

---

## Suporte

Duvidas tecnicas → Joao Lucas Ucceli (CTO)
