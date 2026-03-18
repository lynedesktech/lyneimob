# Requisito — Módulo de Loteamentos

> Gerado em 2026-03-18
> Baseado em: pesquisa-loteamentos.md + CSV vendas-reserva-mar.csv
> Status: aguardando implementação

---

## Visão geral

Criar um módulo dedicado `/loteamentos/` no LyneImob. O módulo permite cadastrar loteamentos (empreendimentos de lotes) e gerenciar cada lote individualmente — quadra, número, valor, status, comprador. Inclui importação CSV, galeria de fotos, descrição com IA e exibição no site público.

---

## 1. Banco de dados

### Migration: `supabase/migrations/026_loteamentos.sql`

#### Tabela `loteamentos`

```sql
CREATE TABLE public.loteamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id UUID NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  descricao_ia TEXT,
  status TEXT NOT NULL DEFAULT 'em_vendas'
    CHECK (status IN ('lancamento', 'em_vendas', 'esgotado')),
  cep TEXT,
  logradouro TEXT,
  numero TEXT,
  complemento TEXT,
  bairro TEXT,
  cidade TEXT NOT NULL,
  estado CHAR(2) NOT NULL,
  total_lotes INTEGER NOT NULL DEFAULT 0,
  lotes_disponiveis INTEGER NOT NULL DEFAULT 0,
  lotes_vendidos INTEGER NOT NULL DEFAULT 0,
  lotes_reservados INTEGER NOT NULL DEFAULT 0,
  valor_total NUMERIC NOT NULL DEFAULT 0,
  publicar_site BOOLEAN NOT NULL DEFAULT TRUE,
  observacoes_internas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_loteamentos_org ON public.loteamentos(organizacao_id);
CREATE INDEX idx_loteamentos_status ON public.loteamentos(status);
CREATE INDEX idx_loteamentos_cidade ON public.loteamentos(cidade);
```

#### Tabela `lotes`

```sql
CREATE TABLE public.lotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loteamento_id UUID NOT NULL REFERENCES public.loteamentos(id) ON DELETE CASCADE,
  organizacao_id UUID NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  quadra TEXT NOT NULL,
  numero_lote TEXT NOT NULL,
  unidade TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'disponivel'
    CHECK (status IN ('disponivel', 'reservado', 'vendido')),
  comprador TEXT,
  valor NUMERIC NOT NULL DEFAULT 0,
  data_venda DATE,
  area NUMERIC,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(loteamento_id, quadra, numero_lote),
  UNIQUE(loteamento_id, unidade)
);

CREATE INDEX idx_lotes_loteamento ON public.lotes(loteamento_id);
CREATE INDEX idx_lotes_org ON public.lotes(organizacao_id);
CREATE INDEX idx_lotes_status ON public.lotes(status);
CREATE INDEX idx_lotes_quadra ON public.lotes(quadra);
```

#### Tabela `loteamento_fotos`

```sql
CREATE TABLE public.loteamento_fotos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loteamento_id UUID NOT NULL REFERENCES public.loteamentos(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  descricao TEXT,
  ordem INTEGER NOT NULL DEFAULT 0,
  eh_capa BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_loteamento_fotos_loteamento ON public.loteamento_fotos(loteamento_id);
```

#### Trigger de updated_at

```sql
CREATE TRIGGER atualizar_updated_at_loteamentos
  BEFORE UPDATE ON public.loteamentos
  FOR EACH ROW EXECUTE FUNCTION public.atualizar_updated_at();

CREATE TRIGGER atualizar_updated_at_lotes
  BEFORE UPDATE ON public.lotes
  FOR EACH ROW EXECUTE FUNCTION public.atualizar_updated_at();
```

#### Função para recalcular contadores do loteamento

```sql
CREATE OR REPLACE FUNCTION public.recalcular_contadores_loteamento()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.loteamentos SET
    total_lotes = (SELECT COUNT(*) FROM public.lotes WHERE loteamento_id = COALESCE(NEW.loteamento_id, OLD.loteamento_id)),
    lotes_disponiveis = (SELECT COUNT(*) FROM public.lotes WHERE loteamento_id = COALESCE(NEW.loteamento_id, OLD.loteamento_id) AND status = 'disponivel'),
    lotes_vendidos = (SELECT COUNT(*) FROM public.lotes WHERE loteamento_id = COALESCE(NEW.loteamento_id, OLD.loteamento_id) AND status = 'vendido'),
    lotes_reservados = (SELECT COUNT(*) FROM public.lotes WHERE loteamento_id = COALESCE(NEW.loteamento_id, OLD.loteamento_id) AND status = 'reservado'),
    valor_total = (SELECT COALESCE(SUM(valor), 0) FROM public.lotes WHERE loteamento_id = COALESCE(NEW.loteamento_id, OLD.loteamento_id))
  WHERE id = COALESCE(NEW.loteamento_id, OLD.loteamento_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER recalcular_contadores_apos_lote
  AFTER INSERT OR UPDATE OR DELETE ON public.lotes
  FOR EACH ROW EXECUTE FUNCTION public.recalcular_contadores_loteamento();
```

#### RLS (Row-Level Security)

```sql
ALTER TABLE public.loteamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loteamento_fotos ENABLE ROW LEVEL SECURITY;

-- Loteamentos: SELECT
CREATE POLICY "usuarios_veem_loteamentos_org" ON public.loteamentos
  FOR SELECT USING (
    organizacao_id = (SELECT organizacao_id FROM public.usuarios WHERE id = auth.uid())
  );

-- Loteamentos: INSERT
CREATE POLICY "usuarios_criam_loteamentos" ON public.loteamentos
  FOR INSERT WITH CHECK (
    organizacao_id = (SELECT organizacao_id FROM public.usuarios WHERE id = auth.uid())
  );

-- Loteamentos: UPDATE
CREATE POLICY "usuarios_atualizam_loteamentos" ON public.loteamentos
  FOR UPDATE USING (
    organizacao_id = (SELECT organizacao_id FROM public.usuarios WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE id = auth.uid() AND cargo IN ('admin', 'gerente')
    )
  );

-- Loteamentos: DELETE
CREATE POLICY "admin_deleta_loteamentos" ON public.loteamentos
  FOR DELETE USING (
    organizacao_id = (SELECT organizacao_id FROM public.usuarios WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE id = auth.uid() AND cargo = 'admin'
    )
  );

-- Lotes: SELECT (via org)
CREATE POLICY "usuarios_veem_lotes_org" ON public.lotes
  FOR SELECT USING (
    organizacao_id = (SELECT organizacao_id FROM public.usuarios WHERE id = auth.uid())
  );

-- Lotes: INSERT
CREATE POLICY "usuarios_criam_lotes" ON public.lotes
  FOR INSERT WITH CHECK (
    organizacao_id = (SELECT organizacao_id FROM public.usuarios WHERE id = auth.uid())
  );

-- Lotes: UPDATE
CREATE POLICY "usuarios_atualizam_lotes" ON public.lotes
  FOR UPDATE USING (
    organizacao_id = (SELECT organizacao_id FROM public.usuarios WHERE id = auth.uid())
  );

-- Lotes: DELETE
CREATE POLICY "admin_deleta_lotes" ON public.lotes
  FOR DELETE USING (
    organizacao_id = (SELECT organizacao_id FROM public.usuarios WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE id = auth.uid() AND cargo = 'admin'
    )
  );

-- Fotos: acesso via join com loteamentos
CREATE POLICY "usuarios_veem_fotos_loteamento" ON public.loteamento_fotos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.loteamentos
      WHERE id = loteamento_id
      AND organizacao_id = (SELECT organizacao_id FROM public.usuarios WHERE id = auth.uid())
    )
  );

CREATE POLICY "usuarios_gerenciam_fotos_loteamento" ON public.loteamento_fotos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.loteamentos
      WHERE id = loteamento_id
      AND organizacao_id = (SELECT organizacao_id FROM public.usuarios WHERE id = auth.uid())
    )
  );
```

#### Storage

```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'loteamento-fotos',
  'loteamento-fotos',
  TRUE,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT DO NOTHING;
```

#### Campo lote_id em negócios (integração com pipeline)

```sql
ALTER TABLE public.negocios
  ADD COLUMN lote_id UUID REFERENCES public.lotes(id) ON DELETE SET NULL;

CREATE INDEX idx_negocios_lote ON public.negocios(lote_id);
```

---

## 2. Tipos e validação

### `src/types/loteamentos.ts`

```typescript
import { z } from "zod"
import { SIGLAS_ESTADOS_BR } from "@/types/imoveis"

// ============================================================
// Tipos base
// ============================================================

export type StatusLoteamento = "lancamento" | "em_vendas" | "esgotado"
export type StatusLote = "disponivel" | "reservado" | "vendido"

// ============================================================
// Schemas Zod
// ============================================================

export const schemaCriarLoteamento = z.object({
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  descricao: z.string().optional(),
  status: z.enum(["lancamento", "em_vendas", "esgotado"]).default("em_vendas"),
  cep: z.string().optional(),
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().min(1, "Cidade obrigatória"),
  estado: z.string().length(2, "Estado deve ter 2 caracteres")
    .transform(v => v.toUpperCase())
    .refine(v => (SIGLAS_ESTADOS_BR as readonly string[]).includes(v), "Estado inválido"),
  publicar_site: z.boolean().default(true),
  observacoes_internas: z.string().optional(),
})

export const schemaAtualizarLoteamento = schemaCriarLoteamento.extend({
  id: z.string().uuid(),
})

export const schemaCriarLote = z.object({
  loteamento_id: z.string().uuid(),
  quadra: z.string().min(1, "Quadra obrigatória"),
  numero_lote: z.string().min(1, "Número do lote obrigatório"),
  unidade: z.string().min(1, "Unidade obrigatória"),
  status: z.enum(["disponivel", "reservado", "vendido"]).default("disponivel"),
  comprador: z.string().optional(),
  valor: z.coerce.number().min(0, "Valor deve ser positivo"),
  data_venda: z.string().optional(), // ISO date string
  area: z.coerce.number().positive("Área deve ser positiva").optional(),
  observacoes: z.string().optional(),
})

export const schemaAtualizarLote = schemaCriarLote.extend({
  id: z.string().uuid(),
})

export const schemaFiltrosLoteamentos = z.object({
  busca: z.string().optional(),
  status: z.enum(["lancamento", "em_vendas", "esgotado"]).optional(),
  cidade: z.string().optional(),
  pagina: z.coerce.number().int().positive().default(1),
  por_pagina: z.coerce.number().int().positive().default(12),
})

export const schemaFiltrosLotes = z.object({
  quadra: z.string().optional(),
  status: z.enum(["disponivel", "reservado", "vendido"]).optional(),
  busca: z.string().optional(), // busca por comprador ou unidade
})
```

### `src/lib/constantes/loteamentos.ts`

```typescript
export const labelsStatusLoteamento: Record<string, string> = {
  lancamento: "Lançamento",
  em_vendas: "Em Vendas",
  esgotado: "Esgotado",
}

export const labelsStatusLote: Record<string, string> = {
  disponivel: "Disponível",
  reservado: "Reservado",
  vendido: "Vendido",
}

export const coresStatusLote: Record<string, string> = {
  disponivel: "bg-green-100 text-green-800",
  reservado: "bg-yellow-100 text-yellow-800",
  vendido: "bg-red-100 text-red-800",
}
```

### `src/types/importacao-lotes.ts`

```typescript
import { z } from "zod"

export const schemaLinhaImportacaoLote = z.object({
  quadra: z.string().min(1, "Quadra obrigatória"),
  numero_lote: z.string().min(1, "Número do lote obrigatório"),
  unidade: z.string().optional(), // se não vier, gerar automaticamente
  comprador: z.string().optional().transform(v => v === "0" ? undefined : v),
  valor: z.coerce.number().min(0, "Valor deve ser positivo"),
  data_venda: z.string().optional().transform(v => {
    if (!v || v === "0") return undefined
    // Converter DD/MM/YYYY pra YYYY-MM-DD
    const partes = v.split("/")
    if (partes.length === 3) return `${partes[2]}-${partes[1]}-${partes[0]}`
    return v
  }),
  area: z.coerce.number().positive().optional(),
})

export type LinhaImportacaoLote = z.infer<typeof schemaLinhaImportacaoLote>

export type ResultadoImportacaoLotes = {
  criados: number
  erros: Array<{ linha: number; unidade: string; erro: string }>
}

// Mapeamento de colunas do CSV
export const MAPEAMENTO_COLUNAS_LOTES: Record<string, string> = {
  quadra: "quadra",
  lote: "numero_lote",
  numero_lote: "numero_lote",
  número_lote: "numero_lote",
  "numero do lote": "numero_lote",
  unidade: "unidade",
  comprador: "comprador",
  nome: "comprador",
  valor: "valor",
  "valor venda": "valor",
  preco: "valor",
  preço: "valor",
  "data venda": "data_venda",
  data_venda: "data_venda",
  "data da venda": "data_venda",
  area: "area",
  área: "area",
  "area m2": "area",
  "área m²": "area",
}

export const CAMPOS_OBRIGATORIOS_LOTES = ["quadra", "numero_lote", "valor"]
```

---

## 3. Server Actions

### `src/actions/loteamentos.ts`

Seguindo o padrão de `src/actions/imoveis.ts`:

**Funções:**
- `criarLoteamento(estado, formData)` — valida com Zod, verifica limite plano, insere com org_id, redireciona pra detalhe
- `atualizarLoteamento(estado, formData)` — valida, atualiza, redireciona
- `excluirLoteamento(id)` — só admin, deleta (cascade remove lotes e fotos)
- `criarLote(estado, formData)` — cria lote individual dentro de um loteamento
- `atualizarLote(estado, formData)` — atualiza campos do lote (status, comprador, valor, etc.)
- `excluirLote(id)` — remove lote individual
- `alterarStatusLote(id, status)` — muda status do lote (disponivel → reservado → vendido)

### `src/actions/importacao-lotes.ts`

Seguindo o padrão de `src/actions/importacao-imoveis.ts`:

**Funções:**
- `importarLotes(loteamentoId, linhas)` — recebe array de linhas validadas, insere em batches de 50, retorna `{ criados, erros }`

**Lógica especial:**
- Se `unidade` não vier no CSV, gerar como "Quadra {quadra} Lote {numero_lote}"
- Se `comprador` for "0" ou vazio, tratar como `null`
- Se tem `data_venda`, setar status como "vendido"
- Se tem `comprador` sem `data_venda`, setar status como "reservado"
- Após importação, trigger do banco recalcula contadores automaticamente

### `src/actions/ia-loteamentos.ts`

Seguindo o padrão de `src/actions/ia-imoveis.ts`:

**Funções:**
- `gerarDescricaoLoteamentoIA(loteamentoId)` — gera descrição comercial com GPT-4o-mini usando contexto (nome, cidade, total lotes, faixa de preço)
- `salvarTextoIA(loteamentoId, campo, texto)` — salva descricao_ia

---

## 4. Páginas

### `src/app/(dashboard)/loteamentos/page.tsx` — Listagem

Server Component com:
- PageHeader com título "Loteamentos" + botão "Novo loteamento"
- FiltrosLoteamentos (busca, status, cidade)
- Toggle visualização (cards / tabela)
- Paginação
- Query: `supabase.from("loteamentos").select("*, loteamento_fotos(*)").eq("organizacao_id", ...)`

### `src/app/(dashboard)/loteamentos/novo/page.tsx` — Cadastro

Client wrapper com `<FormularioLoteamento />`

### `src/app/(dashboard)/loteamentos/[id]/page.tsx` — Detalhe

Server Component com:
- Header: nome, cidade, status badge
- Botões: Editar, Importar Lotes, Excluir
- ResumoLoteamento: cards com total lotes, disponíveis, vendidos, reservados, valor total
- Tabs:
  - **Lotes**: tabela com filtros por quadra e status (editável inline — alterar status, comprador)
  - **Fotos**: galeria de fotos do loteamento
  - **Descrição IA**: gerar/editar descrição com IA
- Query: `supabase.from("loteamentos").select("*, lotes(*), loteamento_fotos(*)").eq("id", ...)`

### `src/app/(dashboard)/loteamentos/[id]/editar/page.tsx` — Edição

Client wrapper com `<FormularioLoteamento loteamento={...} />`

### `src/app/(dashboard)/loteamentos/[id]/importar/page.tsx` — Importar lotes

Client wrapper com `<ImportadorLotes loteamentoId={...} />`

---

## 5. Componentes

### `src/components/loteamentos/formulario-loteamento.tsx`
React Hook Form + Zod. Campos: nome, descrição, status, endereço completo (cep, logradouro, numero, complemento, bairro, cidade, estado), publicar_site, observações internas.

### `src/components/loteamentos/card-loteamento.tsx`
Card pra listagem: foto de capa, nome, cidade/estado, total lotes, disponíveis, faixa de preço, status badge.

### `src/components/loteamentos/tabela-lotes.tsx`
Tabela dentro do detalhe do loteamento. Colunas: quadra, lote, unidade, status (badge colorido), comprador, valor (R$), data venda, área (m²). Filtros: dropdown de quadra, dropdown de status. Ordenação por quadra/lote.

### `src/components/loteamentos/filtros-loteamentos.tsx`
Filtros da listagem: input busca (nome), dropdown status, dropdown cidade. Atualiza URL params.

### `src/components/loteamentos/importador-lotes.tsx`
3 estágios: Upload → Preview → Resultado. Mesmo padrão do importador de imóveis. Usa `MAPEAMENTO_COLUNAS_LOTES` pra mapear headers. Valida com `schemaLinhaImportacaoLote`. Max 500 linhas, max 10MB.

### `src/components/loteamentos/galeria-fotos-loteamento.tsx`
Upload, reordenação, definir capa, excluir. Storage: bucket `loteamento-fotos`. Mesmo padrão de `galeria-fotos.tsx` de imóveis.

### `src/components/loteamentos/ia-loteamento.tsx`
Botão "Gerar descrição com IA" + textarea pra editar + botão salvar.

### `src/components/loteamentos/resumo-loteamento.tsx`
4 cards com métricas: Total de Lotes, Disponíveis (verde), Vendidos (vermelho), Reservados (amarelo). + card com Valor Total formatado em R$.

---

## 6. Site público

### `src/app/[slug]/loteamentos/page.tsx` — Listagem pública

Mesmo padrão de `/[slug]/imoveis/page.tsx`:
- Busca loteamentos com `publicar_site=true` e `status IN ('lancamento', 'em_vendas')`
- Cards com foto, nome, cidade, lotes disponíveis, faixa de preço
- Paginação 12 por página

### `src/app/[slug]/loteamentos/[id]/page.tsx` — Detalhe público

- Galeria de fotos
- Nome, descrição (ou descricao_ia), endereço
- Métricas: total lotes, disponíveis, faixa de preço
- Tabela de lotes disponíveis (quadra, lote, área, valor) — APENAS disponíveis
- Botão/formulário de contato (nome, telefone, email, mensagem)

### Header do site público

Adicionar link "Loteamentos" no menu de navegação do site público (ao lado de "Imóveis").

---

## 7. Sidebar

Adicionar em `src/components/layout/app-sidebar.tsx`, no array `gruposNavegacao[0].itens`:

```typescript
{ titulo: "Loteamentos", href: "/loteamentos", icone: MapPin }
```

Posição: depois de "Imóveis" (índice 4), antes de "Atividades".

Importar `MapPin` de `lucide-react`.

---

## 8. Tipos no banco (database.ts)

Adicionar em `src/types/database.ts`:

```typescript
export type Loteamento = {
  id: string
  organizacao_id: string
  nome: string
  descricao: string | null
  descricao_ia: string | null
  status: "lancamento" | "em_vendas" | "esgotado"
  cep: string | null
  logradouro: string | null
  numero: string | null
  complemento: string | null
  bairro: string | null
  cidade: string
  estado: string
  total_lotes: number
  lotes_disponiveis: number
  lotes_vendidos: number
  lotes_reservados: number
  valor_total: number
  publicar_site: boolean
  observacoes_internas: string | null
  created_at: string
  updated_at: string
}

export type LoteamentoComFotos = Loteamento & {
  loteamento_fotos: LoteamentoFoto[]
}

export type LoteamentoComLotes = Loteamento & {
  lotes: Lote[]
  loteamento_fotos: LoteamentoFoto[]
}

export type Lote = {
  id: string
  loteamento_id: string
  organizacao_id: string
  quadra: string
  numero_lote: string
  unidade: string
  status: "disponivel" | "reservado" | "vendido"
  comprador: string | null
  valor: number
  data_venda: string | null
  area: number | null
  observacoes: string | null
  created_at: string
  updated_at: string
}

export type LoteamentoFoto = {
  id: string
  loteamento_id: string
  url: string
  descricao: string | null
  ordem: number
  eh_capa: boolean
  created_at: string
}
```

---

## 9. Integração com negócios

Adicionar campo `lote_id` na tabela `negocios` (já incluso na migration).

**Ajustes necessários:**
- `src/types/database.ts` — adicionar `lote_id: string | null` no tipo `Negocio`
- `src/types/negocios.ts` — adicionar `lote_id` no schema Zod (opcional)
- `src/actions/negocios.ts` — aceitar `lote_id` no criar/atualizar
- `src/components/negocios/formulario-negocio.tsx` — adicionar seletor de loteamento + lote (condicional: só aparece se selecionar "Loteamento" como origem)
- `src/components/negocios/kanban-card.tsx` — mostrar nome do lote se vinculado

---

## 10. Limites de plano

Adicionar `max_loteamentos` no campo `limites` da tabela `organizacoes`:

| Plano | max_loteamentos |
|-------|-----------------|
| Trial | 1 |
| CRM IA | 5 |
| CRM IA + SDR | 20 |

Criar `src/lib/verificar-limites-loteamentos.ts` seguindo o padrão de `verificar-limites.ts`.

---

## 11. Ordem de implementação sugerida

1. **Migration SQL** — criar tabelas, RLS, triggers, storage bucket, campo lote_id em negocios
2. **Tipos** — database.ts, loteamentos.ts, importacao-lotes.ts, constantes
3. **Server Actions** — CRUD loteamentos, CRUD lotes, importação, IA
4. **Sidebar** — adicionar item "Loteamentos"
5. **Páginas + Componentes** — listagem, formulário, detalhe com tabela de lotes, importador
6. **Galeria de fotos** — upload e gestão
7. **IA** — geração de descrição
8. **Site público** — listagem e detalhe
9. **Integração negócios** — campo lote_id, seletor no formulário
10. **Limites de plano** — verificação no CRUD

---

## 12. Checklist de entrega

- [ ] Migration 026 executada sem erros
- [ ] CRUD de loteamento funcionando (criar, editar, excluir, listar)
- [ ] CRUD de lotes funcionando (criar, editar, alterar status, excluir)
- [ ] Importação CSV de lotes funcionando com o arquivo fornecido
- [ ] Contadores automáticos recalculando (total, disponíveis, vendidos, reservados, valor)
- [ ] Galeria de fotos funcionando
- [ ] Descrição IA gerando corretamente
- [ ] Site público exibindo loteamentos e lotes disponíveis
- [ ] Sidebar com item "Loteamentos"
- [ ] Negócio pode vincular a um lote
- [ ] RLS isolando dados entre organizações
- [ ] Limite de plano verificado na criação
