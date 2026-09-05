-- Migration 042: Fecha a escalacao de privilegio na tabela usuarios (SEC-01)
--
-- PROBLEMA
-- A migration 030 criou a policy "usuario_atualiza_proprio_onboarding":
--   FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid())
-- A intencao era deixar o usuario marcar o proprio checklist de boas-vindas.
-- Mas RLS no Postgres age por LINHA, nao por COLUNA: a policy liberou o usuario
-- a alterar QUALQUER coluna da propria linha, inclusive cargo, organizacao_id,
-- perfil_plataforma, super_admin e ativo.
--
-- A corrente completa do ataque:
--   1. corretor faz UPDATE usuarios SET perfil_plataforma = 'super_admin'
--      WHERE id = <proprio id>   -> permitido pela policy da 030
--   2. o trigger trg_sincronizar_super_admin (migration 034) ve o novo perfil
--      e seta super_admin = true automaticamente
--   3. as policies perfil_plataforma_ver_todas_organizacoes e
--      perfil_plataforma_ver_todos_usuarios (migrations 034/035) liberam leitura
--      de TODAS as organizacoes e TODOS os usuarios da plataforma
-- Resultado: qualquer usuario cadastrado le a base inteira de todos os clientes.
--
-- SOLUCAO
-- A policy da 030 continua valendo (o auto-update de onboarding e perfil e
-- legitimo), mas um trigger BEFORE UPDATE devolve as colunas sensiveis ao valor
-- anterior sempre que o proprio dono da linha for quem esta atualizando.
--
-- Por que devolver o valor em vez de levantar excecao: o PostgREST costuma
-- enviar a linha inteira no UPDATE, entao levantar erro quebraria updates
-- legitimos que apenas repetem o valor atual das colunas protegidas.
--
-- Quem NAO e afetado pelo trigger:
--   - service_role (cliente admin): auth.uid() e NULL, a condicao nao bate
--   - admin alterando OUTRO usuario: auth.uid() <> NEW.id, a condicao nao bate
-- Ou seja, gerenciamento de equipe pela tela de Configuracoes segue funcionando.

CREATE OR REPLACE FUNCTION public.proteger_colunas_sensiveis_usuario()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Só interfere quando o usuário está atualizando a própria linha.
  IF auth.uid() IS NOT NULL AND auth.uid() = NEW.id THEN
    NEW.cargo              := OLD.cargo;
    NEW.organizacao_id     := OLD.organizacao_id;
    NEW.perfil_plataforma  := OLD.perfil_plataforma;
    NEW.super_admin        := OLD.super_admin;
    NEW.ativo              := OLD.ativo;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.proteger_colunas_sensiveis_usuario() IS
  'Impede que um usuario altere o proprio cargo, organizacao, perfil de plataforma, super_admin ou status. Complementa a policy usuario_atualiza_proprio_onboarding (migration 030), que libera a linha inteira.';

-- O nome ordena antes de trg_sincronizar_super_admin, mas a protecao e correta
-- em qualquer ordem: se o trigger de sincronia rodar primeiro, este devolve
-- perfil_plataforma E super_admin aos valores antigos logo em seguida.
DROP TRIGGER IF EXISTS trg_proteger_colunas_sensiveis_usuario ON public.usuarios;
CREATE TRIGGER trg_proteger_colunas_sensiveis_usuario
  BEFORE UPDATE ON public.usuarios
  FOR EACH ROW
  EXECUTE FUNCTION public.proteger_colunas_sensiveis_usuario();
