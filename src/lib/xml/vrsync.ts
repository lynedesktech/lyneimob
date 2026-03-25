// ============================================================
// Gerador de Feed XML VRSync para portais imobiliários
// Adaptado para o schema real do banco (tabela imoveis)
// ============================================================

// Tipo do imóvel conforme banco real
interface ImovelBanco {
  id: string
  empresa_id: string
  titulo: string
  descricao: string | null
  tipo: string
  finalidade: string
  status: string
  valor: number | null
  valor_condominio: number | null
  valor_iptu: number | null
  area_total: number | null
  area_construida: number | null
  quartos: number | null
  suites: number | null
  banheiros: number | null
  vagas: number | null
  cep: string | null
  logradouro: string | null
  numero: string | null
  complemento: string | null
  bairro: string | null
  cidade: string | null
  estado: string | null
  codigo_interno: string | null
  destaque: boolean
  criado_em: string
}

// ============================================================
// Mapeamento de tipos do banco para VRSync
// ============================================================

const MAPA_TIPO_IMOVEL: Record<string, string> = {
  apartamento: "Residential / Apartment",
  casa: "Residential / Home",
  terreno: "Residential / Land Lot",
  sala_comercial: "Commercial / Office",
  galpao: "Commercial / Building",
  cobertura: "Residential / Penthouse",
  kitnet: "Residential / Kitnet",
  fazenda: "Residential / Land Lot",
  sitio: "Residential / Land Lot",
  loja: "Commercial / Retail",
  outro: "Residential / Home",
}

const SIGLAS_ESTADOS_BR = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO",
]

const MAPA_ESTADO_SIGLA: Record<string, string> = {
  "Acre": "AC", "Alagoas": "AL", "Amapá": "AP", "Amazonas": "AM",
  "Bahia": "BA", "Ceará": "CE", "Distrito Federal": "DF", "Espírito Santo": "ES",
  "Goiás": "GO", "Maranhão": "MA", "Mato Grosso": "MT", "Mato Grosso do Sul": "MS",
  "Minas Gerais": "MG", "Pará": "PA", "Paraíba": "PB", "Paraná": "PR",
  "Pernambuco": "PE", "Piauí": "PI", "Rio de Janeiro": "RJ", "Rio Grande do Norte": "RN",
  "Rio Grande do Sul": "RS", "Rondônia": "RO", "Roraima": "RR", "Santa Catarina": "SC",
  "São Paulo": "SP", "Sergipe": "SE", "Tocantins": "TO",
  "AC": "AC", "AL": "AL", "AP": "AP", "AM": "AM", "BA": "BA", "CE": "CE",
  "DF": "DF", "ES": "ES", "GO": "GO", "MA": "MA", "MT": "MT", "MS": "MS",
  "MG": "MG", "PA": "PA", "PB": "PB", "PR": "PR", "PE": "PE", "PI": "PI",
  "RJ": "RJ", "RN": "RN", "RS": "RS", "RO": "RO", "RR": "RR", "SC": "SC",
  "SP": "SP", "SE": "SE", "TO": "TO",
}

// ============================================================
// Escape XML
// ============================================================

function escapeXml(texto: string | null | undefined): string {
  if (!texto) return ""
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

// ============================================================
// Tipo de transação
// ============================================================

function obterTransactionType(finalidade: string): string {
  if (finalidade === "aluguel") return "For Rent"
  if (finalidade === "venda_e_aluguel") return "For Sale/Rent"
  return "For Sale"
}

// ============================================================
// Validação de elegibilidade para portais
// ============================================================

export function imovelElegivelParaPortal(
  imovel: ImovelBanco
): { elegivel: boolean; motivos: string[] } {
  const motivos: string[] = []

  // Estado válido
  const sigla = MAPA_ESTADO_SIGLA[imovel.estado || ""] || imovel.estado?.toUpperCase() || ""
  if (!SIGLAS_ESTADOS_BR.includes(sigla)) {
    motivos.push("Estado inválido ou não preenchido")
  }

  // Descrição com mínimo 20 caracteres
  const descricao = imovel.descricao || imovel.titulo || ""
  if (descricao.length < 20) {
    motivos.push("Descrição com menos de 20 caracteres")
  }

  // Preço válido
  const temPreco = (imovel.valor ?? 0) > 0
  if (!temPreco) {
    motivos.push("Sem preço definido")
  }

  // Cidade preenchida
  if (!imovel.cidade?.trim()) {
    motivos.push("Cidade não preenchida")
  }

  return { elegivel: motivos.length === 0, motivos }
}

// ============================================================
// Sanitização
// ============================================================

function formatarCep(cep: string | null | undefined): string | null {
  if (!cep) return null
  const limpo = cep.replace(/\D/g, "")
  return limpo.length === 8 ? limpo : null
}

function truncar(texto: string, limite: number): string {
  return texto.length > limite ? texto.slice(0, limite) : texto
}

// ============================================================
// Gerar XML de um imóvel
// ============================================================

function gerarListingXml(
  imovel: ImovelBanco,
  appUrl: string,
  slug: string,
  contato: { nome: string; email: string; telefone: string },
): string {
  const estadoNormalizado = MAPA_ESTADO_SIGLA[imovel.estado || ""] || imovel.estado?.toUpperCase() || ""
  const siglaEstado = SIGLAS_ESTADOS_BR.includes(estadoNormalizado)
    ? estadoNormalizado
    : ""
  const tipoVrsync = MAPA_TIPO_IMOVEL[imovel.tipo] || "Residential / Home"
  const transactionType = obterTransactionType(imovel.finalidade)

  const descricaoRaw = imovel.descricao || imovel.titulo || ""
  const descricao = truncar(descricaoRaw, 5000)
  const titulo = truncar(escapeXml(imovel.titulo), 100)
  const cepFormatado = formatarCep(imovel.cep)
  const codigoId = imovel.codigo_interno || imovel.id

  // Preço — o banco tem um campo `valor` único
  const tagPreco = (imovel.valor ?? 0) > 0
    ? (imovel.finalidade === "aluguel"
        ? `        <RentalPrice currency="BRL" period="Monthly">${imovel.valor}</RentalPrice>`
        : `        <ListPrice currency="BRL">${imovel.valor}</ListPrice>`)
    : ""

  return `    <Listing>
      <ListingID>${escapeXml(codigoId)}</ListingID>
      <TransactionType>${transactionType}</TransactionType>
      <Title>${titulo}</Title>
      <DetailViewUrl>${escapeXml(appUrl)}/${escapeXml(slug)}/imoveis/${imovel.id}</DetailViewUrl>

      <Location>
        <Country abbreviation="BR">Brasil</Country>
        <State abbreviation="${escapeXml(siglaEstado)}">${escapeXml(imovel.estado)}</State>
        <City>${escapeXml(imovel.cidade)}</City>
        <Neighborhood>${escapeXml(imovel.bairro)}</Neighborhood>
        <Address>${escapeXml(imovel.logradouro)}</Address>
        <StreetNumber>${escapeXml(imovel.numero)}</StreetNumber>${cepFormatado ? `\n        <PostalCode>${cepFormatado}</PostalCode>` : ""}
      </Location>

      <Details>
        <PropertyType>${tipoVrsync}</PropertyType>
        <Description><![CDATA[${descricao}]]></Description>
${tagPreco}
        <PropertyAdministrationFee currency="BRL">${imovel.valor_condominio || 0}</PropertyAdministrationFee>
        <YearlyTax currency="BRL">${imovel.valor_iptu || 0}</YearlyTax>
        <LivingArea unit="square metres">${imovel.area_construida || imovel.area_total || 0}</LivingArea>
        <LotArea unit="square metres">${imovel.area_total || 0}</LotArea>
        <Bedrooms>${imovel.quartos || 0}</Bedrooms>
        <Bathrooms>${imovel.banheiros || 0}</Bathrooms>
        <Suites>${imovel.suites || 0}</Suites>
        <Garage type="Parking Space">${imovel.vagas || 0}</Garage>
      </Details>

      <ContactInfo>
        <Name>${escapeXml(contato.nome)}</Name>
        <Email>${escapeXml(contato.email)}</Email>
        <Telephone>${escapeXml(contato.telefone)}</Telephone>
      </ContactInfo>
    </Listing>`
}

// ============================================================
// Tipo de retorno do feed
// ============================================================

export interface ImovelExcluidoFeed {
  codigo: string
  titulo: string
  motivos: string[]
}

export interface ResultadoFeedXml {
  xml: string
  totalPublicaveis: number
  excluidos: ImovelExcluidoFeed[]
}

// ============================================================
// Gerar feed XML completo
// ============================================================

export function gerarFeedXml(
  imoveis: ImovelBanco[],
  empresa: { nome: string; email: string | null; telefone: string | null; slug: string },
  appUrl: string,
): ResultadoFeedXml {
  const dataPublicacao = new Date().toISOString()

  const contato = {
    nome: empresa.nome,
    email: empresa.email || "",
    telefone: empresa.telefone || "",
  }

  // Filtrar imóveis elegíveis para portais
  const elegiveis: ImovelBanco[] = []
  const excluidos: ImovelExcluidoFeed[] = []

  for (const imovel of imoveis) {
    const resultado = imovelElegivelParaPortal(imovel)
    if (resultado.elegivel) {
      elegiveis.push(imovel)
    } else {
      excluidos.push({
        codigo: imovel.codigo_interno || imovel.id,
        titulo: imovel.titulo,
        motivos: resultado.motivos,
      })
    }
  }

  const listingsXml = elegiveis
    .map((imovel) => gerarListingXml(imovel, appUrl, empresa.slug, contato))
    .join("\n")

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<ListingDataFeed xmlns="http://www.vivareal.com/schemas/1.0/VRSync"
  xsi:schemaLocation="http://www.vivareal.com/schemas/1.0/VRSync"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">

  <Header>
    <Provider>LyneImob</Provider>
    <Email>${escapeXml(empresa.email)}</Email>
    <ContactName>${escapeXml(empresa.nome)}</ContactName>
    <Telephone>${escapeXml(empresa.telefone)}</Telephone>
    <PublishDate>${dataPublicacao}</PublishDate>
  </Header>

  <Listings>
${listingsXml}
  </Listings>
</ListingDataFeed>`

  return {
    xml,
    totalPublicaveis: elegiveis.length,
    excluidos,
  }
}
