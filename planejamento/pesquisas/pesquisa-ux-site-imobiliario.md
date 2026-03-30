# Pesquisa: UX/UI para Sites Imobiliarios Modernos

**Data**: 30/03/2026
**Escopo**: Hero section, busca, extracao de cores, favicon dinamico, filtros, performance

---

## 1. O Que Ja Existe no Projeto

### Site Publico (rota `[slug]`)

O LyneImob ja tem um site publico funcional em `src/app/[slug]/` com:

- **Hero section** (`src/components/site/secao-hero.tsx`) — titulo dinamico com `{empresa}`, subtitulo, imagem de fundo opcional com overlay, dois CTAs (ver imoveis + fale conosco)
- **Busca rapida** (`src/components/site/busca-rapida-hero.tsx`) — formulario com campo de texto (bairro/cidade), select de tipo, select de finalidade, botao buscar. Layout pill/rounded no hero
- **Filtros da listagem** (`src/components/site/filtros-imoveis-publico.tsx`) — busca por texto com debounce (500ms), tipo, finalidade, quartos. Usa shadcn Select
- **Cards de imoveis** (`src/components/site/card-imovel-publico.tsx`) — foto com Next.js Image, badge de finalidade, titulo, preco, localizacao, quartos/banheiros/vagas/area
- **Header** (`src/components/site/header-site.tsx`) — logo ou nome, nav desktop, menu hamburger mobile com Sheet
- **Layout** (`src/app/[slug]/layout.tsx`) — CSS variables `--site-primaria`, `--site-destaque`, `--site-hero-fundo` aplicadas por tenant
- **Configuracoes** (`src/types/configuracoes-site.ts`) — schema Zod com cores (primaria, destaque, hero_fundo), hero (titulo, subtitulo, imagem), sobre (historia, missao, visao, valores)

### O que NAO existe ainda

- Abas compra/aluguel na busca do hero
- Autocomplete de localizacao
- Filtros expandiveis (preco, area, banheiros, vagas)
- Favicon dinamico por tenant
- Extracao automatica de cores do logo
- Skeleton loading nos cards
- Lazy loading otimizado (alem do nativo do Next.js Image)

---

## 2. Hero Section e Busca — Referencia dos Maiores Sites

### Padrao identificado nos sites brasileiros

**QuintoAndar** (referencia principal de UX):
- Abas "Alugar" / "Comprar" no topo da busca
- Campos: Cidade, Bairro, Valor maximo (range predefinido), Quartos (1+, 2+, 3+, 4+)
- Botao "Buscar imoveis" como CTA principal
- Links rapidos abaixo: apartamentos por quartos, casas, studios, mobiliados

**Lopes** (busca mais completa):
- Abas "Compra" / "Aluguel" com destaque visual na aba ativa (cor + borda inferior)
- Campo de localizacao com autocomplete e dropdown de sugestoes (chips "NOVO", "LUGAR")
- Filtros adicionais: faixa de preco (range), tipo de imovel (checkboxes multi-selecao)
- Botao de busca principal + botao "Limpar filtros"
- Layout responsivo: expandido em desktop, empilhado em mobile

**VivaReal / ZapImoveis** (mesmo grupo OLX):
- Tipo de transacao > Tipo de imovel > Localizacao (fluxo sequencial)
- Filtros pos-busca: preco, quartos, area util

### Recomendacao para o LyneImob

A busca do hero deve ter:

1. **Abas Compra / Aluguel** — toggle ou tabs no topo do formulario de busca (como QuintoAndar/Lopes)
2. **Campo de localizacao principal** — input de texto com placeholder "Bairro, cidade..." (ja existe, manter)
3. **Tipo de imovel** — select dropdown (ja existe, manter)
4. **Botao buscar** — destaque visual (ja existe, manter)
5. **Filtros avancados** — nao no hero, mas na pagina de listagem (`/imoveis`)

O hero deve ser simples e rapido. Filtros avancados ficam na listagem.

---

## 3. Extracao de Cores do Logo — Bibliotecas JavaScript

### Comparativo

| Biblioteca | Versao | Tamanho | Ultima atualizacao | Web Worker | TypeScript | Recomendacao |
|---|---|---|---|---|---|---|
| **colorthief** (v3) | 3.3.1 | ~1.48 MB (total) | Mar 2026 | Sim | Sim (nativo) | Mais completa, API moderna |
| **color-thief** (v2) | 2.2.5 | ~466 KB | 7 anos atras | Nao | Nao | Legado, nao usar |
| **color-thief-browser** | 2.0.2 | pequeno | 9 anos atras | Nao | Nao | Abandonado |
| **node-vibrant** | 4.0.4 | medio | Mar 2026 | Sim | Sim | Boa alternativa |
| **@yaredfall/color-thief-ts** | 1.1.4 | ~30.5 KB | recente | Nao | Sim | Mais leve |

### Analise detalhada

**colorthief v3** (recomendado para projetos robustos):
- Rewrite completo em TypeScript (marco 2026)
- API: `getColor()`, `getPalette()`, `getSwatches()` — sincrono e async
- Swatches semanticos: Vibrant, Muted, DarkVibrant, DarkMuted, LightVibrant, LightMuted
- Quantizacao OKLCH (perceptualmente uniforme)
- Suporte a Web Workers para nao travar a UI
- Objetos Color com `.hex()`, `.hsl()`, `.oklch()`, `.css()`, contraste WCAG, `isDark`, `textColor`
- Problema: bundle grande (~1.48 MB total no npm, mas tree-shakeable)

**node-vibrant v4** (boa alternativa):
- Import separado: `node-vibrant/browser` para browser
- Suporte a Web Workers
- API: `Vibrant.from(url).getPalette()`
- Swatches: Vibrant, Muted, DarkVibrant, DarkMuted, LightVibrant, LightMuted
- Ativamente mantido

**@yaredfall/color-thief-ts** (melhor para minimalismo):
- Apenas ~30.5 KB
- TypeScript nativo
- API simples
- Sem Web Workers

### Recomendacao para o LyneImob

**Usar `colorthief` v3** como primeira opcao. Motivos:
- API semantica (swatches) permite extrair automaticamente cor primaria, cor de destaque, cor de fundo
- Contraste WCAG embutido garante acessibilidade das cores extraidas
- `isDark` e `textColor` ajudam a decidir cor de texto sobre fundo
- TypeScript nativo, compativel com o projeto

**Alternativa leve**: `@yaredfall/color-thief-ts` se o bundle size for critico. Porem, nao tem swatches semanticos — seria necessario logica manual para classificar as cores.

### Fluxo proposto de extracao

1. Corretor faz upload do logo na configuracao da empresa
2. Client-side: carregar logo num `<canvas>` oculto
3. Extrair paleta com `colorthief.getSwatches(canvas)`
4. Mapear: `Vibrant` -> cor destaque, `DarkVibrant` -> cor primaria, `DarkMuted` -> hero fundo
5. Sugerir cores ao usuario (preview em tempo real)
6. Usuario aceita ou ajusta manualmente
7. Salvar no banco em `configuracoes_site.cores`

---

## 4. Favicon Dinamico por Tenant — Next.js App Router

### Como funciona no Next.js 16

O App Router permite criar um arquivo `icon.tsx` (ou `icon.js`) dentro de qualquer segmento de rota. Esse arquivo funciona como um Route Handler que gera a imagem do icone dinamicamente.

### Implementacao recomendada

Criar `src/app/[slug]/icon.tsx`:

```tsx
import { ImageResponse } from 'next/og'
import { buscarOrganizacaoPorSlug } from '@/lib/site/buscar-dados-site'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default async function Icon({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const org = await buscarOrganizacaoPorSlug(slug)

  if (!org) {
    // Favicon padrao com letra "L"
    return new ImageResponse(
      <div style={{ /* ... */ }}>L</div>,
      { ...size }
    )
  }

  // Opcao 1: Se tem logo, fazer fetch e usar como favicon
  // Opcao 2: Gerar favicon com iniciais + cor primaria do tenant
  const configs = /* extrair cores */
  const iniciais = org.nome.slice(0, 2).toUpperCase()

  return new ImageResponse(
    <div style={{
      background: configs.cores.primaria,
      color: 'white',
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 18,
      fontWeight: 'bold',
      borderRadius: 4,
    }}>
      {iniciais}
    </div>,
    { ...size }
  )
}
```

### Pontos importantes

- O arquivo `icon.tsx` dentro de `[slug]/` recebe `params` com o slug do tenant
- E cacheado por padrao (bom para performance)
- Nao e possivel gerar `favicon.ico` dinamicamente — usar `icon.tsx` que gera `<link rel="icon">`
- Alternativa: se o tenant tem logo, fazer fetch da imagem e retornar como Response com o content-type correto
- Para apple-icon, criar `apple-icon.tsx` no mesmo diretorio

### Estrategia de fallback

1. Se tenant tem `logo_url` → fazer fetch do logo e redimensionar para 32x32
2. Se nao tem logo → gerar icone com iniciais do nome + cor primaria
3. Fallback global: favicon padrao do LyneImob em `src/app/favicon.ico`

---

## 5. Filtros de Busca Imobiliaria

### Filtros essenciais (devem estar sempre visiveis)

| Filtro | Tipo de UI | Justificativa |
|---|---|---|
| Busca por texto | Input com icone | Bairro, cidade, codigo — mais usado |
| Tipo de imovel | Select/dropdown | Casa, apartamento, terreno, sala, etc |
| Finalidade | Tabs ou select | Compra, aluguel, ambos |
| Quartos | Select ou botoes | 1+, 2+, 3+, 4+ |

### Filtros opcionais (expandiveis, "Mais filtros")

| Filtro | Tipo de UI | Justificativa |
|---|---|---|
| Faixa de preco | Range duplo (min-max) ou dois inputs | Muito usado mas ocupa espaco |
| Banheiros | Select | 1+, 2+, 3+ |
| Vagas garagem | Select | 1+, 2+, 3+ |
| Area (m2) | Range ou dois inputs | Util para terrenos |
| Bairro | Select/multi-select | Se busca por texto nao for suficiente |
| Aceita pets | Toggle | Relevante para aluguel |
| Mobiliado | Toggle | Relevante para aluguel |

### Padroes de UX para filtros

**Desktop**: filtros em linha horizontal acima dos resultados. "Mais filtros" expande painel abaixo ou lateral.

**Mobile**:
- Filtros essenciais visiveis (tipo + finalidade como pills horizontais com scroll)
- Botao "Filtros" abre Sheet/Drawer de tela cheia com todos os filtros
- Botao "Aplicar filtros" fixo no rodape do drawer
- Badge com contagem de filtros ativos no botao

**Feedback em tempo real**:
- Atualizar resultados conforme filtros mudam (com debounce no texto, imediato nos selects)
- Mostrar contagem de resultados: "32 imoveis encontrados"
- Botao "Limpar filtros" quando ha filtros ativos

### O que ja existe no projeto

O `FiltrosImoveisPublico` ja tem: busca com debounce (500ms), tipo, finalidade e quartos. Falta:
- Faixa de preco
- Area
- Banheiros / vagas
- Layout mobile otimizado (Sheet com filtros completos)
- Badge de filtros ativos
- Botao limpar filtros

---

## 6. Performance — Lazy Loading, Skeleton, Debounce

### Lazy Loading de Imagens

**O que ja existe**:
- Next.js `Image` com `loading` lazy por padrao (exceto hero com `priority`)
- `sizes` prop configurado nos cards para responsive

**O que pode melhorar**:
- Blur placeholder: usar `placeholder="blur"` com `blurDataURL` (base64 pequeno) nos cards de imoveis
- LQIP (Low Quality Image Placeholder): gerar thumbnails pequenos no upload e usar como blurDataURL

### Skeleton Loading

**O que NAO existe**: nenhum skeleton no site publico.

**Recomendacao**:
- Usar o componente `Skeleton` do shadcn/ui (ja instalado no projeto como parte do design system)
- Criar `CardImovelSkeleton` que replica a estrutura do `CardImovelPublico` com blocos animados
- Usar `Suspense` do React com fallback de skeleton na listagem
- Skeleton no hero durante carregamento inicial nao e necessario (Server Component, renderiza no servidor)

**Estrutura do CardImovelSkeleton**:
```
┌─────────────────────┐
│   [imagem skeleton]  │  aspect-video, bg-muted animate-pulse
│                      │
├─────────────────────┤
│ ████████████         │  titulo
│ ████████             │  tipo + codigo
│                      │
│ ██████████           │  preco
│ █████████████        │  localizacao
│ ████ ██ ██ ████      │  quartos/banheiros/vagas/area
└─────────────────────┘
```

### Debounce na Busca

**O que ja existe**: debounce de 500ms no `FiltrosImoveisPublico` usando `setTimeout`/`clearTimeout` com `useRef`.

**O que pode melhorar**:
- 500ms e bom, mas 300ms pode ser mais responsivo sem sobrecarregar
- Considerar `useDeferredValue` do React 19 como alternativa moderna ao debounce manual
- Adicionar debounce tambem na `BuscaRapidaHero` (hoje nao tem, mas la o usuario clica "Buscar")

### Otimizacoes adicionais

- **Intersection Observer para animacoes**: o `AnimacaoScroll` ja existe e provavelmente usa isso
- **Prefetch de paginas**: Next.js Link ja faz prefetch automatico
- **Paginacao vs. Infinite scroll**: o projeto usa paginacao tradicional (bom para SEO). Manter.

---

## 7. Resumo de Recomendacoes

### Prioridade alta (impacto grande, esforco medio)

1. **Abas Compra/Aluguel no hero** — melhora UX da busca principal
2. **Favicon dinamico por tenant** — criar `src/app/[slug]/icon.tsx`
3. **Skeleton loading nos cards** — criar `CardImovelSkeleton` com shadcn Skeleton

### Prioridade media (impacto medio, esforco medio)

4. **Filtros expandiveis na listagem** — preco, banheiros, vagas, area
5. **Layout mobile para filtros** — Sheet com filtros completos + badge de ativos
6. **Blur placeholder nas imagens** — `placeholder="blur"` nos cards

### Prioridade baixa (impacto alto, esforco alto)

7. **Extracao automatica de cores do logo** — instalar `colorthief` v3, criar fluxo de sugestao
8. **Autocomplete de localizacao** — requer indexacao de bairros/cidades dos imoveis cadastrados

---

## 8. Bibliotecas Sugeridas

| Biblioteca | Versao | Uso | Ja instalada? |
|---|---|---|---|
| `colorthief` | ^3.3.1 | Extracao de cores do logo | Nao |
| `next/og` (ImageResponse) | built-in Next.js 16 | Favicon dinamico | Sim (nativa) |
| Skeleton (shadcn/ui) | built-in | Skeleton loading | Verificar se instalado |
| `react-day-picker` | ^9.14.0 | Ja no projeto | Sim |
| `framer-motion` | ^12.38.0 | Animacoes (ja usado) | Sim |

Nao e necessario instalar bibliotecas novas para a maioria das melhorias. A unica dependencia nova seria `colorthief` para extracao de cores.

---

## Fontes Consultadas

- [Color Thief v3](https://lokeshdhakar.com/projects/color-thief/)
- [node-vibrant](https://github.com/Vibrant-Colors/node-vibrant)
- [Next.js App Icons (icon.tsx)](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/app-icons)
- [Next.js generateMetadata](https://nextjs.org/docs/app/api-reference/functions/generate-metadata)
- [Next.js Multi-Tenant Guide](https://nextjs.org/docs/app/guides/multi-tenant)
- [Lopes.com.br](https://www.lopes.com.br/) — referencia de busca com autocomplete e abas
- [QuintoAndar.com.br](https://www.quintoandar.com.br/) — referencia de hero section e filtros
- [Filter UI Design Best Practices](https://www.insaim.design/blog/filter-ui-design-best-ux-practices-and-examples)
- [Real Estate UI/UX Best Practices](https://dcastalia.com/blog/real-estate-website-ui-ux-development/)
- [Enterprise Filtering UX Patterns](https://www.pencilandpaper.io/articles/ux-pattern-analysis-enterprise-filtering)
