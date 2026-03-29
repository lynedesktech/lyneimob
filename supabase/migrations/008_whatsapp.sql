-- ============================================================
-- Migration 008: Tabelas do agente SDR WhatsApp
-- Configuração, conversas e mensagens com RLS multi-tenant
-- ============================================================

-- ============================================================
-- 1. TABELA CONFIG_WHATSAPP
-- Configuração da integração WhatsApp por organização (1 por org)
-- ============================================================
CREATE TABLE public.config_whatsapp (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organizacao_id uuid NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,

  -- Credenciais Uazapi
  uazapi_url text NOT NULL,
  uazapi_token text NOT NULL,
  numero_whatsapp text NOT NULL,

  -- Estado do agente
  ativo boolean DEFAULT false,

  -- Personalização do agente
  prompt_personalizado text,
  horario_atendimento jsonb,
  mensagem_fora_horario text,

  -- Corretor padrão para receber leads
  corretor_padrao_id uuid REFERENCES public.usuarios(id) ON DELETE SET NULL,

  -- Timestamps
  criado_em timestamptz DEFAULT now(),
  atualizado_em timestamptz DEFAULT now(),

  -- Uma config por organização
  CONSTRAINT config_whatsapp_org_unique UNIQUE (organizacao_id)
);

-- Funcao auxiliar para tabelas que usam atualizado_em (portugues)
CREATE OR REPLACE FUNCTION public.atualizar_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger atualizado_em
CREATE TRIGGER trigger_config_whatsapp_updated_at
  BEFORE UPDATE ON public.config_whatsapp
  FOR EACH ROW EXECUTE FUNCTION public.atualizar_atualizado_em();

-- ============================================================
-- 2. TABELA CONVERSAS_WHATSAPP
-- Uma conversa = um contato do WhatsApp com a imobiliária
-- ============================================================
CREATE TABLE public.conversas_whatsapp (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organizacao_id uuid NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,

  -- Dados do contato
  numero_cliente text NOT NULL,
  nome_cliente text,
  foto_url text,

  -- Status da conversa
  status text DEFAULT 'em_andamento' CHECK (status IN ('em_andamento', 'qualificado', 'encaminhado', 'finalizado', 'arquivado')),

  -- IA
  resumo_ia text,
  qualificacao jsonb,

  -- Vinculações com CRM
  cliente_id uuid REFERENCES public.clientes(id) ON DELETE SET NULL,
  negocio_id uuid REFERENCES public.negocios(id) ON DELETE SET NULL,
  corretor_id uuid REFERENCES public.usuarios(id) ON DELETE SET NULL,

  -- Controle temporal
  ultima_mensagem_em timestamptz DEFAULT now(),
  criado_em timestamptz DEFAULT now(),
  atualizado_em timestamptz DEFAULT now()
);

-- Trigger atualizado_em
CREATE TRIGGER trigger_conversas_whatsapp_updated_at
  BEFORE UPDATE ON public.conversas_whatsapp
  FOR EACH ROW EXECUTE FUNCTION public.atualizar_atualizado_em();

-- ============================================================
-- 3. TABELA MENSAGENS_WHATSAPP
-- Cada mensagem enviada ou recebida na conversa
-- ============================================================
CREATE TABLE public.mensagens_whatsapp (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  conversa_id uuid NOT NULL REFERENCES public.conversas_whatsapp(id) ON DELETE CASCADE,
  organizacao_id uuid NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,

  -- Direção e tipo
  direcao text NOT NULL CHECK (direcao IN ('recebida', 'enviada')),
  tipo_conteudo text NOT NULL CHECK (tipo_conteudo IN ('texto', 'audio', 'imagem', 'documento', 'video', 'sticker', 'localizacao')),

  -- Conteúdo
  conteudo text,
  conteudo_original text,
  midia_url text,

  -- Deduplicação
  message_id_whatsapp text,

  -- Metadados extras
  metadata jsonb,

  -- Timestamp
  criado_em timestamptz DEFAULT now()
);

-- ============================================================
-- 4. RLS — CONFIG_WHATSAPP
-- Apenas admin pode gerenciar configuração
-- ============================================================
ALTER TABLE public.config_whatsapp ENABLE ROW LEVEL SECURITY;

CREATE POLICY "config_whatsapp_select"
  ON public.config_whatsapp
  FOR SELECT USING (
    organizacao_id IN (
      SELECT organizacao_id FROM public.usuarios WHERE id = auth.uid()
    )
  );

CREATE POLICY "config_whatsapp_insert"
  ON public.config_whatsapp
  FOR INSERT WITH CHECK (
    organizacao_id IN (
      SELECT organizacao_id FROM public.usuarios
      WHERE id = auth.uid() AND cargo = 'admin'
    )
  );

CREATE POLICY "config_whatsapp_update"
  ON public.config_whatsapp
  FOR UPDATE USING (
    organizacao_id IN (
      SELECT organizacao_id FROM public.usuarios
      WHERE id = auth.uid() AND cargo = 'admin'
    )
  );

CREATE POLICY "config_whatsapp_delete"
  ON public.config_whatsapp
  FOR DELETE USING (
    organizacao_id IN (
      SELECT organizacao_id FROM public.usuarios
      WHERE id = auth.uid() AND cargo = 'admin'
    )
  );

-- ============================================================
-- 5. RLS — CONVERSAS_WHATSAPP
-- ============================================================
ALTER TABLE public.conversas_whatsapp ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conversas_whatsapp_select"
  ON public.conversas_whatsapp
  FOR SELECT USING (
    organizacao_id IN (
      SELECT organizacao_id FROM public.usuarios WHERE id = auth.uid()
    )
  );

CREATE POLICY "conversas_whatsapp_insert"
  ON public.conversas_whatsapp
  FOR INSERT WITH CHECK (
    organizacao_id IN (
      SELECT organizacao_id FROM public.usuarios WHERE id = auth.uid()
    )
  );

CREATE POLICY "conversas_whatsapp_update"
  ON public.conversas_whatsapp
  FOR UPDATE USING (
    organizacao_id IN (
      SELECT organizacao_id FROM public.usuarios
      WHERE id = auth.uid() AND cargo IN ('admin', 'gerente')
    )
  );

CREATE POLICY "conversas_whatsapp_delete"
  ON public.conversas_whatsapp
  FOR DELETE USING (
    organizacao_id IN (
      SELECT organizacao_id FROM public.usuarios
      WHERE id = auth.uid() AND cargo IN ('admin', 'gerente')
    )
  );

-- ============================================================
-- 6. RLS — MENSAGENS_WHATSAPP
-- ============================================================
ALTER TABLE public.mensagens_whatsapp ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mensagens_whatsapp_select"
  ON public.mensagens_whatsapp
  FOR SELECT USING (
    organizacao_id IN (
      SELECT organizacao_id FROM public.usuarios WHERE id = auth.uid()
    )
  );

CREATE POLICY "mensagens_whatsapp_insert"
  ON public.mensagens_whatsapp
  FOR INSERT WITH CHECK (
    organizacao_id IN (
      SELECT organizacao_id FROM public.usuarios WHERE id = auth.uid()
    )
  );

CREATE POLICY "mensagens_whatsapp_delete"
  ON public.mensagens_whatsapp
  FOR DELETE USING (
    organizacao_id IN (
      SELECT organizacao_id FROM public.usuarios
      WHERE id = auth.uid() AND cargo IN ('admin', 'gerente')
    )
  );

-- ============================================================
-- 7. INDICES
-- ============================================================

-- Config
CREATE INDEX idx_config_whatsapp_org ON public.config_whatsapp(organizacao_id);
CREATE INDEX idx_config_whatsapp_numero ON public.config_whatsapp(numero_whatsapp);

-- Conversas
CREATE INDEX idx_conversas_whatsapp_org ON public.conversas_whatsapp(organizacao_id);
CREATE INDEX idx_conversas_whatsapp_numero ON public.conversas_whatsapp(organizacao_id, numero_cliente);
CREATE INDEX idx_conversas_whatsapp_status ON public.conversas_whatsapp(organizacao_id, status);
CREATE INDEX idx_conversas_whatsapp_ultima_msg ON public.conversas_whatsapp(organizacao_id, ultima_mensagem_em DESC);
CREATE INDEX idx_conversas_whatsapp_cliente ON public.conversas_whatsapp(cliente_id);
CREATE INDEX idx_conversas_whatsapp_negocio ON public.conversas_whatsapp(negocio_id);

-- Mensagens
CREATE INDEX idx_mensagens_whatsapp_conversa ON public.mensagens_whatsapp(conversa_id, criado_em);
CREATE INDEX idx_mensagens_whatsapp_org ON public.mensagens_whatsapp(organizacao_id);
CREATE UNIQUE INDEX idx_mensagens_whatsapp_dedup ON public.mensagens_whatsapp(message_id_whatsapp)
  WHERE message_id_whatsapp IS NOT NULL;
