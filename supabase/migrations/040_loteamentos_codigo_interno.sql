-- Migration 040: codigo_interno em loteamentos
-- Pedido do Angelo (audios 1 e 2): "lote Vila do Morro estava travado, sem referencia/codigo".
-- IA + corretor precisam de codigo identificavel.
-- Padrao: LT-{NNN} sequencial dentro da organizacao (loteamento e categoria propria,
-- nao mistura com imoveis CA-/TE-/AP- etc).

ALTER TABLE public.loteamentos
  ADD COLUMN IF NOT EXISTS codigo_interno text;

-- Indice pra busca rapida e unique-por-org (mesmo padrao de imoveis)
CREATE UNIQUE INDEX IF NOT EXISTS loteamentos_org_codigo_unique
  ON public.loteamentos (organizacao_id, codigo_interno)
  WHERE codigo_interno IS NOT NULL;
