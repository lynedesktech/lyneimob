import type { Organizacao } from "@/types/database"
import type { ConfigWhatsapp } from "@/types/whatsapp"

/**
 * Colunas que podem ser lidas com o login do próprio usuário.
 *
 * As tabelas `organizacoes` e `config_whatsapp` guardam credenciais na mesma
 * linha dos dados comuns (token do WhatsApp, identificadores do Stripe, o JSON
 * com as chaves de OpenAI/Uazapi/Redis e o segredo do webhook de portais). Como
 * as políticas de leitura liberam a linha inteira para qualquer membro da
 * organização, um `select("*")` entregava essas credenciais para um corretor
 * que consultasse a API do banco diretamente com o próprio token.
 *
 * A migration 047 revoga a leitura dessas colunas do papel `authenticated`.
 * Quem realmente precisa delas — as Server Actions de integração — usa a
 * conexão administrativa, sempre filtrando por `organizacao_id`.
 *
 * Precisa ser string literal (e não montada com join) para o cliente do
 * Supabase conseguir inferir o formato do retorno.
 *
 * Ao adicionar uma coluna nova na tabela, inclua aqui se ela NÃO for secreta.
 */
export const COLUNAS_ORGANIZACAO_SEGURAS =
  "id, nome, slug, logo_url, telefone, email, endereco, creci, plano, plano_status, limites, configuracoes_site, configuracoes_ia, config_distribuicao, trial_fim_em, whatsapp_numero, created_at, updated_at"

/** Organização sem as colunas de credencial. */
export type OrganizacaoSegura = Omit<
  Organizacao,
  | "configuracoes_integracoes"
  | "whatsapp_token"
  | "stripe_customer_id"
  | "stripe_subscription_id"
>

export const COLUNAS_CONFIG_WHATSAPP_SEGURAS =
  "id, organizacao_id, uazapi_url, instance_id, numero_whatsapp, ativo, nome_agente, prompt_personalizado, horario_atendimento, mensagem_fora_horario, corretor_padrao_id, criado_em, atualizado_em"

/** Configuração do WhatsApp sem o token da instância. */
export type ConfigWhatsappSegura = Omit<ConfigWhatsapp, "uazapi_token">
