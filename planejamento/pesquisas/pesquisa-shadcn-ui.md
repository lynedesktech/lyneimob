# Pesquisa: Integração 100% shadcn/ui no LyneImob

**Data**: 2026-03-17
**Tema**: Adoção completa do ecossistema shadcn/ui — componentes, theming, ferramentas
**Motivação**: O sidebar azul escuro ficou visualmente pesado. O padrão moderno do shadcn/ui (sidebar cinza claro + fundo branco + acentos sutis) é mais elegante e profissional.

---

## O que o LyneImob já usa hoje

O projeto já tem uma base sólida de shadcn/ui:

- **25 componentes** instalados em `src/components/ui/`
- **Base UI** (não Radix) como lib headless, usando `render` prop para composição
- **Sidebar** shadcn completo com collapsible, mobile sheet, cookie state, atalho Ctrl+B
- **Sistema de cores OKLCH** em `globals.css` (moderno, perceptualmente uniforme)
- **Tailwind CSS 4** + next-themes para dark mode
- **CLI shadcn v4** configurado (`components.json` com preset `base-nova`)
- **5 componentes customizados**: confirmacao-exclusao, estado-vazio, status-badge, paginacao-listagem, botao-exportar

### Componentes instalados

**Core UI**: button, card, input, label, textarea, select, tabs, badge, switch
**Navegação e layout**: sidebar, sheet, separator, dropdown-menu
**Dados e feedback**: table, dialog, progress, skeleton, tooltip, avatar, sonner
**Custom do projeto**: confirmacao-exclusao, estado-vazio, status-badge, paginacao-listagem, botao-exportar

---

## O problema visual atual

### Sidebar no light mode

As variáveis CSS atuais (`globals.css`, linhas 95-102):

```css
--sidebar: oklch(0.20 0.10 260);              /* Fundo azul escurão (#011A42) */
--sidebar-foreground: oklch(0.95 0 0);         /* Texto quase branco */
--sidebar-primary: oklch(0.95 0 0);            /* Ícone ativo: branco */
--sidebar-primary-foreground: oklch(0.38 0.15 258); /* Texto no ícone: azul */
--sidebar-accent: oklch(0.26 0.12 258);        /* Item ativo: azul médio */
--sidebar-accent-foreground: oklch(0.95 0 0);  /* Texto no item ativo: branco */
```

**Resultado**: sidebar com fundo azul escuro sólido, texto branco, items ativos em azul médio. Funciona em termos de contraste, mas o visual fica pesado — lembra apps corporativos dos anos 2010.

### O padrão moderno do shadcn/ui

O design default do shadcn/ui (e que as imagens de referência mostram) é:

```css
--sidebar: oklch(0.985 0 0);                   /* Fundo cinza muito claro / quase branco */
--sidebar-foreground: oklch(0.145 0 0);         /* Texto escuro */
--sidebar-primary: oklch(0.205 0 0);            /* Ícone ativo: escuro */
--sidebar-primary-foreground: oklch(0.985 0 0); /* Texto no ícone: claro */
--sidebar-accent: oklch(0.97 0 0);              /* Item ativo: cinza levíssimo */
--sidebar-accent-foreground: oklch(0.205 0 0);  /* Texto no item ativo: escuro */
```

**Resultado**: sidebar clean, leve, com texto escuro legível, acentos sutis. A cor da marca aparece apenas em elementos pontuais (ícones, badges, botão primário).

---

## O que o ecossistema shadcn/ui oferece que NÃO estamos usando

### Componentes novos (outubro 2025)

| Componente | O que faz | Substitui algo nosso? |
|------------|-----------|----------------------|
| **Spinner** | Indicador de loading animado | Não temos equivalente |
| **Kbd** | Visual de atalho de teclado (ex: ⌘K) | Não temos equivalente |
| **Button Group** | Botões agrupados (ex: "Exportar ▾") | Não temos equivalente |
| **Input Group** | Input com ícone, botão ou label integrado | Não temos equivalente |
| **Field** | Wrapper unificado: label + help + error + input | Fazemos manual em cada formulário |
| **Item** | Listas e cards estruturados | Não temos equivalente |
| **Empty** | Estado vazio padronizado | Temos `estado-vazio.tsx` custom |

### Componentes que existem mas não instalamos

**Alta prioridade** (usaríamos imediatamente):
- **Breadcrumb** — navegação de contexto (hoje não temos)
- **Command** (cmdk) — command palette / busca avançada (temos BuscaGlobal custom)
- **Checkbox** — checkboxes em formulários e tabelas
- **Popover** — menus flutuantes contextuais
- **Radio Group** — seleção única em formulários
- **Drawer** — painéis laterais (Sheet faz algo similar)

**Média prioridade** (melhorariam a UX):
- **Accordion** — seções colapsáveis
- **Alert** / **Alert Dialog** — avisos e confirmações
- **Calendar** / **Date Picker** — seleção de datas nativa
- **Combobox** — select com busca
- **Data Table** — tabelas com TanStack Table v5
- **Hover Card** — preview ao passar o mouse
- **Navigation Menu** — menu de navegação avançado
- **Pagination** (oficial) — paginação padrão
- **Scroll Area** — scroll customizado
- **Toggle** / **Toggle Group** — alternadores

**Baixa prioridade** (casos específicos):
- **Carousel** — galeria de imagens
- **Collapsible** — conteúdo expansível
- **Context Menu** — menu de clique direito
- **Input OTP** — código de verificação
- **Menubar** — barra de menus
- **Native Select** — select nativo
- **Resizable** — painéis redimensionáveis
- **Slider** — controles deslizantes
- **Typography** — estilos de texto

### Ferramentas do ecossistema

| Ferramenta | O que faz | Como instalar |
|------------|-----------|---------------|
| **Skills** | Dá contexto do projeto ao Claude Code | `pnpm dlx skills add shadcn/ui` |
| **MCP Server** | Buscar, ver e instalar componentes via IA | `npx shadcn@latest mcp init --client claude-code` |
| **Registry** | Distribuição de componentes customizados | Configuração em `registry.json` |
| **Presets** | Temas prontos | Via CLI `shadcn init --preset` |
| **tweakcn.com** | Editor visual de temas | Acesso web, exporta CSS |

---

## Mapa de oportunidades

| Área | Hoje | Com shadcn/ui 100% |
|------|------|---------------------|
| Sidebar (light mode) | Azul escuro pesado | Cinza claro elegante |
| Sidebar (dark mode) | Cinza escuro (OK) | Mantém como está |
| Formulários | Wrappers manuais com RHF | Field + Input Group oficiais |
| Estados vazios | `estado-vazio.tsx` custom | Empty oficial (avaliar) |
| Loading | Skeleton manual | Spinner + Skeleton |
| Paginação | `paginacao-listagem.tsx` custom | Pagination oficial (avaliar) |
| Atalhos de teclado | Sem indicador visual | Kbd para mostrar shortcuts |
| Botões agrupados | Nenhum | Button Group |
| Breadcrumbs | Nenhum | Breadcrumb oficial |
| Command palette | BuscaGlobal custom | Command (cmdk) oficial |
| Tabelas de dados | Table básica manual | Data Table com TanStack |
| Seleção de datas | Input de texto | Calendar + Date Picker |
| Checkboxes | HTML nativo | Checkbox shadcn |

---

## Riscos e pontos de atenção

### 1. Identidade da marca
O azul é a identidade visual do LyneImob. Mudar o sidebar para cinza pode "descaracterizar". **Solução**: manter o azul como cor de destaque (primary, botões, ícone ativo, badges) em vez de fundo. O azul continua presente, só não domina a tela inteira.

### 2. Base UI vs Radix
O projeto usa Base UI (`@base-ui/react`). Nem todos os componentes novos do shadcn têm versão Base UI — alguns podem estar apenas para Radix. Precisa verificar compatibilidade componente por componente antes de instalar.

### 3. Componentes customizados
Temos 5 componentes custom em `src/components/ui/`. Antes de substituir por oficiais, avaliar:
- `estado-vazio.tsx` → Empty oficial cobre nosso caso?
- `paginacao-listagem.tsx` → Pagination oficial é suficiente?
- `confirmacao-exclusao.tsx` → Alert Dialog oficial + customização?
- `status-badge.tsx` e `botao-exportar.tsx` → provavelmente mantêm (são específicos do domínio)

### 4. Impacto no código
A mudança de cores do sidebar é **quase toda em `globals.css`** (6 variáveis CSS). Impacto baixo no código, alto no visual. Não precisa mexer em componentes — só variáveis.

### 5. Escopo protegido
**Landing page** e **site público** usam o gradiente azul vibrante e **não devem mudar**. A mudança de sidebar é exclusiva do dashboard (área logada).

### 6. Dark mode
No dark mode, o sidebar já usa cinza escuro (`oklch(0.205 0 0)`), que é o padrão shadcn. **Não precisa de mudança no dark mode** — só no light.

---

## Arquivos-chave para implementação futura

| Arquivo | O que mudar |
|---------|-------------|
| `src/app/globals.css` (linhas 95-102) | Variáveis de cor do sidebar no `:root` |
| `src/components/layout/app-sidebar.tsx` | Eventuais ajustes de estilo nos items |
| `src/components/layout/header.tsx` | Possível ajuste de contraste |
| `src/app/(dashboard)/layout.tsx` | Nada estrutural, mas verificar |
| `components.json` | Adicionar novos componentes via CLI |

---

## Documentação consultada

- [shadcn/ui Docs — Sidebar](https://ui.shadcn.com/docs/components/sidebar)
- [shadcn/ui Docs — Theming](https://ui.shadcn.com/docs/theming)
- [shadcn/ui Docs — CLI](https://ui.shadcn.com/docs/cli)
- [shadcn/ui Docs — MCP Server](https://ui.shadcn.com/docs/mcp)
- [shadcn/ui Docs — Skills](https://ui.shadcn.com/docs/skills)
- [shadcn/ui Changelog — outubro 2025 (7 novos componentes)](https://ui.shadcn.com/docs/changelog/2025-10-new-components)
- [shadcn/ui Changelog — março 2026 (CLI v4)](https://ui.shadcn.com/docs/changelog)
- [Base UI vs Radix UI — Comparativo](https://shadcnstudio.com/blog/base-ui-vs-radix-ui)
- [tweakcn.com — Editor de temas](https://tweakcn.com)

---

## Próximo passo

Gerar o **levantamento de requisitos** (`/requisitos`) detalhando exatamente o que mudar, em que ordem, e como validar — se a gente fosse adotar 100% do shadcn/ui no sistema.
