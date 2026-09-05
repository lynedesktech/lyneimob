-- Migration 044: Impede mover negocios e atividades pra outra organizacao (SEC-08)
--
-- PROBLEMA
-- As policies negocios_update e atividades_update (migration 019) tem a forma
--   USING (dono OR (organizacao = minha_org AND cargo admin/gerente))
-- e nao declaram WITH CHECK. Quando o WITH CHECK e omitido, o Postgres
-- reaproveita a expressao do USING pra validar a LINHA RESULTANTE.
--
-- Como o primeiro ramo (corretor_id = auth.uid() / usuario_id = auth.uid()) nao
-- amarra a organizacao, a validacao da linha nova passa mesmo com o
-- organizacao_id trocado — basta o usuario continuar sendo o dono do registro.
--
-- Consequencia: o dono de um negocio troca o organizacao_id da propria linha e
-- injeta no funil de outra imobiliaria um card com titulo e valor escolhidos por
-- ele. O mesmo vale pra atividades na agenda alheia.
--
-- SOLUCAO
-- Manter o USING como esta (quem pode editar continua o mesmo) e declarar um
-- WITH CHECK explicito que sempre exige a organizacao do proprio usuario na
-- linha resultante. Assim o registro nunca muda de dono organizacional.

-- ============================================================
-- negocios
-- ============================================================

DROP POLICY IF EXISTS "negocios_update" ON public.negocios;
CREATE POLICY "negocios_update" ON public.negocios
  FOR UPDATE
  USING (
    corretor_id = auth.uid()
    OR (
      organizacao_id = public.organizacao_id_do_usuario()
      AND EXISTS (
        SELECT 1 FROM public.usuarios
        WHERE id = auth.uid() AND cargo IN ('admin', 'gerente')
      )
    )
  )
  WITH CHECK (
    organizacao_id = public.organizacao_id_do_usuario()
  );

-- ============================================================
-- atividades
-- ============================================================

DROP POLICY IF EXISTS "atividades_update" ON public.atividades;
CREATE POLICY "atividades_update" ON public.atividades
  FOR UPDATE
  USING (
    usuario_id = auth.uid()
    OR (
      organizacao_id = public.organizacao_id_do_usuario()
      AND EXISTS (
        SELECT 1 FROM public.usuarios
        WHERE id = auth.uid() AND cargo IN ('admin', 'gerente')
      )
    )
  )
  WITH CHECK (
    organizacao_id = public.organizacao_id_do_usuario()
  );
