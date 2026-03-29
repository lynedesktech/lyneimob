import type { ColunaExportacao } from "@/types/exportacao"
import {
  labelsTipoImovel,
  labelsFinalidade,
  labelsStatusImovel,
} from "@/lib/constantes/imoveis"
import {
  labelsTipoCliente,
  labelsOrigem,
  labelsStatusCliente,
} from "@/lib/constantes/clientes"
import {
  labelsTipoNegocio,
  labelsStatusNegocio,
} from "@/lib/constantes/negocios"
import {
  labelsTipoAtividade,
  labelsPrioridade,
  labelsStatusAtividade,
} from "@/lib/constantes/atividades"
import { formatarPreco, formatarData, formatarDataHora } from "@/lib/formatadores"

// ============================================================
// Helpers
// ============================================================

function labelDe(mapa: Record<string, string>) {
  return (valor: unknown) => (typeof valor === "string" ? mapa[valor] ?? valor : "—")
}

function nomeRelacao(campo: string) {
  return (valor: unknown) => {
    if (!valor || typeof valor !== "object") return "—"
    const obj = valor as Record<string, unknown>
    return (obj[campo] as string) ?? "—"
  }
}

// ============================================================
// Colunas — Imóveis
// ============================================================

export const colunasImoveis: ColunaExportacao[] = [
  { campo: "codigo", label: "Código" },
  { campo: "titulo", label: "Título" },
  { campo: "tipo", label: "Tipo", formatar: labelDe(labelsTipoImovel) },
  { campo: "finalidade", label: "Finalidade", formatar: labelDe(labelsFinalidade) },
  { campo: "status", label: "Status", formatar: labelDe(labelsStatusImovel) },
  { campo: "cidade", label: "Cidade" },
  { campo: "estado", label: "UF" },
  { campo: "bairro", label: "Bairro" },
  { campo: "endereco", label: "Endereço" },
  { campo: "valor", label: "Preço Venda", formatar: (v) => formatarPreco(v as number | null) },
  { campo: "valor_aluguel", label: "Preço Aluguel", formatar: (v) => formatarPreco(v as number | null) },
  { campo: "area_total", label: "Área Total (m²)" },
  { campo: "quartos", label: "Quartos" },
  { campo: "banheiros", label: "Banheiros" },
  { campo: "vagas", label: "Vagas" },
  { campo: "created_at", label: "Cadastrado em", formatar: (v) => formatarData(v as string | null) },
]

// ============================================================
// Colunas — Clientes
// ============================================================

export const colunasClientes: ColunaExportacao[] = [
  { campo: "nome", label: "Nome" },
  { campo: "email", label: "E-mail" },
  { campo: "telefone", label: "Telefone" },
  { campo: "whatsapp", label: "WhatsApp" },
  { campo: "cpf_cnpj", label: "CPF/CNPJ" },
  { campo: "tipo", label: "Tipo", formatar: labelDe(labelsTipoCliente) },
  { campo: "origem", label: "Origem", formatar: labelDe(labelsOrigem) },
  { campo: "status", label: "Status", formatar: labelDe(labelsStatusCliente) },
  { campo: "score", label: "Score" },
  { campo: "observacoes", label: "Observações" },
  { campo: "created_at", label: "Cadastrado em", formatar: (v) => formatarData(v as string | null) },
]

// ============================================================
// Colunas — Negócios
// ============================================================

export const colunasNegocios: ColunaExportacao[] = [
  { campo: "titulo", label: "Título" },
  { campo: "clientes", label: "Cliente", formatar: nomeRelacao("nome") },
  { campo: "imoveis", label: "Imóvel", formatar: nomeRelacao("titulo") },
  { campo: "pipeline_etapas", label: "Etapa", formatar: nomeRelacao("nome") },
  { campo: "tipo", label: "Tipo", formatar: labelDe(labelsTipoNegocio) },
  { campo: "valor", label: "Valor", formatar: (v) => formatarPreco(v as number | null) },
  { campo: "status", label: "Status", formatar: labelDe(labelsStatusNegocio) },
  { campo: "usuarios", label: "Corretor", formatar: nomeRelacao("nome") },
  { campo: "previsao_fechamento", label: "Previsão Fechamento", formatar: (v) => formatarData(v as string | null) },
  { campo: "created_at", label: "Criado em", formatar: (v) => formatarData(v as string | null) },
]

// ============================================================
// Colunas — Atividades
// ============================================================

export const colunasAtividades: ColunaExportacao[] = [
  { campo: "titulo", label: "Título" },
  { campo: "tipo", label: "Tipo", formatar: labelDe(labelsTipoAtividade) },
  { campo: "prioridade", label: "Prioridade", formatar: labelDe(labelsPrioridade) },
  { campo: "status", label: "Status", formatar: labelDe(labelsStatusAtividade) },
  { campo: "data_vencimento", label: "Data Início", formatar: (v) => formatarDataHora(v as string | null) },
  { campo: "data_fim", label: "Data Fim", formatar: (v) => formatarDataHora(v as string | null) },
  { campo: "clientes", label: "Cliente", formatar: nomeRelacao("nome") },
  { campo: "negocios", label: "Negócio", formatar: nomeRelacao("titulo") },
  { campo: "usuarios", label: "Responsável", formatar: nomeRelacao("nome") },
  { campo: "descricao", label: "Descrição" },
]

// ============================================================
// Mapa de colunas por módulo
// ============================================================

export const colunasPorModulo: Record<string, ColunaExportacao[]> = {
  imoveis: colunasImoveis,
  clientes: colunasClientes,
  negocios: colunasNegocios,
  atividades: colunasAtividades,
}
