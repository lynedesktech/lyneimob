# Auditoria completa do sistema — LyneImob

Data da auditoria: 19/03/2026

---

## Stack e arquitetura

- **Frontend**: Next.js 16 (App Router) + TypeScript + React 19
- **Estilo**: Tailwind CSS 4 + shadcn/ui (Base UI — usa `render` prop em vez de `asChild`)
- **Backend**: Supabase (PostgreSQL com RLS, Auth, Storage)
- **Server State**: TanStack Query v5 (hooks customizados em `src/hooks/`)
- **Formularios**: React Hook Form + Zod v4 (schemas em `src/types/`)
- **IA**: OpenAI GPT-4o-mini via SDK `openai` (descricoes, sugestoes, agente WhatsApp)
- **Pagamentos**: Stripe (checkout, assinaturas, webhooks, customer portal)
- **Cache/Fila**: Upstash Redis (`@upstash/redis`) — debounce WhatsApp + memoria agente
- **WhatsApp**: Uazapi (provider de API WhatsApp)
- **Icones**: Lucide React
- **Deploy**: Vercel (serverless functions)

### Arquitetura multi-tenancy

Toda tabela tem `organizacao_id` com RLS (Row Level Security). Isolamento total entre organizacoes. 3 clientes Supabase: browser (componentes client), server (Server Components/Actions), admin (bypassa RLS para operacoes de plataforma).

### Autenticacao

Supabase Auth com email/senha. Trigger no banco cria organizacao + usuario automaticamente no cadastro. Middleware intercepta todas as requisicoes, valida sessao, redireciona se nao autenticado.

---

## Modulos identificados

### 1. Autenticacao

- **Descricao**: Login, cadastro, recuperacao de senha e aceite de convites
- **Rotas frontend**: `/login`, `/cadastro`, `/esqueci-senha`, `/convite/[token]`
- **Endpoints**: Nenhum (usa Server Actions direto)
- **Entidades**: `usuarios`, `organizacoes`, `convites`
- **Server Actions**: `login`, `cadastrar`, `recuperarSenha`, `sair` (auth.ts), `validarConvite`, `cadastrarViaConvite`, `aceitarConviteLogado` (convites.ts)
- **Status**: **COMPLETO** — 4 paginas funcionais com validacao, tratamento de erro e feedback via toast

### 2. Painel (Dashboard)

- **Descricao**: Tela inicial com metricas, resumo semanal IA e checklist de onboarding
- **Rotas frontend**: `/painel`
- **Endpoints**: Nenhum
- **Entidades**: `negocios`, `clientes`, `atividades`, `conversas_whatsapp`, `resumos_semanais`
- **Server Actions**: `buscarResumoSemanal`, `regenerarResumoSemanal` (resumo-semanal.ts), `buscarProgressoOnboarding`, `marcarTourCompleto` (onboarding.ts)
- **Status**: **COMPLETO** — paineis role-based (corretor, gerente, admin, super_admin), loading states com Suspense

### 3. Imoveis

- **Descricao**: CRUD completo de imoveis com fotos, importacao em massa e descricoes IA
- **Rotas frontend**: `/imoveis`, `/imoveis/novo`, `/imoveis/[id]`, `/imoveis/[id]/editar`, `/imoveis/importar`
- **Endpoints**: Nenhum (Server Actions)
- **Entidades**: `imoveis`, `imovel_fotos`
- **Server Actions**: `criarImovel`, `atualizarImovel`, `excluirImovel`, `alterarStatusImovel` (imoveis.ts), `gerarDescricaoIA`, `melhorarTextoIA`, `gerarTituloIA` (ia-imoveis.ts), `importarImoveis` (importacao-imoveis.ts)
- **Status**: **COMPLETO** — CRUD funcional, filtros (busca, tipo, finalidade, status, cidade, bairro, canal), paginacao (12/24/48), toggle cards/lista, galeria fotos, IA integrada, importacao CSV

### 4. Clientes

- **Descricao**: CRUD de clientes com interesses imobiliarios, interacoes e match inteligente IA
- **Rotas frontend**: `/clientes`, `/clientes/novo`, `/clientes/[id]`, `/clientes/[id]/editar`
- **Endpoints**: Nenhum
- **Entidades**: `clientes`, `cliente_interesses`, `cliente_interacoes`
- **Server Actions**: `criarCliente`, `atualizarCliente`, `excluirCliente`, `alterarStatusCliente`, `criarInteresse`, `atualizarInteresse`, `excluirInteresse`, `criarInteracao`, `excluirInteracao` (clientes.ts), `gerarScoreLead`, `gerarResumoCliente`, `matchInteligente` (ia-clientes.ts)
- **Status**: **COMPLETO** — CRUD funcional, filtros, interesses e interacoes, IA match de imoveis, exportacao CSV

### 5. Negocios (Pipeline)

- **Descricao**: Pipeline Kanban de vendas com drag-and-drop, acoes em massa e sugestoes IA
- **Rotas frontend**: `/negocios`, `/negocios/novo`, `/negocios/[id]`, `/negocios/[id]/editar`
- **Endpoints**: Nenhum
- **Entidades**: `negocios`, `pipeline_etapas`
- **Server Actions**: `criarNegocio`, `atualizarNegocio`, `excluirNegocio`, `moverNegocio`, `ganharNegocio`, `perderNegocio`, `excluirNegociosEmMassa`, `moverNegociosParaEtapa`, `ganharNegociosEmMassa`, `perderNegociosEmMassa`, `reabrirNegocio` (negocios.ts), `analisarNegocio`, `sugerirAcao`, `analisarPerda` (ia-negocios.ts), CRUD de etapas (pipeline.ts)
- **Status**: **COMPLETO** — Kanban drag-drop funcional, ListView para mobile, contagem por etapa, acoes em massa, IA sugestoes

### 6. Atividades

- **Descricao**: Agenda de atividades com calendario (mensal/semanal/diario) e briefing IA
- **Rotas frontend**: `/atividades`, `/atividades/novo`, `/atividades/[id]`, `/atividades/[id]/editar`
- **Endpoints**: Nenhum
- **Entidades**: `atividades`, `tipos_atividade`
- **Server Actions**: `criarAtividade`, `atualizarAtividade`, `excluirAtividade`, `marcarConcluida`, `reagendarAtividade`, `cancelarAtividade`, `reabrirAtividade` (atividades.ts), `gerarBriefingVisita`, `gerarSugestaoPosAtividade` (ia-atividades.ts), CRUD de tipos (tipos-atividade.ts)
- **Status**: **COMPLETO** — 3 views de calendario com animacoes, filtros (tipo, status, prioridade, usuario, datas), paginacao

### 7. Loteamentos

- **Descricao**: CRUD de loteamentos com gestao de lotes, fotos e importacao em massa
- **Rotas frontend**: `/loteamentos`, `/loteamentos/novo`, `/loteamentos/[id]`, `/loteamentos/[id]/editar`, `/loteamentos/[id]/importar`
- **Endpoints**: Nenhum
- **Entidades**: `loteamentos`, `lotes`, `loteamento_fotos`
- **Server Actions**: `criarLoteamento`, `atualizarLoteamento`, `excluirLoteamento`, `criarLote`, `atualizarLote`, `excluirLote`, `alterarStatusLote` (loteamentos.ts), `gerarDescricaoLoteamentoIA`, `melhorarTextoLoteamentoIA` (ia-loteamentos.ts), `importarLotes` (importacao-lotes.ts)
- **Status**: **COMPLETO** — CRUD funcional, importacao CSV/Excel, galeria fotos, contadores automaticos via trigger SQL

### 8. Configuracoes

- **Descricao**: Hub de configuracoes com 8 sub-paginas, filtradas por permissao do cargo
- **Rotas frontend**: `/configuracoes`, `/configuracoes/empresa`, `/configuracoes/whatsapp`, `/configuracoes/equipe`, `/configuracoes/pipeline`, `/configuracoes/tipos-atividade`, `/configuracoes/distribuicao`, `/configuracoes/portais`, `/configuracoes/meu-site`
- **Endpoints**: Nenhum
- **Entidades**: `organizacoes`, `usuarios`, `convites`, `pipeline_etapas`, `tipos_atividade`, `config_distribuicao`, `config_whatsapp`, `dominios_customizados`
- **Server Actions**: `salvarConfiguracoesOrganizacao`, `salvarConfiguracoesSite`, `salvarConfigWhatsapp`, `salvarConfigAgenteWhatsapp`, `convidarUsuario`, `revogarConvite`, `alterarCargo`, `salvarConfigDistribuicao`, `salvarDominio`, `verificarDns`, `removerDominio` + CRUD pipeline e tipos atividade
- **Status**: **COMPLETO** — 8 sub-paginas funcionais, hub com cards filtrados por permissao

### 9. Usuarios

- **Descricao**: Gestao de equipe (listagem, convites, cargos)
- **Rotas frontend**: `/usuarios`
- **Entidades**: `usuarios`, `convites`
- **Server Actions**: `listarUsuarios`, `listarConvites`, `convidarUsuario`, `revogarConvite`, `alterarCargo`, `alternarStatusUsuario`, `removerUsuario` (usuarios.ts)
- **Status**: **COMPLETO**

### 10. Financeiro

- **Descricao**: Gestao de planos, assinaturas Stripe e trial
- **Rotas frontend**: `/financeiro`
- **Endpoints**: `POST /api/webhooks/stripe`
- **Entidades**: `organizacoes` (campos stripe_*), `eventos_billing`
- **Server Actions**: `criarSessaoCheckout`, `criarSessaoPortal`, `buscarStatusAssinatura` (billing.ts)
- **Status**: **COMPLETO** — Stripe integration funcional, portal cliente, faturas, tracking trial

### 11. Admin (Super Admin)

- **Descricao**: Area de gestao da plataforma, acessivel apenas por super admins
- **Rotas frontend**: `/admin/painel` (redireciona para `/painel`), `/admin/organizacoes`, `/admin/organizacoes/[id]`, `/admin/roadmap`, `/admin/configuracoes`, `/admin/configuracoes/stripe`, `/admin/configuracoes/openai`, `/admin/configuracoes/uazapi`, `/admin/configuracoes/redis`, `/admin/configuracoes/memoria`
- **Entidades**: `organizacoes`, `usuarios`, `tarefas_roadmap`
- **Server Actions**: `listarTarefasRoadmap`, `buscarResumoRoadmap`, `criarTarefaRoadmap`, `atualizarStatusTarefa`, `excluirTarefaRoadmap`, `gerarAnaliseRoadmap` (roadmap.ts)
- **Guard**: Layout verifica `super_admin=true`, redireciona para `/painel` se nao autorizado
- **Status**: **COMPLETO** — 8 paginas funcionais, Kanban roadmap, gestao de organizacoes

### 12. Site Publico

- **Descricao**: Site customizavel por organizacao, acessivel via `/{slug}` ou dominio customizado
- **Rotas frontend**: `/[slug]`, `/[slug]/imoveis`, `/[slug]/imoveis/[id]`, `/[slug]/loteamentos`, `/[slug]/loteamentos/[id]`, `/[slug]/sobre`, `/[slug]/contato`
- **Endpoints**: `GET /api/xml/[slug]` (feed XML), `GET /api/xml/[slug]/validar`
- **Entidades**: `organizacoes`, `imoveis`, `loteamentos`, `lotes`
- **Server Actions**: `enviarContatoSite` (site-contato.ts)
- **Status**: **COMPLETO** — 7 paginas, cores customizaveis, hero, galeria, filtros, formulario contato, metadata dinamica

### 13. Landing Page

- **Descricao**: Pagina de vendas do SaaS (rota `/`)
- **Rotas frontend**: `/`
- **Status**: **COMPLETO** — Hero, funcionalidades, video, precos (3 planos), FAQ, CTA, footer

---

## Perfis de acesso

### Administrador (cargo: `admin`)

**Rotas acessiveis**: Todas as rotas do dashboard (`/painel`, `/imoveis`, `/clientes`, `/negocios`, `/atividades`, `/loteamentos`, `/configuracoes/*`, `/usuarios`, `/financeiro`, `/meu-perfil`, `/ajuda`, `/integracoes`)

**Acoes permitidas** (13/13):
- `gerenciar_usuarios` — convidar, remover, alterar cargos
- `gerenciar_plano` — alterar plano, checkout Stripe
- `gerenciar_integracoes` — configurar WhatsApp, portais
- `gerenciar_site` — personalizar site publico
- `ver_configuracoes` — acessar hub de configuracoes
- `processar_leads` — aceitar/descartar leads de portais
- `ver_todos_registros` — ver imoveis/clientes/negocios de todos
- `criar_registros` — criar imoveis, clientes, negocios, atividades
- `editar_proprio_registro` — editar qualquer registro
- `excluir_registros` — excluir imoveis, clientes, negocios
- `ver_conversas_whatsapp` — ver conversas do agente
- `ver_integracoes` — ver status integracoes
- `gerenciar_organizacao` — dados da empresa

**Restricoes**: Nenhuma dentro da organizacao. Nao acessa `/admin/*` (precisa ser super_admin).

### Gerente (cargo: `gerente`)

**Rotas acessiveis**: `/painel`, `/imoveis`, `/clientes`, `/negocios`, `/atividades`, `/loteamentos`, `/configuracoes` (parcial), `/meu-perfil`, `/ajuda`

**Acoes permitidas** (9/13):
- `gerenciar_site`, `ver_configuracoes`, `processar_leads`, `ver_todos_registros`, `criar_registros`, `editar_proprio_registro`, `ver_conversas_whatsapp`, `ver_integracoes`

**Restricoes**:
- NAO pode `gerenciar_usuarios` — nao convida nem remove membros
- NAO pode `gerenciar_plano` — nao acessa Stripe/financeiro
- NAO pode `gerenciar_integracoes` — nao configura WhatsApp/portais
- NAO pode `excluir_registros` — nao exclui nada
- NAO pode `gerenciar_organizacao` — nao edita dados da empresa

### Corretor (cargo: `corretor`)

**Rotas acessiveis**: `/painel`, `/imoveis`, `/clientes`, `/negocios`, `/atividades`, `/loteamentos`, `/meu-perfil`, `/ajuda`

**Acoes permitidas** (3/13):
- `criar_registros` — criar imoveis, clientes, negocios, atividades
- `editar_proprio_registro` — editar apenas seus proprios registros
- (implicitamente ve apenas seus proprios registros via RLS)

**Restricoes**:
- NAO acessa `/configuracoes` (sidebar esconde o link)
- NAO ve registros de outros corretores (RLS filtra por `corretor_id = auth.uid()`)
- NAO exclui nada
- NAO processa leads
- NAO ve conversas WhatsApp
- NAO ve integracoes

### Super Admin (flag: `super_admin = true`)

**Rotas acessiveis**: Tudo do admin + `/admin/painel`, `/admin/organizacoes`, `/admin/roadmap`, `/admin/configuracoes/*`

**Acoes permitidas**: Todas (bypass completo via `if (superAdmin) return true`)

**Guard**: `src/app/(dashboard)/admin/layout.tsx` — verifica `super_admin` flag, redireciona para `/painel` se nao autorizado

---

## Matriz de permissoes

| Acao | Admin | Gerente | Corretor |
|------|:-----:|:-------:|:--------:|
| gerenciar_usuarios | SIM | - | - |
| gerenciar_plano | SIM | - | - |
| gerenciar_integracoes | SIM | - | - |
| gerenciar_organizacao | SIM | - | - |
| gerenciar_site | SIM | SIM | - |
| ver_configuracoes | SIM | SIM | - |
| processar_leads | SIM | SIM | - |
| ver_todos_registros | SIM | SIM | - |
| ver_conversas_whatsapp | SIM | SIM | - |
| ver_integracoes | SIM | SIM | - |
| excluir_registros | SIM | - | - |
| criar_registros | SIM | SIM | SIM |
| editar_proprio_registro | SIM | SIM | SIM |

Arquivo fonte: `src/lib/permissoes.ts`

---

## Agente A (WhatsApp SDR) — mapeamento completo

### O que ele faz

Agente de pre-atendimento automatizado que conversa com leads via WhatsApp usando IA (GPT-4o-mini). Qualifica o lead, busca imoveis, agenda visitas, e encaminha para um corretor humano quando pronto.

### Fluxo completo

```
Mensagem WhatsApp (Uazapi)
    ↓
POST /api/webhooks/whatsapp/route.ts
    ↓ valida payload (Zod), ignora grupo/fromMe/nao-mensagem
    ↓ identifica organizacao (token → instance_id → pattern)
    ↓ busca ou cria conversa
    ↓ se conversa nova: cria cliente "Contato WhatsApp" + negocio na etapa "Pre-atendimento IA"
    ↓ salva mensagem (dedup por message_id_whatsapp)
    ↓ marca como lida no WhatsApp
    ↓
after() → POST /api/interno/processar-debounce
    ↓ lock Redis (90s TTL)
    ↓ espera 20s de silencio (max 2 ciclos)
    ↓
processar-midia.ts (se audio/imagem/documento)
    ↓ audio → texto, imagem → descricao, PDF → texto
    ↓
agente-sdr.ts (orquestrador IA)
    ↓ busca config, conversa, historico (30 msgs)
    ↓ verifica status: PRIMEIRA_RESPOSTA | REATIVACAO | EM_ANDAMENTO
    ↓ verifica se negocio esta na etapa "Pre-atendimento IA" (so responde la)
    ↓ verifica horario atendimento
    ↓ busca memoria Redis (30 msgs, TTL 7 dias)
    ↓ monta contexto (qualificacao, origem lead, imovel interesse)
    ↓ chama OpenAI GPT-4o-mini com function calling
    ↓
tools-sdr.ts + executores-sdr.ts (6 tools disponiveis)
    ↓ buscar_imoveis → pesquisa por tipo/finalidade/cidade/bairro/preco/quartos
    ↓ atualizar_cliente → preenche nome, email, tipo, observacoes
    ↓ atualizar_negocio → titulo, tipo, valor, imovel vinculado
    ↓ salvar_qualificacao → tipo imovel, finalidade, bairros, preco, urgencia
    ↓ criar_atividade → agenda visita/ligacao/follow-up para corretor
    ↓ encaminhar_corretor → handoff para humano (round-robin)
    ↓
humanizar.ts
    ↓ remove markdown, adiciona emojis controlados, varia aberturas
    ↓
uazapi.ts → enviarMensagem()
    ↓ envia resposta humanizada via Uazapi
    ↓ salva mensagem enviada no banco
```

### Gatilhos que acionam o agente

1. **Mensagem recebida via WhatsApp** — unico gatilho. O webhook Uazapi envia POST para `/api/webhooks/whatsapp`
2. **Debounce completo** — apos 20s sem nova mensagem, o processamento IA inicia

### Dados que ele consome

- Config WhatsApp da org (`config_whatsapp`)
- Historico de mensagens (ultimas 30)
- Memoria Redis (TTL 7 dias)
- Dados do cliente (se ja qualificado)
- Dados do negocio e etapa pipeline
- Imovel de interesse (se veio de portal/site)
- Horario de atendimento configurado

### Dados que ele produz

- Mensagens enviadas (salvas em `mensagens_whatsapp`)
- Cliente atualizado (nome, email, tipo)
- Negocio atualizado (titulo, tipo, valor, imovel)
- Qualificacao do lead (tipo_imovel, finalidade, bairros, preco, urgencia)
- Atividades agendadas (visita, ligacao, follow-up)
- Status da conversa atualizado (em_andamento → qualificado → encaminhado)

### Pontos de integracao

- **Pipeline**: so responde se negocio esta na etapa `pre_atendimento_ia`
- **Clientes**: cria automaticamente + atualiza via tool
- **Negocios**: cria automaticamente + move no pipeline
- **Atividades**: cria via tool (visita, ligacao)
- **Distribuicao**: usa `obterProximoCorretor()` para round-robin
- **Redis**: memoria + debounce + locks
- **Leads portais**: detecta origem (portal/site) para adaptar comportamento

### Arquivos-chave

| Arquivo | Funcao |
|---------|--------|
| `src/app/api/webhooks/whatsapp/route.ts` | Webhook — entrada de mensagens |
| `src/app/api/interno/processar-debounce/route.ts` | Debounce — agrupamento de mensagens |
| `src/lib/whatsapp/agente-sdr.ts` | Orquestrador IA principal |
| `src/lib/whatsapp/prompt-sdr.ts` | Prompt do sistema (algoritmo 6 passos) |
| `src/lib/whatsapp/tools-sdr.ts` | Definicoes das 6 tools para function calling |
| `src/lib/whatsapp/executores-sdr.ts` | Execucao das tools (CRUD no banco) |
| `src/lib/whatsapp/humanizar.ts` | Humanizacao da resposta |
| `src/lib/whatsapp/memoria.ts` | Gestao de memoria Redis |
| `src/lib/whatsapp/uazapi.ts` | Wrapper HTTP Uazapi (enviar, ler, QR, etc) |
| `src/lib/whatsapp/processar-midia.ts` | Conversao audio/imagem/documento |
| `src/actions/whatsapp.ts` | Actions UI (config, status, atribuicao) |
| `src/actions/instancia-whatsapp.ts` | Criacao/conexao de instancia |

---

## Pontos de atencao identificados

### CRITICOS — bloqueiam go-live

**1. Race condition no cadastro via convite**
- **Arquivo**: `src/actions/convites.ts`, linhas 95-109
- **Problema**: Entre o SELECT que valida o token e o signUp do Supabase Auth, outro processo pode criar a conta. Sem transacao. Trigger no banco pode atribuir org incorreta.
- **Correcao**: Usar transacao ou lock no token antes do signUp.

**2. `.single()` sem tratamento de erro em 28+ consultas**
- **Arquivo**: Multiplos — `src/actions/auth.ts:42`, `src/actions/convites.ts:20,138`, `src/app/api/webhooks/whatsapp/route.ts:88,100,111`, e muitos outros
- **Problema**: `.single()` lanca erro PGRST116 se resultado vazio. O codigo checa `if (!data)` mas ignora `error`. Deveria usar `.maybeSingle()` ou verificar `error`.
- **Correcao**: Substituir por `.maybeSingle()` onde resultado vazio e esperado.

**3. Comparacao de email case-sensitive em convites**
- **Arquivo**: `src/actions/convites.ts`, linhas 71, 149
- **Problema**: `.toLowerCase()` so no frontend, queries ao banco nao usam `ilike`. `test@email.com` e `Test@email.com` sao tratados como diferentes.
- **Correcao**: Normalizar email para lowercase antes de qualquer query.

**4. Exclusao de dominio sem validar organizacao_id**
- **Arquivo**: `src/actions/dominios.ts`, linhas 130-135
- **Problema**: Query de delete nao inclui `.eq("organizacao_id", ...)`. Usuario de uma org pode deletar dominio de outra.
- **Correcao**: Adicionar filtro `organizacao_id` em todas as operacoes de delete/update.

**5. Header x-internal-secret usa SUPABASE_SERVICE_ROLE_KEY**
- **Arquivo**: `src/app/api/interno/processar-debounce/route.ts`, linha 17
- **Problema**: A chave admin do Supabase e usada como secret para validar chamadas internas. Se o endpoint for acessivel externamente, a chave pode ser inferida.
- **Correcao**: Usar secret dedicado (`INTERNAL_API_SECRET`) ou validar origem da requisicao.

### IMPORTANTES — devem ser resolvidos

**6. Erro generico em importacao de imoveis**
- **Arquivo**: `src/actions/importacao-imoveis.ts`, linhas 76-100
- **Problema**: Retorna "Erro ao inserir." sem detalhar qual imovel falhou ou por que.

**7. XML feed publico sem rate limiting**
- **Arquivo**: `src/app/api/xml/[slug]/route.ts`
- **Problema**: GET publico lista todos os imoveis publicaveis sem controle de taxa.

**8. Webhook WhatsApp com `.single()` em busca de config**
- **Arquivo**: `src/app/api/webhooks/whatsapp/route.ts`, linhas 78-113
- **Problema**: Se org tem multiplas instancias WhatsApp, `.single()` falha com PGRST116.

**9. Webhook Stripe sem rate limiting**
- **Arquivo**: `src/app/api/webhooks/stripe/route.ts`
- **Problema**: Eventos simultaneos podem causar race condition em `plano_status`.

**10. Sugestao IA fire-and-forget em negocios**
- **Arquivo**: `src/actions/negocios.ts`, linhas 74-77
- **Problema**: `import().then(...).catch(() => {})` ignora erros silenciosamente.

**11. Falta de validacao de posicao no Kanban**
- **Arquivo**: `src/actions/negocios.ts`, linhas 166-180
- **Problema**: `moverNegocio()` nao valida se posicao e numero valido.

**12. Cron resumo semanal sem throttle OpenAI**
- **Arquivo**: `src/app/api/cron/resumo-semanal/route.ts`, linhas 66-73
- **Problema**: Processa 10 orgs em paralelo, pode exceder rate limit OpenAI.

### MENORES — melhorias recomendadas

**13. Acentuacao inconsistente em mensagens de erro**
- **Arquivo**: Multiplos (`src/actions/convites.ts` e outros)
- **Problema**: Algumas mensagens usam `nao` em vez de `nao` com acento.

**14. Fallback perigoso na identificacao de plano Stripe**
- **Arquivo**: `src/app/api/webhooks/stripe/route.ts`, linhas 347-361
- **Problema**: Se `priceId` nao bate, retorna `"crm_ia"` como fallback.

**15. console.log em producao**
- **Arquivo**: `src/lib/whatsapp/agente-sdr.ts`, `src/lib/whatsapp/debounce.ts` e outros
- **Problema**: Logs de debug em codigo critico de producao.

**16. setState em effects sincronizado (re-renders cascata)**
- **Arquivo**: `conteudo-pipeline-config.tsx`, `conteudo-tipos-atividade-config.tsx`, `conteudo-distribuicao-config.tsx`
- **Problema**: Multiplos `setState` em effects causam re-renders desnecessarios.

**17. Type casting fragil (`as unknown as`)**
- **Arquivo**: `src/actions/ia-clientes.ts` e outros
- **Problema**: 7+ instancias de casting sem validacao, pode causar crash com dados malformados.

**18. HTML `<a>` em vez de `<Link>` do Next.js**
- **Arquivo**: `src/app/(auth)/error.tsx`, `src/app/error.tsx`
- **Problema**: Navegacao quebra no modo SPA, sem prefetch.

---

## Endpoints de API

| Metodo | Rota | Funcao | Auth |
|--------|------|--------|------|
| POST | `/api/webhooks/stripe` | Eventos Stripe (checkout, assinatura, pagamento) | Webhook signature |
| POST | `/api/webhooks/whatsapp` | Mensagens WhatsApp (Uazapi) | Token verification |
| POST | `/api/webhooks/portais` | Leads de portais (ZAP, OLX, VivaReal) | API key |
| POST | `/api/interno/processar-debounce` | Debounce de mensagens WhatsApp | x-internal-secret |
| GET | `/api/cron/resumo-semanal` | Geracao semanal do resumo IA | CRON_SECRET |
| GET | `/api/xml/[slug]` | Feed XML de imoveis para portais | Nenhuma (publico) |
| GET | `/api/xml/[slug]/validar` | Validacao do feed XML | Nenhuma (publico) |

---

## Banco de dados — tabelas principais

| Tabela | Descricao | Campos-chave |
|--------|-----------|-------------|
| `organizacoes` | Imobiliarias | slug, plano, trial_fim_em, stripe_*, configuracoes_site |
| `usuarios` | Usuarios do sistema | organizacao_id, cargo, super_admin, ativo |
| `imoveis` | Imoveis cadastrados | tipo, finalidade, status, preco_venda, publicar_site |
| `imovel_fotos` | Fotos dos imoveis | imovel_id, url, ordem, eh_capa |
| `clientes` | Clientes/leads | tipo, origem, status, score_lead, resumo_ia |
| `cliente_interesses` | Interesses imobiliarios | tipo_imovel, finalidade, bairros_interesse, preco_min/max |
| `cliente_interacoes` | Historico de interacoes | tipo, descricao, data |
| `negocios` | Negocios/oportunidades | etapa_id, status, valor, posicao, analise_ia |
| `pipeline_etapas` | Etapas do funil | nome, cor, ordem, tipo (normal/ganho/perdido/pre_atendimento_ia) |
| `atividades` | Agenda/calendario | tipo, status, prioridade, data_inicio, briefing_ia |
| `tipos_atividade` | Tipos customizaveis | nome, slug, cor, icone, sistema |
| `loteamentos` | Loteamentos | status, total_lotes, valor_total (calculado) |
| `lotes` | Lotes individuais | quadra, numero_lote, status, valor, comprador |
| `loteamento_fotos` | Fotos dos loteamentos | loteamento_id, url, ordem, eh_capa |
| `config_whatsapp` | Config do agente WhatsApp | uazapi_token, instance_id, ativo, prompt_personalizado |
| `conversas_whatsapp` | Conversas ativas | status, cliente_id, negocio_id, qualificacao, origem_lead |
| `mensagens_whatsapp` | Mensagens individuais | direcao, tipo_conteudo, conteudo, message_id_whatsapp |
| `leads_portais` | Leads de portais externos | portal, status, imovel_id, cliente_id |
| `convites` | Convites de equipe | email, cargo, token, status |
| `dominios_customizados` | Dominios personalizados | dominio, status, dns_registros |
| `config_distribuicao` | Config round-robin | tipo_distribuicao, proximos_indices |
| `resumos_semanais` | Resumo semanal IA | conteudo, dados_resumo |
| `onboarding` | Progresso onboarding | tour_completo, checklist |
| `eventos_billing` | Eventos Stripe (dedup) | tipo_evento, stripe_event_id |
| `tarefas_roadmap` | Roadmap dev (admin) | status, titulo, descricao |

Total: 24 tabelas + 30 migrations SQL

---

## Resumo executivo

| Metrica | Valor |
|---------|-------|
| Total de modulos | 13 |
| Total de paginas frontend | ~65 |
| Total de endpoints API | 7 |
| Total de Server Actions | 33 arquivos / 100+ funcoes |
| Total de hooks customizados | 28 |
| Total de tabelas no banco | 24 |
| Pontos criticos (bloqueiam go-live) | 5 |
| Pontos importantes | 7 |
| Pontos menores | 6 |
| Status geral dos modulos | 13/13 COMPLETO |
