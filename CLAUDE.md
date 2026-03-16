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
- **Paleta principal**: azul-marinho `#1e3a5f`

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
│   ├── (auth)/                # Paginas de autenticacao (login, cadastro, esqueci-senha, convite)
│   ├── (dashboard)/           # Paginas do CRM protegidas (layout com sidebar + header)
│   │   ├── layout.tsx         # Layout principal: sidebar + header + providers + onboarding
│   │   ├── page.tsx           # Dashboard com resumo semanal IA + checklist de onboarding
│   │   ├── providers.tsx      # QueryClientProvider (TanStack Query)
│   │   ├── imoveis/           # Modulo de imoveis
│   │   │   ├── page.tsx       # Listagem com filtros e paginacao + botao importar
│   │   │   ├── novo/page.tsx  # Formulario de criacao
│   │   │   ├── importar/page.tsx  # Importacao em massa (CSV/Excel) — wizard 3 etapas
│   │   │   └── [id]/          # Detalhe e edicao
│   │   │       ├── page.tsx   # Detalhe com tabs (info, fotos, IA)
│   │   │       └── editar/page.tsx  # Formulario de edicao
│   │   ├── clientes/          # Modulo de clientes
│   │   │   ├── page.tsx       # Listagem com filtros e paginacao
│   │   │   ├── novo/page.tsx  # Formulario de criacao
│   │   │   └── [id]/          # Detalhe e edicao
│   │   │       ├── page.tsx   # Detalhe com 5 tabs (info, interesses, timeline, match, IA)
│   │   │       └── editar/page.tsx  # Formulario de edicao
│   │   ├── negocios/          # Modulo de negocios/pipeline
│   │   │   ├── page.tsx       # Pipeline Kanban com drag-and-drop e filtros
│   │   │   ├── novo/page.tsx  # Formulario de criacao de negocio
│   │   │   └── [id]/          # Detalhe e edicao
│   │   │       ├── page.tsx   # Detalhe com tabs (info, IA) + acoes (ganhar, perder, reabrir) + card sugestao acao IA
│   │   │       └── editar/page.tsx  # Formulario de edicao
│   │   ├── atividades/        # Modulo de atividades/agenda
│   │   │   ├── page.tsx       # Listagem com filtros, paginacao e toggle lista/calendario
│   │   │   ├── novo/page.tsx  # Formulario de criacao de atividade (aceita searchParams: titulo, tipo, negocio_id)
│   │   │   └── [id]/          # Detalhe e edicao
│   │   │       ├── page.tsx   # Detalhe com tabs (info, IA) + acoes (concluir, reagendar, cancelar)
│   │   │       └── editar/page.tsx  # Formulario de edicao
│   │   ├── usuarios/           # Gestao de equipe (admin only)
│   │   │   └── page.tsx       # Listagem de membros, convites, alterar cargo
│   │   ├── planos/             # Pagina de planos e billing
│   │   │   └── page.tsx       # Listagem dos 3 planos (Trial, CRM+IA, CRM+IA+SDR)
│   │   ├── conversas/          # Painel de conversas WhatsApp
│   │   │   ├── page.tsx       # Listagem com filtros (status, busca) e paginacao
│   │   │   └── [id]/
│   │   │       └── page.tsx   # Detalhe com historico de chat + qualificacao do lead
│   │   ├── integracoes/       # Modulo de integracoes com portais
│   │   │   └── page.tsx       # Feed XML, webhook de leads, listagem de leads recebidos
│   │   ├── meu-site/          # Painel de customizacao do site publico
│   │   │   └── page.tsx       # Configuracoes de cores, hero, sobre nos, logo
│   │   └── configuracoes/     # Configuracoes de integracoes (chaves de API)
│   │       └── page.tsx       # Formulario de chaves (Stripe, OpenAI, WhatsApp, Redis)
│   ├── [slug]/                # Site publico da imobiliaria (por slug)
│   │   ├── layout.tsx         # Layout publico (header + footer + validacao slug)
│   │   ├── page.tsx           # Home do site (hero + imoveis destaque + sobre)
│   │   ├── not-found.tsx      # Pagina 404 personalizada
│   │   ├── imoveis/
│   │   │   ├── page.tsx       # Listagem publica com filtros e paginacao
│   │   │   └── [id]/
│   │   │       └── page.tsx   # Detalhe do imovel (galeria + info + contato)
│   │   ├── contato/
│   │   │   └── page.tsx       # Formulario de contato (cria lead automaticamente)
│   │   └── sobre/
│   │       └── page.tsx       # Pagina Sobre Nos (historia, missao, visao, valores)
│   ├── auth/callback/         # Route handler para callback do Supabase Auth
│   ├── api/                   # API Routes
│   │   ├── xml/[slug]/route.ts      # Feed XML VRSync (GET — publico, retorna XML dos imoveis)
│   │   └── webhooks/
│   │       ├── portais/route.ts     # Webhook receptor de leads dos portais (POST)
│   │       ├── stripe/route.ts      # Webhook Stripe — eventos de pagamento e assinatura (POST)
│   │       └── whatsapp/route.ts    # Webhook receptor de mensagens WhatsApp via Uazapi (POST)
│   ├── layout.tsx             # Root layout (fontes, Toaster)
│   └── globals.css            # Estilos globais + variaveis de cor shadcn
├── components/
│   ├── ui/                    # Componentes shadcn/ui (Button, Input, Card, Select, Tabs, Badge, Dialog, Table, Switch, etc.) + customizados (StatusBadge, ConfirmacaoExclusao, PaginacaoListagem, EstadoVazio)
│   ├── layout/                # Componentes do layout (AppSidebar, Header, UsuarioMenu, BuscaGlobal — provider + dialog + trigger)
│   ├── imoveis/               # Componentes do modulo de imoveis (formulario, card, filtros, galeria, IA, importador-imoveis)
│   ├── clientes/              # Componentes do modulo de clientes (formulario, card, filtros, interesses, timeline, match, IA)
│   ├── negocios/              # Componentes do modulo de negocios (kanban-board, kanban-coluna, kanban-card, formulario, filtros, acoes, IA, card-sugestao-acao)
│   ├── atividades/            # Componentes do modulo de atividades (formulario, card, filtros, acoes, excluir, ia-atividade)
│   │   └── calendario/        # Componentes do calendario (calendario-atividades, visao-mensal, visao-semanal, visao-diaria)
│   ├── conversas-whatsapp/    # Componentes do painel de conversas (conexao-whatsapp, card-conversa, conversas-conteudo, filtros-conversas, historico-conversa, info-qualificacao)
│   ├── integracoes/           # Componentes de integracoes (feed-xml-info, webhook-info, integracoes-conteudo, card-lead, acoes-lead, filtros-leads, config-distribuicao, carga-corretores)
│   ├── site/                  # Componentes do site publico (header-site, footer-site, card-imovel-publico, filtros-imoveis-publico, galeria-imovel, formulario-contato, secao-hero, paginacao-site)
│   ├── planos/                # Componentes do modulo de billing (card-plano, pagina-planos, banner-trial, banner-trial-layout)
│   ├── meu-site/              # Componentes do painel de customizacao (formulario-configuracoes-site, upload-imagem-site, preview-cores, configuracao-dominio)
│   ├── dashboard/             # Componentes do dashboard (card-resumo-semanal)
│   ├── onboarding/            # Componentes de onboarding (provedor-onboarding, card-onboarding, checklist-onboarding)
│   ├── configuracoes/         # Componentes de configuracoes (formulario-configuracoes-integracoes)
│   └── usuarios/              # Componentes de gestao de equipe (pagina-usuarios, formulario-convite)
├── lib/
│   ├── supabase/              # Clientes Supabase (client.ts, server.ts, admin.ts, middleware.ts)
│   ├── site/                  # Funcoes de busca de dados publicos (buscar-dados-site.ts — buscarOrganizacaoPorSlug, buscarOrganizacaoPorDominio, buscarDominioOrganizacao)
│   ├── xml/                   # Gerador XML VRSync (vrsync.ts — feed para portais imobiliarios)
│   ├── leads/                 # Normalizador de leads dos portais (normalizador.ts)
│   ├── whatsapp/              # Agente SDR WhatsApp
│   │   ├── uazapi.ts          # Wrapper da API Uazapi (enviar texto, imagem, simular digitando, gestao de instancia — criar, conectar, status, desconectar, webhook)
│   │   ├── humanizar.ts       # Envio humanizado (quebrar mensagem, delay, digitacao)
│   │   ├── processar-midia.ts # Processamento de midia (Whisper audio, Vision imagem, PDF)
│   │   ├── debounce.ts        # Debounce com Redis (agrupa mensagens em janela de 20s)
│   │   ├── agente-sdr.ts      # Orquestrador do agente IA (contexto, OpenAI, tools, resposta)
│   │   ├── prompt-sdr.ts      # Prompt do agente SDR (persona, qualificacao, regras)
│   │   ├── tools-sdr.ts       # Tools function calling (buscar imoveis, criar cliente/negocio/atividade)
│   │   └── memoria.ts         # Memoria de conversa com Redis (20 mensagens, TTL 24h)
│   ├── stripe.ts              # Cliente Stripe singleton (billing)
│   ├── permissoes.ts          # Mapa de permissoes centralizado (temPermissao, verificarPermissao, obterPermissoes)
│   ├── verificar-limites.ts   # Verificacao de limites por plano (imoveis, corretores, IA, modulos)
│   ├── distribuicao-leads.ts  # Distribuicao de leads entre corretores (obterProximoCorretor — manual/roleta/balanceamento)
│   ├── redis.ts               # Cliente Upstash Redis (debounce + memoria de conversa)
│   ├── openai.ts              # Cliente OpenAI (GPT-4o-mini para IA em imoveis)
│   ├── formatadores.ts        # Funcoes utilitarias de formatacao (formatarPreco, formatarData, formatarDataHora, formatarDataCurta, formatarDataHoraCurta)
│   └── utils.ts               # Funcao cn() do shadcn
├── hooks/                     # Custom hooks (use-organizacao, use-usuario, use-mobile, use-plano, use-lista-imoveis, use-imovel, use-lista-clientes, use-cliente, use-pipeline, use-negocio, use-lista-atividades, use-atividade, use-atividades-calendario, use-lista-leads, use-lista-conversas, use-conversa-whatsapp, use-lista-usuarios, use-config-distribuicao, use-config-whatsapp, use-instancia-whatsapp, use-busca-global, use-onboarding)
├── types/                     # Tipos TypeScript (database.ts, auth.ts, imoveis.ts, clientes.ts, negocios.ts, atividades.ts, leads-portais.ts, formulario.ts, billing.ts, configuracoes-site.ts, configuracoes-integracoes.ts, whatsapp.ts, distribuicao-leads.ts, dominios.ts, busca-global.ts, onboarding.ts, resumo-semanal.ts, importacao.ts)
├── actions/                   # Server Actions (auth.ts, imoveis.ts, ia-imoveis.ts, clientes.ts, ia-clientes.ts, negocios.ts, ia-negocios.ts, atividades.ts, ia-atividades.ts, billing.ts, leads-portais.ts, site-contato.ts, configuracoes-site.ts, configuracoes-integracoes.ts, usuarios.ts, convites.ts, distribuicao-leads.ts, whatsapp.ts, instancia-whatsapp.ts, dominios.ts, busca-global.ts, onboarding.ts, resumo-semanal.ts, importacao-imoveis.ts)
└── middleware.ts               # Middleware de auth (protecao de rotas)

supabase/
└── migrations/                # Migrations SQL do banco (001_organizacoes_usuarios.sql, 002_imoveis.sql, 003_clientes.sql, 004_negocios.sql, 005_atividades.sql, 006_leads_portais.sql, 007_site_assets_bucket.sql, 008_whatsapp.sql, 009_configuracoes_integracoes.sql, 010_billing.sql, 011_convites_usuarios.sql, 012_distribuicao_leads.sql, 013_dominios_customizados.sql, 014_canais_publicacao.sql, 015_onboarding.sql, 016_resumos_semanais.sql, 017_whatsapp_instance_id.sql, 018_sugestao_ia_resumo.sql)

planejamento/
├── pesquisas/                 # Pesquisas geradas pela skill /pesquisa
└── requisitos/                # Requisitos gerados pela skill /requisitos
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

## Arquivos Sensiveis / Nao Modificar

- `.env.local` — contem segredos do Supabase
- `supabase/migrations/` — migrations ja executadas no banco (nao alterar, criar novas)
- `src/components/ui/` — componentes gerados pelo shadcn/ui (alterar com cuidado)

## Divida Tecnica Conhecida

- Tipos do banco em `types/database.ts` sao manuais — trocar por `supabase gen types` quando o CLI estiver configurado
- Middleware do Next.js 16 usa convencao deprecated (`middleware.ts`) — migrar para `proxy` quando a nova API estabilizar
- Paginas de auth e dashboard precisam de polimento visual com a skill `frontend-design`

---

## Boas Praticas de Desenvolvimento

Regras que valem sempre, em qualquer tarefa:

- **Nunca duplicar codigo** — antes de criar algo novo, buscar se ja existe no projeto (funcoes, hooks, componentes). Se existe: usar, adaptar ou estender.
- **Simplicidade primeiro** — a solucao mais simples que funciona e a correta. Se envolve criar abstracoes novas, questionar se sao necessarias.
- **Pesquisar antes de codar** — para features grandes ou mudancas com 3+ arquivos, usar `/pesquisa` e `/requisitos` antes de implementar. Para ajustes pontuais, ir direto.
- **Documentacao atualizada** — nao confiar so no conhecimento interno. Verificar APIs e libs via Context7 antes de usar sintaxes que podem ter mudado.
- **Um arquivo, uma responsabilidade** — logica de negocio separada de UI. Chamada de API nao fica misturada com componente visual.
- **So entregar o que foi pedido** — sem melhorias extras, sem refatoracoes nao solicitadas. Se identificar algo que poderia melhorar, mencionar ao usuario — nao implementar sozinho.
- **Na duvida, parar e pesquisar** — se nao tiver certeza sobre como algo funciona ou se ja existe, pesquisar antes de seguir. Nunca chutar.
- **Atualizar CLAUDE.md** — apos toda implementacao que crie, remova ou renomeie algo relevante (funcoes, rotas, componentes, dependencias, estrutura de pastas). Este documento e o coracao do projeto.

## MCPs Configurados

MCPs são integrações externas instaladas por projeto via `.mcp.json`.

### Fixos neste template
- **Context7** — busca documentação atualizada de bibliotecas e frameworks

### Específicos do projeto
(nenhum adicional por enquanto)

## Ferramentas Disponiveis (Skills)

- **pesquisa** — etapa 1 do metodo: pesquisa qualquer tema e gera `planejamento/pesquisas/pesquisa-[tema].md`. Nao executa nada, nao altera o projeto — produto final e apenas o arquivo .md
- **requisitos** — etapa 2 do metodo: le uma pesquisa (ou trabalha com escopo conhecido) e gera `planejamento/requisitos/requisito-[tema].md` com o plano de execucao completo. Nao executa nada, nao implementa, nao altera o codigo — produto final e apenas o arquivo .md
- **debate** — etapa 3 do metodo: sessao de debate sobre o plano do projeto. Discute arquitetura, escopo, prioridades e trade-offs com o usuario. Quando conclui, gera tarefas executaveis no roadmap.md. Nao implementa nada, nao altera codigo — produto final sao as tarefas no roadmap
- **frontend-design** — OBRIGATORIO para qualquer alteracao visual (layout, componentes, CSS, paginas)
- **busca-no-yt** — buscar videos no YouTube

---

## Arquivos de planejamento

Pesquisas e requisitos gerados pelas skills ficam em `planejamento/`:
- `planejamento/pesquisas/` — arquivos gerados pela skill `pesquisa`
- `planejamento/requisitos/` — arquivos gerados pela skill `requisitos`

Nunca salvar pesquisas ou requisitos fora dessa pasta.
Ao criar um novo arquivo de planejamento, seguir a convencao:
- Pesquisa: `planejamento/pesquisas/pesquisa-[tema].md`
- Requisito: `planejamento/requisitos/requisito-[tema].md`

---

## Ciclo de vida dos arquivos de planejamento

Pesquisas e requisitos são arquivos temporários — existem para apoiar um ciclo de desenvolvimento e devem ser removidos quando esse ciclo fecha.

### Regra de limpeza

Quando o Claude mover uma tarefa para a seção **Concluído** no `roadmap.md`, deve verificar se existe algum arquivo de planejamento associado a ela e, se existir, **apagar**.

**Arquivos a apagar:**
- `planejamento/pesquisas/pesquisa-[tema].md` relacionada à tarefa
- `planejamento/requisitos/requisito-[tema].md` relacionado à tarefa

### Como identificar o arquivo associado

O tema do arquivo de planejamento geralmente bate com o tema da tarefa no roadmap. Exemplos:

- Tarefa concluída: "Implementar autenticação"
  → Apagar: `pesquisa-autenticacao.md` e/ou `requisito-autenticacao.md`

- Tarefa concluída: "Listagem de contatos"
  → Apagar: `pesquisa-listagem-contatos.md` e/ou `requisito-listagem-contatos.md`

Se não houver arquivo de planejamento associado, não fazer nada.

### Regra de confirmação

Antes de apagar, informar em uma linha o que será removido:
> "Vou apagar `planejamento/requisitos/requisito-autenticacao.md` pois a tarefa foi concluída."

Se o usuário não quiser apagar, basta dizer e o arquivo é mantido.

### O que nunca apagar

- Arquivos em `planejamento/pesquisas/` ou `planejamento/requisitos/` que **não tenham** uma tarefa correspondente marcada como concluída
- Os arquivos `CLAUDE.md` dentro dessas pastas — esses são permanentes

---

## Gestão de Tarefas — roadmap.md

O `roadmap.md` é o centro de controle do projeto. O Claude atua como gestor de projeto — registra, move e atualiza as tarefas automaticamente, sem precisar ser lembrado. Nenhuma demanda é perdida.

### As 5 seções

- **🔄 Fazendo** — tarefa em execução agora (máximo 1)
- **📋 A Fazer** — fila priorizada aguardando execução
- **✅ A Validar** — entregue pelo Claude, aguarda teste do usuário
- **💡 Futuras** — ideias e implementações sem prazo definido
- **✔️ Concluído** — validado pelo usuário (manter as 10 mais recentes)

---

### Comportamento automático obrigatório

O Claude atualiza o `roadmap.md` **por conta própria**, sem precisar ser solicitado, em todas as situações abaixo.

---

#### 1. Quando o usuário pede algo novo

Qualquer pedido — seja uma feature, uma correção, uma pesquisa ou uma melhoria — vira uma tarefa no roadmap **antes** de qualquer execução.

- Se for para fazer agora → entra direto em **Fazendo**
- Se for para depois → entra em **A Fazer**
- Se for uma ideia sem prazo → entra em **Futuras**

> O Claude nunca começa a trabalhar em algo que não está registrado no roadmap.

---

#### 2. Ao iniciar qualquer tarefa

1. Ler o `roadmap.md`
2. Mover a tarefa de **A Fazer** → **Fazendo**
3. Se já houver algo em **Fazendo**: perguntar ao usuário se pausa ou continua
4. Só então começar a execução

---

#### 3. Durante a execução — tarefas descobertas

Se durante o trabalho o Claude identificar algo que precisa ser feito mas não estava previsto:
- Registrar imediatamente em **A Fazer** (se for necessário para a tarefa atual)
- Ou em **Futuras** (se for melhoria ou dívida técnica)
- Informar o usuário em uma linha: *"Anotei no roadmap: [nome da tarefa]"*

---

#### 4. Ao concluir uma tarefa

1. Mover de **Fazendo** → **A Validar**
2. Adicionar nota do que foi feito e o que o usuário deve testar
3. Verificar se existe arquivo de planejamento associado (pesquisa ou requisito) — se sim, informar que será apagado ao validar
4. Nunca mover para Concluído sozinho — apenas o usuário valida

---

#### 5. Se a tarefa for interrompida

- Deixar em **Fazendo** com nota do ponto exato de parada
- Exemplo: `- [ ] Implementar worker ← parou na integração com 2Captcha`
- Na próxima sessão, ao ler o roadmap, retomar desse ponto

---

#### 6. Ao receber validação do usuário

Quando o usuário disser "ok", "validado", "aprovado", "feito", "pode mover" ou similar:
1. Mover de **A Validar** → **Concluído** com a data
2. Apagar arquivos de planejamento associados (`pesquisa-[tema].md`, `requisito-[tema].md`) — informar antes
3. Manter apenas as 10 tarefas mais recentes em **Concluído**
4. Verificar se há próxima tarefa em **A Fazer** e perguntar: *"Próximo da fila é [tarefa]. Começo agora?"*

---

#### 7. Se a validação falhar

Quando o usuário reportar um problema na tarefa em **A Validar**:
1. Mover de **A Validar** → **Fazendo** com nota do problema
2. Exemplo: `- [ ] Listagem de contatos ← voltou: filtro de busca não funciona no mobile`
3. Corrigir e devolver para **A Validar**

---

#### 8. Ao receber pedido de status

Quando o usuário disser "o que está pendente?", "próximo passo?", "me atualize", "leia o roadmap" ou similar:

Ler o `roadmap.md` e responder em formato curto:

```
Fazendo: [tarefa ou "nada em andamento"]
A Validar: [lista ou "nada aguardando validação"]
Próximo da fila: [primeira tarefa de A Fazer ou "fila vazia"]
Futuras: [quantidade de itens]
```

---

### Formato de uma tarefa no roadmap

```markdown
- [ ] Título claro e objetivo da tarefa
      Contexto: por que isso precisa ser feito (opcional, só quando não for óbvio)
      ← nota de parada ou problema (só quando interrompida ou devolvida)
```

Exemplos:

```markdown
- [ ] Implementar listagem de contatos
      Contexto: feature necessária antes do lançamento do módulo de CRM

- [ ] Corrigir filtro de busca na listagem
      ← voltou: não funciona no mobile (Safari iOS)
```

---

### Princípio central

> O roadmap é a fonte de verdade do projeto.
> Se não está no roadmap, não existe.
> O Claude nunca perde uma demanda e nunca trabalha no escuro.
