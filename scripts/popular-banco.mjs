const SUPABASE_URL = "https://ksujxbrkvdiobvkjeaer.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzdWp4YnJrdmRpb2J2a2plYWVyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzI0NTg4NiwiZXhwIjoyMDg4ODIxODg2fQ.U0mt0N9Lz1u-DfYA7p7w0wrCvWbaCPhxeq83ttKDSD0";
const EMPRESA_ID = "c15646b1-547d-4fda-9aeb-a40ca49820d1";

async function inserir(tabela, dados) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${tabela}`, {
    method: "POST",
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "return=representation"
    },
    body: JSON.stringify(dados)
  });

  if (!res.ok) {
    const erro = await res.text();
    console.error(`ERRO ao inserir em ${tabela}:`, erro);
    return null;
  }

  const result = await res.json();
  console.log(`OK: ${result.length} registros inseridos em ${tabela}`);
  return result;
}

// ==========================================
// IMOVEIS (10 novos)
// Tipos validos no banco: apartamento, casa, terreno, comercial
// ==========================================
const imoveis = [
  {
    empresa_id: EMPRESA_ID,
    titulo: "Apartamento Garden Moema",
    descricao: "Apartamento garden com 120m2 de area privativa e 60m2 de jardim. 2 suites, living amplo com pe direito duplo. Condominio com lazer completo.",
    tipo: "apartamento",
    finalidade: "venda",
    status: "disponivel",
    valor: 1250000.00,
    valor_condominio: 1400.00,
    valor_iptu: 3200.00,
    area_total: 180.00,
    area_construida: 120.00,
    quartos: 2,
    suites: 2,
    banheiros: 3,
    vagas: 2,
    cep: "04077-000",
    logradouro: "Alameda dos Arapanes",
    numero: "350",
    bairro: "Moema",
    cidade: "Sao Paulo",
    estado: "SP",
    destaque: false,
    codigo_interno: "APT-MOE-002"
  },
  {
    empresa_id: EMPRESA_ID,
    titulo: "Casa de Vila em Vila Mariana",
    descricao: "Charmosa casa de vila com 3 quartos, quintal e churrasqueira. Rua tranquila, proxima ao metro Ana Rosa. Reformada recentemente.",
    tipo: "casa",
    finalidade: "venda",
    status: "disponivel",
    valor: 980000.00,
    valor_condominio: 600.00,
    valor_iptu: 2800.00,
    area_total: 150.00,
    area_construida: 110.00,
    quartos: 3,
    suites: 1,
    banheiros: 2,
    vagas: 1,
    cep: "04101-000",
    logradouro: "Rua Domingos de Morais",
    numero: "870",
    bairro: "Vila Mariana",
    cidade: "Sao Paulo",
    estado: "SP",
    destaque: true,
    codigo_interno: "CAS-VMA-001"
  },
  {
    empresa_id: EMPRESA_ID,
    titulo: "Studio Compacto Consolacao",
    descricao: "Studio compacto e funcional de 32m2, totalmente reformado. Ideal para investimento ou moradia. Proximo a Paulista.",
    tipo: "apartamento",
    finalidade: "aluguel",
    status: "disponivel",
    valor: 1800.00,
    valor_condominio: 450.00,
    valor_iptu: 800.00,
    area_total: 32.00,
    area_construida: 32.00,
    quartos: 1,
    suites: 0,
    banheiros: 1,
    vagas: 0,
    cep: "01301-000",
    logradouro: "Rua da Consolacao",
    numero: "2100",
    bairro: "Consolacao",
    cidade: "Sao Paulo",
    estado: "SP",
    destaque: false,
    codigo_interno: "STD-CON-001"
  },
  {
    empresa_id: EMPRESA_ID,
    titulo: "Galpao Industrial Santo Amaro",
    descricao: "Galpao com 500m2, pe direito 8m, piso industrial reforcado. Otimo para logistica ou oficina. Portaria 24h.",
    tipo: "comercial",
    finalidade: "aluguel",
    status: "disponivel",
    valor: 18000.00,
    valor_condominio: 0,
    valor_iptu: 8500.00,
    area_total: 500.00,
    area_construida: 500.00,
    quartos: 0,
    suites: 0,
    banheiros: 2,
    vagas: 5,
    cep: "04720-000",
    logradouro: "Rua Guaraiuva",
    numero: "500",
    bairro: "Santo Amaro",
    cidade: "Sao Paulo",
    estado: "SP",
    destaque: false,
    codigo_interno: "GAL-SAM-001"
  },
  {
    empresa_id: EMPRESA_ID,
    titulo: "Cobertura Linear Perdizes",
    descricao: "Cobertura linear com 250m2, terraco gourmet de 80m2, vista para o Parque da Agua Branca. 4 suites, living para 3 ambientes.",
    tipo: "apartamento",
    finalidade: "venda",
    status: "disponivel",
    valor: 3200000.00,
    valor_condominio: 2800.00,
    valor_iptu: 7500.00,
    area_total: 330.00,
    area_construida: 250.00,
    quartos: 4,
    suites: 4,
    banheiros: 5,
    vagas: 3,
    cep: "05005-000",
    logradouro: "Rua Cardoso de Almeida",
    numero: "1500",
    bairro: "Perdizes",
    cidade: "Sao Paulo",
    estado: "SP",
    destaque: true,
    codigo_interno: "COB-PER-001"
  },
  {
    empresa_id: EMPRESA_ID,
    titulo: "Apartamento 2 Dorms Tatuape",
    descricao: "Apartamento de 65m2 com 2 dormitorios, varanda e lazer completo. Proximo ao metro Tatuape e shopping.",
    tipo: "apartamento",
    finalidade: "venda",
    status: "reservado",
    valor: 520000.00,
    valor_condominio: 680.00,
    valor_iptu: 1800.00,
    area_total: 65.00,
    area_construida: 60.00,
    quartos: 2,
    suites: 1,
    banheiros: 2,
    vagas: 1,
    cep: "03060-000",
    logradouro: "Rua Serra de Japi",
    numero: "400",
    bairro: "Tatuape",
    cidade: "Sao Paulo",
    estado: "SP",
    destaque: false,
    codigo_interno: "APT-TAT-001"
  },
  {
    empresa_id: EMPRESA_ID,
    titulo: "Loja Comercial Mooca",
    descricao: "Loja de esquina com 80m2, vitrine ampla, banheiro e deposito. Alto fluxo de pedestres. Ideal para comercio varejista.",
    tipo: "comercial",
    finalidade: "aluguel",
    status: "disponivel",
    valor: 6500.00,
    valor_condominio: 0,
    valor_iptu: 2200.00,
    area_total: 80.00,
    area_construida: 80.00,
    quartos: 0,
    suites: 0,
    banheiros: 1,
    vagas: 0,
    cep: "03104-000",
    logradouro: "Rua da Mooca",
    numero: "2500",
    bairro: "Mooca",
    cidade: "Sao Paulo",
    estado: "SP",
    destaque: false,
    codigo_interno: "LOJ-MOO-001"
  },
  {
    empresa_id: EMPRESA_ID,
    titulo: "Casa Alto Padrao Brooklin",
    descricao: "Casa contemporanea com 4 suites, piscina aquecida, home theater e automacao completa. Terreno de 500m2 em condominio fechado.",
    tipo: "casa",
    finalidade: "venda",
    status: "disponivel",
    valor: 4800000.00,
    valor_condominio: 3500.00,
    valor_iptu: 12000.00,
    area_total: 500.00,
    area_construida: 380.00,
    quartos: 4,
    suites: 4,
    banheiros: 6,
    vagas: 4,
    cep: "04563-000",
    logradouro: "Rua Michigan",
    numero: "200",
    bairro: "Brooklin",
    cidade: "Sao Paulo",
    estado: "SP",
    destaque: true,
    codigo_interno: "CAS-BRK-001"
  },
  {
    empresa_id: EMPRESA_ID,
    titulo: "Apartamento Compacto Bela Vista",
    descricao: "Apartamento de 45m2 com 1 dormitorio, cozinha americana e varanda. Predio novo com academia e coworking. Proximo ao metro.",
    tipo: "apartamento",
    finalidade: "aluguel",
    status: "disponivel",
    valor: 2800.00,
    valor_condominio: 580.00,
    valor_iptu: 1200.00,
    area_total: 45.00,
    area_construida: 42.00,
    quartos: 1,
    suites: 0,
    banheiros: 1,
    vagas: 1,
    cep: "01319-000",
    logradouro: "Rua Treze de Maio",
    numero: "850",
    bairro: "Bela Vista",
    cidade: "Sao Paulo",
    estado: "SP",
    destaque: false,
    codigo_interno: "APT-BVI-001"
  },
  {
    empresa_id: EMPRESA_ID,
    titulo: "Terreno Granja Viana 1200m2",
    descricao: "Terreno plano em condominio fechado na Granja Viana. Pronto para construir, com projeto aprovado. Condominio com seguranca 24h e lazer.",
    tipo: "terreno",
    finalidade: "venda",
    status: "disponivel",
    valor: 650000.00,
    valor_condominio: 900.00,
    valor_iptu: 1500.00,
    area_total: 1200.00,
    area_construida: 0,
    quartos: 0,
    suites: 0,
    banheiros: 0,
    vagas: 0,
    cep: "06710-000",
    logradouro: "Estrada Fernando Nobre",
    numero: "3000",
    bairro: "Granja Viana",
    cidade: "Cotia",
    estado: "SP",
    destaque: false,
    codigo_interno: "TER-GRV-001"
  }
];

// ==========================================
// CLIENTES / LEADS (14 novos)
// Todos com as mesmas chaves (cpf_cnpj: null para PF)
// ==========================================
const clientes = [
  {
    empresa_id: EMPRESA_ID,
    nome: "Patricia Rodrigues",
    tipo_pessoa: "fisica",
    cpf_cnpj: null,
    email: "patricia.rodrigues@gmail.com",
    telefone: "11987654321",
    whatsapp: "5511987654321",
    origem: "site",
    interesse: "compra",
    status: "ativo",
    notas: "Medica, casada, 2 filhos. Procura casa com 3+ quartos em bairro com boa escola. Orcamento ate R$1.5M"
  },
  {
    empresa_id: EMPRESA_ID,
    nome: "Ricardo Almeida",
    tipo_pessoa: "fisica",
    cpf_cnpj: null,
    email: "ricardo.almeida@outlook.com",
    telefone: "11976543210",
    whatsapp: "5511976543210",
    origem: "indicacao",
    interesse: "compra",
    status: "ativo",
    notas: "Engenheiro, solteiro. Quer apartamento compacto para investimento. Faixa de R$400-600k. Preferencia Zona Leste. Em negociacao."
  },
  {
    empresa_id: EMPRESA_ID,
    nome: "Camila e Bruno Ferreira",
    tipo_pessoa: "fisica",
    cpf_cnpj: null,
    email: "camila.ferreira@yahoo.com",
    telefone: "11965432109",
    whatsapp: "5511965432109",
    origem: "portal",
    interesse: "compra",
    status: "ativo",
    notas: "Casal jovem, primeiro imovel. Buscam apartamento 2 dorms com varanda. Orcamento ate R$550k. Podem usar FGTS."
  },
  {
    empresa_id: EMPRESA_ID,
    nome: "Sergio Nakamura",
    tipo_pessoa: "fisica",
    cpf_cnpj: null,
    email: "sergio.nakamura@gmail.com",
    telefone: "11954321098",
    whatsapp: "5511954321098",
    origem: "whatsapp",
    interesse: "aluguel",
    status: "ativo",
    notas: "Designer, trabalha remoto. Precisa de apartamento com espaco para home office. Budget R$2.5-3.5k/mes. Prefere Vila Madalena ou Pinheiros."
  },
  {
    empresa_id: EMPRESA_ID,
    nome: "Grupo Invest SP Ltda",
    tipo_pessoa: "juridica",
    cpf_cnpj: "45.678.901/0001-23",
    email: "contato@investsp.com.br",
    telefone: "1132456789",
    whatsapp: "5511932456789",
    origem: "indicacao",
    interesse: "compra",
    status: "ativo",
    notas: "Grupo investidor. Busca imoveis comerciais e terrenos para incorporacao. Orcamento aberto para bons negocios."
  },
  {
    empresa_id: EMPRESA_ID,
    nome: "Debora Santana",
    tipo_pessoa: "fisica",
    cpf_cnpj: null,
    email: "debora.santana@hotmail.com",
    telefone: "11943210987",
    whatsapp: "5511943210987",
    origem: "site",
    interesse: "aluguel",
    status: "ativo",
    notas: "Estudante de pos-graduacao na USP. Procura studio ate R$2k/mes proximo ao campus ou metro."
  },
  {
    empresa_id: EMPRESA_ID,
    nome: "Antonio Carlos Pereira",
    tipo_pessoa: "fisica",
    cpf_cnpj: null,
    email: "antonio.pereira@gmail.com",
    telefone: "11932109876",
    whatsapp: "5511932109876",
    origem: "indicacao",
    interesse: "compra",
    status: "ativo",
    notas: "Aposentado, quer vender casa no Brooklin para se mudar para o interior. Imovel avaliado em ~R$2M."
  },
  {
    empresa_id: EMPRESA_ID,
    nome: "Marina Costa Oliveira",
    tipo_pessoa: "fisica",
    cpf_cnpj: null,
    email: "marina.costa@gmail.com",
    telefone: "11921098765",
    whatsapp: "5511921098765",
    origem: "portal",
    interesse: "compra",
    status: "ativo",
    notas: "Empresaria, separada. Busca cobertura ou apartamento grande em Perdizes/Higienopolis. Sem limite de orcamento claro. Em negociacao ativa."
  },
  {
    empresa_id: EMPRESA_ID,
    nome: "Felipe e Julia Martins",
    tipo_pessoa: "fisica",
    cpf_cnpj: null,
    email: "felipe.martins@gmail.com",
    telefone: "11910987654",
    whatsapp: "5511910987654",
    origem: "whatsapp",
    interesse: "compra",
    status: "ativo",
    notas: "Casal com bebe, moram de aluguel na Vila Mariana. Querem comprar no mesmo bairro ou Saude. Ate R$800k."
  },
  {
    empresa_id: EMPRESA_ID,
    nome: "Restaurante Sabor Paulista ME",
    tipo_pessoa: "juridica",
    cpf_cnpj: "12.345.678/0001-90",
    email: "contato@saborpaulista.com.br",
    telefone: "1133456789",
    whatsapp: "5511933456789",
    origem: "site",
    interesse: "aluguel",
    status: "ativo",
    notas: "Restaurante em expansao. Procura ponto comercial com 60-100m2 na Mooca ou Tatuape. Ate R$8k/mes."
  },
  {
    empresa_id: EMPRESA_ID,
    nome: "Renata Barbosa",
    tipo_pessoa: "fisica",
    cpf_cnpj: null,
    email: "renata.barbosa@outlook.com",
    telefone: "11909876543",
    whatsapp: "5511909876543",
    origem: "portal",
    interesse: "compra",
    status: "inativo",
    notas: "Advogada. Estava buscando apt 3 dorms em Moema mas decidiu esperar. Retomar contato em 6 meses."
  },
  {
    empresa_id: EMPRESA_ID,
    nome: "Carlos Eduardo Silva",
    tipo_pessoa: "fisica",
    cpf_cnpj: null,
    email: "cadu.silva@gmail.com",
    telefone: "11998765432",
    whatsapp: "5511998765432",
    origem: "whatsapp",
    interesse: "aluguel",
    status: "ativo",
    notas: "Consultor de TI, recebeu proposta de emprego em SP. Vem do RJ. Precisa de apartamento mobiliado 1-2 dorms. Budget R$3-4k/mes."
  },
  {
    empresa_id: EMPRESA_ID,
    nome: "Construtora Horizonte SA",
    tipo_pessoa: "juridica",
    cpf_cnpj: "78.901.234/0001-56",
    email: "terrenos@horizontesa.com.br",
    telefone: "1134567890",
    whatsapp: "5511934567890",
    origem: "indicacao",
    interesse: "compra",
    status: "ativo",
    notas: "Construtora media. Interesse especifico em terrenos acima de 1000m2 na Grande SP para lancamentos residenciais. Em negociacao."
  },
  {
    empresa_id: EMPRESA_ID,
    nome: "Lucia Helena Moreira",
    tipo_pessoa: "fisica",
    cpf_cnpj: null,
    email: "lucia.moreira@gmail.com",
    telefone: "11987651234",
    whatsapp: "5511987651234",
    origem: "site",
    interesse: "compra",
    status: "ativo",
    notas: "Professora universitaria, divorciada. Busca apartamento garden ou casa terrea em bairro tranquilo. Ate R$900k."
  }
];

async function main() {
  // Imoveis ja inseridos na execucao anterior
  // console.log("=== Inserindo 10 imoveis ===");
  // const imoveisResult = await inserir("imoveis", imoveis);

  console.log("=== Inserindo 14 clientes ===");
  const clientesResult = await inserir("clientes", clientes);

  // Resumo final
  console.log("\n=== RESUMO ===");
  if (imoveisResult) {
    console.log("Imoveis inseridos:");
    imoveisResult.forEach(i => console.log(`  - ${i.titulo} (${i.tipo}, ${i.finalidade}, R$${i.valor})`));
  }
  if (clientesResult) {
    console.log("Clientes inseridos:");
    clientesResult.forEach(c => console.log(`  - ${c.nome} (${c.interesse}, ${c.origem}, ${c.status})`));
  }
}

main().catch(console.error);
