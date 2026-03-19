-- Remove tabela de análise IA do roadmap (funcionalidade removida)
DROP POLICY IF EXISTS "super_admin_analise" ON analise_roadmap;
DROP TABLE IF EXISTS analise_roadmap;
