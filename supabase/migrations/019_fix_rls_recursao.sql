-- =============================================================================
-- Migration 019: Fix RLS recursion on usuarios table
-- =============================================================================
-- Problema: A policy "usuarios_veem_mesma_org" faz um SELECT na própria tabela
-- usuarios para buscar o organizacao_id, causando recursão infinita no PostgreSQL.
-- Solução: Criar uma função SECURITY DEFINER que busca o organizacao_id direto
-- sem passar pela RLS, e usá-la em todas as policies.
-- =============================================================================

-- 1. Criar função helper que retorna o organizacao_id do usuário logado
-- SECURITY DEFINER = roda com permissões do owner (bypassa RLS)
CREATE OR REPLACE FUNCTION public.organizacao_id_do_usuario()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organizacao_id FROM public.usuarios WHERE id = auth.uid()
$$;

-- 2. Recriar policy de SELECT em usuarios (era recursiva)
DROP POLICY IF EXISTS "usuarios_veem_mesma_org" ON public.usuarios;
CREATE POLICY "usuarios_veem_mesma_org" ON public.usuarios
  FOR SELECT USING (
    organizacao_id = public.organizacao_id_do_usuario()
  );

-- 3. Recriar policy de UPDATE em usuarios
DROP POLICY IF EXISTS "admin_atualiza_usuario" ON public.usuarios;
CREATE POLICY "admin_atualiza_usuario" ON public.usuarios
  FOR UPDATE USING (
    organizacao_id = public.organizacao_id_do_usuario()
    AND EXISTS (
      SELECT 1 FROM public.usuarios u
      WHERE u.id = auth.uid() AND u.cargo = 'admin'
    )
  );

-- 4. Recriar policy de INSERT em usuarios
DROP POLICY IF EXISTS "admin_insere_usuario" ON public.usuarios;
CREATE POLICY "admin_insere_usuario" ON public.usuarios
  FOR INSERT WITH CHECK (
    organizacao_id = public.organizacao_id_do_usuario()
    AND EXISTS (
      SELECT 1 FROM public.usuarios u
      WHERE u.id = auth.uid() AND u.cargo = 'admin'
    )
  );

-- 5. Recriar policies de organizacoes
DROP POLICY IF EXISTS "usuarios_veem_propria_org" ON public.organizacoes;
CREATE POLICY "usuarios_veem_propria_org" ON public.organizacoes
  FOR SELECT USING (
    id = public.organizacao_id_do_usuario()
  );

DROP POLICY IF EXISTS "admin_atualiza_propria_org" ON public.organizacoes;
CREATE POLICY "admin_atualiza_propria_org" ON public.organizacoes
  FOR UPDATE USING (
    id = public.organizacao_id_do_usuario()
    AND EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE id = auth.uid() AND cargo = 'admin'
    )
  );

-- 6. Recriar policies de imoveis
DROP POLICY IF EXISTS "usuarios_veem_imoveis_org" ON public.imoveis;
CREATE POLICY "usuarios_veem_imoveis_org" ON public.imoveis
  FOR SELECT USING (
    organizacao_id = public.organizacao_id_do_usuario()
  );

DROP POLICY IF EXISTS "usuarios_atualizam_imoveis" ON public.imoveis;
CREATE POLICY "usuarios_atualizam_imoveis" ON public.imoveis
  FOR UPDATE USING (
    organizacao_id = public.organizacao_id_do_usuario()
    AND (
      corretor_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.usuarios
        WHERE id = auth.uid() AND cargo IN ('admin', 'gerente')
      )
    )
  );

DROP POLICY IF EXISTS "admin_exclui_imoveis" ON public.imoveis;
CREATE POLICY "admin_exclui_imoveis" ON public.imoveis
  FOR DELETE USING (
    organizacao_id = public.organizacao_id_do_usuario()
    AND EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE id = auth.uid() AND cargo = 'admin'
    )
  );

-- 7. Recriar policies de clientes
DROP POLICY IF EXISTS "usuarios_veem_clientes_org" ON public.clientes;
CREATE POLICY "usuarios_veem_clientes_org" ON public.clientes
  FOR SELECT USING (
    organizacao_id = public.organizacao_id_do_usuario()
  );

DROP POLICY IF EXISTS "usuarios_atualizam_clientes" ON public.clientes;
CREATE POLICY "usuarios_atualizam_clientes" ON public.clientes
  FOR UPDATE USING (
    organizacao_id = public.organizacao_id_do_usuario()
    AND (
      corretor_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.usuarios
        WHERE id = auth.uid() AND cargo IN ('admin', 'gerente')
      )
    )
  );

DROP POLICY IF EXISTS "admin_exclui_clientes" ON public.clientes;
CREATE POLICY "admin_exclui_clientes" ON public.clientes
  FOR DELETE USING (
    organizacao_id = public.organizacao_id_do_usuario()
    AND EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE id = auth.uid() AND cargo = 'admin'
    )
  );

-- 8. Recriar policies de negocios
DROP POLICY IF EXISTS "negocios_select" ON public.negocios;
CREATE POLICY "negocios_select" ON public.negocios
  FOR SELECT USING (
    organizacao_id = public.organizacao_id_do_usuario()
  );

DROP POLICY IF EXISTS "negocios_update" ON public.negocios;
CREATE POLICY "negocios_update" ON public.negocios
  FOR UPDATE USING (
    corretor_id = auth.uid()
    OR (
      organizacao_id = public.organizacao_id_do_usuario()
      AND EXISTS (
        SELECT 1 FROM public.usuarios
        WHERE id = auth.uid() AND cargo IN ('admin', 'gerente')
      )
    )
  );

DROP POLICY IF EXISTS "negocios_delete" ON public.negocios;
CREATE POLICY "negocios_delete" ON public.negocios
  FOR DELETE USING (
    organizacao_id = public.organizacao_id_do_usuario()
    AND EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE id = auth.uid() AND cargo = 'admin'
    )
  );

-- 9. Recriar policies de atividades
DROP POLICY IF EXISTS "atividades_select" ON public.atividades;
CREATE POLICY "atividades_select" ON public.atividades
  FOR SELECT USING (
    organizacao_id = public.organizacao_id_do_usuario()
  );

DROP POLICY IF EXISTS "atividades_update" ON public.atividades;
CREATE POLICY "atividades_update" ON public.atividades
  FOR UPDATE USING (
    usuario_id = auth.uid()
    OR (
      organizacao_id = public.organizacao_id_do_usuario()
      AND EXISTS (
        SELECT 1 FROM public.usuarios
        WHERE id = auth.uid() AND cargo IN ('admin', 'gerente')
      )
    )
  );

DROP POLICY IF EXISTS "atividades_delete" ON public.atividades;
CREATE POLICY "atividades_delete" ON public.atividades
  FOR DELETE USING (
    organizacao_id = public.organizacao_id_do_usuario()
    AND EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE id = auth.uid() AND cargo IN ('admin', 'gerente')
    )
  );

-- 10. Recriar policies de imovel_fotos
DROP POLICY IF EXISTS "usuarios_veem_fotos" ON public.imovel_fotos;
CREATE POLICY "usuarios_veem_fotos" ON public.imovel_fotos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.imoveis
      WHERE imoveis.id = imovel_fotos.imovel_id
      AND imoveis.organizacao_id = public.organizacao_id_do_usuario()
    )
  );

DROP POLICY IF EXISTS "usuarios_atualizam_fotos" ON public.imovel_fotos;
CREATE POLICY "usuarios_atualizam_fotos" ON public.imovel_fotos
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.imoveis
      WHERE imoveis.id = imovel_fotos.imovel_id
      AND imoveis.organizacao_id = public.organizacao_id_do_usuario()
    )
  );

DROP POLICY IF EXISTS "usuarios_excluem_fotos" ON public.imovel_fotos;
CREATE POLICY "usuarios_excluem_fotos" ON public.imovel_fotos
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.imoveis
      WHERE imoveis.id = imovel_fotos.imovel_id
      AND imoveis.organizacao_id = public.organizacao_id_do_usuario()
    )
  );

-- 11. Recriar policies de cliente_interesses
DROP POLICY IF EXISTS "usuarios_veem_interesses" ON public.cliente_interesses;
CREATE POLICY "usuarios_veem_interesses" ON public.cliente_interesses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.clientes
      WHERE clientes.id = cliente_interesses.cliente_id
      AND clientes.organizacao_id = public.organizacao_id_do_usuario()
    )
  );

DROP POLICY IF EXISTS "usuarios_atualizam_interesses" ON public.cliente_interesses;
CREATE POLICY "usuarios_atualizam_interesses" ON public.cliente_interesses
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.clientes
      WHERE clientes.id = cliente_interesses.cliente_id
      AND clientes.organizacao_id = public.organizacao_id_do_usuario()
    )
  );

DROP POLICY IF EXISTS "usuarios_excluem_interesses" ON public.cliente_interesses;
CREATE POLICY "usuarios_excluem_interesses" ON public.cliente_interesses
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.clientes
      WHERE clientes.id = cliente_interesses.cliente_id
      AND clientes.organizacao_id = public.organizacao_id_do_usuario()
    )
  );

-- 12. Recriar policies de cliente_interacoes
DROP POLICY IF EXISTS "usuarios_veem_interacoes" ON public.cliente_interacoes;
CREATE POLICY "usuarios_veem_interacoes" ON public.cliente_interacoes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.clientes
      WHERE clientes.id = cliente_interacoes.cliente_id
      AND clientes.organizacao_id = public.organizacao_id_do_usuario()
    )
  );

DROP POLICY IF EXISTS "usuarios_excluem_interacoes" ON public.cliente_interacoes;
CREATE POLICY "usuarios_excluem_interacoes" ON public.cliente_interacoes
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.clientes
      WHERE clientes.id = cliente_interacoes.cliente_id
      AND clientes.organizacao_id = public.organizacao_id_do_usuario()
    )
  );

-- 13. Recriar policies de convites
DROP POLICY IF EXISTS "admin_ve_convites" ON public.convites;
CREATE POLICY "admin_ve_convites" ON public.convites
  FOR SELECT USING (
    organizacao_id = public.organizacao_id_do_usuario()
    AND EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE id = auth.uid() AND cargo = 'admin'
    )
  );

DROP POLICY IF EXISTS "admin_atualiza_convite" ON public.convites;
CREATE POLICY "admin_atualiza_convite" ON public.convites
  FOR UPDATE USING (
    organizacao_id = public.organizacao_id_do_usuario()
    AND EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE id = auth.uid() AND cargo = 'admin'
    )
  );

DROP POLICY IF EXISTS "admin_deleta_convite" ON public.convites;
CREATE POLICY "admin_deleta_convite" ON public.convites
  FOR DELETE USING (
    organizacao_id = public.organizacao_id_do_usuario()
    AND EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE id = auth.uid() AND cargo = 'admin'
    )
  );

-- 14. Recriar policies de leads_portais
DROP POLICY IF EXISTS "leads_portais_select" ON public.leads_portais;
CREATE POLICY "leads_portais_select" ON public.leads_portais
  FOR SELECT USING (
    organizacao_id = public.organizacao_id_do_usuario()
  );

DROP POLICY IF EXISTS "leads_portais_update" ON public.leads_portais;
CREATE POLICY "leads_portais_update" ON public.leads_portais
  FOR UPDATE USING (
    organizacao_id = public.organizacao_id_do_usuario()
    AND EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE id = auth.uid() AND cargo IN ('admin', 'gerente')
    )
  );

DROP POLICY IF EXISTS "leads_portais_delete" ON public.leads_portais;
CREATE POLICY "leads_portais_delete" ON public.leads_portais
  FOR DELETE USING (
    organizacao_id = public.organizacao_id_do_usuario()
    AND EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE id = auth.uid() AND cargo = 'admin'
    )
  );

-- 15. Recriar policies de config_whatsapp
DROP POLICY IF EXISTS "config_whatsapp_select" ON public.config_whatsapp;
CREATE POLICY "config_whatsapp_select" ON public.config_whatsapp
  FOR SELECT USING (
    organizacao_id = public.organizacao_id_do_usuario()
  );

DROP POLICY IF EXISTS "config_whatsapp_update" ON public.config_whatsapp;
CREATE POLICY "config_whatsapp_update" ON public.config_whatsapp
  FOR UPDATE USING (
    organizacao_id = public.organizacao_id_do_usuario()
    AND EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE id = auth.uid() AND cargo = 'admin'
    )
  );

DROP POLICY IF EXISTS "config_whatsapp_delete" ON public.config_whatsapp;
CREATE POLICY "config_whatsapp_delete" ON public.config_whatsapp
  FOR DELETE USING (
    organizacao_id = public.organizacao_id_do_usuario()
    AND EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE id = auth.uid() AND cargo = 'admin'
    )
  );

-- 16. Recriar policies de conversas_whatsapp
DROP POLICY IF EXISTS "conversas_whatsapp_select" ON public.conversas_whatsapp;
CREATE POLICY "conversas_whatsapp_select" ON public.conversas_whatsapp
  FOR SELECT USING (
    organizacao_id = public.organizacao_id_do_usuario()
  );

DROP POLICY IF EXISTS "conversas_whatsapp_update" ON public.conversas_whatsapp;
CREATE POLICY "conversas_whatsapp_update" ON public.conversas_whatsapp
  FOR UPDATE USING (
    organizacao_id = public.organizacao_id_do_usuario()
    AND EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE id = auth.uid() AND cargo IN ('admin', 'gerente')
    )
  );

DROP POLICY IF EXISTS "conversas_whatsapp_delete" ON public.conversas_whatsapp;
CREATE POLICY "conversas_whatsapp_delete" ON public.conversas_whatsapp
  FOR DELETE USING (
    organizacao_id = public.organizacao_id_do_usuario()
    AND EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE id = auth.uid() AND cargo IN ('admin', 'gerente')
    )
  );

-- 17. Recriar policies de mensagens_whatsapp
DROP POLICY IF EXISTS "mensagens_whatsapp_select" ON public.mensagens_whatsapp;
CREATE POLICY "mensagens_whatsapp_select" ON public.mensagens_whatsapp
  FOR SELECT USING (
    organizacao_id = public.organizacao_id_do_usuario()
  );

DROP POLICY IF EXISTS "mensagens_whatsapp_delete" ON public.mensagens_whatsapp;
CREATE POLICY "mensagens_whatsapp_delete" ON public.mensagens_whatsapp
  FOR DELETE USING (
    organizacao_id = public.organizacao_id_do_usuario()
    AND EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE id = auth.uid() AND cargo IN ('admin', 'gerente')
    )
  );

-- 18. Recriar policies de pipeline_etapas
DROP POLICY IF EXISTS "pipeline_etapas_select" ON public.pipeline_etapas;
CREATE POLICY "pipeline_etapas_select" ON public.pipeline_etapas
  FOR SELECT USING (
    organizacao_id = public.organizacao_id_do_usuario()
  );

DROP POLICY IF EXISTS "pipeline_etapas_update" ON public.pipeline_etapas;
CREATE POLICY "pipeline_etapas_update" ON public.pipeline_etapas
  FOR UPDATE USING (
    organizacao_id = public.organizacao_id_do_usuario()
    AND EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE id = auth.uid() AND cargo IN ('admin', 'gerente')
    )
  );

DROP POLICY IF EXISTS "pipeline_etapas_delete" ON public.pipeline_etapas;
CREATE POLICY "pipeline_etapas_delete" ON public.pipeline_etapas
  FOR DELETE USING (
    organizacao_id = public.organizacao_id_do_usuario()
    AND EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE id = auth.uid() AND cargo = 'admin'
    )
  );

-- 19. Recriar policies de eventos_billing
DROP POLICY IF EXISTS "admin_ve_eventos_billing" ON public.eventos_billing;
CREATE POLICY "admin_ve_eventos_billing" ON public.eventos_billing
  FOR SELECT USING (
    organizacao_id = public.organizacao_id_do_usuario()
    AND EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE id = auth.uid() AND cargo = 'admin'
    )
  );

-- =============================================================================
-- Verificação: Garante que não existem mais policies com subquery recursiva
-- =============================================================================
-- Após esta migration, TODAS as policies usam public.organizacao_id_do_usuario()
-- em vez de (SELECT organizacao_id FROM usuarios WHERE id = auth.uid())
-- =============================================================================
