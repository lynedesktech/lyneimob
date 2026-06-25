// ============================================================
// Sanitização do nome do contato (pushName do WhatsApp)
//
// O pushName é o nome que a PESSOA escolheu no perfil do WhatsApp dela —
// pode ser literalmente qualquer coisa: "Deus", um emoji, o nome de uma
// empresa, um papel ("Vendedor"), um número. O agente NÃO pode tratar isso
// como nome real e chamar o cliente de "Deus".
//
// Esta função devolve um primeiro nome plausível para o agente usar, ou
// null quando o "nome" claramente não é nome de pessoa (aí o agente
// pergunta "com quem tenho o prazer de falar?").
//
// Importante: a avaliação é feita sobre o PRIMEIRO token (o nome que será
// usado de fato) e por comparação EXATA de palavra — nunca substring, pra
// não queimar nomes reais ("Meire", "Meirelles" contêm "mei", mas são gente).
// ============================================================

type NomeBruto = string | null | undefined

// Palavras que não são nome de pessoa (comparadas sem acento, minúsculas, por token exato)
const NOMES_INVALIDOS = new Set([
  // religioso / afetivo / placeholder
  "deus", "jesus", "cristo", "nossa", "senhora",
  "amor", "vida", "nenem", "bb", "bebe",
  "cliente", "comprador", "contato", "lead", "interessado",
  "teste", "test", "testando",
  "eu", "eumesmo", "fulano", "ciclano", "beltrano",
  "anonimo", "desconhecido", "ninguem",
  "none", "null", "undefined", "na", "sem", "nome",
  "whatsapp", "zap", "wpp",
  // papel / função (pushName comercial)
  "vendedor", "vendedora", "atendimento", "atendente", "suporte", "sac",
  "recepcao", "financeiro", "comercial", "gerente", "diretor", "diretora",
  "secretaria", "plantao", "loja", "patrao", "chefe", "adm", "admin",
  // parentesco / apelido afetivo
  "crush", "pai", "mae", "filho", "filha", "vovo", "tia", "tio",
  "sogra", "sogro", "marido", "esposa", "namorado", "namorada",
])

// Marcadores de empresa (comparados por TOKEN EXATO contra o primeiro nome)
const PALAVRAS_EMPRESA = new Set([
  "imoveis", "imovel", "imobiliaria", "imobiliario", "imob",
  "ltda", "eireli", "mei", "construtora", "incorporadora",
  "corretor", "corretora", "consultoria", "negocios", "negocio",
  "realty", "broker", "urbanismo", "empreendimento",
])

// Partículas de sobrenome que às vezes vêm como primeiro token
const PARTICULAS = new Set(["de", "da", "do", "dos", "das", "del", "della", "mc", "mac", "van", "von"])

/** Remove acentos/marcas para comparação (à prova de encoding). */
function semAcento(s: string): string {
  return s.normalize("NFD").replace(/\p{M}/gu, "")
}

/** Capitaliza cada segmento (separado por espaço, hífen ou apóstrofo): "ana-maria" -> "Ana-Maria". */
function capitalizar(s: string): string {
  return s.toLowerCase().replace(/(^|[\s'-])(\p{L})/gu, (_m, sep, ch) => sep + ch.toUpperCase())
}

/**
 * Extrai um primeiro nome plausível do pushName/nome bruto do contato.
 * Devolve o nome capitalizado, ou null quando não é nome de pessoa.
 */
export function extrairPrimeiroNomeValido(nomeBruto: NomeBruto): string | null {
  if (!nomeBruto) return null

  // Mantém só letras (com acento), espaço, hífen e apóstrofo — tira dígitos, emojis e símbolos
  const limpo = nomeBruto
    .replace(/[^\p{L}\s'-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()

  if (!limpo) return null

  const primeiro = limpo.split(" ")[0]
  if (primeiro.length < 2) return null // iniciais soltas, "x", etc.

  // Avaliação SEMPRE sobre o primeiro token (o que será usado), por igualdade exata
  const chave = semAcento(primeiro).toLowerCase()
  if (NOMES_INVALIDOS.has(chave)) return null
  if (PALAVRAS_EMPRESA.has(chave)) return null
  if (PARTICULAS.has(chave)) return null

  return capitalizar(primeiro)
}
