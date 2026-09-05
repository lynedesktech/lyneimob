-- Migration 043: Escopa os buckets de Storage por organizacao (SEC-06)
--
-- PROBLEMA
-- As policies de escrita dos tres buckets publicos exigiam apenas
--   bucket_id = '<bucket>' AND auth.uid() IS NOT NULL
-- ou seja: "estar logado". Nao havia checagem de que a pasta pertence a
-- organizacao de quem esta enviando/apagando.
--
-- Consequencia: qualquer usuario de qualquer imobiliaria podia apagar ou
-- sobrescrever os arquivos de outra. No bucket site-assets, que e publico, isso
-- inclui trocar a logo e a imagem de capa — o site publico da vitima passa a
-- servir a imagem trocada imediatamente.
--
-- SOLUCAO
-- Todo upload do app ja grava em '{organizacao_id}/...' (galeria-fotos.tsx,
-- galeria-fotos-loteamento.tsx, configuracoes-site.ts e meu-perfil.ts), entao
-- basta exigir que a primeira pasta do caminho seja a organizacao do usuario.
--
-- A leitura (SELECT) continua liberada pra todos: os buckets sao publicos de
-- proposito, porque as fotos aparecem no site publico da imobiliaria.

-- ============================================================
-- site-assets (logo, favicon, capa do site, avatares)
-- ============================================================

DROP POLICY IF EXISTS "usuarios_fazem_upload_site_assets" ON storage.objects;
CREATE POLICY "usuarios_fazem_upload_site_assets" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'site-assets'
    AND (storage.foldername(name))[1] = public.organizacao_id_do_usuario()::text
  );

DROP POLICY IF EXISTS "usuarios_excluem_site_assets" ON storage.objects;
CREATE POLICY "usuarios_excluem_site_assets" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'site-assets'
    AND (storage.foldername(name))[1] = public.organizacao_id_do_usuario()::text
  );

DROP POLICY IF EXISTS "usuarios_atualizam_site_assets" ON storage.objects;
CREATE POLICY "usuarios_atualizam_site_assets" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'site-assets'
    AND (storage.foldername(name))[1] = public.organizacao_id_do_usuario()::text
  )
  WITH CHECK (
    bucket_id = 'site-assets'
    AND (storage.foldername(name))[1] = public.organizacao_id_do_usuario()::text
  );

-- ============================================================
-- imovel-fotos
-- ============================================================

DROP POLICY IF EXISTS "usuarios_fazem_upload_fotos" ON storage.objects;
CREATE POLICY "usuarios_fazem_upload_fotos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'imovel-fotos'
    AND (storage.foldername(name))[1] = public.organizacao_id_do_usuario()::text
  );

DROP POLICY IF EXISTS "usuarios_excluem_fotos_storage" ON storage.objects;
CREATE POLICY "usuarios_excluem_fotos_storage" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'imovel-fotos'
    AND (storage.foldername(name))[1] = public.organizacao_id_do_usuario()::text
  );

-- Nao existia policy de UPDATE nesse bucket; criar escopada garante que um
-- upsert nao vire brecha de sobrescrita entre organizacoes.
DROP POLICY IF EXISTS "usuarios_atualizam_fotos_storage" ON storage.objects;
CREATE POLICY "usuarios_atualizam_fotos_storage" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'imovel-fotos'
    AND (storage.foldername(name))[1] = public.organizacao_id_do_usuario()::text
  )
  WITH CHECK (
    bucket_id = 'imovel-fotos'
    AND (storage.foldername(name))[1] = public.organizacao_id_do_usuario()::text
  );

-- ============================================================
-- loteamento-fotos
-- ============================================================

DROP POLICY IF EXISTS "usuarios_fazem_upload_fotos_loteamento" ON storage.objects;
CREATE POLICY "usuarios_fazem_upload_fotos_loteamento" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'loteamento-fotos'
    AND (storage.foldername(name))[1] = public.organizacao_id_do_usuario()::text
  );

DROP POLICY IF EXISTS "usuarios_excluem_fotos_loteamento_storage" ON storage.objects;
CREATE POLICY "usuarios_excluem_fotos_loteamento_storage" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'loteamento-fotos'
    AND (storage.foldername(name))[1] = public.organizacao_id_do_usuario()::text
  );

DROP POLICY IF EXISTS "usuarios_atualizam_fotos_loteamento_storage" ON storage.objects;
CREATE POLICY "usuarios_atualizam_fotos_loteamento_storage" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'loteamento-fotos'
    AND (storage.foldername(name))[1] = public.organizacao_id_do_usuario()::text
  )
  WITH CHECK (
    bucket_id = 'loteamento-fotos'
    AND (storage.foldername(name))[1] = public.organizacao_id_do_usuario()::text
  );
