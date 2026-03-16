-- ============================================================
-- Migration 011: Tabela de convites para gestao de usuarios
-- Permite admins convidarem corretores e gerentes para a org
-- ============================================================

-- ============================================================
-- 1. TABELA CONVITES
-- ============================================================
CREATE TABLE public.convites (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organizacao_id uuid NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  convidado_por uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  email text NOT NULL,
  cargo text NOT NULL CHECK (cargo IN ('admin', 'corretor', 'gerente')),
  token text UNIQUE NOT NULL,
  status text DEFAULT 'pendente' CHECK (status IN ('pendente', 'aceito', 'expirado', 'revogado')),
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- 2. INDICES
-- ============================================================
CREATE INDEX idx_convites_org ON public.convites(organizacao_id);
CREATE INDEX idx_convites_token ON public.convites(token);
CREATE INDEX idx_convites_email ON public.convites(email);

-- ============================================================
-- 3. RLS
-- ============================================================
ALTER TABLE public.convites ENABLE ROW LEVEL SECURITY;

-- Admins veem convites da propria organizacao
CREATE POLICY "admin_ve_convites" ON public.convites
  FOR SELECT USING (
    organizacao_id = (SELECT organizacao_id FROM public.usuarios WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE id = auth.uid() AND cargo = 'admin'
    )
  );

-- Admins criam convites na propria organizacao
CREATE POLICY "admin_cria_convite" ON public.convites
  FOR INSERT WITH CHECK (
    organizacao_id = (SELECT organizacao_id FROM public.usuarios WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE id = auth.uid() AND cargo = 'admin'
    )
  );

-- Admins atualizam convites da propria organizacao (revogar)
CREATE POLICY "admin_atualiza_convite" ON public.convites
  FOR UPDATE USING (
    organizacao_id = (SELECT organizacao_id FROM public.usuarios WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE id = auth.uid() AND cargo = 'admin'
    )
  );

-- Admins podem deletar convites da propria organizacao
CREATE POLICY "admin_deleta_convite" ON public.convites
  FOR DELETE USING (
    organizacao_id = (SELECT organizacao_id FROM public.usuarios WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE id = auth.uid() AND cargo = 'admin'
    )
  );

-- ============================================================
-- 4. ATUALIZAR TRIGGER DE SIGNUP
-- Agora verifica se existe convite pendente antes de criar org
-- Se tiver convite, entra na org existente com o cargo do convite
-- Se nao tiver, cria org nova como admin (comportamento atual)
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
  convite_registro RECORD;
BEGIN
  -- Verificar se existe convite pendente para este email
  SELECT * INTO convite_registro
  FROM public.convites
  WHERE email = NEW.email
    AND status = 'pendente'
    AND expires_at > now()
  ORDER BY created_at DESC
  LIMIT 1;

  IF convite_registro IS NOT NULL THEN
    -- Convite encontrado: entrar na org existente
    INSERT INTO public.usuarios (id, organizacao_id, nome, email, cargo)
    VALUES (
      NEW.id,
      convite_registro.organizacao_id,
      coalesce(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
      NEW.email,
      convite_registro.cargo
    );

    -- Marcar convite como aceito
    UPDATE public.convites
    SET status = 'aceito'
    WHERE id = convite_registro.id;

    RETURN NEW;
  END IF;

  -- Sem convite: criar nova organizacao (comportamento original)
  nome_org := coalesce(NEW.raw_user_meta_data->>'nome_organizacao', 'Minha Imobiliaria');

  slug_gerado := lower(regexp_replace(
    translate(
      nome_org,
      'aaaaeeeiiiooooouuucAAAAEEEIIIOOOOUUUC',
      'aaaaeeeiiiooooouuucAAAAEEEIIIOOOOUUUC'
    ),
    '[^a-z0-9]+', '-', 'g'
  ));
  slug_gerado := trim(both '-' from slug_gerado);
  slug_gerado := slug_gerado || '-' || substring(NEW.id::text from 1 for 8);

  INSERT INTO public.organizacoes (nome, slug)
  VALUES (nome_org, slug_gerado)
  RETURNING id INTO nova_org_id;

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
