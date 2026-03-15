-- ============================================================
-- Migration 003: Tabelas clientes + cliente_interesses + cliente_interacoes
-- Modulo de gestao de clientes com RLS
-- ============================================================

-- ============================================================
-- 1. TABELA CLIENTES
-- ============================================================
CREATE TABLE public.clientes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organizacao_id uuid NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  corretor_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE SET NULL,

  -- Dados pessoais
  nome text NOT NULL,
  email text,
  telefone text,
  whatsapp text,
  cpf_cnpj text,

  -- Classificacao
  tipo text NOT NULL CHECK (tipo IN ('comprador', 'vendedor', 'locatario', 'proprietario')),
  origem text DEFAULT 'outro' CHECK (origem IN ('indicacao', 'portal', 'site', 'whatsapp', 'outro')),
  status text DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'negociando', 'fechado')),

  -- Notas internas
  observacoes text,

  -- IA
  score_lead integer DEFAULT 0 CHECK (score_lead BETWEEN 0 AND 100),
  resumo_ia text,

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- CPF/CNPJ unico por organizacao (permite mesmo CPF em orgs diferentes)
ALTER TABLE public.clientes
  ADD CONSTRAINT uq_cliente_cpf_cnpj_org UNIQUE (organizacao_id, cpf_cnpj);

-- ============================================================
-- 2. TABELA CLIENTE_INTERESSES
-- ============================================================
CREATE TABLE public.cliente_interesses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,

  -- O que o cliente busca
  tipo_imovel text CHECK (tipo_imovel IN (
    'apartamento', 'casa', 'terreno', 'sala_comercial', 'galpao',
    'cobertura', 'kitnet', 'fazenda', 'sitio', 'loja', 'outro'
  )),
  finalidade text CHECK (finalidade IN ('venda', 'aluguel', 'venda_e_aluguel')),
  bairros_interesse text[],
  cidade text,
  estado text CHECK (estado IS NULL OR char_length(estado) = 2),
  preco_min numeric(15,2),
  preco_max numeric(15,2),
  quartos_min integer,
  area_min numeric(10,2),
  observacoes text,

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- 3. TABELA CLIENTE_INTERACOES
-- ============================================================
CREATE TABLE public.cliente_interacoes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  usuario_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE SET NULL,

  -- Dados da interacao
  tipo text NOT NULL CHECK (tipo IN ('ligacao', 'email', 'visita', 'whatsapp', 'reuniao', 'outro')),
  descricao text NOT NULL,
  data timestamptz DEFAULT now(),

  -- Timestamps
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- 4. INDICES
-- ============================================================
CREATE INDEX idx_clientes_org ON public.clientes(organizacao_id);
CREATE INDEX idx_clientes_status ON public.clientes(organizacao_id, status);
CREATE INDEX idx_clientes_tipo ON public.clientes(organizacao_id, tipo);
CREATE INDEX idx_clientes_origem ON public.clientes(organizacao_id, origem);
CREATE INDEX idx_clientes_corretor ON public.clientes(corretor_id);
CREATE INDEX idx_clientes_nome ON public.clientes(organizacao_id, nome);
CREATE INDEX idx_cliente_interesses_cliente ON public.cliente_interesses(cliente_id);
CREATE INDEX idx_cliente_interacoes_cliente ON public.cliente_interacoes(cliente_id);
CREATE INDEX idx_cliente_interacoes_data ON public.cliente_interacoes(cliente_id, data DESC);

-- ============================================================
-- 5. TRIGGERS: atualizar updated_at (reutiliza funcao da migration 001)
-- ============================================================
CREATE TRIGGER trigger_updated_at_clientes
  BEFORE UPDATE ON public.clientes
  FOR EACH ROW EXECUTE FUNCTION public.atualizar_updated_at();

CREATE TRIGGER trigger_updated_at_cliente_interesses
  BEFORE UPDATE ON public.cliente_interesses
  FOR EACH ROW EXECUTE FUNCTION public.atualizar_updated_at();

-- ============================================================
-- 6. RLS — HABILITAR
-- ============================================================
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cliente_interesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cliente_interacoes ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 7. RLS — POLICIES CLIENTES
-- ============================================================

-- Usuarios veem clientes da propria organizacao
CREATE POLICY "usuarios_veem_clientes_org" ON public.clientes
  FOR SELECT USING (
    organizacao_id = (SELECT organizacao_id FROM public.usuarios WHERE id = auth.uid())
  );

-- Usuarios inserem clientes na propria organizacao
CREATE POLICY "usuarios_inserem_clientes" ON public.clientes
  FOR INSERT WITH CHECK (
    organizacao_id = (SELECT organizacao_id FROM public.usuarios WHERE id = auth.uid())
  );

-- Corretor atualiza seus proprios clientes, admin/gerente atualiza qualquer um da org
CREATE POLICY "usuarios_atualizam_clientes" ON public.clientes
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

-- Admin pode excluir clientes da organizacao
CREATE POLICY "admin_exclui_clientes" ON public.clientes
  FOR DELETE USING (
    organizacao_id = (SELECT organizacao_id FROM public.usuarios WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE id = auth.uid() AND cargo = 'admin'
    )
  );

-- ============================================================
-- 8. RLS — POLICIES CLIENTE_INTERESSES (via join com clientes)
-- ============================================================

-- Usuarios veem interesses de clientes da propria org
CREATE POLICY "usuarios_veem_interesses" ON public.cliente_interesses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.clientes
      WHERE id = cliente_id
      AND organizacao_id = (SELECT organizacao_id FROM public.usuarios WHERE id = auth.uid())
    )
  );

-- Usuarios inserem interesses em clientes da propria org
CREATE POLICY "usuarios_inserem_interesses" ON public.cliente_interesses
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clientes
      WHERE id = cliente_id
      AND organizacao_id = (SELECT organizacao_id FROM public.usuarios WHERE id = auth.uid())
    )
  );

-- Usuarios atualizam interesses de clientes da propria org
CREATE POLICY "usuarios_atualizam_interesses" ON public.cliente_interesses
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.clientes
      WHERE id = cliente_id
      AND organizacao_id = (SELECT organizacao_id FROM public.usuarios WHERE id = auth.uid())
    )
  );

-- Usuarios excluem interesses de clientes da propria org
CREATE POLICY "usuarios_excluem_interesses" ON public.cliente_interesses
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.clientes
      WHERE id = cliente_id
      AND organizacao_id = (SELECT organizacao_id FROM public.usuarios WHERE id = auth.uid())
    )
  );

-- ============================================================
-- 9. RLS — POLICIES CLIENTE_INTERACOES (via join com clientes)
-- ============================================================

-- Usuarios veem interacoes de clientes da propria org
CREATE POLICY "usuarios_veem_interacoes" ON public.cliente_interacoes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.clientes
      WHERE id = cliente_id
      AND organizacao_id = (SELECT organizacao_id FROM public.usuarios WHERE id = auth.uid())
    )
  );

-- Usuarios inserem interacoes em clientes da propria org
CREATE POLICY "usuarios_inserem_interacoes" ON public.cliente_interacoes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clientes
      WHERE id = cliente_id
      AND organizacao_id = (SELECT organizacao_id FROM public.usuarios WHERE id = auth.uid())
    )
  );

-- Usuarios excluem interacoes de clientes da propria org
CREATE POLICY "usuarios_excluem_interacoes" ON public.cliente_interacoes
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.clientes
      WHERE id = cliente_id
      AND organizacao_id = (SELECT organizacao_id FROM public.usuarios WHERE id = auth.uid())
    )
  );
