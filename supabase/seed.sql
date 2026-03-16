-- ============================================================
-- SEED: Dados de teste do LyneImob
-- ============================================================
-- INSTRUCOES:
-- 1. Primeiro crie as 3 contas pelo app (signup + convites)
-- 2. Depois rode este script no Supabase SQL Editor
-- 3. Ele busca automaticamente a org e os usuarios
-- ============================================================

DO $$
DECLARE
  v_org_id uuid;
  v_admin_id uuid;
  v_gerente_id uuid;
  v_corretor_id uuid;
  -- Pipeline etapas
  v_etapa_novo uuid;
  v_etapa_contato uuid;
  v_etapa_visita uuid;
  v_etapa_proposta uuid;
  v_etapa_negociacao uuid;
  v_etapa_ganho uuid;
  v_etapa_perdido uuid;
  -- Imoveis
  v_imovel_01 uuid;
  v_imovel_02 uuid;
  v_imovel_03 uuid;
  v_imovel_04 uuid;
  v_imovel_05 uuid;
  v_imovel_06 uuid;
  v_imovel_07 uuid;
  v_imovel_08 uuid;
  v_imovel_09 uuid;
  v_imovel_10 uuid;
  v_imovel_11 uuid;
  v_imovel_12 uuid;
  v_imovel_13 uuid;
  v_imovel_14 uuid;
  v_imovel_15 uuid;
  v_imovel_16 uuid;
  v_imovel_17 uuid;
  v_imovel_18 uuid;
  v_imovel_19 uuid;
  v_imovel_20 uuid;
  -- Clientes
  v_cliente_01 uuid;
  v_cliente_02 uuid;
  v_cliente_03 uuid;
  v_cliente_04 uuid;
  v_cliente_05 uuid;
  v_cliente_06 uuid;
  v_cliente_07 uuid;
  v_cliente_08 uuid;
  v_cliente_09 uuid;
  v_cliente_10 uuid;
  v_cliente_11 uuid;
  v_cliente_12 uuid;
  v_cliente_13 uuid;
  v_cliente_14 uuid;
  v_cliente_15 uuid;
BEGIN
  -- ============================================================
  -- BUSCAR ORG E USUARIOS
  -- Pega a primeira org encontrada (ajuste se necessario)
  -- ============================================================
  SELECT id INTO v_org_id FROM public.organizacoes LIMIT 1;
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Nenhuma organizacao encontrada. Crie uma conta primeiro.';
  END IF;

  SELECT id INTO v_admin_id FROM public.usuarios
    WHERE organizacao_id = v_org_id AND cargo = 'admin' LIMIT 1;
  SELECT id INTO v_gerente_id FROM public.usuarios
    WHERE organizacao_id = v_org_id AND cargo = 'gerente' LIMIT 1;
  SELECT id INTO v_corretor_id FROM public.usuarios
    WHERE organizacao_id = v_org_id AND cargo = 'corretor' LIMIT 1;

  -- Se gerente ou corretor nao existem, usa admin pra tudo
  IF v_gerente_id IS NULL THEN v_gerente_id := v_admin_id; END IF;
  IF v_corretor_id IS NULL THEN v_corretor_id := v_admin_id; END IF;

  -- ============================================================
  -- BUSCAR ETAPAS DO PIPELINE
  -- ============================================================
  SELECT id INTO v_etapa_novo FROM public.pipeline_etapas
    WHERE organizacao_id = v_org_id AND ordem = 0;
  SELECT id INTO v_etapa_contato FROM public.pipeline_etapas
    WHERE organizacao_id = v_org_id AND ordem = 1;
  SELECT id INTO v_etapa_visita FROM public.pipeline_etapas
    WHERE organizacao_id = v_org_id AND ordem = 2;
  SELECT id INTO v_etapa_proposta FROM public.pipeline_etapas
    WHERE organizacao_id = v_org_id AND ordem = 3;
  SELECT id INTO v_etapa_negociacao FROM public.pipeline_etapas
    WHERE organizacao_id = v_org_id AND ordem = 4;
  SELECT id INTO v_etapa_ganho FROM public.pipeline_etapas
    WHERE organizacao_id = v_org_id AND ordem = 5;
  SELECT id INTO v_etapa_perdido FROM public.pipeline_etapas
    WHERE organizacao_id = v_org_id AND ordem = 6;

  -- ============================================================
  -- IMOVEIS (20 imoveis variados)
  -- ============================================================

  -- Admin: 8 imoveis
  INSERT INTO public.imoveis (id, organizacao_id, corretor_id, codigo, titulo, descricao, tipo, finalidade, status, bairro, cidade, estado, preco_venda, preco_aluguel, area_total, area_construida, quartos, suites, banheiros, vagas_garagem, iptu, condominio)
  VALUES
    (gen_random_uuid(), v_org_id, v_admin_id, 'IMV-001', 'Apartamento Alto Padrao Jardins', 'Lindo apartamento com vista panoramica, acabamento de primeira, varanda gourmet e lazer completo no condominio.', 'apartamento', 'venda', 'disponivel', 'Jardins', 'Sao Paulo', 'SP', 1250000.00, NULL, 142.00, 120.00, 3, 1, 3, 2, 850.00, 1200.00)
  RETURNING id INTO v_imovel_01;

  INSERT INTO public.imoveis (id, organizacao_id, corretor_id, codigo, titulo, descricao, tipo, finalidade, status, bairro, cidade, estado, preco_venda, preco_aluguel, area_total, area_construida, quartos, suites, banheiros, vagas_garagem, iptu, condominio)
  VALUES
    (gen_random_uuid(), v_org_id, v_admin_id, 'IMV-002', 'Casa em Condominio Fechado Alphaville', 'Casa espaçosa com piscina, churrasqueira e 4 suites em condominio com seguranca 24h.', 'casa', 'venda', 'disponivel', 'Alphaville', 'Barueri', 'SP', 2800000.00, NULL, 450.00, 320.00, 4, 4, 5, 4, 1200.00, 2500.00)
  RETURNING id INTO v_imovel_02;

  INSERT INTO public.imoveis (id, organizacao_id, corretor_id, codigo, titulo, descricao, tipo, finalidade, status, bairro, cidade, estado, preco_venda, preco_aluguel, area_total, area_construida, quartos, suites, banheiros, vagas_garagem)
  VALUES
    (gen_random_uuid(), v_org_id, v_admin_id, 'IMV-003', 'Terreno 500m2 Riviera de Sao Lourenco', 'Terreno plano em condominio pe na areia. Documentacao em dia, pronto para construir.', 'terreno', 'venda', 'disponivel', 'Riviera', 'Bertioga', 'SP', 980000.00, NULL, 500.00, NULL, 0, 0, 0, 0)
  RETURNING id INTO v_imovel_03;

  INSERT INTO public.imoveis (id, organizacao_id, corretor_id, codigo, titulo, descricao, tipo, finalidade, status, bairro, cidade, estado, preco_venda, preco_aluguel, area_total, area_construida, quartos, suites, banheiros, vagas_garagem, condominio)
  VALUES
    (gen_random_uuid(), v_org_id, v_admin_id, 'IMV-004', 'Studio Moderno Vila Madalena', 'Studio compacto e funcional, ideal para jovens profissionais. Proximo ao metro e comercio.', 'kitnet', 'aluguel', 'disponivel', 'Vila Madalena', 'Sao Paulo', 'SP', NULL, 3200.00, 38.00, 35.00, 1, 0, 1, 1, 650.00)
  RETURNING id INTO v_imovel_04;

  INSERT INTO public.imoveis (id, organizacao_id, corretor_id, codigo, titulo, descricao, tipo, finalidade, status, bairro, cidade, estado, preco_venda, preco_aluguel, area_total, area_construida, quartos, suites, banheiros, vagas_garagem, iptu)
  VALUES
    (gen_random_uuid(), v_org_id, v_admin_id, 'IMV-005', 'Sala Comercial Faria Lima', 'Sala comercial em predio AAA na Faria Lima. Ar condicionado central, piso elevado, 2 vagas.', 'sala_comercial', 'venda_e_aluguel', 'disponivel', 'Itaim Bibi', 'Sao Paulo', 'SP', 750000.00, 6500.00, 55.00, 55.00, 0, 0, 1, 2, 450.00)
  RETURNING id INTO v_imovel_05;

  INSERT INTO public.imoveis (id, organizacao_id, corretor_id, codigo, titulo, descricao, tipo, finalidade, status, bairro, cidade, estado, preco_venda, preco_aluguel, area_total, area_construida, quartos, suites, banheiros, vagas_garagem, condominio)
  VALUES
    (gen_random_uuid(), v_org_id, v_admin_id, 'IMV-006', 'Cobertura Duplex Moema', 'Cobertura espetacular com terraço, piscina privativa e vista livre. 4 suites e sala ampla.', 'cobertura', 'venda', 'reservado', 'Moema', 'Sao Paulo', 'SP', 3500000.00, NULL, 280.00, 260.00, 4, 4, 5, 3, 3800.00)
  RETURNING id INTO v_imovel_06;

  INSERT INTO public.imoveis (id, organizacao_id, corretor_id, codigo, titulo, descricao, tipo, finalidade, status, bairro, cidade, estado, preco_venda, preco_aluguel, area_total, area_construida, quartos, suites, banheiros, vagas_garagem, iptu, condominio)
  VALUES
    (gen_random_uuid(), v_org_id, v_admin_id, 'IMV-007', 'Apartamento 2 Quartos Tatuape', 'Apartamento reformado com 2 quartos, sala ampla e cozinha americana. Proximo ao metro.', 'apartamento', 'aluguel', 'alugado', 'Tatuape', 'Sao Paulo', 'SP', NULL, 2800.00, 68.00, 65.00, 2, 0, 1, 1, 380.00, 580.00)
  RETURNING id INTO v_imovel_07;

  INSERT INTO public.imoveis (id, organizacao_id, corretor_id, codigo, titulo, descricao, tipo, finalidade, status, bairro, cidade, estado, preco_venda, preco_aluguel, area_total, area_construida, quartos, suites, banheiros, vagas_garagem, iptu)
  VALUES
    (gen_random_uuid(), v_org_id, v_admin_id, 'IMV-008', 'Galpao Logistico Guarulhos', 'Galpao com pe direito de 12m, docas, patio para carretas. Area administrativa climatizada.', 'galpao', 'venda_e_aluguel', 'disponivel', 'Cumbica', 'Guarulhos', 'SP', 4500000.00, 35000.00, 2000.00, 1800.00, 0, 0, 4, 10, 3200.00)
  RETURNING id INTO v_imovel_08;

  -- Gerente: 6 imoveis
  INSERT INTO public.imoveis (id, organizacao_id, corretor_id, codigo, titulo, descricao, tipo, finalidade, status, bairro, cidade, estado, preco_venda, preco_aluguel, area_total, area_construida, quartos, suites, banheiros, vagas_garagem, condominio)
  VALUES
    (gen_random_uuid(), v_org_id, v_gerente_id, 'IMV-009', 'Casa Terrea Vila Nova Conceicao', 'Casa terrea reformada em rua arborizada. Jardim, edicula e quintal grande.', 'casa', 'venda', 'disponivel', 'Vila Nova Conceicao', 'Sao Paulo', 'SP', 4200000.00, NULL, 380.00, 250.00, 3, 2, 4, 3, NULL)
  RETURNING id INTO v_imovel_09;

  INSERT INTO public.imoveis (id, organizacao_id, corretor_id, codigo, titulo, descricao, tipo, finalidade, status, bairro, cidade, estado, preco_venda, preco_aluguel, area_total, area_construida, quartos, suites, banheiros, vagas_garagem, condominio)
  VALUES
    (gen_random_uuid(), v_org_id, v_gerente_id, 'IMV-010', 'Apartamento Compacto Pinheiros', 'Apartamento de 1 quarto ideal para investimento. Alta demanda de locacao na regiao.', 'apartamento', 'venda', 'disponivel', 'Pinheiros', 'Sao Paulo', 'SP', 520000.00, NULL, 42.00, 40.00, 1, 0, 1, 1, 480.00)
  RETURNING id INTO v_imovel_10;

  INSERT INTO public.imoveis (id, organizacao_id, corretor_id, codigo, titulo, descricao, tipo, finalidade, status, bairro, cidade, estado, preco_venda, preco_aluguel, area_total, area_construida, quartos, suites, banheiros, vagas_garagem, condominio)
  VALUES
    (gen_random_uuid(), v_org_id, v_gerente_id, 'IMV-011', 'Loja Comercial Augusta', 'Loja em ponto nobre da Rua Augusta com 120m2, vitrine ampla e mezanino.', 'loja', 'aluguel', 'disponivel', 'Consolacao', 'Sao Paulo', 'SP', NULL, 12000.00, 120.00, 120.00, 0, 0, 2, 0, NULL)
  RETURNING id INTO v_imovel_11;

  INSERT INTO public.imoveis (id, organizacao_id, corretor_id, codigo, titulo, descricao, tipo, finalidade, status, bairro, cidade, estado, preco_venda, preco_aluguel, area_total, area_construida, quartos, suites, banheiros, vagas_garagem, condominio)
  VALUES
    (gen_random_uuid(), v_org_id, v_gerente_id, 'IMV-012', 'Apartamento 3 Quartos Perdizes', 'Apartamento familiar com 3 quartos, dependencia de empregada e lazer completo.', 'apartamento', 'venda', 'disponivel', 'Perdizes', 'Sao Paulo', 'SP', 890000.00, NULL, 105.00, 98.00, 3, 1, 2, 2, 1050.00)
  RETURNING id INTO v_imovel_12;

  INSERT INTO public.imoveis (id, organizacao_id, corretor_id, codigo, titulo, descricao, tipo, finalidade, status, bairro, cidade, estado, preco_venda, preco_aluguel, area_total, area_construida, quartos, suites, banheiros, vagas_garagem)
  VALUES
    (gen_random_uuid(), v_org_id, v_gerente_id, 'IMV-013', 'Sitio em Ibiuna', 'Sitio com 5 hectares, casa sede, lago, pomar e curral. Agua de nascente.', 'sitio', 'venda', 'disponivel', 'Zona Rural', 'Ibiuna', 'SP', 1500000.00, NULL, 50000.00, 350.00, 4, 2, 3, 5)
  RETURNING id INTO v_imovel_13;

  INSERT INTO public.imoveis (id, organizacao_id, corretor_id, codigo, titulo, descricao, tipo, finalidade, status, bairro, cidade, estado, preco_venda, preco_aluguel, area_total, area_construida, quartos, suites, banheiros, vagas_garagem, condominio)
  VALUES
    (gen_random_uuid(), v_org_id, v_gerente_id, 'IMV-014', 'Flat Paulista para Aluguel', 'Flat mobiliado na Av. Paulista. Servicos inclusos: limpeza, lavanderia e recepcao.', 'apartamento', 'aluguel', 'disponivel', 'Bela Vista', 'Sao Paulo', 'SP', NULL, 4500.00, 35.00, 33.00, 1, 0, 1, 0, 1800.00)
  RETURNING id INTO v_imovel_14;

  -- Corretor: 6 imoveis (esses so o corretor ve)
  INSERT INTO public.imoveis (id, organizacao_id, corretor_id, codigo, titulo, descricao, tipo, finalidade, status, bairro, cidade, estado, preco_venda, preco_aluguel, area_total, area_construida, quartos, suites, banheiros, vagas_garagem, condominio)
  VALUES
    (gen_random_uuid(), v_org_id, v_corretor_id, 'IMV-015', 'Apartamento Novo Brooklin', 'Apartamento novo pronto para morar. Lazer completo, predio com seguranca e piscina.', 'apartamento', 'venda', 'disponivel', 'Brooklin', 'Sao Paulo', 'SP', 680000.00, NULL, 72.00, 68.00, 2, 1, 2, 1, 780.00)
  RETURNING id INTO v_imovel_15;

  INSERT INTO public.imoveis (id, organizacao_id, corretor_id, codigo, titulo, descricao, tipo, finalidade, status, bairro, cidade, estado, preco_venda, preco_aluguel, area_total, area_construida, quartos, suites, banheiros, vagas_garagem)
  VALUES
    (gen_random_uuid(), v_org_id, v_corretor_id, 'IMV-016', 'Casa Sobrado Santo Andre', 'Sobrado com 3 quartos em rua tranquila. Quintal com churrasqueira e edicula nos fundos.', 'casa', 'venda', 'disponivel', 'Jardim Bela Vista', 'Santo Andre', 'SP', 520000.00, NULL, 200.00, 160.00, 3, 1, 2, 2)
  RETURNING id INTO v_imovel_16;

  INSERT INTO public.imoveis (id, organizacao_id, corretor_id, codigo, titulo, descricao, tipo, finalidade, status, bairro, cidade, estado, preco_venda, preco_aluguel, area_total, area_construida, quartos, suites, banheiros, vagas_garagem, condominio)
  VALUES
    (gen_random_uuid(), v_org_id, v_corretor_id, 'IMV-017', 'Kitnet Centro SP', 'Kitnet funcional proximo ao metro Se. Ideal para estudantes ou profissionais.', 'kitnet', 'aluguel', 'disponivel', 'Centro', 'Sao Paulo', 'SP', NULL, 1800.00, 28.00, 25.00, 1, 0, 1, 0, 350.00)
  RETURNING id INTO v_imovel_17;

  INSERT INTO public.imoveis (id, organizacao_id, corretor_id, codigo, titulo, descricao, tipo, finalidade, status, bairro, cidade, estado, preco_venda, preco_aluguel, area_total, area_construida, quartos, suites, banheiros, vagas_garagem)
  VALUES
    (gen_random_uuid(), v_org_id, v_corretor_id, 'IMV-018', 'Terreno Residencial Cotia', 'Terreno em loteamento aprovado com infraestrutura completa. Asfalto, agua e esgoto.', 'terreno', 'venda', 'disponivel', 'Granja Viana', 'Cotia', 'SP', 320000.00, NULL, 300.00, NULL, 0, 0, 0, 0)
  RETURNING id INTO v_imovel_18;

  INSERT INTO public.imoveis (id, organizacao_id, corretor_id, codigo, titulo, descricao, tipo, finalidade, status, bairro, cidade, estado, preco_venda, preco_aluguel, area_total, area_construida, quartos, suites, banheiros, vagas_garagem, condominio)
  VALUES
    (gen_random_uuid(), v_org_id, v_corretor_id, 'IMV-019', 'Apartamento 2 Quartos Osasco', 'Apartamento com 2 quartos e sacada. Condominio com piscina e academia. Financiavel.', 'apartamento', 'venda', 'vendido', 'Centro', 'Osasco', 'SP', 380000.00, NULL, 58.00, 55.00, 2, 0, 1, 1, 420.00)
  RETURNING id INTO v_imovel_19;

  INSERT INTO public.imoveis (id, organizacao_id, corretor_id, codigo, titulo, descricao, tipo, finalidade, status, bairro, cidade, estado, preco_venda, preco_aluguel, area_total, area_construida, quartos, suites, banheiros, vagas_garagem, condominio)
  VALUES
    (gen_random_uuid(), v_org_id, v_corretor_id, 'IMV-020', 'Sala Comercial Osasco', 'Sala de 40m2 em predio comercial com elevador. Proximo ao shopping e ao metro.', 'sala_comercial', 'aluguel', 'disponivel', 'Presidente Altino', 'Osasco', 'SP', NULL, 2200.00, 40.00, 40.00, 0, 0, 1, 1, 380.00)
  RETURNING id INTO v_imovel_20;

  -- ============================================================
  -- CLIENTES (15 clientes variados)
  -- ============================================================

  -- Admin: 5 clientes
  INSERT INTO public.clientes (id, organizacao_id, corretor_id, nome, email, telefone, whatsapp, cpf_cnpj, tipo, origem, status, observacoes, score_lead)
  VALUES
    (gen_random_uuid(), v_org_id, v_admin_id, 'Roberto Almeida Santos', 'roberto.santos@email.com', '(11) 99876-5432', '5511998765432', '123.456.789-00', 'comprador', 'indicacao', 'negociando', 'Empresario, busca imovel de alto padrao para familia. Urgente.', 85)
  RETURNING id INTO v_cliente_01;

  INSERT INTO public.clientes (id, organizacao_id, corretor_id, nome, email, telefone, whatsapp, tipo, origem, status, observacoes, score_lead)
  VALUES
    (gen_random_uuid(), v_org_id, v_admin_id, 'Maria Fernanda Oliveira', 'mfernanda@email.com', '(11) 98765-4321', '5511987654321', 'comprador', 'site', 'ativo', 'Medica, primeira compra de imovel. Prefere financiamento.', 72)
  RETURNING id INTO v_cliente_02;

  INSERT INTO public.clientes (id, organizacao_id, corretor_id, nome, email, telefone, tipo, origem, status, observacoes, score_lead)
  VALUES
    (gen_random_uuid(), v_org_id, v_admin_id, 'Carlos Eduardo Lima', 'carloseduardo@email.com', '(11) 97654-3210', 'proprietario', 'indicacao', 'ativo', 'Possui 3 imoveis para venda. Cliente antigo.', 90)
  RETURNING id INTO v_cliente_03;

  INSERT INTO public.clientes (id, organizacao_id, corretor_id, nome, email, telefone, whatsapp, tipo, origem, status, score_lead)
  VALUES
    (gen_random_uuid(), v_org_id, v_admin_id, 'Ana Paula Rodrigues', 'apaula@email.com', '(11) 96543-2109', '5511965432109', 'locatario', 'portal', 'ativo', 45)
  RETURNING id INTO v_cliente_04;

  INSERT INTO public.clientes (id, organizacao_id, corretor_id, nome, email, tipo, origem, status, observacoes, score_lead)
  VALUES
    (gen_random_uuid(), v_org_id, v_admin_id, 'Joao Pedro Martins', 'jpedro.martins@email.com', 'vendedor', 'outro', 'ativo', 'Herdou imovel e quer vender rapido. Aceita proposta abaixo do mercado.', 60)
  RETURNING id INTO v_cliente_05;

  -- Gerente: 5 clientes
  INSERT INTO public.clientes (id, organizacao_id, corretor_id, nome, email, telefone, whatsapp, tipo, origem, status, observacoes, score_lead)
  VALUES
    (gen_random_uuid(), v_org_id, v_gerente_id, 'Luciana Ferreira Costa', 'luciana.costa@email.com', '(11) 95432-1098', '5511954321098', 'comprador', 'whatsapp', 'negociando', 'Investidora, busca imoveis para renda. Perfil alto.', 88)
  RETURNING id INTO v_cliente_06;

  INSERT INTO public.clientes (id, organizacao_id, corretor_id, nome, email, telefone, tipo, origem, status, score_lead)
  VALUES
    (gen_random_uuid(), v_org_id, v_gerente_id, 'Fernando Souza Neto', 'fernando.neto@email.com', '(11) 94321-0987', 'comprador', 'portal', 'ativo', 55)
  RETURNING id INTO v_cliente_07;

  INSERT INTO public.clientes (id, organizacao_id, corretor_id, nome, email, telefone, whatsapp, tipo, origem, status, observacoes, score_lead)
  VALUES
    (gen_random_uuid(), v_org_id, v_gerente_id, 'Patricia Mendes', 'patricia.mendes@email.com', '(11) 93210-9876', '5511932109876', 'locatario', 'site', 'ativo', 'Precisa mudar rapido, contrato atual vence em 30 dias.', 70)
  RETURNING id INTO v_cliente_08;

  INSERT INTO public.clientes (id, organizacao_id, corretor_id, nome, email, telefone, tipo, origem, status, score_lead)
  VALUES
    (gen_random_uuid(), v_org_id, v_gerente_id, 'Ricardo Gomes Pereira', 'ricardo.gomes@email.com', '(11) 92109-8765', 'proprietario', 'indicacao', 'ativo', 65)
  RETURNING id INTO v_cliente_09;

  INSERT INTO public.clientes (id, organizacao_id, corretor_id, nome, email, tipo, origem, status, score_lead)
  VALUES
    (gen_random_uuid(), v_org_id, v_gerente_id, 'Camila Duarte Silva', 'camila.duarte@email.com', 'comprador', 'portal', 'inativo', 20)
  RETURNING id INTO v_cliente_10;

  -- Corretor: 5 clientes (so o corretor ve esses)
  INSERT INTO public.clientes (id, organizacao_id, corretor_id, nome, email, telefone, whatsapp, tipo, origem, status, observacoes, score_lead)
  VALUES
    (gen_random_uuid(), v_org_id, v_corretor_id, 'Marcos Vinicius Barbosa', 'marcos.barbosa@email.com', '(11) 91098-7654', '5511910987654', 'comprador', 'indicacao', 'negociando', 'Casal jovem, primeiro imovel. Orcamento ate 700k.', 78)
  RETURNING id INTO v_cliente_11;

  INSERT INTO public.clientes (id, organizacao_id, corretor_id, nome, email, telefone, tipo, origem, status, score_lead)
  VALUES
    (gen_random_uuid(), v_org_id, v_corretor_id, 'Daniela Costa Ribeiro', 'daniela.ribeiro@email.com', '(11) 90987-6543', 'locatario', 'site', 'ativo', 50)
  RETURNING id INTO v_cliente_12;

  INSERT INTO public.clientes (id, organizacao_id, corretor_id, nome, email, telefone, whatsapp, tipo, origem, status, observacoes, score_lead)
  VALUES
    (gen_random_uuid(), v_org_id, v_corretor_id, 'Eduardo Henrique Prado', 'eduardo.prado@email.com', '(11) 89876-5432', '5511898765432', 'comprador', 'whatsapp', 'ativo', 'Busca sala comercial para abrir consultorio.', 62)
  RETURNING id INTO v_cliente_13;

  INSERT INTO public.clientes (id, organizacao_id, corretor_id, nome, email, tipo, origem, status, score_lead)
  VALUES
    (gen_random_uuid(), v_org_id, v_corretor_id, 'Renata Campos Alves', 'renata.campos@email.com', 'vendedor', 'outro', 'ativo', 40)
  RETURNING id INTO v_cliente_14;

  INSERT INTO public.clientes (id, organizacao_id, corretor_id, nome, email, telefone, tipo, origem, status, observacoes, score_lead)
  VALUES
    (gen_random_uuid(), v_org_id, v_corretor_id, 'Thiago Nascimento', 'thiago.nasc@email.com', '(11) 88765-4321', 'comprador', 'portal', 'fechado', 'Comprou o IMV-019 (apto Osasco). Cliente satisfeito.', 95)
  RETURNING id INTO v_cliente_15;

  -- ============================================================
  -- INTERESSES DE CLIENTES (alguns clientes com interesses)
  -- ============================================================
  INSERT INTO public.cliente_interesses (cliente_id, tipo_imovel, finalidade, cidade, estado, bairros_interesse, preco_min, preco_max, quartos_min)
  VALUES
    (v_cliente_01, 'apartamento', 'venda', 'Sao Paulo', 'SP', ARRAY['Jardins', 'Moema', 'Vila Nova Conceicao'], 1000000.00, 2000000.00, 3),
    (v_cliente_02, 'apartamento', 'venda', 'Sao Paulo', 'SP', ARRAY['Pinheiros', 'Vila Madalena', 'Perdizes'], 400000.00, 700000.00, 2),
    (v_cliente_06, 'apartamento', 'venda', 'Sao Paulo', 'SP', ARRAY['Brooklin', 'Itaim Bibi', 'Moema'], 500000.00, 1500000.00, 1),
    (v_cliente_08, 'apartamento', 'aluguel', 'Sao Paulo', 'SP', ARRAY['Consolacao', 'Bela Vista', 'Pinheiros'], NULL, 5000.00, 1),
    (v_cliente_11, 'apartamento', 'venda', 'Sao Paulo', 'SP', ARRAY['Brooklin', 'Santo Amaro', 'Campo Belo'], 400000.00, 700000.00, 2),
    (v_cliente_11, 'casa', 'venda', 'Santo Andre', 'SP', ARRAY['Jardim Bela Vista', 'Centro'], 400000.00, 600000.00, 3),
    (v_cliente_13, 'sala_comercial', 'aluguel', 'Sao Paulo', 'SP', ARRAY['Moema', 'Brooklin', 'Itaim Bibi'], NULL, 5000.00, NULL);

  -- ============================================================
  -- INTERACOES DE CLIENTES
  -- ============================================================
  INSERT INTO public.cliente_interacoes (cliente_id, usuario_id, tipo, descricao, data)
  VALUES
    (v_cliente_01, v_admin_id, 'ligacao', 'Primeiro contato. Roberto tem interesse em apartamento nos Jardins. Orcamento de 1 a 2 milhoes.', now() - interval '10 days'),
    (v_cliente_01, v_admin_id, 'visita', 'Visitamos o IMV-001. Roberto gostou muito da vista e do acabamento.', now() - interval '5 days'),
    (v_cliente_01, v_admin_id, 'whatsapp', 'Roberto pediu proposta formal para o IMV-001.', now() - interval '2 days'),
    (v_cliente_02, v_admin_id, 'email', 'Enviado catalogo de apartamentos em Pinheiros e Vila Madalena.', now() - interval '7 days'),
    (v_cliente_02, v_admin_id, 'ligacao', 'Maria confirmou interesse em visitar 2 imoveis no sabado.', now() - interval '3 days'),
    (v_cliente_06, v_gerente_id, 'whatsapp', 'Luciana enviou mensagem perguntando sobre imoveis para investimento.', now() - interval '8 days'),
    (v_cliente_06, v_gerente_id, 'reuniao', 'Reuniao na imobiliaria. Definimos perfil de busca: studios e 1 quarto para renda.', now() - interval '4 days'),
    (v_cliente_06, v_gerente_id, 'visita', 'Visitamos IMV-010 e IMV-014. Luciana gostou dos dois.', now() - interval '1 day'),
    (v_cliente_11, v_corretor_id, 'ligacao', 'Marcos e esposa buscam primeiro imovel. Orcamento 500-700k.', now() - interval '6 days'),
    (v_cliente_11, v_corretor_id, 'visita', 'Visitamos IMV-015 (Brooklin). Casal gostou mas achou apertado.', now() - interval '2 days'),
    (v_cliente_15, v_corretor_id, 'visita', 'Visitamos IMV-019. Thiago adorou e quer fechar.', now() - interval '15 days'),
    (v_cliente_15, v_corretor_id, 'reuniao', 'Assinatura do contrato do IMV-019. Venda concluida!', now() - interval '10 days');

  -- ============================================================
  -- NEGOCIOS (10 negocios em diferentes etapas)
  -- ============================================================

  -- Admin: 4 negocios
  INSERT INTO public.negocios (organizacao_id, corretor_id, cliente_id, imovel_id, etapa_id, titulo, valor, tipo, status, previsao_fechamento, observacoes, posicao)
  VALUES
    (v_org_id, v_admin_id, v_cliente_01, v_imovel_01, v_etapa_proposta, 'Venda Apto Jardins - Roberto', 1250000.00, 'venda', 'aberto', (current_date + interval '15 days')::date, 'Cliente pediu proposta. Negociando valor.', 0),
    (v_org_id, v_admin_id, v_cliente_02, v_imovel_10, v_etapa_visita, 'Venda Apto Pinheiros - Maria', 520000.00, 'venda', 'aberto', (current_date + interval '30 days')::date, 'Agendada visita para sabado.', 0),
    (v_org_id, v_admin_id, v_cliente_04, v_imovel_04, v_etapa_contato, 'Aluguel Studio Vila Madalena - Ana', 3200.00, 'aluguel', 'aberto', (current_date + interval '7 days')::date, NULL, 0),
    (v_org_id, v_admin_id, v_cliente_03, v_imovel_06, v_etapa_negociacao, 'Venda Cobertura Moema - Carlos (proprietario)', 3500000.00, 'venda', 'aberto', (current_date + interval '20 days')::date, 'Carlos e proprietario. Temos comprador interessado.', 0);

  -- Gerente: 3 negocios
  INSERT INTO public.negocios (organizacao_id, corretor_id, cliente_id, imovel_id, etapa_id, titulo, valor, tipo, status, previsao_fechamento, observacoes, posicao)
  VALUES
    (v_org_id, v_gerente_id, v_cliente_06, v_imovel_10, v_etapa_proposta, 'Investimento Pinheiros - Luciana', 520000.00, 'venda', 'aberto', (current_date + interval '10 days')::date, 'Luciana quer comprar para investir. Negociando desconto a vista.', 1),
    (v_org_id, v_gerente_id, v_cliente_08, v_imovel_14, v_etapa_novo, 'Aluguel Flat Paulista - Patricia', 4500.00, 'aluguel', 'aberto', (current_date + interval '25 days')::date, 'Patricia tem urgencia, contrato atual vence em 30 dias.', 0),
    (v_org_id, v_gerente_id, v_cliente_07, NULL, v_etapa_novo, 'Busca Imovel - Fernando', NULL, 'venda', 'aberto', NULL, 'Fernando ainda nao definiu o que quer. Agendar reuniao.', 1);

  -- Corretor: 3 negocios (incluindo 1 ganho e 1 perdido)
  INSERT INTO public.negocios (organizacao_id, corretor_id, cliente_id, imovel_id, etapa_id, titulo, valor, tipo, status, previsao_fechamento, observacoes, posicao)
  VALUES
    (v_org_id, v_corretor_id, v_cliente_11, v_imovel_15, v_etapa_visita, 'Venda Apto Brooklin - Marcos', 680000.00, 'venda', 'aberto', (current_date + interval '20 days')::date, 'Marcos gostou mas achou pequeno. Mostrar opcoes maiores.', 0);

  INSERT INTO public.negocios (organizacao_id, corretor_id, cliente_id, imovel_id, etapa_id, titulo, valor, tipo, status, data_ganho, observacoes, posicao)
  VALUES
    (v_org_id, v_corretor_id, v_cliente_15, v_imovel_19, v_etapa_ganho, 'Venda Apto Osasco - Thiago', 380000.00, 'venda', 'ganho', now() - interval '10 days', 'Venda concluida! Financiamento aprovado pela Caixa.', 0);

  INSERT INTO public.negocios (organizacao_id, corretor_id, cliente_id, imovel_id, etapa_id, titulo, valor, tipo, status, data_perda, motivo_perda, observacoes, posicao)
  VALUES
    (v_org_id, v_corretor_id, v_cliente_14, v_imovel_16, v_etapa_perdido, 'Venda Casa Santo Andre - Renata', 520000.00, 'venda', 'perdido', now() - interval '5 days', 'Proprietaria desistiu de vender', 'Renata decidiu reformar em vez de vender.', 0);

  -- ============================================================
  -- ATIVIDADES (15 atividades variadas)
  -- ============================================================

  -- Admin: 5 atividades
  INSERT INTO public.atividades (organizacao_id, usuario_id, cliente_id, imovel_id, titulo, descricao, tipo, status, prioridade, data_inicio, data_fim)
  VALUES
    (v_org_id, v_admin_id, v_cliente_01, v_imovel_01, 'Enviar proposta para Roberto', 'Preparar proposta formal do apto Jardins com condicoes de pagamento.', 'proposta', 'pendente', 'alta', now() + interval '1 day', now() + interval '1 day' + interval '1 hour'),
    (v_org_id, v_admin_id, v_cliente_02, NULL, 'Ligar para Maria - confirmar visitas', 'Confirmar visitas de sabado aos imoveis de Pinheiros.', 'ligacao', 'pendente', 'media', now() + interval '2 days', NULL),
    (v_org_id, v_admin_id, v_cliente_03, v_imovel_06, 'Reuniao com Carlos sobre cobertura', 'Apresentar proposta do comprador para a cobertura Moema.', 'reuniao', 'pendente', 'alta', now() + interval '3 days', now() + interval '3 days' + interval '2 hours'),
    (v_org_id, v_admin_id, v_cliente_01, v_imovel_01, 'Follow-up proposta Roberto', 'Verificar se Roberto recebeu e analisou a proposta.', 'follow_up', 'pendente', 'media', now() + interval '5 days', NULL),
    (v_org_id, v_admin_id, v_cliente_04, v_imovel_04, 'Visita Studio Vila Madalena - Ana', 'Mostrar studio para Ana Paula.', 'visita', 'concluida', 'media', now() - interval '3 days', now() - interval '3 days' + interval '1 hour');

  -- Gerente: 5 atividades
  INSERT INTO public.atividades (organizacao_id, usuario_id, cliente_id, imovel_id, titulo, descricao, tipo, status, prioridade, data_inicio, data_fim)
  VALUES
    (v_org_id, v_gerente_id, v_cliente_06, v_imovel_10, 'Enviar contrato Luciana - Pinheiros', 'Enviar minuta do contrato de compra e venda do apto Pinheiros.', 'proposta', 'pendente', 'alta', now() + interval '1 day', now() + interval '1 day' + interval '30 minutes'),
    (v_org_id, v_gerente_id, v_cliente_08, v_imovel_14, 'Agendar visita flat Paulista - Patricia', 'Patricia precisa ver o flat urgente. Agendar para esta semana.', 'ligacao', 'pendente', 'alta', now(), now() + interval '30 minutes'),
    (v_org_id, v_gerente_id, v_cliente_07, NULL, 'Reuniao de descoberta - Fernando', 'Entender o que Fernando busca. Definir perfil e orcamento.', 'reuniao', 'pendente', 'media', now() + interval '4 days', now() + interval '4 days' + interval '1 hour'),
    (v_org_id, v_gerente_id, v_cliente_09, NULL, 'Avaliacao imoveis Ricardo', 'Fazer avaliacao dos imoveis do Ricardo para precificacao.', 'visita', 'pendente', 'media', now() + interval '6 days', now() + interval '6 days' + interval '3 hours'),
    (v_org_id, v_gerente_id, v_cliente_06, v_imovel_14, 'Follow-up Luciana - flat Paulista', 'Verificar interesse no flat apos visita.', 'follow_up', 'concluida', 'media', now() - interval '1 day', NULL);

  -- Corretor: 5 atividades
  INSERT INTO public.atividades (organizacao_id, usuario_id, cliente_id, imovel_id, titulo, descricao, tipo, status, prioridade, data_inicio, data_fim)
  VALUES
    (v_org_id, v_corretor_id, v_cliente_11, v_imovel_16, 'Visita casa Santo Andre - Marcos', 'Mostrar casa sobrado de Santo Andre como alternativa ao apto Brooklin.', 'visita', 'pendente', 'alta', now() + interval '2 days', now() + interval '2 days' + interval '2 hours'),
    (v_org_id, v_corretor_id, v_cliente_12, v_imovel_17, 'Ligar Daniela - kitnet Centro', 'Oferecer kitnet no Centro para Daniela.', 'ligacao', 'pendente', 'media', now() + interval '1 day', NULL),
    (v_org_id, v_corretor_id, v_cliente_13, v_imovel_20, 'Visita sala comercial - Eduardo', 'Mostrar sala em Osasco para Eduardo montar consultorio.', 'visita', 'pendente', 'media', now() + interval '3 days', now() + interval '3 days' + interval '1 hour'),
    (v_org_id, v_corretor_id, v_cliente_15, NULL, 'Email pos-venda Thiago', 'Enviar email de agradecimento e pedir indicacao.', 'email', 'pendente', 'baixa', now() + interval '7 days', NULL),
    (v_org_id, v_corretor_id, v_cliente_11, v_imovel_15, 'Follow-up visita Brooklin - Marcos', 'Perguntar se Marcos pensou melhor sobre o apto Brooklin.', 'follow_up', 'concluida', 'media', now() - interval '1 day', NULL);

  RAISE NOTICE 'Seed concluido! Dados criados: 20 imoveis, 15 clientes, 7 interesses, 12 interacoes, 10 negocios, 15 atividades.';
END $$;
