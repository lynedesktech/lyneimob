# Requisitos — Domínio Customizado por Imobiliária

## O que é

Permitir que cada imobiliária configure seu próprio domínio (ex: `www.imobiliariaxyz.com.br`) para o site público, em vez de acessar apenas via slug (`app.com/slug-da-imobiliaria`).

Hoje o site público funciona 100% por slug na URL. Com essa feature, a imobiliária vai poder usar seu domínio próprio como "fachada" — os visitantes acessam `www.imobiliariaxyz.com.br` e veem o site da imobiliária normalmente, sem saber que por trás roda o LyneImob.

O slug continua funcionando como fallback. O domínio customizado é um bônus — quem não configurar, segue usando o slug normalmente.

---

## O que NÃO faz (fora do escopo)

- **Não registra domínios** — a imobiliária compra o domínio por conta própria
- **Não gerencia DNS** — a imobiliária configura o CNAME/A record no provedor dela
- **Não emite SSL manualmente** — isso é responsabilidade da plataforma de deploy (Vercel, Cloudflare, etc.)
- **Não altera o dashboard** — o CRM/dashboard continua acessível apenas pela URL principal da aplicação
- **Não cria subdomínios automaticamente** — é apenas domínio customizado apontado manualmente

---

## Como funciona (fluxo do usuário)

1. Imobiliária acessa **Meu Site** no dashboard
2. Na nova aba "Domínio", digita o domínio desejado (ex: `www.imobiliariaxyz.com.br`)
3. O sistema mostra as instruções de DNS: "Aponte um registro CNAME para `cname.lyneimob.com.br`"
4. A imobiliária configura o DNS no provedor dela
5. O sistema verifica automaticamente se o DNS foi configurado corretamente
6. Quando verificado → domínio fica ativo e o site passa a funcionar no domínio customizado
7. Se o DNS não bater → mostra status "Aguardando configuração de DNS"

---

## Arquivos a criar

### 1. Migration: `supabase/migrations/013_dominios_customizados.sql`

**Responsabilidade**: criar tabela `dominios_customizados` e índices.

**Estrutura esperada**:
```sql
CREATE TABLE public.dominios_customizados (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organizacao_id uuid NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
  dominio text UNIQUE NOT NULL,          -- ex: "www.imobiliariaxyz.com.br"
  status text DEFAULT 'pendente'         -- 'pendente' | 'verificado' | 'erro'
    CHECK (status IN ('pendente', 'verificado', 'erro')),
  verificado_em timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índice para busca rápida por domínio (usado no middleware)
CREATE UNIQUE INDEX idx_dominios_dominio ON public.dominios_customizados(dominio);
CREATE INDEX idx_dominios_org ON public.dominios_customizados(organizacao_id);

-- RLS
ALTER TABLE public.dominios_customizados ENABLE ROW LEVEL SECURITY;

-- Policies: mesma lógica das outras tabelas (usuário vê só da org dele)
-- IMPORTANTE: precisa de policy pública para SELECT por domínio (middleware precisa ler sem auth)
```

**Ponto de atenção**: o middleware precisa consultar essa tabela SEM autenticação (visitante público acessando pelo domínio). Então precisa de uma policy de SELECT pública ou usar o cliente admin (service role).

### 2. Tipos: `src/types/dominios.ts`

**Responsabilidade**: tipos TypeScript do domínio customizado.

**Estrutura esperada**:
```typescript
export type StatusDominio = 'pendente' | 'verificado' | 'erro'

export type DominioCustomizado = {
  id: string
  organizacao_id: string
  dominio: string
  status: StatusDominio
  verificado_em: string | null
  created_at: string
  updated_at: string
}
```

### 3. Server Action: `src/actions/dominios.ts`

**Responsabilidade**: CRUD do domínio customizado + verificação de DNS.

**Funções**:
- `salvarDominio(formData)` — salva ou atualiza o domínio da organização
- `verificarDns(formData)` — verifica se o CNAME está apontando corretamente
- `removerDominio(formData)` — remove o domínio customizado

**Lógica da verificação de DNS**:
- Usar `dns.resolve` do Node.js para verificar CNAME
- Verificar se o CNAME aponta para o domínio esperado (ex: `cname.lyneimob.com.br`)
- Se verificado → atualizar status para `verificado`
- Se não → manter `pendente` ou `erro`

### 4. Componente: `src/components/meu-site/configuracao-dominio.tsx`

**Responsabilidade**: UI da aba "Domínio" dentro de Meu Site.

**Estrutura esperada**:
- Input para o domínio
- Instruções de configuração de DNS (CNAME)
- Botão "Verificar DNS"
- Badge com status (pendente / verificado / erro)
- Botão "Remover domínio"

---

## Arquivos a modificar

### 5. `src/lib/supabase/middleware.ts` (CRÍTICO)

**O que muda**: antes de verificar se é rota protegida ou auth, o middleware precisa detectar se o request vem de um domínio customizado.

**Lógica nova**:
```
1. Pegar o hostname do request (request.headers.get('host'))
2. Se hostname === domínio principal da app (NEXT_PUBLIC_APP_URL) → fluxo normal (como é hoje)
3. Se hostname !== domínio principal → buscar na tabela dominios_customizados
   a. Se encontrou e status === 'verificado' → é site público, reescrever a URL para /{slug} internamente
   b. Se não encontrou → 404 ou redirect para domínio principal
```

**Ponto de atenção**: essa consulta ao banco acontece em TODA requisição de domínio customizado. Precisa ser rápida. Considerar cache em memória ou header-based cache.

### 6. `src/lib/site/buscar-dados-site.ts`

**O que muda**: adicionar função `buscarOrganizacaoPorDominio(dominio)` — busca a organização pelo domínio customizado em vez do slug.

### 7. `src/components/meu-site/formulario-configuracoes-site.tsx`

**O que muda**: adicionar a tab "Domínio" ao componente de Tabs existente, renderizando o novo componente `ConfiguracaoDominio`.

### 8. `src/app/(dashboard)/meu-site/page.tsx`

**O que muda**: buscar o domínio customizado da organização (se houver) e passar como prop para o formulário.

### 9. `next.config.ts`

**O que muda**: dependendo da abordagem, pode precisar de configuração de `allowedDevOrigins` ou `images.remotePatterns` para os domínios customizados. Porém, como os domínios são dinâmicos, a abordagem principal será via middleware (rewrite), não via config estática.

### 10. `src/types/database.ts`

**O que muda**: adicionar tipo `DominioCustomizado` à tipagem do banco (ou importar de `dominios.ts`).

### 11. Componentes do site público que usam slug em links

**Impacto mapeado** — esses componentes geram links com `/${slug}/...`:

| Componente | Arquivo | Links afetados |
|---|---|---|
| HeaderSite | `src/components/site/header-site.tsx` | `/`, `/imoveis`, `/sobre`, `/contato` |
| SecaoHero | `src/components/site/secao-hero.tsx` | `/imoveis`, `/contato` |
| CardImovelPublico | `src/components/site/card-imovel-publico.tsx` | `/imoveis/{id}` |
| PaginacaoSite | `src/components/site/paginacao-site.tsx` | `/imoveis?page=...` |
| FiltrosImoveisPublico | `src/components/site/filtros-imoveis-publico.tsx` | `/imoveis?filtros=...` |
| HomePage | `src/app/[slug]/page.tsx` | `/imoveis` |
| DetalheImovel | `src/app/[slug]/imoveis/[id]/page.tsx` | `/imoveis`, `/contato?imovel=...` |

**Solução**: quando o acesso vier via domínio customizado, os links internos NÃO precisam do prefixo `/{slug}` — basta usar `/imoveis`, `/contato`, etc. O middleware já faz o rewrite internamente.

**Abordagem**: criar um helper `gerarLinkSite(slug: string, caminho: string)` que retorna:
- Se acessado via domínio customizado → `/{caminho}` (sem slug)
- Se acessado via slug na URL → `/{slug}/{caminho}` (como é hoje)

Alternativa mais simples: como o middleware faz rewrite de `dominio.com/imoveis` para `/slug/imoveis` internamente, os links podem continuar usando `/{slug}/...` e o Next.js resolve. **Porém**, isso faz o slug aparecer na URL do visitante, o que é ruim.

**Decisão recomendada**: usar links relativos nos componentes do site. Em vez de `/${slug}/imoveis`, usar `/imoveis` quando detectar que estamos num domínio customizado. Isso exige passar um contexto (prop ou context API) pelos componentes.

### 12. `src/app/api/xml/[slug]/route.ts`

**O que muda**: o `DetailViewUrl` gerado no XML usa `appUrl/slug/imoveis/id`. Se a organização tem domínio customizado, deveria usar `https://dominio-customizado/imoveis/id`. Precisa verificar e priorizar o domínio customizado quando existir.

### 13. `src/lib/xml/vrsync.ts`

**O que muda**: a função `gerarFeedXml` recebe `appUrl` e monta links com slug. Se houver domínio customizado, precisa montar links sem slug, usando o domínio customizado como base.

---

## Ordem de implementação

1. **Migration** (013) — criar tabela `dominios_customizados` com RLS e policies
2. **Tipos** — `src/types/dominios.ts`
3. **Atualizar `database.ts`** — adicionar tipo
4. **Função de busca** — `buscarOrganizacaoPorDominio` em `buscar-dados-site.ts`
5. **Middleware** — lógica de detecção de hostname e rewrite
6. **Server Action** — `src/actions/dominios.ts` (salvar, verificar DNS, remover)
7. **Componente UI** — `configuracao-dominio.tsx`
8. **Integrar na página Meu Site** — nova tab "Domínio" no formulário
9. **Adaptar links do site público** — helper para gerar links corretos
10. **Adaptar XML feed** — usar domínio customizado quando disponível
11. **Testar fluxo completo**

---

## Riscos e pontos de atenção

### Performance do middleware
O middleware roda em TODA requisição. Buscar no banco a cada request de domínio customizado pode ser lento. Opções:
- **Cache em memória** (Map com TTL de 5 min) — mais simples, funciona bem para poucos domínios
- **Edge Config / KV** (Vercel) — ideal para produção
- **Header cache** (Cache-Control no Supabase) — limitado

**Recomendação**: começar com cache em memória simples. Se escalar, migrar para edge KV.

### SSL/Certificados
O LyneImob vai rodar na **Vercel**? Se sim, a Vercel tem suporte nativo a custom domains via API — ela emite SSL automaticamente via Let's Encrypt. Se não for Vercel, precisa definir onde o SSL será gerenciado.

**Recomendação**: assumir deploy na Vercel por enquanto. Adicionar domínios via Vercel API automaticamente quando o DNS for verificado.

### DNS propagation
DNS pode levar até 48h para propagar. O usuário vai clicar "Verificar" e pode não funcionar de primeira. Precisa de:
- Mensagem clara explicando que DNS pode demorar
- Botão para re-verificar manualmente
- Opcionalmente: verificação automática periódica (cron ou webhook)

### Supabase Auth
Se alguém acessar o dashboard pelo domínio customizado (não deveria, mas pode tentar), o auth callback pode falhar porque o domínio não está na lista de redirect URLs do Supabase. **Solução**: o middleware já impede isso — domínio customizado SEMPRE serve apenas o site público, nunca o dashboard.

### Links compartilhados e SEO
Se a imobiliária ativar domínio customizado, os links antigos com slug (`app.com/slug/imoveis`) devem:
- Continuar funcionando (backward compatibility)
- Idealmente, redirecionar 301 para o domínio customizado (SEO)

---

## Checklist de validação

- [ ] Tabela `dominios_customizados` criada com RLS e policies corretas
- [ ] Domínio salvo com validação (formato válido, único, sem duplicata)
- [ ] Verificação de DNS funciona (CNAME detectado corretamente)
- [ ] Middleware detecta hostname e rewrite para slug correto
- [ ] Site público acessível via domínio customizado
- [ ] Links internos do site NÃO mostram slug quando acessado via domínio
- [ ] Links internos do site MOSTRAM slug quando acessado via URL padrão
- [ ] Feed XML usa domínio customizado quando disponível
- [ ] Slug continua funcionando como fallback (sem domínio configurado)
- [ ] Dashboard NÃO é acessível via domínio customizado
- [ ] UI de configuração funcional (salvar, verificar, remover)
- [ ] Status visual claro (pendente / verificado / erro)
- [ ] Cache no middleware evita query a cada request

---

## Variáveis de ambiente novas

Nenhuma obrigatória. Opcionais:
- `DOMINIO_PRINCIPAL` — domínio principal da app (se diferente de NEXT_PUBLIC_APP_URL). Usado pelo middleware para distinguir requests do domínio principal vs customizado.

Na prática, podemos extrair o hostname de `NEXT_PUBLIC_APP_URL` existente.
