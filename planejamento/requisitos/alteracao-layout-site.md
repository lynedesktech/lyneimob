# Alteracao do Layout do Site Publico

Documento de referencia para reformulacao do site publico do LyneImob.
Baseado nas solicitacoes da Vitoria (Devix) em 30/03/2026, auditoria completa do site atual,
e analise do site da Lopes (lopes.com.br) como referencia de mercado.

---

## Diagnostico do Estado Atual

O site publico hoje funciona, mas tem uma estrutura generica que nao se diferencia.
Estes sao os pontos fracos identificados na auditoria:

**Busca e filtros:**
- A busca rapida no hero tem 3 campos simples (texto, tipo, finalidade) sem hierarquia visual
- A secao "Buscar por tipo de imovel" ocupa espaco com 10 cards de icone que nao agregam muito — o usuario ja pode filtrar por tipo na listagem
- Nao existe separacao clara entre Comprar e Alugar (a finalidade fica escondida num dropdown)
- Sem filtros avancados expandiveis (valor, area, dormitorios, vagas)

**Configuracao e personalizacao:**
- As cores sao escolhidas manualmente — o cliente precisa saber os codigos hex da marca dele
- Nao existe upload de favicon — todos os sites usam o favicon padrao do LyneImob
- Sem extracao automatica de cores da logo

**Referencia de mercado (Lopes):**
- Abas Comprar/Alugar no topo da busca — separacao clara de intencao
- Campo de busca unico com placeholder contextual
- Botao "Filtros" que expande painel com Valor, Area, Dormitorios, Vagas
- Cards com preco em destaque e CTA forte
- Design limpo com muito espaco em branco

---

## Plano de Execucao

Dividido em 3 entregas independentes, ordenadas por impacto e complexidade.

---

### Entrega 1 — Upload de Favicon (simples, rapido)

**Problema:** todos os sites publicos dos clientes mostram o favicon padrao do LyneImob na aba do navegador. Nao tem como personalizar.

**Solucao:** adicionar campo de upload de favicon na pagina "Meu Site" e aplicar no layout publico.

**Passo a passo:**

1. **Adicionar campo `favicon_url` no schema**
   - Arquivo: `src/types/configuracoes-site.ts`
   - Adicionar `favicon_url: z.string().nullable().default(null)` dentro do `schemaConfiguracoesSite` (no mesmo nivel de `cores`, `hero`, `sobre`)
   - Atualizar `configPadrao()` e `extrairConfiguracoes()` pra incluir o campo

2. **Suportar tipo `favicon` no upload**
   - Arquivo: `src/components/meu-site/upload-imagem-site.tsx`
   - Adicionar `"favicon"` ao union type do prop `tipo`
   - Aceitar tambem `.ico` e `.svg` alem de jpg/png/webp
   - Tamanho maximo menor (1MB em vez de 5MB)
   - Recomendacao visual: "32x32px, formato .ico, .png ou .svg"

3. **Adicionar upload na aba Logo do formulario**
   - Arquivo: `src/components/meu-site/formulario-configuracoes-site.tsx`
   - Na aba "identidade" (Logo), abaixo do upload da logo, adicionar:
     - Separador visual
     - Titulo "Favicon" com descricao "Icone que aparece na aba do navegador"
     - Componente `UploadImagemSite` com tipo="favicon"
   - Estado: novo `faviconUrl` (string | null) inicializado de `configs.favicon_url`
   - No submit, incluir `favicon_url` no JSON de configs

4. **Salvar favicon_url na action**
   - Arquivo: `src/actions/configuracoes-site.ts`
   - O campo ja vai vir dentro do JSON de `configuracoes` validado pelo Zod
   - Nenhuma mudanca extra na action (o schema valida e salva como JSONB)

5. **Aplicar favicon no layout publico**
   - Arquivo: `src/app/[slug]/layout.tsx`
   - Na funcao `generateMetadata`, verificar se `configs.favicon_url` existe
   - Se sim: `icons: { icon: configs.favicon_url, apple: configs.favicon_url }`
   - Se nao: manter o favicon padrao do LyneImob

**Arquivos alterados:** 4 arquivos
- `src/types/configuracoes-site.ts`
- `src/components/meu-site/upload-imagem-site.tsx`
- `src/components/meu-site/formulario-configuracoes-site.tsx`
- `src/app/[slug]/layout.tsx`

**Verificacao:** subir um favicon de teste na pagina "Meu Site", abrir o site publico, confirmar que a aba do navegador mostra o icone correto.

---

### Entrega 2 — Extracao Automatica de Cores da Logo (medio)

**Problema:** quando o cliente sobe a logo, ele precisa abrir outra ferramenta (como Adobe Colors) pra descobrir as cores da marca e digitar os hex manualmente. Isso e atrito desnecessario.

**Solucao:** ao subir a logo, extrair automaticamente as cores dominantes e sugerir como paleta do site. O cliente pode ajustar depois.

**Passo a passo:**

1. **Instalar biblioteca de extracao de cores**
   - Lib recomendada: `colorthief` (pacote `colorthief`, ~2KB, roda no browser)
   - Alternativa: `color-thief-browser` ou implementacao manual com Canvas API
   - Comando: `npm install colorthief`
   - Motivo: leve, sem dependencias server-side, funciona com Canvas API no browser

2. **Criar funcao utilitaria de extracao**
   - Novo arquivo: `src/lib/extrair-cores-imagem.ts`
   - Funcao: `extrairCoresDaImagem(imageUrl: string): Promise<{ primaria: string, destaque: string, heroFundo: string }>`
   - Logica:
     - Carregar imagem num elemento `<img>` temporario
     - Usar ColorThief para pegar a cor dominante (primaria)
     - Pegar paleta de 5 cores, escolher a segunda mais vibrante (destaque)
     - Para hero_fundo, escurecer a cor primaria (~30% mais escura)
   - Retornar as 3 cores em formato hex (#RRGGBB)

3. **Integrar no formulario apos upload da logo**
   - Arquivo: `src/components/meu-site/formulario-configuracoes-site.tsx`
   - Apos o `onUrlChange` do upload de logo:
     - Chamar `extrairCoresDaImagem(novaUrl)`
     - Mostrar dialog/toast: "Detectamos as cores da sua logo. Deseja aplicar como paleta do site?"
     - Se sim: atualizar `configs.cores` com as cores extraidas
     - Se nao: manter as cores atuais
   - Importante: nao sobrescrever automaticamente — sempre perguntar

4. **Exibir preview das cores sugeridas**
   - No dialog de confirmacao, mostrar:
     - A logo
     - As 3 cores extraidas com amostras visuais
     - Botao "Aplicar cores" e "Manter atuais"
   - Reusar o componente `PreviewCores` que ja existe

**Arquivos alterados:** 2 arquivos + 1 novo
- `src/lib/extrair-cores-imagem.ts` (novo)
- `src/components/meu-site/formulario-configuracoes-site.tsx`
- `package.json` (nova dependencia)

**Verificacao:** subir uma logo colorida, verificar que as cores sugeridas fazem sentido visual, aplicar e ver o preview mudar.

---

### Entrega 3 — Reformulacao da Busca e Filtros (complexa, maior impacto)

**Problema:** a busca atual e generica — um campo de texto, dois dropdowns e um grid de 10 icones que ocupa metade da tela. O usuario nao tem como filtrar por preco, area ou dormitorios sem ir pra pagina de listagem.

**Solucao:** substituir por um sistema de busca moderno inspirado na Lopes, com abas de intencao (Comprar/Alugar/Lotes), campo de busca unico e filtros expandiveis.

**Passo a passo:**

#### Fase A: Novo componente de busca no hero

1. **Criar componente `BuscaHeroModerna`**
   - Novo arquivo: `src/components/site/busca-hero-moderna.tsx` (client component)
   - Props: `slug: string`
   - Layout:
     ```
     [Abas: Comprar | Alugar | Lotes]
     ┌──────────────────────────────────────────────┐
     │ 🔍 Busque por regiao ou empreendimento...    │ [Buscar] [Filtros ▼]
     └──────────────────────────────────────────────┘
     [Painel de filtros expandivel - oculto por padrao]
     ```

   - **Abas** (3):
     - "Comprar" → finalidade = "venda"
     - "Alugar" → finalidade = "aluguel"
     - "Lotes" → redireciona para `/${slug}/loteamentos`
   - Aba ativa: cor `--site-primaria` com borda inferior
   - Estado: `abaAtiva: "comprar" | "alugar" | "lotes"`

   - **Campo de busca:**
     - Input unico com icone de lupa
     - Placeholder contextual: "Busque imoveis para comprar..." ou "...para alugar..."
     - Sem debounce (submit por botao)

   - **Botao Buscar:**
     - Cor de destaque (`--site-destaque` ou `--site-primaria`)
     - Ao clicar: monta URL `/${slug}/imoveis?finalidade={aba}&busca={texto}` + filtros
     - Para aba "Lotes": `/${slug}/loteamentos?busca={texto}`

   - **Botao Filtros:**
     - Texto "Filtros" com icone chevron
     - Toggle do painel expansivel abaixo

2. **Painel de filtros expandivel**
   - Dentro do mesmo componente, controlado por estado `filtrosAbertos: boolean`
   - Animacao: slide down suave (CSS transition ou framer-motion)
   - Layout: grid de 4 colunas em desktop, 2 em mobile
   - Campos:
     - **Valor**: dois inputs lado a lado (min / max) com mascara monetaria
     - **Area**: dois inputs (min / max) em m²
     - **Dormitorios**: botoes 1 | 2 | 3 | 4+ (toggle, pode selecionar multiplos)
     - **Vagas**: botoes 1 | 2 | 3 | 4+ (toggle)
   - Botao "Limpar filtros" para resetar tudo
   - Os filtros sao incluidos na URL ao clicar "Buscar"

3. **Integrar no hero**
   - Arquivo: `src/components/site/secao-hero.tsx`
   - Remover referencia ao `BuscaRapidaHero` antigo
   - Adicionar `BuscaHeroModerna` posicionado na parte inferior do hero
   - Estilo: card semi-transparente com backdrop-blur sobre a imagem/cor de fundo
   - Responsivo: em mobile, card ocupa largura total abaixo do titulo

#### Fase B: Remover secao de tipos

4. **Remover secao "Buscar por tipo de imovel" da home**
   - Arquivo: `src/app/[slug]/page.tsx`
   - Remover import e render de `SecaoBuscarPorTipo`
   - O componente `src/components/site/secao-buscar-por-tipo.tsx` pode ser deletado
   - A home fica: Hero → Imoveis em destaque → Loteamentos → Estatisticas → Sobre → CTA

5. **Remover `busca-rapida-hero.tsx` antigo**
   - Arquivo pode ser deletado apos a integracao do novo componente

#### Fase C: Adaptar pagina de listagem

6. **Atualizar filtros na pagina de listagem**
   - Arquivo: `src/components/site/filtros-imoveis-publico.tsx`
   - Adicionar campos que faltam: preco_min, preco_max, area_min, area_max, vagas
   - Manter compatibilidade com os searchParams que ja existem
   - Layout: barra horizontal com os filtros mais usados + botao "Mais filtros"

7. **Suportar novos filtros no data fetching**
   - Arquivo: `src/lib/site/buscar-dados-site.ts`
   - Na funcao `buscarImoveisPublicos`, adicionar suporte a:
     - `area_min` / `area_max` → filtro em `area_total`
     - `vagas` → filtro `gte` em `vagas`
   - Esses campos ja existem na tabela `imoveis`, so falta o filtro na query

**Arquivos alterados:** 5 arquivos + 1 novo + 2 deletados
- `src/components/site/busca-hero-moderna.tsx` (novo)
- `src/components/site/secao-hero.tsx` (trocar busca)
- `src/app/[slug]/page.tsx` (remover secao tipos)
- `src/components/site/filtros-imoveis-publico.tsx` (adicionar filtros)
- `src/lib/site/buscar-dados-site.ts` (suportar novos filtros)
- `src/components/site/busca-rapida-hero.tsx` (deletar)
- `src/components/site/secao-buscar-por-tipo.tsx` (deletar)

**Verificacao:**
- Abrir site publico, ver abas Comprar/Alugar/Lotes no hero
- Clicar "Filtros", ver painel expandir com Valor/Area/Dormitorios/Vagas
- Buscar com filtros, confirmar que a listagem filtra corretamente
- Testar em mobile: filtros devem empilhar verticalmente
- Confirmar que a secao de tipos nao aparece mais

---

## Resumo Geral

| Entrega | Complexidade | Arquivos | Dependencia |
|---------|-------------|----------|-------------|
| 1. Favicon | Simples | 4 alterados | Nenhuma |
| 2. Cores da logo | Media | 2 alterados + 1 novo | `colorthief` |
| 3. Busca moderna | Complexa | 5 alterados + 1 novo + 2 deletados | Nenhuma |

**Ordem recomendada:** 1 → 2 → 3 (do mais simples ao mais complexo, cada entrega e independente)

**Total de arquivos impactados:** 12 (7 alterados, 2 novos, 2 deletados, 1 package.json)

---

## Boas Praticas Identificadas na Auditoria

Pontos que devem ser respeitados durante a implementacao:

1. **Todas as cores via CSS variables** — nunca hardcodar hex. Usar `var(--site-primaria)`, `var(--site-destaque)`, `var(--site-hero-fundo)`. Excecao unica: WhatsApp (#25D366)

2. **Componentes client-side com "use client"** — busca e filtros usam estado local, precisam ser client components. Manter server components pra tudo que nao precisa de interatividade

3. **Navegacao via URL params** — o padrao atual (e correto) e montar searchParams e navegar via `router.push()`. Os filtros novos devem seguir o mesmo padrao

4. **Responsividade mobile-first** — o site ja usa breakpoints sm/md/lg. Os novos componentes devem seguir a mesma logica (empilhar em mobile, lado a lado em desktop)

5. **Animacoes com Framer Motion** — o site usa `AnimacaoScroll` (framer-motion). Usar a mesma lib pra animar o painel de filtros expandivel

6. **Validacao Zod em tudo** — qualquer campo novo no schema de configuracao precisa de validacao Zod com default. A funcao `extrairConfiguracoes()` faz merge com defaults, entao campos novos sao retrocompativeis

7. **Upload no bucket `site-assets`** — path padrao: `{org_id}/{tipo}.{ext}`. Favicon segue o mesmo padrao

8. **Metadata dinamica** — o layout do site publico ja usa `generateMetadata`. O favicon entra ai naturalmente

9. **Nao quebrar sites existentes** — todas as mudancas devem ter fallback. Se o cliente nao subiu favicon, usa o padrao. Se nao extraiu cores, mantem as que ele ja tinha. Se nao expandiu filtros, busca funciona igual
