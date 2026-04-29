# CLAUDE.md

Este arquivo guia o Claude Code ao trabalhar neste projeto.

---

## Comunicacao

- **Idioma obrigatorio**: toda comunicacao, pastas, arquivos, commits e branches DEVEM ser em **portugues brasileiro**. Nunca responder em ingles.
- **Linguagem didatica**: o usuario nao e desenvolvedor — explicar tudo de forma simples, passo a passo, evitando jargoes. Quando precisar usar um termo tecnico, explicar o que ele significa.
- **Transparencia**: sempre explicar o que foi feito, por que foi feito, e qual o impacto da mudanca no projeto.

---

## LEITURA OBRIGATORIA — Protocolo de Trabalho da Equipe

> **Antes de executar qualquer task neste projeto, o Claude Code DEVE ler o protocolo completo em `docs/vault/processos/protocolo-lynedesk.md`.**
>
> Esse documento define como toda a equipe Lynedesk opera: ferramentas, papeis, fluxo de trabalho, regras inegociaveis e checklists obrigatorios. Nao e sugestao — e o contrato de trabalho.

### Equipe e papeis

| Papel | Quem | Responsabilidade |
|-------|------|-----------------|
| CTO / PO | Joao | Define prioridades, cria tasks, aprova entregas, decide arquitetura |
| Dev | Vitoria | Infra, frontend, backend, banco de dados — tudo do sistema |
| Dev IA | Gabriel | Agente WhatsApp, automacoes, inteligencia artificial |
| Comercial / Ops | Mateus | Clientes, demos, vendas, acompanhamento |
| CEO / Socio | Eduardo | Visao de mercado, posicionamento, validacao estrategica |

### Regras inegociaveis

1. **Uma task por vez**, na sequencia do Linear — nao antecipar nem pular
2. **Somente Joao cria tasks** — devs sugerem via WhatsApp
3. **Somente Joao fecha tasks** — dev move para "Revisao", nunca "Concluido"
4. **Build tem que passar** antes de cada commit (`npm run build`)
5. **Qualidade > Velocidade** — se vai atrasar, avisar no WhatsApp e Joao ajusta prazo
6. **Credenciais nunca no repositorio** — tudo em `.env` (no `.gitignore`)
7. **Tasks bloqueadas sao intocaveis** — status "Aguardando cliente" nao pode ser iniciado sem aviso

### Cadencia obrigatoria (NUNCA inverter)

```
Codigo → Git (commit + push) → Linear (checkboxes + comentario) → WhatsApp (1 linha)
```

**Mensagem no WhatsApp SEM commit no Git = nada pra validar.**

### Status das tasks no Linear

| Status | Significado | Quem move |
|--------|-------------|-----------|
| **Backlog** | Ideia registrada, sem prioridade | Joao |
| **A fazer** | Priorizada, aguardando execucao | Joao |
| **Em andamento** | Em execucao pelo dev | Dev |
| **Revisao** | Implementado, aguardando aprovacao do Joao | Dev |
| **Aguardando cliente** | Depende de retorno externo | Joao |
| **Concluido** | Aprovado pelo Joao | **Somente Joao** |

### Convencao de commits

Formato: `prefixo: LYNEDES-XX descricao curta`

| Prefixo | Quando usar |
|---------|-------------|
| `feat:` | Nova funcionalidade |
| `fix:` | Correcao de bug |
| `refactor:` | Refatoracao sem mudar comportamento |
| `chore:` | Configuracao, deps, infra |
| `docs:` | Documentacao |

Exemplo: `feat: LYNEDES-75 remover onboarding`

### Fluxo Git

```
main (branch principal)
  └── feature/LYNEDES-XX-descricao (branch da task)
       └── PR → review (Joao) → merge em main
```

### Checklist essencial antes de codar

```
[ ] Task aberta no Linear? Li a spec COMPLETA?
[ ] Sei o que "pronto" significa? (criterios de aceite claros)
[ ] Task movida pra "Em andamento"?
[ ] Task NAO esta bloqueada?
```

### Checklist antes de commitar

```
[ ] Build passa localmente? (npm run build sem erros)
[ ] Zero credenciais no codigo?
[ ] Novas env vars documentadas no .env.example?
[ ] Commit message no formato correto?
```

### Checklist depois do push

```
[ ] Linear atualizado? (checkboxes + comentario de progresso)
[ ] Task movida pra "Revisao"?
[ ] Aviso no WhatsApp? (1 linha: [LYNEDES-XX] descricao curta)
```

### 4 canais de trabalho

| Canal | Funcao |
|-------|--------|
| **Git/GitHub** | Producao — codigo vive aqui |
| **Linear** | Operacional — tasks, specs, progresso |
| **WhatsApp** | Comunicacao — avisos curtos com referencia ao Linear |
| **Obsidian** (`docs/vault/`) | Memoria — decisoes, aprendizados, atas, processos |

### Modelo mental

> "Um commit sem update no Linear e uma entrega incompleta, da mesma forma que codigo que nao builda e codigo incompleto."
>
> - Se o Linear nao reflete o que voce fez → voce nao fez.
> - Se o Git nao tem o commit → o codigo nao existe.
> - Se o WhatsApp nao tem o aviso → ninguem sabe.

O processo NAO e burocracia. O processo E PARTE do trabalho.

---

## Estilo de Apresentacao de Planos

Todo plano deve ser escrito como conversa, nao como documentacao tecnica. Usar linguagem natural, analogias quando necessario, e explicar como se estivesse falando com alguem.

**Estrutura**: cobrir 3 pontos em prosa — (1) o problema ou contexto, (2) o caminho que sera seguido, (3) as mudancas que vao acontecer e onde.

**Tom**: direto, sem rodeios, sem jargao desnecessario. Usar 3 a 6 paragrafos curtos. Evitar tabelas, listas frias com 10+ itens e frases como "Procederei a implementar".

---

## Projeto

**Nome**: LyneImob
**Descricao**: CRM imobiliario SaaS com IA integrada em todos os modulos, para corretores e imobiliarias
**Objetivo principal**: ajudar corretores a vender mais com IA que analisa, sugere e automatiza — desde o cadastro do imovel ate o fechamento do negocio

## Tecnologias

- **Framework**: Next.js 16 (App Router) + TypeScript
- **Estilo**: Tailwind CSS 4 + shadcn/ui (Base UI)
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Server State**: TanStack Query v5
- **Formularios**: React Hook Form + Zod v4
- **IA**: OpenAI GPT-4o-mini (SDK `openai`)
- **Pagamentos**: Stripe (`stripe`) — checkout, assinaturas, webhooks, customer portal
- **Email transacional**: Resend (`resend`) — emails de auth (via SMTP no Supabase), convites, notificacoes
- **Cache/Fila**: Upstash Redis (`@upstash/redis`) — debounce e memoria de conversa do agente WhatsApp
- **Icones**: Lucide React
- **Alias de caminho**: `@/` aponta para `./src/`
- **Paleta principal**: gradiente azul vibrante → azul profundo (`#0A5DC2` → `#063A8C` → `#011A42`), destaque `#2B8AFF`

## Comandos

```bash
npm run dev          # Inicia servidor de desenvolvimento em localhost:3000
npm run build        # Gera build de producao otimizado
npm run start        # Roda o build de producao localmente
npm run lint         # Roda ESLint para verificar erros de codigo
```

## Estrutura de Pastas

```
src/
├── app/
│   ├── (auth)/            # Paginas de autenticacao (login, cadastro, esqueci-senha, convite)
│   ├── (dashboard)/       # Paginas do CRM protegidas (layout com sidebar + header)
│   │   ├── painel/        # Dashboard com resumo semanal IA + checklist de onboarding
│   │   ├── imoveis/       # CRUD de imoveis + importacao em massa
│   │   ├── clientes/      # CRUD de clientes + interesses + match IA
│   │   ├── negocios/      # Pipeline Kanban + sugestao acao IA
│   │   ├── atividades/    # Agenda + calendario (mensal, semanal, diario)
│   │   ├── configuracoes/ # Hub: empresa, whatsapp, equipe, distribuicao, portais, meu-site, pipeline, tipos-atividade
│   │   ├── meu-perfil/    # Pagina de perfil do usuario logado
│   │   ├── meu-site/      # Customizacao do site publico
│   │   ├── usuarios/      # Gestao de equipe
│   │   ├── integracoes/   # Integracoes (WhatsApp, portais)
│   │   ├── loteamentos/   # CRUD de loteamentos + lotes + importacao em massa
│   │   ├── admin/         # Area de super admin (gestao global)
│   │   └── financeiro/    # Modulo financeiro
│   ├── [slug]/            # Site publico da imobiliaria (por slug)
│   ├── api/               # API Routes (XML feed, webhooks: portais, stripe, whatsapp; cron: resumo-semanal)
│   ├── page.tsx           # Landing page de vendas (publica, rota /)
│   └── globals.css        # Estilos globais + variaveis de cor shadcn
├── components/
│   ├── ui/                # Componentes shadcn/ui + customizados (StatusBadge, PaginacaoListagem, etc.)
│   ├── layout/            # AppSidebar, Header, UsuarioMenu, BuscaGlobal
│   └── [modulo]/          # Componentes por modulo (imoveis, clientes, negocios, etc.)
├── lib/
│   ├── resumo-semanal/    # Logica de geracao do resumo semanal (gerar-resumo.ts — usado pelo cron e pelo botao regenerar)
│   └── ...                # Supabase clients, openai, stripe, whatsapp, permissoes, constantes, formatadores
├── hooks/                 # Custom hooks (use-organizacao, use-usuario, use-plano, etc.)
├── types/                 # Tipos TypeScript (database, auth, imoveis, clientes, etc.)
├── actions/               # Server Actions (auth, imoveis, clientes, negocios, etc.)
└── middleware.ts          # Middleware de auth (protecao de rotas)

supabase/
└── migrations/            # Migrations SQL do banco (001 a 030)

planejamento/
├── pesquisas/             # Pesquisas geradas pela skill /pesquisa
└── requisitos/            # Requisitos gerados pela skill /requisitos
```

## Arquitetura

- **Multi-tenancy com RLS**: toda tabela tem `organizacao_id` e policies que garantem isolamento total entre imobiliarias
- **Auth**: Supabase Auth com email/senha. Trigger no banco cria organizacao + usuario automaticamente no cadastro
- **Server Components + Server Actions**: dados buscados no servidor, acoes executadas via Server Actions
- **Middleware**: intercepta todas as requisicoes, valida sessao, redireciona se nao autenticado
- **Grupos de rotas**: `(auth)` para paginas publicas, `(dashboard)` para paginas protegidas
- **Clientes Supabase**: 3 variantes — browser (componentes client), server (Server Components/Actions), admin (bypassa RLS)

## Padroes de Codigo

- **Formularios**: React Hook Form + Zod para validacao client+server. Schemas em `types/`
- **Server Actions**: recebem `FormData`, validam com Zod, retornam `{ erro?: string, sucesso?: string }`
- **Hooks**: prefixo `use-`, retornam `{ dados, carregando, erro }` via TanStack Query
- **Nomenclatura**: tudo em portugues brasileiro (nomes de funcoes, variaveis, componentes, tabelas)
- **Erros**: toast via Sonner para feedback ao usuario, mensagens claras em portugues
- **shadcn/ui Base UI**: esta versao usa `render` prop em vez de `asChild` para composicao de componentes

## Variaveis de Ambiente

Obrigatorias no `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=url-do-projeto-supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=chave-publica-do-supabase
SUPABASE_SERVICE_ROLE_KEY=chave-admin-do-supabase (nunca expor no browser)
NEXT_PUBLIC_APP_URL=http://localhost:3000
OPENAI_API_KEY=chave-da-openai (nunca expor no browser, usada apenas em Server Actions)
STRIPE_SECRET_KEY=chave-secreta-do-stripe (nunca expor no browser)
STRIPE_WEBHOOK_SECRET=secret-do-webhook-stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=chave-publica-do-stripe
STRIPE_PRICE_ID_CRM_IA=price-id-do-plano-crm-ia (criado no dashboard Stripe)
STRIPE_PRICE_ID_CRM_IA_SDR=price-id-do-plano-crm-ia-sdr (criado no dashboard Stripe)
UPSTASH_REDIS_REST_URL=url-do-redis-upstash
UPSTASH_REDIS_REST_TOKEN=token-do-redis-upstash
RESEND_API_KEY=chave-da-api-resend (nunca expor no browser)
RESEND_FROM_EMAIL=LyneImob <noreply@seudominio.com>
```

## Arquivos Sensiveis

- `.env.local` — contem segredos, nunca commitar
- `supabase/migrations/` — migrations ja executadas no banco. Nunca alterar as existentes, sempre criar novas
- `src/components/ui/` — componentes shadcn/ui. Podem ser ajustados quando necessario, mas sempre avaliar o impacto global antes (sao reutilizados em todo o sistema)

## Divida Tecnica Conhecida

- Tipos do banco em `types/database.ts` sao manuais. Ja existe o script `npm run gen:types` que gera `types/database.generated.ts` via Supabase CLI — migrar o codigo pra usar o gerado em task separada (requer comparacao campo a campo pra garantir que nada quebre). Ver `scripts/README-gen-types.md`.
- Middleware do Next.js 16 usa convencao deprecated (`middleware.ts`) — migrar para `proxy` quando a nova API estabilizar

## CI

PRs rodam automaticamente via GitHub Actions (`.github/workflows/ci.yml`):

- **Lint + typecheck** — `npm run lint` e `npm run typecheck`. Se falhar, PR nao merge.
- **Build de producao** — `npm run build` com env vars dummy (so valida compilacao, nao executa codigo real).

Pra forcar o CI bloquear merge com falha, habilitar branch protection em `main` e `desenvolvimento` no GitHub: Settings → Branches → Add rule → "Require status checks to pass before merging" → marcar `Lint + Typecheck` e `Build de producao`.

---

## Boas Praticas de Desenvolvimento

Regras que valem sempre, em qualquer tarefa:

- **Nunca duplicar codigo** — antes de criar algo novo, buscar se ja existe no projeto (funcoes, hooks, componentes). Se existe: usar, adaptar ou estender.
- **Corrigir no componente, nao no consumidor** — se o problema esta num componente reutilizavel (Card, Button, Input, etc.), a correcao vai no componente base. Nunca repetir a mesma correcao em cada pagina que usa ele.
- **Simplicidade primeiro** — a solucao mais simples que funciona e a correta. Se envolve criar abstracoes novas, questionar se sao necessarias.
- **Pesquisar antes de codar** — para features grandes ou mudancas com 3+ arquivos, usar `/pesquisa` e `/requisitos` antes de implementar. Para ajustes pontuais, ir direto.
- **Documentacao atualizada** — nao confiar so no conhecimento interno. Verificar APIs e libs via Context7 antes de usar sintaxes que podem ter mudado.
- **Um arquivo, uma responsabilidade** — logica de negocio separada de UI. Chamada de API nao fica misturada com componente visual.
- **So entregar o que foi pedido** — sem melhorias extras, sem refatoracoes nao solicitadas. Se identificar algo que poderia melhorar, mencionar ao usuario — nao implementar sozinho.
- **Na duvida, parar e pesquisar** — se nao tiver certeza sobre como algo funciona ou se ja existe, pesquisar antes de seguir. Nunca chutar.
- **Atualizar CLAUDE.md** — apos toda implementacao que crie, remova ou renomeie algo relevante (funcoes, rotas, componentes, dependencias, estrutura de pastas). Este documento e o coracao do projeto.

## UI e Design — Regras Obrigatorias

**shadcn/ui e o especialista de UI deste projeto.** Toda interface deve seguir o design system definido na skill `frontend-design`.

Regras que valem SEMPRE para qualquer trabalho visual:

- **shadcn primeiro** — antes de criar qualquer elemento visual (botao, card, formulario, tabela, modal), verificar se ja existe um componente no shadcn. Usar o MCP shadcn para buscar. So criar componente customizado se nao existir equivalente.
- **MCP shadcn para componentes novos** — ao precisar de um componente que nao esta em `src/components/ui/`, usar o MCP shadcn para verificar disponibilidade e instalar via CLI: `npx shadcn@latest add [nome]`
- **Nunca hardcodar cores** — usar exclusivamente as variaveis CSS do design system (ver skill frontend-design). Excecoes: `#25D366` (WhatsApp) e `var(--site-primaria)` (site publico).
- **Skill frontend-design obrigatoria** — ler antes de qualquer implementacao visual. Contem paleta completa, tipografia, radius, catalogo de componentes e checklist de entrega.

---

## MCPs Configurados

MCPs sao integracoes externas que dao superpoderes ao Claude Code. Configurados via `.mcp.json` e settings do Claude Code.

- **Context7** — busca documentacao atualizada de bibliotecas e frameworks
- **Gamma** — gera apresentacoes profissionais (slides)
- **shadcn** — especialista de UI: gerencia componentes shadcn/ui, busca exemplos, verifica disponibilidade, instala novos componentes
- **Supabase** — acesso direto ao banco (executar SQL, listar tabelas, criar migrations, gerar tipos)
- **Playwright** — automacao de browser (testes visuais, navegacao, screenshots)
- **Linear** — gestao de projetos e tarefas (criar issues, buscar tickets, gerenciar projetos, ciclos e equipes)

> **Como configurar localmente**: o `.mcp.json` esta no `.gitignore` (contem tokens). Para configurar na sua maquina, copie `.mcp.json.example` para `.mcp.json` e preencha os tokens de cada servico (Supabase, Gamma, Linear).

## Ferramentas Disponiveis (Skills)

- **pesquisa** — etapa 1 do metodo: pesquisa qualquer tema e gera `planejamento/pesquisas/pesquisa-[tema].md`. Nao executa nada, nao altera o projeto — produto final e apenas o arquivo .md
- **requisitos** — etapa 2 do metodo: le uma pesquisa (ou trabalha com escopo conhecido) e gera `planejamento/requisitos/requisito-[tema].md` com o plano de execucao completo. Nao executa nada, nao implementa, nao altera o codigo — produto final e apenas o arquivo .md
- **debate** — etapa 3 do metodo: sessao de debate sobre o plano do projeto. Discute arquitetura, escopo, prioridades e trade-offs com o usuario. Ao concluir, o Joao cria as tasks no Linear
- **frontend-design** — OBRIGATORIO para qualquer alteracao visual (layout, componentes, CSS, paginas). Contem o design system completo do projeto.
- **busca-no-yt** — buscar videos no YouTube
- **commit-inteligente** — analisa mudancas, cria mensagem de commit estruturada, commita e faz push automaticamente. Resolve tudo de uma vez.
- **publicar** — analisa commits, organiza por topicos, gera release notes em linguagem simples, e publica release oficial no GitHub via `gh release create`
- **changelog** — gera resumo organizado de tudo que mudou no projeto (commits e releases) em linguagem simples, direto no chat
- **retornar** — volta o projeto a uma versao ou commit anterior de forma segura, sem apagar historico (usa git revert)

---

## Planejamento

Pesquisas e requisitos ficam em `planejamento/` e sao temporarios — existem para apoiar um ciclo de desenvolvimento.

- Pesquisa: `planejamento/pesquisas/pesquisa-[tema].md`
- Requisito: `planejamento/requisitos/requisito-[tema].md`

**Limpeza automatica:** quando uma task for movida para **Concluido** no Linear, verificar se existe pesquisa ou requisito associado. Se sim, informar o usuario e apagar. Se o usuario quiser manter, respeitar.

---

*Gestao de tarefas: **Linear** e a unica fonte de verdade. Detalhes no topo deste documento (secao "LEITURA OBRIGATORIA — Protocolo de Trabalho da Equipe") e no arquivo `docs/vault/processos/protocolo-lynedesk.md`.*
