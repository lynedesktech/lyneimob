-- Migration 030: Permitir que usuários atualizem seus próprios campos de onboarding
-- Problema: A policy "admin_atualiza_usuario" só permite update por admins.
-- Corretores e gerentes não conseguiam marcar progresso do tour/checklist.

CREATE POLICY "usuario_atualiza_proprio_onboarding" ON public.usuarios
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());
