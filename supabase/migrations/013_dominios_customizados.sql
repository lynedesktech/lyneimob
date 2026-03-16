-- ============================================================
-- Migration 013: Dominios customizados
-- Permite que cada imobiliaria use seu proprio dominio
-- no site publico (ex: www.imobiliariaxyz.com.br)
-- ============================================================

-- ============================================================
-- 1. TABELA DOMINIOS_CUSTOMIZADOS
-- Mapeamento dominio → organizacao
-- ============================================================
CREATE TABLE public.dominios_customizados (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organizacao_id uuid NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  dominio text UNIQUE NOT NULL,
  status text DEFAULT 'pendente' CHECK (status IN ('pendente', 'verificado', 'erro')),
  verificado_em timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Trigger updated_at (reutiliza funcao existente)
CREATE TRIGGER trigger_dominios_updated_at
  BEFORE UPDATE ON public.dominios_customizados
  FOR EACH ROW EXECUTE FUNCTION public.atualizar_updated_at();

-- ============================================================
-- 2. INDICES
-- ============================================================

-- Busca rapida por dominio (usado no middleware a cada request)
CREATE UNIQUE INDEX idx_dominios_dominio ON public.dominios_customizados(dominio);

-- Busca por organizacao (usado no dashboard)
CREATE INDEX idx_dominios_org ON public.dominios_customizados(organizacao_id);

-- ============================================================
-- 3. RLS
-- ============================================================
ALTER TABLE public.dominios_customizados ENABLE ROW LEVEL SECURITY;

-- SELECT: usuarios da organizacao veem seus proprios dominios
CREATE POLICY "dominios_select"
  ON public.dominios_customizados
  FOR SELECT USING (
    organizacao_id IN (
      SELECT organizacao_id FROM public.usuarios WHERE id = auth.uid()
    )
  );

-- INSERT: admin/gerente da organizacao
CREATE POLICY "dominios_insert"
  ON public.dominios_customizados
  FOR INSERT WITH CHECK (
    organizacao_id IN (
      SELECT organizacao_id FROM public.usuarios WHERE id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE id = auth.uid() AND cargo IN ('admin', 'gerente')
    )
  );

-- UPDATE: admin/gerente da organizacao
CREATE POLICY "dominios_update"
  ON public.dominios_customizados
  FOR UPDATE USING (
    organizacao_id IN (
      SELECT organizacao_id FROM public.usuarios WHERE id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE id = auth.uid() AND cargo IN ('admin', 'gerente')
    )
  );

-- DELETE: admin/gerente da organizacao
CREATE POLICY "dominios_delete"
  ON public.dominios_customizados
  FOR DELETE USING (
    organizacao_id IN (
      SELECT organizacao_id FROM public.usuarios WHERE id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE id = auth.uid() AND cargo IN ('admin', 'gerente')
    )
  );

-- ============================================================
-- 4. FUNCAO PUBLICA: buscar_org_por_dominio
-- Usada pelo middleware (edge runtime) com anon key
-- SECURITY DEFINER bypassa RLS para consultas publicas
-- ============================================================
CREATE OR REPLACE FUNCTION public.buscar_org_por_dominio(dominio_busca text)
RETURNS TABLE (organizacao_id uuid, slug text)
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT o.id AS organizacao_id, o.slug
  FROM public.dominios_customizados d
  JOIN public.organizacoes o ON o.id = d.organizacao_id
  WHERE d.dominio = dominio_busca
    AND d.status = 'verificado';
END;
$$ LANGUAGE plpgsql;

-- Permitir que qualquer usuario (incluindo anon) execute a funcao
GRANT EXECUTE ON FUNCTION public.buscar_org_por_dominio(text) TO anon;
GRANT EXECUTE ON FUNCTION public.buscar_org_por_dominio(text) TO authenticated;

-- ============================================================
-- 5. CONSTRAINT: uma organizacao so pode ter um dominio ativo
-- ============================================================
CREATE UNIQUE INDEX idx_dominios_org_unico ON public.dominios_customizados(organizacao_id);
