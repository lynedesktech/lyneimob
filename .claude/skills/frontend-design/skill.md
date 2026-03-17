---
name: frontend-design
description: "OBRIGATORIO para qualquer alteracao visual. Garante interfaces profissionais, consistentes e de alta qualidade. Ativar quando o usuario pede: criar pagina, componente visual, alterar layout, CSS, Tailwind, cores, tipografia."
---

# Skill: Frontend Design — LyneImob

## Quando usar

OBRIGATÓRIO sempre que for:
- Criar uma nova página ou tela
- Criar ou modificar componentes visuais
- Alterar layout, cores, tipografia ou espaçamento
- Trabalhar com CSS, Tailwind ou qualquer estilo

---

## Stack de UI

- **shadcn/ui** — preset `base-mira` (estilo Mira, tema Blue), configurado em `components.json`
- **Base UI** (`@base-ui/react` v1.3.0) — primitivos usados pelos componentes shadcn
- **Tailwind CSS 4** com `@theme inline` — variáveis CSS expostas como classes utilitárias
- **OKLCH** — espaço de cor de todos os tokens (mais preciso que HSL/RGB)
- **Lucide React** — ícones (única biblioteca de ícones do projeto)

---

## Regras Invioláveis

1. **NUNCA hardcodar cores** — nenhum `#hex`, `rgb()`, `text-blue-500`, `bg-gray-100` em componentes do dashboard ou landing
2. **SEMPRE usar variáveis CSS** — `text-foreground`, `bg-card`, `border-border`, etc.
3. **Exceções permitidas** (apenas estas):
   - `#25D366` / `#1da851` — cor oficial da marca WhatsApp
   - `var(--site-primaria)` / `var(--site-destaque)` — cores injetadas por cada imobiliária no site público (`src/app/[slug]/`)
4. **Light e dark mode sempre** — todo componente deve funcionar nas duas variantes sem ajuste manual
5. **Base UI usa `render` prop** — não usar `asChild`. Ver seção "Padrão Base UI" abaixo.
6. **Componentes antes de criar** — verificar `src/components/ui/` antes de criar qualquer novo componente

---

## Paleta de Cores — Classes Tailwind

### Cores base (adaptam automaticamente em light/dark)

| Classe Tailwind | Uso |
|-----------------|-----|
| `bg-background` / `text-foreground` | Fundo e texto principal da página |
| `bg-card` / `text-card-foreground` | Cards e painéis elevados |
| `bg-popover` / `text-popover-foreground` | Dropdowns, tooltips, popovers |
| `bg-muted` / `text-muted-foreground` | Seções secundárias, textos de apoio, labels |
| `bg-primary` / `text-primary-foreground` | Ação principal (botão CTA azul) |
| `bg-secondary` / `text-secondary-foreground` | Ações secundárias |
| `bg-accent` / `text-accent-foreground` | Hover states, destaques suaves |
| `border-border` | Bordas padrão em todos os elementos |
| `bg-input` | Fundo de inputs e selects |
| `ring-ring` | Anel de foco/outline |
| `bg-destructive` / `text-destructive` | Erros, ações destrutivas |

### Cores semânticas (status, badges, alertas)

| Classe Tailwind | Uso |
|-----------------|-----|
| `bg-success` / `text-success-foreground` | Sucesso, confirmações |
| `bg-warning` / `text-warning-foreground` | Alertas, atenção |
| `bg-info` / `text-info-foreground` | Informações neutras |

### Gradiente azul vibrante (landing page e CTAs principais)

```
bg-gradient-to-br from-grad-start via-grad-mid to-grad-end
```

| Token | Valor OKLCH | Equivalente aproximado |
|-------|------------|------------------------|
| `--grad-start` | `oklch(0.47 0.17 255)` | `#0A5DC2` — azul vibrante |
| `--grad-mid` | `oklch(0.38 0.15 258)` | `#063A8C` — azul profundo |
| `--grad-end` | `oklch(0.20 0.10 260)` | `#011A42` — azul muito escuro |

### Destaque azul (links, ícones de feature, badges de destaque)

```
text-accent-blue    bg-accent-blue    border-accent-blue
bg-accent-blue/10   text-accent-blue  ← para badges/tags suaves
```

- `--accent-blue`: `oklch(0.62 0.19 255)` ≈ `#2B8AFF`

### Sidebar (apenas em componentes dentro da sidebar)

| Classe | Uso |
|--------|-----|
| `bg-sidebar` | Fundo da sidebar |
| `text-sidebar-foreground` | Texto padrão na sidebar |
| `bg-sidebar-accent` | Hover de item |
| `text-sidebar-primary font-semibold` | Item ativo (azul + negrito) |
| `text-sidebar-foreground/60` | Labels de grupo (uppercase, menor) |
| `border-sidebar-border` | Bordas internas da sidebar |

### Gráficos (apenas com componente Chart + Recharts)

`text-chart-1` até `text-chart-5` — escala de azuis do mais claro ao mais escuro

---

## Tipografia

**Fonte principal:** Geist Sans → Inter → Segoe UI → Arial (fallback chain em `globals.css`)

| Uso | Classes Tailwind |
|-----|-----------------|
| Título de página | `text-2xl font-bold` |
| Título de seção/card | `text-lg font-semibold` ou `text-sm font-medium` |
| Corpo padrão | `text-sm` (padrão do sistema) |
| Texto auxiliar / label | `text-xs text-muted-foreground` |
| Label de grupo (sidebar) | `text-[11px] uppercase tracking-wider text-sidebar-foreground/60` |
| Código / mono | `font-mono text-xs` |

Nunca usar `font-size` manual em `px` — sempre classes Tailwind.

---

## Radius (bordas arredondadas)

A base é `--radius: 0.625rem`. As variantes derivam dela:

| Classe Tailwind | Valor | Uso típico |
|----------------|-------|------------|
| `rounded-sm` | 0.375rem | Badges, tags pequenas |
| `rounded-md` | 0.5rem | Botões, inputs |
| `rounded-lg` | 0.625rem | **Cards (padrão)** |
| `rounded-xl` | 0.875rem | Modais, sheets |
| `rounded-2xl` | 1.125rem | Seções de destaque |
| `rounded-full` | 9999px | Avatares, badges circulares |

---

## Catálogo de Componentes (`src/components/ui/`)

### Estrutura e layout

| Componente | Quando usar |
|-----------|-------------|
| `Card`, `CardHeader`, `CardContent`, `CardFooter`, `CardTitle`, `CardDescription`, `CardAction` | Todo painel, seção elevada, formulário contido |
| `Separator` | Divisores horizontais ou verticais |
| `Skeleton` | Placeholder de carregamento (substituir conteúdo real) |

### Formulários

| Componente | Quando usar |
|-----------|-------------|
| `Input` | Campo de texto simples |
| `Textarea` | Campo de texto longo |
| `Label` | Rótulo de campo — sempre usar `htmlFor` |
| `Select` | Seleção de uma opção numa lista fixa |
| `Checkbox` | Seleção múltipla ou booleanos |
| `RadioGroup` | Seleção exclusiva entre 2–5 opções |
| `Switch` | Toggle liga/desliga para configurações |

### Ações

| Componente | Quando usar |
|-----------|-------------|
| `Button` | Toda ação clicável. Variantes: `default` (azul), `secondary`, `outline`, `ghost`, `destructive`, `success`, `warning`, `info`, `link` |
| `DropdownMenu` | Menu de ações contextuais (3 pontos, "Mais opções") |

### Feedback e status

| Componente | Quando usar |
|-----------|-------------|
| `Badge` | Status, categorias, contadores. Variantes: `default`, `secondary`, `outline`, `destructive`, `success`, `warning`, `info` |
| `Progress` | Barras de progresso percentual |
| `Spinner` | Indicador de carregamento inline (dentro de botão ou área) |
| `Tooltip` | Dica ao passar o mouse em ícones ou botões sem texto |
| `Avatar` | Foto ou iniciais de usuário/corretor |

### Navegação

| Componente | Quando usar |
|-----------|-------------|
| `Tabs` + `TabsList` + `TabsTrigger` + `TabsContent` | Subseções dentro da mesma página |
| `Breadcrumb` | Trilha hierárquica em páginas de detalhe |
| `Sidebar` + partes | Apenas no layout do dashboard — não recriar em outros lugares |

### Sobreposições

| Componente | Quando usar |
|-----------|-------------|
| `Dialog` | Modais de confirmação, formulários em overlay |
| `Sheet` | Painéis laterais deslizantes (ex: sidebar mobile, filtros) |
| `Popover` | Pequenos painéis flutuantes ancorados a um elemento |

### Dados

| Componente | Quando usar |
|-----------|-------------|
| `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell` | Listagens em formato tabela |
| `Chart` | Gráficos com Recharts (bar, line, area, pie) — importar de `@/components/ui/chart` |

### Utilitários

| Componente | Quando usar |
|-----------|-------------|
| `Kbd` | Exibir atalhos de teclado na UI |
| `Sonner` | Toasts — usar via `import { toast } from "sonner"` |

---

## Padrão Base UI — `render` prop

Este projeto usa `@base-ui/react`, **NÃO Radix**. A composição é feita com `render`, não `asChild`.

```tsx
// ✅ CORRETO — Base UI
<Button render={<Link href="/painel" />}>
  Ir para o painel
</Button>

// ❌ ERRADO — Radix (não funciona neste projeto)
<Button asChild>
  <Link href="/painel">Ir para o painel</Link>
</Button>
```

```tsx
// ✅ Item de menu como link na sidebar
<SidebarMenuButton
  render={<Link href={item.href} />}
  isActive={ativo}
  tooltip={item.titulo}
  className={ativo ? "font-semibold text-sidebar-primary" : ""}
>
  <item.icone />
  <span>{item.titulo}</span>
</SidebarMenuButton>
```

---

## Estrutura padrão de uma página do dashboard

```tsx
export default function MinhaPagina() {
  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Título da Página</h1>
          <p className="text-sm text-muted-foreground">Subtítulo explicativo</p>
        </div>
        <Button>
          <Plus className="h-4 w-4" />
          Novo item
        </Button>
      </div>

      {/* Conteúdo */}
      <Card>
        <CardHeader>
          <CardTitle>Seção</CardTitle>
          <CardDescription>Descrição</CardDescription>
        </CardHeader>
        <CardContent>
          {/* conteúdo aqui */}
        </CardContent>
      </Card>
    </div>
  )
}
```

---

## MCP shadcn — como usar

O MCP `shadcn` está configurado em `.mcp.json`. Use para:
- Buscar exemplos de uso de qualquer componente
- Verificar props e variantes disponíveis
- Verificar compatibilidade com Base UI

Nas conversas, pedir: *"use o MCP shadcn para buscar exemplos de [componente]"*

---

## Checklist antes de entregar qualquer interface

- [ ] Funciona em **light mode**?
- [ ] Funciona em **dark mode**? (DevTools → emular `prefers-color-scheme: dark`)
- [ ] Funciona em **mobile** (390px)?
- [ ] Não há cores hardcoded (`#hex`, `rgb()`, `text-blue-500`)?
- [ ] Todos os componentes vêm de `src/components/ui/`?
- [ ] Ícones são do **Lucide React**?
- [ ] Textos secundários usam `text-muted-foreground`?
- [ ] Bordas usam `border-border`?
- [ ] Composição usa `render` prop (não `asChild`)?
- [ ] Badges de status usam as variantes semânticas do `Badge`?
