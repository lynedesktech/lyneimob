# Requisitos: Adoção 100% shadcn/ui no LyneImob

**Data**: 2026-03-17
**Pesquisa base**: `planejamento/pesquisas/pesquisa-shadcn-ui.md`
**Preset escolhido**: `a1D23ulM` (Mira, Blue, Inter, Neutral, Lucide, Default/Solid, Subtle)

---

## Escopo

### O que FAZ parte desta implementação

1. Aplicar o preset `a1D23ulM` ao projeto existente (tema + cores + sidebar)
2. Instalar componentes novos do shadcn/ui (chart, breadcrumb, checkbox, etc.)
3. Ajustar sidebar para padrão moderno (cinza claro no light mode)
4. Preservar o visual da landing page e site público (gradientes azuis)
5. Corrigir hardcodes de cores
6. Configurar Skills e MCP Server do shadcn/ui

### O que NÃO faz parte (migração futura)

- Migrar formulários para Field + Input Group (escopo grande: 15+ formulários)
- Migrar busca global para Command (cmdk)
- Migrar botao-exportar para DropdownMenu
- Refatorar landing page com Card/Chart oficiais
- Substituir componentes custom (estado-vazio, paginacao, confirmacao-exclusao, status-badge)

---

## Ordem de implementação

### Etapa 1 — Aplicar preset e reconstruir tema

**O que fazer:**
Rodar o comando do shadcn CLI para aplicar o preset escolhido ao projeto existente.

**Comando:**
```bash
npx shadcn@latest init --preset a1D23ulM --force
```

**O que isso faz automaticamente:**
- Atualiza `components.json` com a configuração do preset (estilo Mira, tema Blue, etc.)
- Regenera as variáveis CSS em `src/app/globals.css` com a paleta do preset

**O que precisa ser feito manualmente depois:**
O preset vai sobrescrever o `globals.css`, então precisamos **re-adicionar** as variáveis customizadas que o projeto usa e o preset não conhece:

```css
/* Variáveis da landing page (gradiente azul) */
--grad-start: oklch(0.47 0.17 255);
--grad-mid: oklch(0.38 0.15 258);
--grad-end: oklch(0.20 0.10 260);
--accent-blue: oklch(0.62 0.19 255);

/* Variáveis semânticas (se o preset não incluir) */
--success: oklch(0.55 0.18 145);
--success-foreground: oklch(0.985 0 0);
--warning: oklch(0.75 0.15 85);
--warning-foreground: oklch(0.205 0 0);
--info: oklch(0.55 0.15 250);
--info-foreground: oklch(0.985 0 0);
```

Também re-adicionar no `@theme inline`:
```css
--color-grad-start: var(--grad-start);
--color-grad-mid: var(--grad-mid);
--color-grad-end: var(--grad-end);
--color-accent-blue: var(--accent-blue);
--color-success: var(--success);
/* etc. */
```

**Arquivos modificados:**
| Arquivo | Ação |
|---------|------|
| `components.json` | Atualizado automaticamente pelo CLI |
| `src/app/globals.css` | Atualizado pelo CLI + re-adicionar variáveis custom |

**Verificação:**
- `npm run dev` sem erros
- Sidebar no light mode está cinza claro (não mais azul escuro)
- Dark mode continua funcionando
- Landing page mantém gradientes azuis

---

### Etapa 2 — Instalar componentes novos

**Comando:**
```bash
npx shadcn@latest add chart breadcrumb checkbox popover radio-group spinner kbd
```

**O que cada componente faz:**

| Componente | Utilidade no LyneImob | Dependência externa |
|------------|----------------------|---------------------|
| **chart** | Dashboard com gráficos de performance | `recharts` |
| **breadcrumb** | Navegação de contexto nas páginas internas | nenhuma |
| **checkbox** | Formulários e seleção em tabelas | nenhuma |
| **popover** | Menus contextuais e filtros avançados | nenhuma |
| **radio-group** | Seleção única em formulários (tipo do imóvel, etc.) | nenhuma |
| **spinner** | Loading em botões e ações async | nenhuma |
| **kbd** | Mostrar atalhos de teclado (ex: ⌘K na busca) | nenhuma |

**Ponto de atenção:**
- Verificar se cada componente tem versão para **Base UI** (o projeto usa `@base-ui/react`, não Radix)
- Se algum componente só existir para Radix, avaliar se vale a pena instalar a versão Radix ou pular

**Arquivos criados:**
- `src/components/ui/chart.tsx`
- `src/components/ui/breadcrumb.tsx`
- `src/components/ui/checkbox.tsx`
- `src/components/ui/popover.tsx`
- `src/components/ui/radio-group.tsx`
- `src/components/ui/spinner.tsx`
- `src/components/ui/kbd.tsx`

**Verificação:**
- Arquivos criados sem erro
- `npm run build` compila sem erros (componentes não usados ainda, mas devem compilar)

---

### Etapa 3 — Ajustar sidebar e header (se necessário)

**Expectativa:**
Com o preset aplicado, as variáveis `--sidebar-*` no `:root` devem mudar de azul escuro para cinza claro. Como o `sidebar.tsx` e o `app-sidebar.tsx` usam apenas CSS variables (`bg-sidebar`, `text-sidebar-foreground`, etc.), a mudança visual deve ser **automática**.

**O que verificar no `app-sidebar.tsx`:**

1. **Ícone do header** — usa `bg-sidebar-primary` e `text-sidebar-primary-foreground`
   - Com preset Blue: `sidebar-primary` provavelmente será azul escuro
   - Verificar se o ícone "L" continua visível e bonito

2. **Labels de grupo** — usam `text-sidebar-foreground/50`
   - Com sidebar claro: texto escuro com 50% opacidade = cinza médio (deve ficar bom)

3. **Items ativos** — usam `data-active:bg-sidebar-accent`
   - Com preset: accent deve ser cinza levíssimo ou azul sutil
   - Verificar contraste

4. **Borda do header interno** — `border-b border-sidebar-border`
   - Verificar se fica visível no fundo claro

**O que verificar no `header.tsx`:**
- O header do dashboard (`h-14 border-b`) usa cores globais, não sidebar
- Provavelmente não precisa de mudança

**Arquivos possivelmente modificados:**
| Arquivo | Ação |
|---------|------|
| `src/components/layout/app-sidebar.tsx` | Ajustes de classe se o contraste não ficar bom |
| `src/components/layout/header.tsx` | Provavelmente nenhuma mudança |

**Verificação:**
- Light mode: sidebar elegante, itens legíveis, ícone visível
- Dark mode: sem regressões
- Mobile: sheet sidebar funcional
- Collapsible: ícones visíveis no modo colapsado

---

### Etapa 4 — Preservar landing page e auth

**Contexto:**
A landing page e a tela de auth usam os gradientes azuis (`grad-start`, `grad-mid`, `grad-end`, `accent-blue`). Essas variáveis são customizadas do projeto, não do shadcn. O preset pode sobrescrevê-las ou removê-las.

**Arquivos que dependem dessas variáveis:**

| Arquivo | Variáveis usadas |
|---------|-----------------|
| `src/components/landing/secao-hero.tsx` | `grad-start`, `grad-mid`, `grad-end`, `accent-blue` |
| `src/components/landing/secao-cta-final.tsx` | `grad-start`, `grad-mid`, `grad-end`, `accent-blue` |
| `src/components/landing/secao-video.tsx` | `grad-start`, `grad-end`, `grad-mid`, `accent-blue` |
| `src/components/landing/secao-precos.tsx` | `grad-start`, `grad-mid`, `accent-blue` |
| `src/components/landing/header-landing.tsx` | `grad-end`, `grad-mid` |
| `src/components/landing/secao-funcionalidades.tsx` | `accent-blue` |
| `src/components/landing/secao-faq.tsx` | `accent-blue` |
| `src/app/(auth)/layout.tsx` | `accent-blue` |

**Ação necessária:**
Após aplicar o preset (Etapa 1), verificar se essas variáveis ainda existem no `globals.css`. Se foram removidas, re-adicioná-las tanto no `:root` quanto no `.dark` e no `@theme inline`.

**Verificação:**
- Landing page (`/`) com gradientes azuis intactos
- Tela de auth com destaque azul
- Header da landing com fundo escuro ao scrollar

---

### Etapa 5 — Corrigir hardcodes de cores

**Arquivo: `src/lib/exportacao/gerar-pdf.ts`**
- Usa `RGB(6, 58, 140)` que é `#063A8C` (azul médio da marca)
- **Ação**: Manter como está — PDF é exportação estática, não segue tema
- **Motivo**: PDFs precisam de cores fixas, não CSS variables

**Arquivo: `src/types/configuracoes-site.ts`**
- Define defaults de cores do site público:
  ```typescript
  primaria: "#063A8C"
  destaque: "#2B8AFF"
  hero_fundo: "#011A42"
  ```
- **Ação**: Manter como está — são defaults para novas organizações
- **Motivo**: Cada org pode customizar, e os defaults são a identidade LyneImob

**Conclusão da Etapa 5**: Nenhuma mudança necessária. Os hardcodes existem por motivos válidos.

---

### Etapa 6 — Configurar ferramentas do ecossistema

**6a. Instalar Skills do shadcn/ui**

```bash
pnpm dlx skills add shadcn/ui
```

O que faz: instala um arquivo de skill no projeto que dá ao Claude Code contexto automático sobre a configuração shadcn (componentes instalados, framework, aliases, tema).

**6b. Configurar MCP Server do shadcn/ui**

```bash
npx shadcn@latest mcp init --client claude-code
```

O que faz: adiciona configuração em `.claude/settings.json` (ou `.mcp.json`) para que o Claude Code possa buscar, ver e instalar componentes do shadcn diretamente via IA.

**Verificação:**
- Claude Code reconhece o contexto shadcn nas próximas conversas
- Comando `npx shadcn@latest mcp` responde corretamente

---

## Resumo de arquivos afetados

### Modificados automaticamente pelo CLI
- `components.json`
- `src/app/globals.css`

### Criados pelo CLI (componentes novos)
- `src/components/ui/chart.tsx`
- `src/components/ui/breadcrumb.tsx`
- `src/components/ui/checkbox.tsx`
- `src/components/ui/popover.tsx`
- `src/components/ui/radio-group.tsx`
- `src/components/ui/spinner.tsx`
- `src/components/ui/kbd.tsx`

### Possivelmente ajustados manualmente
- `src/components/layout/app-sidebar.tsx` (ajustes de contraste no light mode)
- `src/app/globals.css` (re-adicionar variáveis custom após preset)

### NÃO modificados
- Todos os 8 arquivos da landing page (dependem de variáveis preservadas)
- Todos os componentes custom em `src/components/ui/` (mantêm)
- `src/lib/exportacao/gerar-pdf.ts` (hardcode justificado)
- `src/types/configuracoes-site.ts` (defaults mantidos)
- Dark mode (já estava correto)

---

## Componentes custom que permanecem

| Componente | Motivo para manter |
|------------|-------------------|
| `estado-vazio.tsx` | Sem equivalente oficial no shadcn |
| `paginacao-listagem.tsx` | Suporta server + client, sem equivalente |
| `confirmacao-exclusao.tsx` | Lógica async + toast específica do projeto |
| `status-badge.tsx` | Mapa de status por módulo (domínio) |
| `botao-exportar.tsx` | Futuro: migrar para DropdownMenu oficial |

---

## Checklist de validação final

- [ ] `npm run build` compila sem erros
- [ ] Light mode — sidebar cinza claro com texto escuro
- [ ] Light mode — item ativo no sidebar com acento sutil (não azul pesado)
- [ ] Light mode — ícone do header do sidebar visível e bonito
- [ ] Dark mode — sidebar continua igual (cinza escuro)
- [ ] Dark mode — sem regressões visuais em nenhuma página
- [ ] Landing page (`/`) — gradientes azuis intactos
- [ ] Landing page — header com fundo ao scrollar
- [ ] Auth (`/login`) — destaque azul mantido
- [ ] Dashboard (`/painel`) — cards de resumo com cores corretas
- [ ] Mobile — sidebar sheet funcional
- [ ] Sidebar collapsible — modo ícone funcional
- [ ] Componentes novos instalados em `src/components/ui/`
- [ ] Skills e MCP Server configurados

---

## Migração futura (não nesta tarefa)

Estas são melhorias que podem ser feitas depois, gradualmente:

| O quê | Impacto | Escopo |
|-------|---------|--------|
| Formulários → Field + Input Group | 15+ formulários, reduz duplicação | Grande |
| Busca Global → Command (cmdk) | Código mais idiomático | Médio |
| botao-exportar → DropdownMenu | Consistência | Pequeno |
| Landing → Card + Chart oficiais | Visual moderno | Médio |
| Dashboard → Charts (Recharts) | Gráficos de performance | Médio |

---

## Próximo passo

Implementar as 6 etapas na ordem definida. Começar pela Etapa 1 (aplicar preset).
