-- ============================================================
-- Migration 006: Tabela leads_portais
-- Leads recebidos via webhook dos portais imobiliarios
-- ============================================================

-- ============================================================
-- 1. TABELA LEADS_PORTAIS
-- ============================================================
CREATE TABLE public.leads_portais (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organizacao_id uuid NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,

  -- Origem
  portal text NOT NULL CHECK (portal IN ('zap', 'olx', 'vivareal', 'imovelweb', 'site', 'whatsapp', 'outro')),
  payload_original jsonb, -- JSON cru do webhook (para debug e reprocessamento)

  -- Dados normalizados do lead
  nome text,
  email text,
  telefone text,
  mensagem text,

  -- Vinculacao com imovel (pelo codigo interno)
  imovel_codigo text, -- codigo do imovel referenciado no lead
  imovel_id uuid REFERENCES public.imoveis(id) ON DELETE SET NULL,

  -- Vinculacao apos processamento
  cliente_id uuid REFERENCES public.clientes(id) ON DELETE SET NULL,
  negocio_id uuid REFERENCES public.negocios(id) ON DELETE SET NULL,

  -- Status do lead
  status text DEFAULT 'novo' CHECK (status IN ('novo', 'processado', 'descartado', 'erro')),
  erro_processamento text, -- mensagem de erro caso falhe o processamento
  processado_em timestamptz,

  -- Timestamps
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- 2. RLS — LEADS_PORTAIS
-- ============================================================
ALTER TABLE public.leads_portais ENABLE ROW LEVEL SECURITY;

-- SELECT: usuarios da organizacao
CREATE POLICY "leads_portais_select"
  ON public.leads_portais
  FOR SELECT USING (
    organizacao_id IN (
      SELECT organizacao_id FROM public.usuarios WHERE id = auth.uid()
    )
  );

-- INSERT: via service role (webhook) — nao precisa de policy de insert para usuarios
-- O webhook usa o cliente admin que bypassa RLS

-- UPDATE: admins e gerentes (processar/descartar leads)
CREATE POLICY "leads_portais_update"
  ON public.leads_portais
  FOR UPDATE USING (
    organizacao_id IN (
      SELECT organizacao_id FROM public.usuarios
      WHERE id = auth.uid() AND cargo IN ('admin', 'gerente')
    )
  );

-- DELETE: apenas admins
CREATE POLICY "leads_portais_delete"
  ON public.leads_portais
  FOR DELETE USING (
    organizacao_id IN (
      SELECT organizacao_id FROM public.usuarios
      WHERE id = auth.uid() AND cargo = 'admin'
    )
  );

-- ============================================================
-- 3. INDICES
-- ============================================================
CREATE INDEX idx_leads_portais_org ON public.leads_portais(organizacao_id);
CREATE INDEX idx_leads_portais_status ON public.leads_portais(organizacao_id, status);
CREATE INDEX idx_leads_portais_portal ON public.leads_portais(organizacao_id, portal);
CREATE INDEX idx_leads_portais_created ON public.leads_portais(organizacao_id, created_at DESC);
CREATE INDEX idx_leads_portais_email ON public.leads_portais(organizacao_id, email);
CREATE INDEX idx_leads_portais_imovel ON public.leads_portais(imovel_id);
