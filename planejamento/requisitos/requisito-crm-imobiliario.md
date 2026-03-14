# Requisito: CRM Imobiliário SaaS — LyneImob

**Data:** 2026-03-14
**Pesquisa base:** pesquisa-crm-imobiliario.md

## Objetivo

Construir um CRM imobiliário SaaS completo com IA integrada em todos os módulos como diferencial competitivo, incluindo agente SDR via WhatsApp, site próprio por imobiliária, e integração com portais imobiliários brasileiros.

## Escopo

**Dentro:**
- Módulo de Imóveis (CRUD, fotos, feed XML VRSync)
- Módulo de Clientes (CRUD, perfil de interesse, match automático)
- Módulo de Negócios (pipeline kanban, drag-and-drop)
- Módulo de Atividades (agenda, follow-ups, notificações)
- Módulo de Site Próprio (site por imobiliária com SSR/SEO)
- Integração com Portais (envio XML + recebimento de leads)
- IA em todos os módulos (análise, geração de texto, sugestões)
- Agente IA SDR via WhatsApp (pré-atendimento)
- SaaS/Billing (Stripe, 2 planos principais)
- Multi-tenancy com RLS
- Identidade visual azul-marinho, corporativa

**Fora (pós-MVP):**
- App mobile nativo
- Espelho de vendas para empreendimentos
- Módulo financeiro (comissões, repasses)
- Integração com sistemas de incorporadoras
- Domínio customizado por imobiliária (subdomínio próprio)
- Dashboard avançado com BI

---

## Stack Tecnológica

| Camada | Tecnologia | Justificativa |
|--------|-----------|---------------|
| **Framework** | Next.js 15 (App Router) | SSR/SSG para SEO do site público, Server Actions, API Routes, React Server Components |
| **Linguagem** | TypeScript | Tipagem forte, menos bugs, melhor DX |
| **Estilo** | Tailwind CSS 4 | Utility-first, rápido, funciona com shadcn/ui |
| **Componentes UI** | shadcn/ui | Acessíveis, customizáveis, copia pro projeto (não é dependência) |
| **Banco de Dados** | Supabase (PostgreSQL) | Auth, Storage, Realtime, Edge Functions, RLS para multi-tenancy |
| **Auth** | Supabase Auth | Email/senha, magic link, OAuth (Google), sessões SSR |
| **Storage** | Supabase Storage | Fotos de imóveis, logos, documentos |
| **Pagamentos** | Stripe | Subscriptions, Customer Portal, Webhooks |
| **Formulários** | React Hook Form + Zod | Validação client+server, tipagem, performance |
| **Server State** | TanStack Query v5 | Cache, refetch, optimistic updates |
| **Drag & Drop** | dnd-kit | Kanban do pipeline, leve e acessível |
| **Email** | Resend | Notificações, lembretes, emails transacionais |
| **IA (módulos)** | Claude API (Anthropic) | Análise de contexto, geração de texto, sugestões — em todos os módulos |
| **IA (WhatsApp SDR)** | n8n + Claude API + Meta WhatsApp Business API | Agente de pré-atendimento no WhatsApp, fluxo gerenciado pelo n8n |
| **Hospedagem** | Vercel | Deploy automático, Edge Functions, integração nativa Next.js |

**Alias de caminho:** `@/` → `./src/`

**Paleta de cores principal:**
- Azul-marinho primário: `#1e3a5f` (ou similar — definir com skill frontend-design)
- Variações: azul mais claro para hover/active, branco para backgrounds
- Estilo: corporativo, institucional, limpo, white-label

---

## Estrutura de Pastas

```
src/
├── app/                          # App Router (Next.js)
│   ├── (auth)/                   # Grupo de rotas de autenticação
│   │   ├── login/
│   │   ├── cadastro/
│   │   └── esqueci-senha/
│   ├── (dashboard)/              # Grupo de rotas do CRM (protegidas)
│   │   ├── layout.tsx            # Layout com sidebar + header
│   │   ├── page.tsx              # Dashboard principal
│   │   ├── negocios/             # Pipeline/Kanban
│   │   ├── clientes/             # Gestão de contatos
│   │   ├── imoveis/              # Gestão de imóveis
│   │   ├── atividades/           # Tarefas e agenda
│   │   ├── integracoes/          # Portais, webhooks, WhatsApp
│   │   ├── configuracoes/        # Config da imobiliária, plano, equipe
│   │   └── ia/                   # Painel do agente IA + histórico conversas
│   ├── (site)/                   # Site público da imobiliária (SSR)
│   │   └── [slug]/               # Rota dinâmica por slug
│   │       ├── page.tsx          # Home do site
│   │       ├── imoveis/          # Listagem + detalhe
│   │       └── contato/          # Formulário de contato
│   ├── api/                      # API Routes
│   │   ├── webhooks/
│   │   │   ├── stripe/           # Webhook Stripe
│   │   │   ├── portais/          # Webhook leads dos portais
│   │   │   └── whatsapp/         # Webhook WhatsApp (Meta)
│   │   ├── xml/                  # Feed XML VRSync
│   │   ├── ia/                   # Endpoints da IA (chat, análise, geração)
│   │   └── cron/                 # Jobs agendados
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                       # shadcn/ui (Button, Input, Dialog, etc.)
│   ├── layout/                   # Sidebar, Header, Breadcrumb
│   ├── negocios/                 # Componentes do pipeline
│   ├── clientes/                 # Componentes de clientes
│   ├── imoveis/                  # Componentes de imóveis
│   ├── atividades/               # Componentes de atividades
│   ├── ia/                       # Componentes IA (botão, painel, chat widget)
│   └── site/                     # Componentes do site público
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Cliente browser
│   │   ├── server.ts             # Cliente server (cookies)
│   │   ├── admin.ts              # Cliente admin (service role)
│   │   └── middleware.ts         # Refresh de sessão
│   ├── stripe/
│   │   ├── client.ts             # Stripe client-side
│   │   ├── server.ts             # Stripe server-side
│   │   └── planos.ts             # Definição dos planos e limites
│   ├── ia/
│   │   ├── cliente-claude.ts     # Client Claude API (Anthropic SDK)
│   │   ├── prompts.ts            # System prompts por módulo
│   │   ├── contexto.ts           # Monta contexto (imóveis, negócio, cliente)
│   │   └── acoes.ts              # Ações da IA (gerar descrição, analisar, sugerir)
│   ├── xml/
│   │   └── vrsync.ts             # Gerador de XML VRSync
│   ├── validacoes/               # Schemas Zod compartilhados
│   └── utils.ts                  # Funções utilitárias
├── hooks/
│   ├── use-organizacao.ts
│   ├── use-usuario.ts
│   ├── use-realtime.ts
│   └── use-ia.ts                 # Hook para chamadas IA nos módulos
├── types/
│   ├── database.ts               # Tipos gerados pelo Supabase
│   ├── negocios.ts
│   ├── clientes.ts
│   ├── imoveis.ts
│   ├── atividades.ts
│   └── ia.ts
├── actions/                      # Server Actions (Next.js)
│   ├── negocios.ts
│   ├── clientes.ts
│   ├── imoveis.ts
│   ├── atividades.ts
│   ├── configuracoes.ts
│   └── ia.ts                     # Server Actions da IA
└── middleware.ts                  # Auth middleware (proteger rotas)
```

---

## Mapeamento Tecnico

### Backend

**Server Actions (Next.js App Router):**
- `actions/imoveis.ts` — criar, editar, excluir, listar, filtrar, alterar status
- `actions/clientes.ts` — CRUD, buscar duplicatas, match automático
- `actions/negocios.ts` — CRUD, mover etapa, ganhar, perder
- `actions/atividades.ts` — CRUD, marcar realizada, reagendar
- `actions/configuracoes.ts` — atualizar org, site, equipe
- `actions/ia.ts` — gerar descrição, analisar negócio, score, match inteligente

**API Routes:**
- `api/webhooks/stripe/` — processar eventos Stripe (subscription, invoice)
- `api/webhooks/portais/` — receber leads de ZAP/OLX/VivaReal
- `api/webhooks/whatsapp/` — receber mensagens do WhatsApp (Meta)
- `api/xml/[slug].xml` — feed XML VRSync por organização
- `api/ia/chat` — chat do site público
- `api/ia/sdr/responder` — resposta do agente WhatsApp
- `api/ia/imoveis/descricao` — gerar descrição de imóvel
- `api/ia/negocios/analise` — análise de contexto do negócio
- `api/ia/clientes/score` — calcular score do lead
- `api/ia/atividades/briefing` — briefing pré-visita

### Frontend

**Layout principal:** Sidebar fixa à esquerda (azul-marinho) + Header + Área de conteúdo

**Páginas do Dashboard:**
- `/` — Dashboard com resumo (negócios abertos, atividades do dia, leads novos)
- `/imoveis` — Listagem com filtros + paginação
- `/imoveis/novo` — Formulário de cadastro
- `/imoveis/[id]` — Detalhe com fotos, dados, histórico
- `/clientes` — Listagem com busca e filtros
- `/clientes/[id]` — Detalhe com timeline, interesses, match
- `/negocios` — Kanban visual com drag-and-drop
- `/atividades` — Calendário + lista de tarefas
- `/integracoes` — Config de portais, feeds XML, webhooks
- `/ia` — Painel do agente IA, histórico de conversas
- `/configuracoes` — Dados da imobiliária, equipe, plano, site

**Páginas do Site Público:**
- `/[slug]` — Home da imobiliária
- `/[slug]/imoveis` — Listagem com filtros
- `/[slug]/imoveis/[id]` — Detalhe do imóvel
- `/[slug]/contato` — Formulário de contato

### Banco de Dados

**12 tabelas** (ver schema completo acima):
1. `organizacoes` — tenant principal
2. `usuarios` — corretores e admins
3. `imoveis` — cadastro de imóveis
4. `imovel_fotos` — fotos dos imóveis
5. `clientes` — contatos
6. `cliente_interesses` — perfil de busca do cliente
7. `pipeline_etapas` — etapas customizáveis do funil
8. `negocios` — deals no pipeline
9. `atividades` — tarefas e agenda
10. `leads_portais` — leads recebidos via webhook
11. `conversas_ia` — histórico de conversas do agente
12. `ia_uso` — controle de consumo da IA por organização

**Multi-tenancy:** RLS policy em todas as tabelas com `organizacao_id`

### API

**Contratos de entrada/saída dos endpoints principais:**

**POST /api/ia/imoveis/descricao**
- Entrada: `{ imovel_id: string }`
- Saída: `{ descricao: string, tokens_usados: number }`
- Erro 402: limite de IA excedido
- Erro 404: imóvel não encontrado

**POST /api/ia/negocios/analise**
- Entrada: `{ negocio_id: string }`
- Saída: `{ analise: string, probabilidade: number, proximos_passos: string[], tokens_usados: number }`

**POST /api/webhooks/portais**
- Entrada: JSON do portal (formato varia)
- Saída: `{ lead_id: string, status: "processado" | "erro" }`
- Headers: verificação de assinatura do portal

**GET /api/xml/[slug].xml**
- Saída: XML VRSync com imóveis publicáveis
- Content-Type: application/xml

### Testes

**Cenários críticos:**
- RLS: criar 2 organizações, verificar isolamento total
- CRUD: caminho feliz + validação de campos obrigatórios + duplicatas
- Pipeline: mover negócio entre etapas, ganhar, perder com motivo
- Upload: foto válida, foto grande demais, tipo inválido
- XML: validar XML gerado contra schema VRSync
- Webhook: payload válido, payload inválido, payload duplicado
- IA: resposta com contexto, limite excedido, erro da API
- Stripe: subscription created, payment failed, canceled
- Auth: login, logout, sessão expirada, multi-tenant

### UI/UX

**Estados visuais obrigatórios:**
- **Loading**: skeleton/spinner em toda listagem e ação assíncrona
- **Vazio**: mensagem + CTA quando não há dados ("Cadastre seu primeiro imóvel")
- **Erro**: toast de erro com mensagem clara, formulário destaca campos inválidos
- **Sucesso**: toast de confirmação em ações (salvar, mover, excluir)
- **IA processando**: indicador de "pensando..." nos botões de IA
- **Responsivo**: sidebar colapsável em mobile, formulários em coluna única

---

## IA em Todos os Módulos — Mapeamento Completo

Este é o diferencial do LyneImob. A IA não é só um chatbot — ela está presente em cada módulo ajudando o corretor a trabalhar melhor.

### Imóveis
| Funcionalidade | Descrição | Endpoint |
|---------------|-----------|----------|
| **Gerar descrição** | Cria descrição atrativa do imóvel baseada nos dados cadastrados (tipo, bairro, características) | `POST /api/ia/imoveis/descricao` |
| **Melhorar descrição** | Recebe texto existente e reescreve de forma mais profissional/vendedora | `POST /api/ia/imoveis/melhorar` |
| **Sugerir preço** | Analisa imóveis similares da base e sugere faixa de preço (futuro: dados externos) | `POST /api/ia/imoveis/preco` |
| **Gerar título** | Cria título otimizado para portais (conciso, com palavras-chave) | `POST /api/ia/imoveis/titulo` |

### Negócios (Pipeline)
| Funcionalidade | Descrição | Endpoint |
|---------------|-----------|----------|
| **Análise de contexto** | Analisa negócio + cliente + imóvel e dá visão geral (probabilidade, riscos, próximos passos) | `POST /api/ia/negocios/analise` |
| **Sugestão de ação** | Sugere próxima atividade baseada no histórico (ex: "Faz 5 dias sem contato, sugerir follow-up") | `POST /api/ia/negocios/sugestao` |
| **Motivo de perda** | Quando negócio é perdido, IA analisa o histórico e sugere o que poderia ter sido diferente | `POST /api/ia/negocios/perda` |

### Clientes
| Funcionalidade | Descrição | Endpoint |
|---------------|-----------|----------|
| **Score de lead** | Calcula score (0-100) baseado em engajamento, perfil, atividades | `POST /api/ia/clientes/score` |
| **Perfil resumido** | Gera resumo do cliente para o corretor (quem é, o que busca, histórico) | `POST /api/ia/clientes/resumo` |
| **Sugestão de imóveis** | Match inteligente: além dos filtros, considera descrições e contexto | `POST /api/ia/clientes/match` |

### Atividades
| Funcionalidade | Descrição | Endpoint |
|---------------|-----------|----------|
| **Sugestão pós-atividade** | Após marcar atividade como realizada, sugere próximo passo | `POST /api/ia/atividades/proximo` |
| **Preparação de visita** | Antes de uma visita, gera briefing: perfil do cliente, pontos fortes do imóvel, objeções prováveis | `POST /api/ia/atividades/briefing` |

### Agente SDR (WhatsApp)
| Funcionalidade | Descrição | Endpoint |
|---------------|-----------|----------|
| **Pré-atendimento** | Conversa com lead no WhatsApp, coleta dados, sugere imóveis, agenda visita | Gerenciado via n8n + `POST /api/ia/sdr/responder` |
| **Transferência** | Quando lead está qualificado ou pede humano, transfere para corretor | `POST /api/ia/sdr/transferir` |
| **Resumo de conversa** | Gera resumo da conversa para o corretor saber o contexto antes de assumir | `POST /api/ia/sdr/resumo` |
| **Follow-up automático** | Se lead não respondeu em X horas, envia mensagem de acompanhamento | Cron via n8n |

### Chat no Site
| Funcionalidade | Descrição | Endpoint |
|---------------|-----------|----------|
| **Chat widget** | Widget flutuante no site público da imobiliária | Frontend: componente React |
| **Responder perguntas** | Responde sobre imóveis disponíveis, localização, valores | `POST /api/ia/chat` |
| **Coletar lead** | Pede nome, telefone, email naturalmente durante a conversa | `POST /api/ia/chat` |

---

## Schema do Banco de Dados (Supabase/PostgreSQL)

### Multi-Tenancy
Toda tabela principal tem coluna `organizacao_id` com RLS policy:
```sql
CREATE POLICY "isolamento_organizacao" ON [tabela]
  USING (organizacao_id = (SELECT organizacao_id FROM public.usuarios WHERE id = auth.uid()));
```

### Tabelas

**1. organizacoes** (tenant principal)
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid PK | ID da organização |
| nome | text NOT NULL | Nome da imobiliária |
| slug | text UNIQUE NOT NULL | URL do site (ex: "imob-copacabana") |
| logo_url | text | Logo no Supabase Storage |
| telefone | text | Telefone principal |
| email | text | Email principal |
| endereco | jsonb | Endereço completo |
| creci | text | CRECI da imobiliária |
| stripe_customer_id | text | ID do cliente no Stripe |
| stripe_subscription_id | text | ID da assinatura no Stripe |
| plano | text DEFAULT 'trial' | trial, crm_ia, crm_ia_sdr |
| plano_status | text DEFAULT 'trialing' | active, past_due, canceled, trialing |
| limites | jsonb | {max_corretores, max_imoveis, max_conversas_ia_mes} |
| configuracoes_site | jsonb | Cores, textos, config do site público |
| configuracoes_ia | jsonb | Prompt personalizado, tom, regras do agente |
| whatsapp_numero | text | Número do WhatsApp Business conectado |
| whatsapp_token | text | Token da Meta API (encriptado) |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**2. usuarios** (corretores e admins)
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid PK (= auth.uid) | Vinculado ao Supabase Auth |
| organizacao_id | uuid FK | Qual imobiliária pertence |
| nome | text NOT NULL | Nome completo |
| email | text NOT NULL | Email |
| telefone | text | Telefone |
| cargo | text | admin, corretor, gerente |
| avatar_url | text | Foto de perfil |
| creci | text | CRECI individual |
| ativo | boolean DEFAULT true | Se está ativo |
| created_at | timestamptz | |

**3. imoveis**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid PK | |
| organizacao_id | uuid FK | |
| codigo | text | Código interno (gerado: ORG-001, ORG-002...) |
| titulo | text NOT NULL | Título do anúncio |
| descricao | text | Descrição completa |
| descricao_ia | text | Descrição gerada pela IA (separada da manual) |
| tipo | text NOT NULL | apartamento, casa, terreno, sala_comercial, etc. |
| finalidade | text NOT NULL | venda, locacao, venda_e_locacao |
| status | text DEFAULT 'disponivel' | disponivel, reservado, vendido, alugado, suspenso |
| valor_venda | numeric(12,2) | Preço de venda |
| valor_locacao | numeric(12,2) | Preço de aluguel |
| valor_condominio | numeric(12,2) | Taxa de condomínio |
| valor_iptu | numeric(12,2) | IPTU anual |
| area_total | numeric(10,2) | Área total m² |
| area_util | numeric(10,2) | Área útil m² |
| quartos | int | |
| suites | int | |
| banheiros | int | |
| vagas | int | |
| andar | int | Para apartamentos |
| ano_construcao | int | |
| endereco | jsonb | {rua, numero, complemento, bairro, cidade, estado, cep, lat, lng} |
| caracteristicas | text[] | Array: ['piscina', 'churrasqueira', 'academia', ...] |
| proprietario_id | uuid FK → clientes | Dono do imóvel |
| corretor_id | uuid FK → usuarios | Corretor responsável |
| publicar_portais | boolean DEFAULT false | Se deve aparecer no XML |
| codigo_portal | text | Código no portal |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**4. imovel_fotos**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid PK | |
| imovel_id | uuid FK | |
| url | text NOT NULL | URL no Supabase Storage |
| legenda | text | Descrição da foto |
| ordem | int DEFAULT 0 | Ordenação |
| principal | boolean DEFAULT false | Foto de capa |
| created_at | timestamptz | |

**5. clientes** (contatos)
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid PK | |
| organizacao_id | uuid FK | |
| nome | text NOT NULL | |
| email | text | |
| telefone | text | |
| cpf_cnpj | text | |
| tipo | text[] | ['comprador', 'vendedor', 'locatario', 'proprietario'] |
| origem | text | portal_zap, portal_olx, site, indicacao, whatsapp, outro |
| corretor_id | uuid FK → usuarios | Corretor responsável |
| tags | text[] | Tags livres |
| observacoes | text | Notas livres |
| score_ia | int | Score de engajamento calculado pela IA (0-100) |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**6. cliente_interesses** (perfil de busca)
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid PK | |
| cliente_id | uuid FK | |
| tipo_imovel | text[] | ['apartamento', 'casa', ...] |
| finalidade | text | compra, locacao |
| bairros | text[] | Bairros de interesse |
| cidade | text | |
| estado | text | |
| preco_min | numeric(12,2) | |
| preco_max | numeric(12,2) | |
| quartos_min | int | |
| area_min | numeric(10,2) | |
| vagas_min | int | |
| observacoes | text | |

**7. pipeline_etapas** (etapas customizáveis)
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid PK | |
| organizacao_id | uuid FK | |
| pipeline_tipo | text | venda, locacao |
| nome | text NOT NULL | Nome da etapa |
| ordem | int NOT NULL | Posição no kanban |
| cor | text | Cor hex |
| created_at | timestamptz | |

**8. negocios** (deals)
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid PK | |
| organizacao_id | uuid FK | |
| titulo | text NOT NULL | |
| cliente_id | uuid FK → clientes | |
| imovel_id | uuid FK → imoveis | |
| etapa_id | uuid FK → pipeline_etapas | Etapa atual |
| corretor_id | uuid FK → usuarios | Responsável |
| valor | numeric(12,2) | Valor do negócio |
| tipo | text | venda, locacao |
| status | text DEFAULT 'aberto' | aberto, ganho, perdido |
| motivo_perda | text | |
| data_previsao | date | Previsão de fechamento |
| observacoes | text | |
| analise_ia | text | Análise de contexto gerada pela IA |
| created_at | timestamptz | |
| updated_at | timestamptz | |
| fechado_em | timestamptz | |

**9. atividades**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid PK | |
| organizacao_id | uuid FK | |
| tipo | text NOT NULL | visita, ligacao, follow_up, proposta, reuniao, assinatura |
| titulo | text NOT NULL | |
| descricao | text | |
| data_hora | timestamptz NOT NULL | |
| duracao_minutos | int | |
| status | text DEFAULT 'pendente' | pendente, realizada, cancelada, reagendada |
| negocio_id | uuid FK → negocios | |
| cliente_id | uuid FK → clientes | |
| imovel_id | uuid FK → imoveis | |
| corretor_id | uuid FK → usuarios | |
| feedback | text | |
| sugestao_ia | text | Sugestão da IA para próximo passo |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**10. leads_portais** (leads via webhook)
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid PK | |
| organizacao_id | uuid FK | |
| portal | text NOT NULL | zap, olx, vivareal, imovelweb, site, whatsapp |
| payload_original | jsonb | JSON cru do webhook |
| nome | text | |
| email | text | |
| telefone | text | |
| mensagem | text | |
| imovel_id | uuid FK → imoveis | |
| cliente_id | uuid FK → clientes | |
| negocio_id | uuid FK → negocios | |
| status | text DEFAULT 'novo' | novo, processado, descartado |
| processado_em | timestamptz | |
| created_at | timestamptz | |

**11. conversas_ia** (histórico de conversas do agente)
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid PK | |
| organizacao_id | uuid FK | |
| lead_id | uuid FK → leads_portais | |
| cliente_id | uuid FK → clientes | |
| canal | text | whatsapp, site, portal |
| whatsapp_numero | text | Número do contato no WhatsApp |
| mensagens | jsonb | Array de {role, content, timestamp} |
| status | text DEFAULT 'ativa' | ativa, encerrada, transferida_corretor |
| resumo | text | Resumo gerado pela IA |
| imoveis_sugeridos | uuid[] | IDs dos imóveis sugeridos |
| dados_coletados | jsonb | Dados que a IA extraiu (nome, interesse, orçamento) |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**12. ia_uso** (controle de uso da IA por organização)
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid PK | |
| organizacao_id | uuid FK | |
| mes_ano | text | "2026-03" (para controle mensal) |
| conversas_sdr | int DEFAULT 0 | Conversas do agente WhatsApp |
| geracoes_texto | int DEFAULT 0 | Descrições geradas |
| analises | int DEFAULT 0 | Análises de negócio |
| tokens_consumidos | int DEFAULT 0 | Total de tokens da API |

### Índices
```sql
CREATE INDEX idx_imoveis_org_status ON imoveis(organizacao_id, status);
CREATE INDEX idx_imoveis_org_tipo ON imoveis(organizacao_id, tipo, finalidade);
CREATE INDEX idx_imoveis_org_valor ON imoveis(organizacao_id, valor_venda);
CREATE INDEX idx_imoveis_org_bairro ON imoveis(organizacao_id, (endereco->>'bairro'));
CREATE INDEX idx_imoveis_match ON imoveis(organizacao_id, tipo, finalidade, status, quartos, valor_venda);
CREATE INDEX idx_imoveis_publicar ON imoveis(organizacao_id, publicar_portais, status);
CREATE INDEX idx_clientes_org ON clientes(organizacao_id);
CREATE INDEX idx_negocios_org_etapa ON negocios(organizacao_id, etapa_id);
CREATE INDEX idx_negocios_org_corretor ON negocios(organizacao_id, corretor_id);
CREATE INDEX idx_atividades_org_data ON atividades(organizacao_id, data_hora);
CREATE INDEX idx_atividades_corretor ON atividades(corretor_id, status);
CREATE INDEX idx_leads_org_status ON leads_portais(organizacao_id, status);
CREATE INDEX idx_org_slug ON organizacoes(slug);
CREATE INDEX idx_conversas_org ON conversas_ia(organizacao_id, status);
CREATE INDEX idx_ia_uso_org_mes ON ia_uso(organizacao_id, mes_ano);
```

---

## Planos SaaS (Stripe)

| | **CRM + IA** | **CRM + IA + SDR** |
|--|-------------|-------------------|
| **Módulos** | Imóveis, Clientes, Pipeline, Atividades, Site | Tudo do anterior + Agente WhatsApp |
| **IA nos módulos** | Sim (geração de texto, análise, score) | Sim |
| **Agente WhatsApp SDR** | Não | Sim |
| **Chat no site** | Sim (básico) | Sim (completo) |
| **Corretores** | Até 5 | Até 20 |
| **Imóveis** | Até 300 | Até 1.000 |
| **Conversas IA/mês** | 200 | 1.000 |
| **Feed XML portais** | Sim | Sim |
| **Suporte** | Email | Email + WhatsApp prioritário |

**Trial**: 14 dias, todas as features do plano CRM+IA+SDR
**Preços**: definir na fase de implementação (referência mercado: R$150-500/mês)

---

## Variáveis de Ambiente

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_CRM_IA=
STRIPE_PRICE_CRM_IA_SDR=

# Anthropic (Claude API)
ANTHROPIC_API_KEY=

# Resend (email)
RESEND_API_KEY=

# WhatsApp Business (Meta)
WHATSAPP_VERIFY_TOKEN=
WHATSAPP_APP_SECRET=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Arquivos Afetados

Como o projeto é greenfield (do zero), todos os arquivos serão **criados**:

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `package.json` | criar | Dependências do projeto |
| `src/app/layout.tsx` | criar | Root layout |
| `src/app/(auth)/login/page.tsx` | criar | Página de login |
| `src/app/(auth)/cadastro/page.tsx` | criar | Página de cadastro |
| `src/app/(dashboard)/layout.tsx` | criar | Layout do dashboard (sidebar + header) |
| `src/app/(dashboard)/page.tsx` | criar | Dashboard principal |
| `src/app/(dashboard)/imoveis/**` | criar | Módulo de imóveis (listagem, detalhe, form) |
| `src/app/(dashboard)/clientes/**` | criar | Módulo de clientes |
| `src/app/(dashboard)/negocios/**` | criar | Pipeline kanban |
| `src/app/(dashboard)/atividades/**` | criar | Agenda e tarefas |
| `src/app/(dashboard)/ia/**` | criar | Painel do agente IA |
| `src/app/(dashboard)/configuracoes/**` | criar | Configurações da org |
| `src/app/(site)/[slug]/**` | criar | Site público da imobiliária |
| `src/app/api/webhooks/**` | criar | Webhooks (Stripe, portais, WhatsApp) |
| `src/app/api/xml/**` | criar | Feed XML VRSync |
| `src/app/api/ia/**` | criar | Endpoints da IA |
| `src/components/ui/**` | criar | shadcn/ui components |
| `src/components/layout/**` | criar | Sidebar, Header |
| `src/lib/supabase/**` | criar | Clients Supabase |
| `src/lib/stripe/**` | criar | Integração Stripe |
| `src/lib/ia/**` | criar | Lógica da IA (prompts, contexto, ações) |
| `src/lib/xml/vrsync.ts` | criar | Gerador XML VRSync |
| `src/hooks/**` | criar | Custom hooks |
| `src/types/**` | criar | Tipos TypeScript |
| `src/actions/**` | criar | Server Actions |
| `src/middleware.ts` | criar | Auth middleware |
| `supabase/migrations/**` | criar | Migrations do banco |
| `CLAUDE.md` | alterar | Preencher com stack e arquitetura |

---

## Impacto

1. **Multi-tenancy (CRÍTICO)**: RLS deve estar 100% correto — vazamento de dados é inaceitável. Testar com 2+ organizações desde a Fase 0
2. **Custo IA**: Claude API pode ficar caro com volume. Implementar: cache de respostas, limites por plano, tabela `ia_uso`
3. **WhatsApp Business API**: requer aprovação da Meta, conta verificada. Pode demorar. Começar o processo cedo
4. **Fotos**: Supabase Storage tem limite no plano gratuito. Monitorar, migrar para R2/S3 se necessário
5. **XML VRSync**: schema pode variar entre portais. Validar com portal real
6. **Stripe webhooks**: devem ser idempotentes (mesmo evento pode chegar 2x)
7. **LGPD**: consentimento, política de privacidade, direito a exclusão
8. **n8n**: hospedagem do n8n (self-hosted ou cloud) é uma dependência externa

---

## Ordem de Execução

**Fase 0 — Fundação**
1. Criar projeto Next.js 15 + TypeScript + Tailwind CSS 4 + shadcn/ui
2. Configurar Supabase (projeto, auth, RLS base)
3. Migration: tabelas `organizacoes` + `usuarios`
4. Auth completo (login, cadastro, esqueci senha, middleware)
5. Layout dashboard (sidebar azul-marinho + header + navegação)
6. Multi-tenancy (RLS policies, hook `use-organizacao`)
7. Atualizar CLAUDE.md com stack completa

**Fase 1 — Imóveis**
1. Migration: `imoveis` + `imovel_fotos` + RLS
2. CRUD completo (Server Actions + formulário com Zod)
3. Upload de fotos (Supabase Storage, galeria com reordenação)
4. Listagem com filtros e paginação
5. Detalhe do imóvel

**Fase 2 — Clientes**
1. Migration: `clientes` + `cliente_interesses` + RLS
2. CRUD completo
3. Perfil de interesse
4. Match automático (query cruzamento)
5. Timeline de interações

**Fase 3 — Pipeline/Negócios**
1. Migration: `pipeline_etapas` + `negocios` + RLS
2. Seed das etapas padrão
3. Kanban visual (dnd-kit)
4. CRUD de negócios (criar, editar, ganhar, perder)
5. Filtros por corretor, tipo, valor

**Fase 4 — Atividades**
1. Migration: `atividades` + RLS
2. CRUD completo
3. Visão calendário (diária/semanal/mensal)
4. Notificações email (Resend)
5. Follow-up automático

**Fase 5 — IA nos Módulos**
1. Configurar Anthropic SDK
2. `lib/ia/` — prompts, contexto, ações
3. IA em Imóveis: gerar descrição, melhorar texto, gerar título
4. IA em Negócios: análise de contexto, sugestão de ação
5. IA em Clientes: score de lead, resumo, match inteligente
6. IA em Atividades: sugestão pós-atividade, briefing de visita
7. Migration: `ia_uso` + controle de consumo

**Fase 6 — Integração Portais**
1. Migration: `leads_portais` + RLS
2. Gerador XML VRSync (`/api/xml/[slug].xml`)
3. Webhook receptor de leads (`/api/webhooks/portais`)
4. Normalizador de leads (ZAP, OLX, VivaReal → formato único)
5. Auto-criação de cliente + negócio a partir do lead

**Fase 7 — Site Próprio**
1. Rotas dinâmicas `/(site)/[slug]/`
2. Home, listagem (com filtros), detalhe, contato
3. SSR + SEO (meta tags, OpenGraph, sitemap)
4. Tema customizável (cores, logo, textos — config no dashboard)
5. Formulário de contato → cria lead
6. Widget de chat IA no site

**Fase 8 — Agente SDR (WhatsApp) + Billing**
1. Migration: `conversas_ia` + RLS
2. Webhook WhatsApp (`/api/webhooks/whatsapp`)
3. Integração n8n + Claude API para o agente
4. Fluxo: receber msg → processar → responder → transferir
5. Painel de conversas no dashboard
6. Stripe: produtos, checkout, customer portal, webhooks
7. Middleware de limites por plano
