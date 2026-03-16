import type { Imovel, ImovelFoto, TipoImovel, FinalidadeImovel } from "@/types/database"
import { SIGLAS_ESTADOS_BR } from "@/types/imoveis"

// ============================================================
// Mapeamento de tipos do banco para VRSync
// ============================================================

const MAPA_TIPO_IMOVEL: Record<TipoImovel, string> = {
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

const MAPA_ESTADO_SIGLA: Record<string, string> = {
  "Acre": "AC", "Alagoas": "AL", "Amapá": "AP", "Amazonas": "AM",
  "Bahia": "BA", "Ceará": "CE", "Distrito Federal": "DF", "Espírito Santo": "ES",
  "Goiás": "GO", "Maranhão": "MA", "Mato Grosso": "MT", "Mato Grosso do Sul": "MS",
  "Minas Gerais": "MG", "Pará": "PA", "Paraíba": "PB", "Paraná": "PR",
  "Pernambuco": "PE", "Piauí": "PI", "Rio de Janeiro": "RJ", "Rio Grande do Norte": "RN",
  "Rio Grande do Sul": "RS", "Rondônia": "RO", "Roraima": "RR", "Santa Catarina": "SC",
  "São Paulo": "SP", "Sergipe": "SE", "Tocantins": "TO",
  // Aceitar siglas diretamente
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

function obterTransactionType(finalidade: FinalidadeImovel): string {
  if (finalidade === "aluguel") return "For Rent"
  if (finalidade === "venda_e_aluguel") return "For Sale/Rent"
  return "For Sale"
}

// ============================================================
// Validação de elegibilidade para portais (VRSync spec)
// ============================================================

type ImovelComFotos = Imovel & { imovel_fotos: ImovelFoto[] }

export function imovelElegivelParaPortal(
  imovel: ImovelComFotos
): { elegivel: boolean; motivos: string[] } {
  const motivos: string[] = []

  // Estado válido
  const sigla = MAPA_ESTADO_SIGLA[imovel.estado] || imovel.estado?.toUpperCase()
  if (!(SIGLAS_ESTADOS_BR as readonly string[]).includes(sigla)) {
    motivos.push("Estado inválido ou não preenchido")
  }

  // Pelo menos 1 foto
  if (!imovel.imovel_fotos || imovel.imovel_fotos.length === 0) {
    motivos.push("Sem foto (mínimo 1 exigido)")
  }

  // Descrição com mínimo 20 caracteres
  const descricao = imovel.descricao_ia || imovel.descricao || imovel.titulo || ""
  if (descricao.length < 20) {
    motivos.push("Descrição com menos de 20 caracteres")
  }

  // Pelo menos um preço válido conforme finalidade
  const temPrecoVenda = (imovel.preco_venda ?? 0) > 0
  const temPrecoAluguel = (imovel.preco_aluguel ?? 0) > 0

  if (imovel.finalidade === "venda" && !temPrecoVenda) {
    motivos.push("Sem preço de venda")
  } else if (imovel.finalidade === "aluguel" && !temPrecoAluguel) {
    motivos.push("Sem preço de aluguel")
  } else if (imovel.finalidade === "venda_e_aluguel" && !temPrecoVenda && !temPrecoAluguel) {
    motivos.push("Sem preço de venda nem de aluguel")
  }

  // Cidade preenchida
  if (!imovel.cidade?.trim()) {
    motivos.push("Cidade não preenchida")
  }

  return { elegivel: motivos.length === 0, motivos }
}

// ============================================================
// Sanitização de campos (limites VRSync)
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
  imovel: ImovelComFotos,
  appUrl: string,
  slug: string,
  contato: { nome: string; email: string; telefone: string },
  dominioCustomizado?: string
): string {
  const estadoNormalizado = MAPA_ESTADO_SIGLA[imovel.estado] || imovel.estado?.toUpperCase()
  const siglaEstado = (SIGLAS_ESTADOS_BR as readonly string[]).includes(estadoNormalizado)
    ? estadoNormalizado
    : ""
  const tipoVrsync = MAPA_TIPO_IMOVEL[imovel.tipo] || "Residential / Home"
  const transactionType = obterTransactionType(imovel.finalidade)

  const fotos = imovel.imovel_fotos
    .sort((a, b) => {
      if (a.eh_capa && !b.eh_capa) return -1
      if (!a.eh_capa && b.eh_capa) return 1
      return a.ordem - b.ordem
    })

  const fotosXml = fotos
    .map((foto, i) => {
      const primary = i === 0 ? ' primary="true"' : ""
      const caption = foto.descricao ? ` caption="${escapeXml(foto.descricao)}"` : ""
      return `        <Item medium="image"${primary}${caption}>${escapeXml(foto.url)}</Item>`
    })
    .join("\n")

  const descricaoRaw = imovel.descricao_ia || imovel.descricao || imovel.titulo || ""
  const descricao = truncar(descricaoRaw, 5000)
  const titulo = truncar(escapeXml(imovel.titulo_ia || imovel.titulo), 100)
  const cepFormatado = formatarCep(imovel.cep)

  // Preços condicionais — só emitir tags com valor > 0
  const precoVenda = imovel.preco_venda ?? 0
  const precoAluguel = imovel.preco_aluguel ?? 0
  const tagPrecoVenda = precoVenda > 0
    ? `        <ListPrice currency="BRL">${precoVenda}</ListPrice>`
    : ""
  const tagPrecoAluguel = precoAluguel > 0
    ? `        <RentalPrice currency="BRL" period="Monthly">${precoAluguel}</RentalPrice>`
    : ""

  return `    <Listing>
      <ListingID>${escapeXml(imovel.codigo)}</ListingID>
      <TransactionType>${transactionType}</TransactionType>
      <Title>${titulo}</Title>
      <DetailViewUrl>${dominioCustomizado ? `https://${escapeXml(dominioCustomizado)}` : `${escapeXml(appUrl)}/${escapeXml(slug)}`}/imoveis/${imovel.id}</DetailViewUrl>

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
${tagPrecoVenda}${tagPrecoVenda && tagPrecoAluguel ? "\n" : ""}${tagPrecoAluguel}
        <PropertyAdministrationFee currency="BRL">${imovel.condominio || 0}</PropertyAdministrationFee>
        <YearlyTax currency="BRL">${imovel.iptu || 0}</YearlyTax>
        <LivingArea unit="square metres">${imovel.area_construida || imovel.area_total || 0}</LivingArea>
        <LotArea unit="square metres">${imovel.area_total || 0}</LotArea>
        <Bedrooms>${imovel.quartos}</Bedrooms>
        <Bathrooms>${imovel.banheiros}</Bathrooms>
        <Suites>${imovel.suites}</Suites>
        <Garage type="Parking Space">${imovel.vagas_garagem}</Garage>
      </Details>

      <Media>
${fotosXml}
      </Media>

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
  imoveis: ImovelComFotos[],
  organizacao: { nome: string; email: string | null; telefone: string | null; slug: string },
  appUrl: string,
  dominioCustomizado?: string
): ResultadoFeedXml {
  const dataPublicacao = new Date().toISOString()

  const contato = {
    nome: organizacao.nome,
    email: organizacao.email || "",
    telefone: organizacao.telefone || "",
  }

  // Filtrar imóveis elegíveis para portais
  const elegiveis: ImovelComFotos[] = []
  const excluidos: ImovelExcluidoFeed[] = []

  for (const imovel of imoveis) {
    const resultado = imovelElegivelParaPortal(imovel)
    if (resultado.elegivel) {
      elegiveis.push(imovel)
    } else {
      excluidos.push({
        codigo: imovel.codigo,
        titulo: imovel.titulo,
        motivos: resultado.motivos,
      })
    }
  }

  const listingsXml = elegiveis
    .map((imovel) => gerarListingXml(imovel, appUrl, organizacao.slug, contato, dominioCustomizado))
    .join("\n")

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<ListingDataFeed xmlns="http://www.vivareal.com/schemas/1.0/VRSync"
  xsi:schemaLocation="http://www.vivareal.com/schemas/1.0/VRSync"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">

  <Header>
    <Provider>LyneImob</Provider>
    <Email>${escapeXml(organizacao.email)}</Email>
    <ContactName>${escapeXml(organizacao.nome)}</ContactName>
    <Telephone>${escapeXml(organizacao.telefone)}</Telephone>
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
