-- ============================================================
-- Migration 026: Modulo de Loteamentos
-- Tabelas loteamentos + lotes + loteamento_fotos com RLS
-- ============================================================

-- ============================================================
-- 1. TABELA LOTEAMENTOS (empreendimento pai)
-- ============================================================
CREATE TABLE public.loteamentos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organizacao_id uuid NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,

  -- Identificacao
  nome text NOT NULL,
  descricao text,
  descricao_ia text,

  -- Status
  status text NOT NULL DEFAULT 'em_vendas'
    CHECK (status IN ('lancamento', 'em_vendas', 'esgotado')),

  -- Endereco
  cep text,
  logradouro text,
  numero text,
  complemento text,
  bairro text,
  cidade text NOT NULL,
  estado char(2) NOT NULL,

  -- Contadores (atualizados automaticamente por trigger)
  total_lotes integer NOT NULL DEFAULT 0,
  lotes_disponiveis integer NOT NULL DEFAULT 0,
  lotes_vendidos integer NOT NULL DEFAULT 0,
  lotes_reservados integer NOT NULL DEFAULT 0,
  valor_total numeric NOT NULL DEFAULT 0,

  -- Configuracoes
  publicar_site boolean NOT NULL DEFAULT true,
  observacoes_internas text,

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. TABELA LOTES (unidades filhas do loteamento)
-- ============================================================
CREATE TABLE public.lotes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  loteamento_id uuid NOT NULL REFERENCES public.loteamentos(id) ON DELETE CASCADE,
  organizacao_id uuid NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,

  -- Identificacao
  quadra text NOT NULL,
  numero_lote text NOT NULL,
  unidade text NOT NULL,

  -- Status e venda
  status text NOT NULL DEFAULT 'disponivel'
    CHECK (status IN ('disponivel', 'reservado', 'vendido')),
  comprador text,
  valor numeric NOT NULL DEFAULT 0,
  data_venda date,
  area numeric,

  -- Notas
  observacoes text,

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Constraints de unicidade
  UNIQUE(loteamento_id, quadra, numero_lote),
  UNIQUE(loteamento_id, unidade)
);

-- ============================================================
-- 3. TABELA LOTEAMENTO_FOTOS
-- ============================================================
CREATE TABLE public.loteamento_fotos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  loteamento_id uuid NOT NULL REFERENCES public.loteamentos(id) ON DELETE CASCADE,
  url text NOT NULL,
  descricao text,
  ordem integer NOT NULL DEFAULT 0,
  eh_capa boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 4. INDICES
-- ============================================================
CREATE INDEX idx_loteamentos_org ON public.loteamentos(organizacao_id);
CREATE INDEX idx_loteamentos_status ON public.loteamentos(organizacao_id, status);
CREATE INDEX idx_loteamentos_cidade ON public.loteamentos(organizacao_id, cidade);
CREATE INDEX idx_lotes_loteamento ON public.lotes(loteamento_id);
CREATE INDEX idx_lotes_org ON public.lotes(organizacao_id);
CREATE INDEX idx_lotes_status ON public.lotes(loteamento_id, status);
CREATE INDEX idx_lotes_quadra ON public.lotes(loteamento_id, quadra);
CREATE INDEX idx_loteamento_fotos_loteamento ON public.loteamento_fotos(loteamento_id);

-- ============================================================
-- 5. TRIGGERS: atualizar updated_at (reutiliza funcao da migration 001)
-- ============================================================
CREATE TRIGGER trigger_updated_at_loteamentos
  BEFORE UPDATE ON public.loteamentos
  FOR EACH ROW EXECUTE FUNCTION public.atualizar_updated_at();

CREATE TRIGGER trigger_updated_at_lotes
  BEFORE UPDATE ON public.lotes
  FOR EACH ROW EXECUTE FUNCTION public.atualizar_updated_at();

-- ============================================================
-- 6. FUNCAO + TRIGGER: recalcular contadores do loteamento
-- Quando um lote e inserido, atualizado ou deletado, recalcula
-- total_lotes, lotes_disponiveis, lotes_vendidos, lotes_reservados, valor_total
-- ============================================================
CREATE OR REPLACE FUNCTION public.recalcular_contadores_loteamento()
RETURNS TRIGGER AS $$
DECLARE
  v_loteamento_id uuid;
BEGIN
  -- Determinar qual loteamento precisa ser recalculado
  v_loteamento_id := COALESCE(NEW.loteamento_id, OLD.loteamento_id);

  UPDATE public.loteamentos SET
    total_lotes = (SELECT COUNT(*) FROM public.lotes WHERE loteamento_id = v_loteamento_id),
    lotes_disponiveis = (SELECT COUNT(*) FROM public.lotes WHERE loteamento_id = v_loteamento_id AND status = 'disponivel'),
    lotes_vendidos = (SELECT COUNT(*) FROM public.lotes WHERE loteamento_id = v_loteamento_id AND status = 'vendido'),
    lotes_reservados = (SELECT COUNT(*) FROM public.lotes WHERE loteamento_id = v_loteamento_id AND status = 'reservado'),
    valor_total = (SELECT COALESCE(SUM(valor), 0) FROM public.lotes WHERE loteamento_id = v_loteamento_id)
  WHERE id = v_loteamento_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_recalcular_contadores_loteamento
  AFTER INSERT OR UPDATE OR DELETE ON public.lotes
  FOR EACH ROW EXECUTE FUNCTION public.recalcular_contadores_loteamento();

-- ============================================================
-- 7. RLS — HABILITAR
-- ============================================================
ALTER TABLE public.loteamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loteamento_fotos ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 8. RLS — POLICIES LOTEAMENTOS
-- ============================================================

-- Usuarios veem loteamentos da propria organizacao
CREATE POLICY "usuarios_veem_loteamentos_org" ON public.loteamentos
  FOR SELECT USING (
    organizacao_id = (SELECT organizacao_id FROM public.usuarios WHERE id = auth.uid())
  );

-- Usuarios inserem loteamentos na propria organizacao
CREATE POLICY "usuarios_inserem_loteamentos" ON public.loteamentos
  FOR INSERT WITH CHECK (
    organizacao_id = (SELECT organizacao_id FROM public.usuarios WHERE id = auth.uid())
  );

-- Admin e gerente atualizam loteamentos da org
CREATE POLICY "usuarios_atualizam_loteamentos" ON public.loteamentos
  FOR UPDATE USING (
    organizacao_id = (SELECT organizacao_id FROM public.usuarios WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE id = auth.uid() AND cargo IN ('admin', 'gerente')
    )
  );

-- Admin pode excluir loteamentos da organizacao
CREATE POLICY "admin_exclui_loteamentos" ON public.loteamentos
  FOR DELETE USING (
    organizacao_id = (SELECT organizacao_id FROM public.usuarios WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE id = auth.uid() AND cargo = 'admin'
    )
  );

-- ============================================================
-- 9. RLS — POLICIES LOTES
-- ============================================================

-- Usuarios veem lotes da propria organizacao
CREATE POLICY "usuarios_veem_lotes_org" ON public.lotes
  FOR SELECT USING (
    organizacao_id = (SELECT organizacao_id FROM public.usuarios WHERE id = auth.uid())
  );

-- Usuarios inserem lotes na propria organizacao
CREATE POLICY "usuarios_inserem_lotes" ON public.lotes
  FOR INSERT WITH CHECK (
    organizacao_id = (SELECT organizacao_id FROM public.usuarios WHERE id = auth.uid())
  );

-- Usuarios da org atualizam lotes (corretores precisam alterar status)
CREATE POLICY "usuarios_atualizam_lotes" ON public.lotes
  FOR UPDATE USING (
    organizacao_id = (SELECT organizacao_id FROM public.usuarios WHERE id = auth.uid())
  );

-- Admin pode excluir lotes da organizacao
CREATE POLICY "admin_exclui_lotes" ON public.lotes
  FOR DELETE USING (
    organizacao_id = (SELECT organizacao_id FROM public.usuarios WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE id = auth.uid() AND cargo = 'admin'
    )
  );

-- ============================================================
-- 10. RLS — POLICIES LOTEAMENTO_FOTOS (via join com loteamentos)
-- ============================================================

-- Usuarios veem fotos de loteamentos da propria org
CREATE POLICY "usuarios_veem_fotos_loteamento" ON public.loteamento_fotos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.loteamentos
      WHERE id = loteamento_id
      AND organizacao_id = (SELECT organizacao_id FROM public.usuarios WHERE id = auth.uid())
    )
  );

-- Usuarios inserem fotos em loteamentos da propria org
CREATE POLICY "usuarios_inserem_fotos_loteamento" ON public.loteamento_fotos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.loteamentos
      WHERE id = loteamento_id
      AND organizacao_id = (SELECT organizacao_id FROM public.usuarios WHERE id = auth.uid())
    )
  );

-- Usuarios atualizam fotos de loteamentos da propria org
CREATE POLICY "usuarios_atualizam_fotos_loteamento" ON public.loteamento_fotos
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.loteamentos
      WHERE id = loteamento_id
      AND organizacao_id = (SELECT organizacao_id FROM public.usuarios WHERE id = auth.uid())
    )
  );

-- Usuarios excluem fotos de loteamentos da propria org
CREATE POLICY "usuarios_excluem_fotos_loteamento" ON public.loteamento_fotos
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.loteamentos
      WHERE id = loteamento_id
      AND organizacao_id = (SELECT organizacao_id FROM public.usuarios WHERE id = auth.uid())
    )
  );

-- ============================================================
-- 11. SUPABASE STORAGE — BUCKET PARA FOTOS DE LOTEAMENTOS
-- ============================================================

-- Criar bucket publico para fotos (limite 5MB, apenas imagens)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'loteamento-fotos',
  'loteamento-fotos',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT DO NOTHING;

-- Usuarios autenticados podem fazer upload
CREATE POLICY "usuarios_fazem_upload_fotos_loteamento" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'loteamento-fotos'
    AND auth.uid() IS NOT NULL
  );

-- Qualquer um pode ver fotos (bucket publico)
CREATE POLICY "qualquer_um_ve_fotos_loteamento" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'loteamento-fotos'
  );

-- Usuarios autenticados podem excluir fotos
CREATE POLICY "usuarios_excluem_fotos_loteamento_storage" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'loteamento-fotos'
    AND auth.uid() IS NOT NULL
  );

-- ============================================================
-- 12. CAMPO lote_id EM NEGOCIOS (integracao com pipeline)
-- ============================================================
ALTER TABLE public.negocios
  ADD COLUMN lote_id uuid REFERENCES public.lotes(id) ON DELETE SET NULL;

CREATE INDEX idx_negocios_lote ON public.negocios(lote_id);
