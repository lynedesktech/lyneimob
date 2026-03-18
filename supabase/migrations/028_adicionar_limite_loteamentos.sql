-- Adicionar max_loteamentos no default da coluna limites
ALTER TABLE organizacoes
ALTER COLUMN limites
SET DEFAULT '{"max_imoveis": 50, "max_corretores": 2, "max_loteamentos": 1, "max_conversas_ia_mes": 30}'::jsonb;

-- Adicionar max_loteamentos em todas as organizações existentes que não têm
UPDATE organizacoes
SET limites = limites || '{"max_loteamentos": 1}'::jsonb
WHERE NOT (limites ? 'max_loteamentos');
