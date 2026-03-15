-- ============================================================
-- Migration 001: Tabelas organizacoes + usuarios
-- Base do multi-tenancy com RLS
-- ============================================================

-- ============================================================
-- 1. TABELA ORGANIZACOES (tenant principal)
-- ============================================================
CREATE TABLE public.organizacoes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL,
  slug text UNIQUE NOT NULL,
  logo_url text,
  telefone text,
  email text,
  endereco jsonb,
  creci text,

  -- Stripe (billing)
  stripe_customer_id text,
  stripe_subscription_id text,
  plano text DEFAULT 'trial' CHECK (plano IN ('trial', 'crm_ia', 'crm_ia_sdr')),
  plano_status text DEFAULT 'trialing' CHECK (plano_status IN ('active', 'past_due', 'canceled', 'trialing')),
  limites jsonb DEFAULT '{"max_corretores": 5, "max_imoveis": 300, "max_conversas_ia_mes": 200}'::jsonb,

  -- Configuracoes
  configuracoes_site jsonb DEFAULT '{}'::jsonb,
  configuracoes_ia jsonb DEFAULT '{}'::jsonb,

  -- WhatsApp
  whatsapp_numero text,
  whatsapp_token text,

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- 2. TABELA USUARIOS (corretores e admins)
-- ============================================================
CREATE TABLE public.usuarios (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organizacao_id uuid NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  nome text NOT NULL,
  email text NOT NULL,
  telefone text,
  cargo text DEFAULT 'admin' CHECK (cargo IN ('admin', 'corretor', 'gerente')),
  avatar_url text,
  creci text,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- 3. INDICES
-- ============================================================
CREATE INDEX idx_org_slug ON public.organizacoes(slug);
CREATE INDEX idx_usuarios_org ON public.usuarios(organizacao_id);

-- ============================================================
-- 4. FUNCAO: atualizar updated_at automaticamente
-- ============================================================
CREATE OR REPLACE FUNCTION public.atualizar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_updated_at_organizacoes
  BEFORE UPDATE ON public.organizacoes
  FOR EACH ROW EXECUTE FUNCTION public.atualizar_updated_at();

-- ============================================================
-- 5. RLS — HABILITAR
-- ============================================================
ALTER TABLE public.organizacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 6. RLS — POLICIES ORGANIZACOES
-- ============================================================

-- Usuarios veem sua propria organizacao
CREATE POLICY "usuarios_veem_propria_org" ON public.organizacoes
  FOR SELECT USING (
    id = (SELECT organizacao_id FROM public.usuarios WHERE id = auth.uid())
  );

-- Admins podem atualizar sua propria org
CREATE POLICY "admin_atualiza_propria_org" ON public.organizacoes
  FOR UPDATE USING (
    id = (SELECT organizacao_id FROM public.usuarios WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE id = auth.uid() AND cargo = 'admin'
    )
  );

-- ============================================================
-- 7. RLS — POLICIES USUARIOS
-- ============================================================

-- Usuarios veem colegas da mesma organizacao
CREATE POLICY "usuarios_veem_mesma_org" ON public.usuarios
  FOR SELECT USING (
    organizacao_id = (SELECT organizacao_id FROM public.usuarios WHERE id = auth.uid())
  );

-- Admins podem inserir usuarios na mesma org
CREATE POLICY "admin_insere_usuario" ON public.usuarios
  FOR INSERT WITH CHECK (
    organizacao_id = (SELECT organizacao_id FROM public.usuarios WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE id = auth.uid() AND cargo = 'admin'
    )
  );

-- Admins podem atualizar usuarios da mesma org
CREATE POLICY "admin_atualiza_usuario" ON public.usuarios
  FOR UPDATE USING (
    organizacao_id = (SELECT organizacao_id FROM public.usuarios WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE id = auth.uid() AND cargo = 'admin'
    )
  );

-- ============================================================
-- 8. TRIGGER: criar organizacao + usuario apos signup
-- Roda com SECURITY DEFINER (bypassa RLS)
-- ============================================================
CREATE OR REPLACE FUNCTION public.criar_usuario_e_organizacao()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  nova_org_id uuid;
  slug_gerado text;
  nome_org text;
BEGIN
  -- Pegar nome da organizacao do metadata (ou usar padrao)
  nome_org := coalesce(NEW.raw_user_meta_data->>'nome_organizacao', 'Minha Imobiliária');

  -- Gerar slug: nome em minusculo, sem acentos, com hifens + 8 chars do UUID
  slug_gerado := lower(regexp_replace(
    translate(
      nome_org,
      'áàâãéèêíìîóòôõúùûçÁÀÂÃÉÈÊÍÌÎÓÒÔÕÚÙÛÇ',
      'aaaaeeeiiioooouuucAAAAEEEIIIOOOOUUUC'
    ),
    '[^a-z0-9]+', '-', 'g'
  ));
  -- Remover hifens no inicio e fim
  slug_gerado := trim(both '-' from slug_gerado);
  -- Adicionar sufixo unico
  slug_gerado := slug_gerado || '-' || substring(NEW.id::text from 1 for 8);

  -- Criar organizacao
  INSERT INTO public.organizacoes (nome, slug)
  VALUES (nome_org, slug_gerado)
  RETURNING id INTO nova_org_id;

  -- Criar usuario vinculado a organizacao
  INSERT INTO public.usuarios (id, organizacao_id, nome, email, cargo)
  VALUES (
    NEW.id,
    nova_org_id,
    coalesce(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    NEW.email,
    'admin'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.criar_usuario_e_organizacao();
