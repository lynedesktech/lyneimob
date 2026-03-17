# Pesquisa: Oportunidades de Componentes shadcn/ui nas Páginas do LyneImob

**Data:** 2026-03-17
**Método:** Mapeamento das páginas do dashboard + cruzamento com registry @shadcn (405 itens disponíveis)

---

## Resumo Executivo

O projeto usa atualmente ~20 componentes shadcn. O registry tem 60+ componentes UI disponíveis. Foram identificadas **15 oportunidades de alto valor** que podem melhorar significativamente a experiência do corretor em 6 áreas do sistema.

---

## Componentes Já Instalados (uso atual)

`button`, `badge`, `card`, `input`, `label`, `textarea`, `select`, `switch`, `table`, `tabs`, `dialog`, `sheet`, `separator`, `skeleton`, `tooltip`, `avatar`, `progress`, `dropdown-menu`, `breadcrumb`, `checkbox`, `popover`, `radio-group`, `spinner`, `kbd`, `chart`, `sonner`

---

## Oportunidades por Página

### 🏠 /painel — Dashboard Principal

**Problema atual:** Cards de métricas são divs simples. Resumo semanal é texto plano. Não há gráficos.

| Componente | Oportunidade | Impacto |
|-----------|-------------|---------|
| **`chart`** (já instalado, não usado) | Gráficos de imóveis ativos por mês, negócios por etapa do funil, evolução de clientes | 🔴 Alto |
| **`alert`** | Banner de trial expirando, limites próximos, pagamento pendente | 🟡 Médio |
| **`collapsible`** | Checklist de onboarding expansível/recolhível | 🟡 Médio |

---

### 🏡 /imoveis — Listagem e Detalhe

**Problema atual:** Galeria de fotos é uma grade simples sem navegação. Filtros avançados são sempre visíveis (pesados). Não há preview rápido.

| Componente | Oportunidade | Impacto |
|-----------|-------------|---------|
| **`carousel`** | Galeria de fotos do imóvel com navegação por seta + thumb | 🔴 Alto |
| **`aspect-ratio`** | Manter proporção 16:9 ou 4:3 nas fotos do grid e galeria | 🟡 Médio |
| **`collapsible`** | Filtros avançados recolhíveis (mostrar só os básicos por padrão) | 🟡 Médio |
| **`scroll-area`** | Lista de fotos em miniatura na lateral do detalhe | 🟢 Baixo |
| **`hover-card`** | Preview rápido do imóvel ao passar mouse no card da listagem | 🟡 Médio |

---

### 👤 /clientes — Listagem e Detalhe

**Problema atual:** Timeline de interações é lista simples. Busca de imóveis para "interesses" é input livre sem autocomplete.

| Componente | Oportunidade | Impacto |
|-----------|-------------|---------|
| **`combobox`** | Busca de imóveis ao adicionar interesse do cliente (busca enquanto digita) | 🔴 Alto |
| **`collapsible`** | Seções "Histórico", "Interesses", "Match IA" expansíveis no detalhe | 🟡 Médio |
| **`hover-card`** | Preview do imóvel ao passar mouse na lista de matches | 🟡 Médio |

---

### 💼 /negocios — Kanban e Detalhe

**Problema atual:** Menu de ações em cards do Kanban tem muitos botões. Colunas do Kanban têm largura fixa. Confirmação de exclusão usa componente genérico.

| Componente | Oportunidade | Impacto |
|-----------|-------------|---------|
| **`context-menu`** | Click-direito nos cards do Kanban: editar, mover etapa, marcar ganho/perdido, duplicar | 🔴 Alto |
| **`alert-dialog`** | Substituir `ConfirmacaoExclusao` por alert-dialog oficial — mais acessível, animado | 🟡 Médio |
| **`resizable`** | Colunas do Kanban redimensionáveis pelo usuário | 🟢 Baixo |
| **`alert`** | Aviso de proposta expirando, prazo de fechamento próximo | 🟡 Médio |

---

### 📅 /atividades — Agenda e Calendário

**Problema atual:** Calendário é implementação manual. Alternância mensal/semanal/diário usa botões simples.

| Componente | Oportunidade | Impacto |
|-----------|-------------|---------|
| **`calendar`** | Substituir calendário manual pelo Calendar shadcn — mais polido, acessível, com seleção de range | 🔴 Alto |
| **`toggle-group`** | Alternância visual Mensal/Semanal/Diário como grupo de botões com ícones | 🟡 Médio |

---

### ⚙️ /configuracoes — Hub e Sub-páginas

**Problema atual:** Formulários de configuração são campos soltos sem agrupamento visual. URLs são campos simples sem prefixo "https://".

| Componente | Oportunidade | Impacto |
|-----------|-------------|---------|
| **`input-group`** | Campos com prefixo (ex: `https://` antes da URL do webhook, `R$` antes de valores) | 🟡 Médio |
| **`field`** | Substituir Label + Input + mensagem de erro manual por Field integrado | 🟡 Médio |
| **`collapsible`** | Seções de configuração avançada colapsáveis (ex: configurações de distribuição avançada) | 🟡 Médio |
| **`alert`** | Avisos de webhook inativo, plano limitado, integração desconectada | 🟡 Médio |

---

### 📋 Formulários em Geral (15+ formulários no projeto)

**Problema atual:** Todos os formulários usam Label + Input + mensagem de erro construídos manualmente.

| Componente | Oportunidade | Impacto |
|-----------|-------------|---------|
| **`field`** | Componente que une Label + Input + erro em um bloco — reduz código duplicado em 15+ formulários | 🔴 Alto |
| **`input-group`** | Inputs com ícone (busca 🔍), prefixo (R$, https://) ou sufixo (m², /mês) | 🟡 Médio |
| **`combobox`** | Seleção em listas longas: corretores (buscar por nome), clientes, imóveis | 🔴 Alto |
| **`form`** | Wrapper de formulário com validação integrada ao React Hook Form + Zod | 🟡 Médio |

---

### 🔍 Busca Global

**Problema atual:** BuscaGlobal é implementação customizada sem atalho de teclado padrão.

| Componente | Oportunidade | Impacto |
|-----------|-------------|---------|
| **`command`** | Substituir busca global por Command palette (Ctrl+K) — busca imóveis, clientes, negócios, navega para páginas | 🔴 Alto |

---

### 📱 Mobile / UX Geral

| Componente | Oportunidade | Impacto |
|-----------|-------------|---------|
| **`drawer`** | Painéis de detalhe em mobile (ex: detalhe do negócio num drawer em vez de nova página) | 🟡 Médio |
| **`toggle-group`** | Alternância Cards ↔ Lista em imóveis, clientes, negócios | 🟡 Médio |
| **`scroll-area`** | Listas longas com scroll personalizado (ex: lista de conversas WhatsApp) | 🟢 Baixo |
| **`accordion`** | FAQ na landing page (substituir implementação manual atual) | 🟢 Baixo |
| **`alert-dialog`** | Todas as confirmações de exclusão do sistema | 🟡 Médio |
| **`button-group`** | Agrupar botões relacionados (ex: "Exportar CSV" + "Exportar PDF") | 🟢 Baixo |

---

## Ranking por Impacto — Top 10 Prioridades

| # | Componente | Onde | Por quê é alto impacto |
|---|-----------|------|------------------------|
| 1 | **`chart`** | /painel | Já instalado, zero esforço de setup. Gráficos transformam o dashboard |
| 2 | **`command`** | Busca global | Atalho Ctrl+K, busca universal — feature que usuários esperam num CRM |
| 3 | **`carousel`** | /imoveis/[id] | Galeria de fotos é central no imóvel — carousel profissional muda percepção |
| 4 | **`field`** | 15+ formulários | Reduz código duplicado em todo o sistema de uma vez |
| 5 | **`combobox`** | /clientes, /negocios | Busca enquanto digita em listas longas — UX essencial em CRM |
| 6 | **`context-menu`** | /negocios Kanban | Click-direito nos cards = ação super rápida sem abrir página |
| 7 | **`calendar`** | /atividades | Calendário polido substitui implementação manual |
| 8 | **`alert`** | Painel, configurações | Avisos visuais claros (trial, limites, erros) |
| 9 | **`alert-dialog`** | Todas as exclusões | Substitui ConfirmacaoExclusao customizada por componente padrão |
| 10 | **`collapsible`** | /imoveis, /clientes, /config | Filros e seções recolhíveis melhoram densidade de informação |

---

## Componentes que NÃO fazem sentido para o projeto

- `navigation-menu` — sidebar já cobre a navegação
- `menubar` — não há barra de menu horizontal no CRM
- `input-otp` — sem fluxo de OTP no sistema atual
- `aspect-ratio` — útil mas baixíssima prioridade vs outros
- `direction` — sem suporte a RTL no escopo atual
