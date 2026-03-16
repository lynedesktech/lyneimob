-- ============================================================
-- Migration 007: Bucket de storage para assets do site público
-- ============================================================
-- Armazena logo e imagem de fundo do hero por organização.
-- Caminhos: {organizacao_id}/hero-bg.ext, {organizacao_id}/logo.ext

-- Criar bucket público para assets do site (limite 5MB, apenas imagens)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'site-assets',
  'site-assets',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
);

-- Usuários autenticados podem fazer upload
CREATE POLICY "usuarios_fazem_upload_site_assets" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'site-assets'
    AND auth.uid() IS NOT NULL
  );

-- Qualquer um pode ver assets (bucket público — site é público)
CREATE POLICY "qualquer_um_ve_site_assets" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'site-assets'
  );

-- Usuários autenticados podem excluir assets
CREATE POLICY "usuarios_excluem_site_assets" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'site-assets'
    AND auth.uid() IS NOT NULL
  );

-- Usuários autenticados podem atualizar assets (sobrescrever)
CREATE POLICY "usuarios_atualizam_site_assets" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'site-assets'
    AND auth.uid() IS NOT NULL
  );
