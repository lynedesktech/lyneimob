-- ============================================================
-- Migration 002: Tabelas imoveis + imovel_fotos
-- Modulo de cadastro e gestao de imoveis com RLS
-- ============================================================

-- ============================================================
-- 1. TABELA IMOVEIS
-- ============================================================
CREATE TABLE public.imoveis (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organizacao_id uuid NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  corretor_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE SET NULL,

  -- Identificacao
  codigo text NOT NULL,
  titulo text NOT NULL,
  descricao text,

  -- Classificacao
  tipo text NOT NULL CHECK (tipo IN (
    'apartamento', 'casa', 'terreno', 'sala_comercial', 'galpao',
    'cobertura', 'kitnet', 'fazenda', 'sitio', 'loja', 'outro'
  )),
  finalidade text NOT NULL CHECK (finalidade IN ('venda', 'aluguel', 'venda_e_aluguel')),
  status text DEFAULT 'disponivel' CHECK (status IN (
    'disponivel', 'reservado', 'vendido', 'alugado', 'inativo'
  )),

  -- Endereco (campos individuais para filtros diretos)
  cep text,
  logradouro text,
  numero text,
  complemento text,
  bairro text,
  cidade text NOT NULL,
  estado text NOT NULL CHECK (char_length(estado) = 2),

  -- Valores
  preco_venda numeric(15,2),
  preco_aluguel numeric(15,2),
  iptu numeric(10,2),
  condominio numeric(10,2),

  -- Caracteristicas
  area_total numeric(10,2),
  area_construida numeric(10,2),
  quartos integer DEFAULT 0,
  suites integer DEFAULT 0,
  banheiros integer DEFAULT 0,
  vagas_garagem integer DEFAULT 0,
  andares integer,

  -- Notas internas
  observacoes_internas text,

  -- IA
  titulo_ia text,
  descricao_ia text,

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Codigo unico por organizacao
ALTER TABLE public.imoveis
  ADD CONSTRAINT uq_imovel_codigo_org UNIQUE (organizacao_id, codigo);

-- ============================================================
-- 2. TABELA IMOVEL_FOTOS
-- ============================================================
CREATE TABLE public.imovel_fotos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  imovel_id uuid NOT NULL REFERENCES public.imoveis(id) ON DELETE CASCADE,
  url text NOT NULL,
  descricao text,
  ordem integer DEFAULT 0,
  eh_capa boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- 3. INDICES
-- ============================================================
CREATE INDEX idx_imoveis_org ON public.imoveis(organizacao_id);
CREATE INDEX idx_imoveis_status ON public.imoveis(organizacao_id, status);
CREATE INDEX idx_imoveis_tipo ON public.imoveis(organizacao_id, tipo);
CREATE INDEX idx_imoveis_finalidade ON public.imoveis(organizacao_id, finalidade);
CREATE INDEX idx_imoveis_cidade_bairro ON public.imoveis(organizacao_id, cidade, bairro);
CREATE INDEX idx_imoveis_corretor ON public.imoveis(corretor_id);
CREATE INDEX idx_imovel_fotos_imovel ON public.imovel_fotos(imovel_id);

-- ============================================================
-- 4. TRIGGER: atualizar updated_at (reutiliza funcao da migration 001)
-- ============================================================
CREATE TRIGGER trigger_updated_at_imoveis
  BEFORE UPDATE ON public.imoveis
  FOR EACH ROW EXECUTE FUNCTION public.atualizar_updated_at();

-- ============================================================
-- 5. RLS — HABILITAR
-- ============================================================
ALTER TABLE public.imoveis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.imovel_fotos ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 6. RLS — POLICIES IMOVEIS
-- ============================================================

-- Usuarios veem imoveis da propria organizacao
CREATE POLICY "usuarios_veem_imoveis_org" ON public.imoveis
  FOR SELECT USING (
    organizacao_id = (SELECT organizacao_id FROM public.usuarios WHERE id = auth.uid())
  );

-- Usuarios inserem imoveis na propria organizacao
CREATE POLICY "usuarios_inserem_imoveis" ON public.imoveis
  FOR INSERT WITH CHECK (
    organizacao_id = (SELECT organizacao_id FROM public.usuarios WHERE id = auth.uid())
  );

-- Corretor atualiza seus proprios imoveis, admin/gerente atualiza qualquer um da org
CREATE POLICY "usuarios_atualizam_imoveis" ON public.imoveis
  FOR UPDATE USING (
    organizacao_id = (SELECT organizacao_id FROM public.usuarios WHERE id = auth.uid())
    AND (
      corretor_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.usuarios
        WHERE id = auth.uid() AND cargo IN ('admin', 'gerente')
      )
    )
  );

-- Admin pode excluir imoveis da organizacao
CREATE POLICY "admin_exclui_imoveis" ON public.imoveis
  FOR DELETE USING (
    organizacao_id = (SELECT organizacao_id FROM public.usuarios WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE id = auth.uid() AND cargo = 'admin'
    )
  );

-- ============================================================
-- 7. RLS — POLICIES IMOVEL_FOTOS (via join com imoveis)
-- ============================================================

-- Usuarios veem fotos de imoveis da propria org
CREATE POLICY "usuarios_veem_fotos" ON public.imovel_fotos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.imoveis
      WHERE id = imovel_id
      AND organizacao_id = (SELECT organizacao_id FROM public.usuarios WHERE id = auth.uid())
    )
  );

-- Usuarios inserem fotos em imoveis da propria org
CREATE POLICY "usuarios_inserem_fotos" ON public.imovel_fotos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.imoveis
      WHERE id = imovel_id
      AND organizacao_id = (SELECT organizacao_id FROM public.usuarios WHERE id = auth.uid())
    )
  );

-- Usuarios atualizam fotos de imoveis da propria org
CREATE POLICY "usuarios_atualizam_fotos" ON public.imovel_fotos
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.imoveis
      WHERE id = imovel_id
      AND organizacao_id = (SELECT organizacao_id FROM public.usuarios WHERE id = auth.uid())
    )
  );

-- Usuarios excluem fotos de imoveis da propria org
CREATE POLICY "usuarios_excluem_fotos" ON public.imovel_fotos
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.imoveis
      WHERE id = imovel_id
      AND organizacao_id = (SELECT organizacao_id FROM public.usuarios WHERE id = auth.uid())
    )
  );

-- ============================================================
-- 8. SUPABASE STORAGE — BUCKET PARA FOTOS DE IMOVEIS
-- ============================================================

-- Criar bucket publico para fotos (limite 5MB, apenas imagens)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'imovel-fotos',
  'imovel-fotos',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- Usuarios autenticados podem fazer upload
CREATE POLICY "usuarios_fazem_upload_fotos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'imovel-fotos'
    AND auth.uid() IS NOT NULL
  );

-- Qualquer um pode ver fotos (bucket publico)
CREATE POLICY "qualquer_um_ve_fotos" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'imovel-fotos'
  );

-- Usuarios autenticados podem excluir fotos
CREATE POLICY "usuarios_excluem_fotos_storage" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'imovel-fotos'
    AND auth.uid() IS NOT NULL
  );
