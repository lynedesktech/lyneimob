import type Anthropic from "@anthropic-ai/sdk"
import type { ContextoTool } from "./executores-sdr"
import {
  executarBuscarImoveis,
  executarBuscarImovelPorIdentificacao,
  executarCriarCliente,
  executarCriarNegocio,
  executarCriarAtividade,
  executarSalvarQualificacao,
  executarEncaminharCorretor,
  executarEnviarCardImovel,
} from "./executores-sdr"

// ============================================================
// Tools (function calling) do agente SDR — formato Anthropic
// Define as funções que a IA pode chamar durante a conversa.
// Executores em ./executores-sdr.ts
// ============================================================

export const definicaoToolsSdr: Anthropic.Tool[] = [
  {
    name: "buscar_imovel_por_identificacao",
    description:
      "Buscar um imóvel específico pelo nome, código interno ou ID. Retorna TODOS os detalhes do imóvel (endereço, preço, quartos, suítes, banheiros, vagas, áreas, descrição, etc). Use quando o cliente mencionar um imóvel específico pelo nome ou código, ou quando precisar dos detalhes completos de um imóvel já identificado.",
    input_schema: {
      type: "object",
      properties: {
        nome: {
          type: "string",
          description: "Nome ou parte do título do imóvel (ex: 'Kubica', 'apartamento centro')",
        },
        codigo: {
          type: "string",
          description: "Código interno do imóvel (ex: 'IMO-001', 'IMO 01')",
        },
        id: {
          type: "string",
          description: "ID UUID do imóvel no sistema (retornado por buscar_imoveis ou presente no contexto)",
        },
      },
      required: [],
    },
  },
  {
    name: "buscar_imoveis",
    description:
      "Buscar imóveis disponíveis no sistema que correspondam aos critérios do cliente. Use sempre que precisar apresentar opções de imóveis ou recomendar similares.",
    input_schema: {
      type: "object",
      properties: {
        tipo: {
          type: "string",
          enum: [
            "apartamento", "casa", "terreno", "sala_comercial",
            "galpao", "cobertura", "kitnet", "fazenda", "sitio", "loja",
          ],
          description: "Tipo do imóvel",
        },
        finalidade: {
          type: "string",
          enum: ["venda", "aluguel"],
          description: "Se o cliente quer comprar ou alugar",
        },
        cidade: {
          type: "string",
          description: "Cidade do imóvel",
        },
        bairro: {
          type: "string",
          description: "Bairro do imóvel",
        },
        preco_min: {
          type: "number",
          description: "Preço mínimo em reais",
        },
        preco_max: {
          type: "number",
          description: "Preço máximo em reais",
        },
        quartos_min: {
          type: "integer",
          description: "Quantidade mínima de quartos",
        },
      },
      required: [],
    },
  },
  {
    name: "atualizar_cliente",
    description:
      "Atualizar os dados do cliente na plataforma. O cliente já existe (criado automaticamente no primeiro contato) — esta ferramenta preenche o nome e informações que a IA coletou. Use assim que souber o nome do cliente.",
    input_schema: {
      type: "object",
      properties: {
        nome: {
          type: "string",
          description: "Nome completo do cliente",
        },
        email: {
          type: "string",
          description: "Email do cliente (se informado)",
        },
        tipo: {
          type: "string",
          enum: ["comprador", "vendedor", "locatario", "proprietario"],
          description: "Tipo de interesse do cliente",
        },
        observacoes: {
          type: "string",
          description: "Observações relevantes sobre o cliente",
        },
      },
      required: ["nome", "tipo"],
    },
  },
  {
    name: "atualizar_negocio",
    description:
      "Atualizar o negócio no pipeline. O negócio já existe (criado automaticamente no primeiro contato) — esta ferramenta enriquece com título, tipo e valor conforme a conversa avança. Use quando o cliente demonstrar interesse concreto.",
    input_schema: {
      type: "object",
      properties: {
        titulo: {
          type: "string",
          description: "Título do negócio (ex: 'Venda - Apto Centro para João')",
        },
        cliente_id: {
          type: "string",
          description: "ID do cliente (retornado por criar_cliente)",
        },
        imovel_id: {
          type: "string",
          description: "ID do imóvel de interesse (retornado por buscar_imoveis)",
        },
        tipo: {
          type: "string",
          enum: ["venda", "aluguel"],
          description: "Tipo do negócio",
        },
        valor: {
          type: "number",
          description: "Valor estimado do negócio em reais",
        },
      },
      required: ["titulo", "cliente_id", "tipo"],
    },
  },
  {
    name: "criar_atividade",
    description:
      "Agendar uma atividade para o corretor (visita, ligação, follow-up). Use quando combinar algo com o cliente ou quando o lead estiver qualificado.",
    input_schema: {
      type: "object",
      properties: {
        titulo: {
          type: "string",
          description: "Título da atividade (ex: 'Ligar para João - Apto Centro')",
        },
        tipo: {
          type: "string",
          enum: ["ligacao", "email", "visita", "reuniao", "follow_up", "proposta", "outro"],
          description: "Tipo da atividade",
        },
        data_vencimento: {
          type: "string",
          description: "Data e hora no formato ISO (ex: '2026-03-16T10:00:00')",
        },
        cliente_id: {
          type: "string",
          description: "ID do cliente vinculado",
        },
        negocio_id: {
          type: "string",
          description: "ID do negócio vinculado",
        },
        descricao: {
          type: "string",
          description: "Descrição ou notas para o corretor",
        },
      },
      required: ["titulo", "tipo", "data_vencimento"],
    },
  },
  {
    name: "salvar_qualificacao",
    description:
      "Salvar os dados de qualificação extraídos da conversa. Use sempre que coletar informações sobre o que o cliente procura. Pode chamar várias vezes — os dados são mesclados.",
    input_schema: {
      type: "object",
      properties: {
        tipo_imovel: {
          type: "string",
          description: "Tipo de imóvel desejado",
        },
        finalidade: {
          type: "string",
          description: "Finalidade (comprar, alugar, vender)",
        },
        bairros: {
          type: "array",
          items: { type: "string" },
          description: "Bairros de interesse",
        },
        faixa_preco: {
          type: "object",
          properties: {
            min: { type: "number" },
            max: { type: "number" },
          },
          description: "Faixa de preço em reais",
        },
        urgencia: {
          type: "string",
          enum: ["alta", "media", "baixa"],
          description: "Urgência do cliente",
        },
        observacoes: {
          type: "string",
          description: "Observações adicionais sobre a qualificação",
        },
      },
      required: [],
    },
  },
  {
    name: "enviar_card_imovel",
    description:
      "Envia DIRETAMENTE pelo WhatsApp um card visual rico de um imóvel: foto de capa + caption com endereço, preço, quartos, banheiros, vagas + link clicável 'Veja mais fotos e detalhes' apontando pro site público. Use SEMPRE que recomendar um imóvel específico ao cliente — é muito mais atraente que descrever em texto. Pode chamar várias vezes se for mostrar várias opções. Depois de chamar, NÃO repita os dados em texto, só pergunte o que o cliente acha.",
    input_schema: {
      type: "object",
      properties: {
        imovel_id: {
          type: "string",
          description: "ID UUID do imóvel a enviar (obtido por buscar_imoveis ou buscar_imovel_por_identificacao)",
        },
      },
      required: ["imovel_id"],
    },
  },
  {
    name: "encaminhar_corretor",
    description:
      "Encaminhar a conversa para um corretor humano. Use quando o lead estiver qualificado e pronto para atendimento personalizado, ou quando o cliente pedir para falar com um humano.",
    input_schema: {
      type: "object",
      properties: {
        motivo: {
          type: "string",
          description: "Motivo do encaminhamento (ex: 'lead qualificado', 'pediu atendimento humano')",
        },
        resumo: {
          type: "string",
          description: "Resumo da conversa para o corretor (2-3 frases)",
        },
      },
      required: ["motivo", "resumo"],
    },
  },
]

// ============================================================
// Dispatcher — roteia chamada de tool para o executor correto
// ============================================================

/**
 * Executa um tool chamado pela IA e retorna resultado legível
 */
export async function executarTool(
  nome: string,
  argumentos: Record<string, unknown>,
  contexto: ContextoTool
): Promise<string> {
  switch (nome) {
    case "buscar_imovel_por_identificacao":
      return executarBuscarImovelPorIdentificacao(argumentos, contexto)
    case "buscar_imoveis":
      return executarBuscarImoveis(argumentos, contexto)
    case "atualizar_cliente":
      return executarCriarCliente(argumentos, contexto)
    case "atualizar_negocio":
      return executarCriarNegocio(argumentos, contexto)
    case "criar_atividade":
      return executarCriarAtividade(argumentos, contexto)
    case "salvar_qualificacao":
      return executarSalvarQualificacao(argumentos, contexto)
    case "enviar_card_imovel":
      return executarEnviarCardImovel(argumentos, contexto)
    case "encaminhar_corretor":
      return executarEncaminharCorretor(argumentos, contexto)
    default:
      return `Ferramenta "${nome}" não reconhecida.`
  }
}
