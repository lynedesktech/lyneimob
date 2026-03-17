# CLAUDE.md

Este arquivo guia o Claude Code ao trabalhar neste projeto.

---

## Comunicacao

- **Idioma obrigatorio**: toda comunicacao, pastas, arquivos, commits e branches DEVEM ser em **portugues brasileiro**. Nunca responder em ingles.
- **Linguagem didatica**: o usuario nao e desenvolvedor — explicar tudo de forma simples, passo a passo, evitando jargoes. Quando precisar usar um termo tecnico, explicar o que ele significa.
- **Transparencia**: sempre explicar o que foi feito, por que foi feito, e qual o impacto da mudanca no projeto.

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
└── migrations/            # Migrations SQL do banco (001 a 025)

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
```

## Arquivos Sensiveis

- `.env.local` — contem segredos, nunca commitar
- `supabase/migrations/` — migrations ja executadas no banco. Nunca alterar as existentes, sempre criar novas
- `src/components/ui/` — componentes shadcn/ui. Podem ser ajustados quando necessario, mas sempre avaliar o impacto global antes (sao reutilizados em todo o sistema)

## Divida Tecnica Conhecida

- Tipos do banco em `types/database.ts` sao manuais — trocar por `supabase gen types` quando o CLI estiver configurado
- Middleware do Next.js 16 usa convencao deprecated (`middleware.ts`) — migrar para `proxy` quando a nova API estabilizar

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

## Ferramentas Disponiveis (Skills)

- **pesquisa** — etapa 1 do metodo: pesquisa qualquer tema e gera `planejamento/pesquisas/pesquisa-[tema].md`. Nao executa nada, nao altera o projeto — produto final e apenas o arquivo .md
- **requisitos** — etapa 2 do metodo: le uma pesquisa (ou trabalha com escopo conhecido) e gera `planejamento/requisitos/requisito-[tema].md` com o plano de execucao completo. Nao executa nada, nao implementa, nao altera o codigo — produto final e apenas o arquivo .md
- **debate** — etapa 3 do metodo: sessao de debate sobre o plano do projeto. Discute arquitetura, escopo, prioridades e trade-offs com o usuario. Quando conclui, gera tarefas executaveis no roadmap.md. Nao implementa nada, nao altera codigo — produto final sao as tarefas no roadmap
- **frontend-design** — OBRIGATORIO para qualquer alteracao visual (layout, componentes, CSS, paginas). Contem o design system completo do projeto.
- **busca-no-yt** — buscar videos no YouTube

---

## Planejamento

Pesquisas e requisitos ficam em `planejamento/` e sao temporarios — existem para apoiar um ciclo de desenvolvimento.

- Pesquisa: `planejamento/pesquisas/pesquisa-[tema].md`
- Requisito: `planejamento/requisitos/requisito-[tema].md`

**Limpeza automatica:** quando uma tarefa for movida para **Concluido** no roadmap, verificar se existe pesquisa ou requisito associado. Se sim, informar o usuario e apagar. Se o usuario quiser manter, respeitar.

---

## Gestao de Tarefas — roadmap.md

O `roadmap.md` e a fonte de verdade do projeto. O Claude atua como gestor — registra, move e atualiza tarefas automaticamente. Nenhuma demanda e perdida.

### As 5 secoes

- **📋 A Fazer** — fila priorizada aguardando execucao
- **🔄 Fazendo** — tarefa em andamento agora
- **✅ Pronto** — implementacao concluida, aguardando validacao do usuario
- **✔️ Concluido** — validado e aprovado pelo usuario
- **💬 Sugestoes** — melhorias identificadas pelo Claude durante o trabalho

### Comportamento automatico

O Claude atualiza o roadmap **por conta propria**, sem precisar ser solicitado:

1. **Pedido novo** → registrar no roadmap antes de executar. Se e pra agora, vai direto pra Fazendo. Se e pra depois, vai pra A Fazer.
2. **Iniciar tarefa** → ler roadmap, mover de A Fazer → Fazendo. Se ja tem algo em Fazendo, perguntar ao usuario.
3. **Tarefa descoberta durante execucao** → registrar em A Fazer e informar o usuario. Se for sugestao de melhoria, registrar em Sugestoes.
4. **Concluir tarefa** → mover de Fazendo → Pronto. Adicionar nota do que foi feito e o que testar.
5. **Tarefa interrompida** → deixar em Fazendo com nota do ponto de parada. Retomar na proxima sessao.
6. **Usuario valida** → mover de Pronto → Concluido com data. Apagar arquivos de planejamento associados. Perguntar se comeca a proxima da fila.
7. **Validacao falhou** → mover de Pronto → Fazendo com nota do problema. Corrigir e devolver pra Pronto.
8. **Pedido de status** → responder em formato curto: Fazendo, Pronto, Proximo da fila, Sugestoes.

### Formato de tarefa

```markdown
- [ ] Titulo claro e objetivo
      Contexto: por que isso precisa ser feito (opcional)
      ← nota de parada ou problema (so quando interrompida ou devolvida)
```

> Se nao esta no roadmap, nao existe. O Claude nunca perde uma demanda e nunca trabalha no escuro.
