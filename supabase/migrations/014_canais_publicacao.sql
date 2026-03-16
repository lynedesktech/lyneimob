-- Migration 014: Canais de publicação por imóvel
-- Permite ao corretor escolher onde cada imóvel aparece (site público, portais, ambos ou nenhum)

ALTER TABLE public.imoveis
  ADD COLUMN publicar_site boolean NOT NULL DEFAULT true,
  ADD COLUMN publicar_portais boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.imoveis.publicar_site IS 'Imóvel aparece no site público da imobiliária';
COMMENT ON COLUMN public.imoveis.publicar_portais IS 'Imóvel aparece no feed XML dos portais (OLX, VivaReal, etc.)';
