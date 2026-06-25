"""Agente IA com tool use — loop de conversacao Anthropic Claude.

Migrado de OpenAI (gpt-4.1-mini) pra Claude:
- Haiku 4.5 padrao (rapido + barato)
- Sonnet 4.6 quando imagem / conversa longa / fluxo complexo
"""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone, timedelta

from anthropic import AsyncAnthropic

from agente.config import settings
from agente.core.prompt import montar_prompt_sdr
from agente.core.sanitizer import extrair_primeiro_nome_valido
from agente.core.tools import TOOLS_DEFINITION, ToolContext, execute_tool
from agente.services import redis_client
from agente.services import supabase_client as db

logger = logging.getLogger(__name__)

# Fluxos complexos (buscar + qualificar + agendar + encaminhar) precisam de iteracoes
MAX_TOOL_ITERATIONS = 7

# Sinais textuais que indicam fluxo complexo (escala pra Sonnet)
SINAIS_FLUXO_COMPLEXO = (
    "agendar", "agendamento", "visita", "visitar",
    "marcar", "horario", "horário",
    "negociar", "negociação", "negociacao", "proposta", "financiamento",
    "documento", "contrato", "comprar agora",
    "falar com", "atendente", "corretor",
)


def _get_anthropic() -> AsyncAnthropic:
    return AsyncAnthropic(api_key=settings.anthropic_api_key)


def _escolher_modelo(
    num_turnos: int,
    ultima_mensagem_tem_imagem: bool,
    textos_recentes: list[str],
) -> str:
    """Roteamento Haiku/Sonnet conforme contexto.

    REGRA: a decisao eh feita no INICIO da resposta. Trocar modelo no
    meio invalida o prompt cache.
    """
    if ultima_mensagem_tem_imagem:
        return settings.anthropic_model_complex
    if num_turnos > 10:
        return settings.anthropic_model_complex
    corpus = " ".join(textos_recentes).lower()
    if any(s in corpus for s in SINAIS_FLUXO_COMPLEXO):
        return settings.anthropic_model_complex
    return settings.anthropic_model_default


async def run_agent(
    conversa_id: str,
    org_id: str,
    numero_cliente: str,
    api_url: str,
    token: str,
) -> str | None:
    """Executa o agente SDR com Claude tool use.

    Returns:
        Resposta final do agente como string, ou None se nao houver resposta.
    """
    # 1. Buscar config WhatsApp
    config = await db.select(
        "config_whatsapp",
        columns="*",
        filters={"organizacao_id": f"eq.{org_id}", "ativo": "eq.true"},
        single=True,
    )
    if not config:
        logger.error(f"[AGENT] Config WhatsApp nao encontrada para org {org_id}")
        return None

    # 2. Buscar conversa
    conversa = await db.select(
        "conversas_whatsapp",
        columns="*,origem_lead,imovel_interesse_id",
        filters={"id": f"eq.{conversa_id}"},
        single=True,
    )
    if not conversa:
        logger.error(f"[AGENT] Conversa {conversa_id} nao encontrada")
        return None

    # Nao processar conversas encaminhadas/finalizadas
    if conversa.get("status") in ("encaminhado", "finalizado", "arquivado"):
        return None

    # Verificar etapa do negocio
    negocio_id = conversa.get("negocio_id")
    if negocio_id:
        tipo_etapa = await db.buscar_etapa_negocio(negocio_id)
        if tipo_etapa and tipo_etapa != "pre_atendimento_ia":
            logger.info(f"[AGENT] Conversa {conversa_id}: fora do pre-atendimento IA (etapa: {tipo_etapa})")
            return None

    # 3. Verificar horario de atendimento
    horario = config.get("horario_atendimento")
    if horario and isinstance(horario, dict):
        if _verificar_fora_horario(horario):
            mensagem_fora = config.get("mensagem_fora_horario") or (
                "Ola! No momento estamos fora do horario de atendimento. Retornaremos em breve!"
            )
            await db.salvar_mensagem(conversa_id, org_id, "enviada", mensagem_fora)
            await db.atualizar_conversa(conversa_id, {"ultima_mensagem_em": datetime.now(timezone.utc).isoformat()})
            return mensagem_fora

    # 4. Buscar nome da organizacao
    nome_org = await db.buscar_nome_organizacao(org_id)

    # 5. Buscar mensagens recentes
    mensagens_recentes = await db.buscar_mensagens_recentes(conversa_id, 30)
    if not mensagens_recentes:
        return None

    # 6. Buscar memoria do Redis
    memoria = await redis_client.memory_get(conversa_id)

    # 7. Montar system prompt
    nome_agente = config.get("nome_agente", "") or f"Assistente {nome_org}"
    prompt_personalizado = config.get("prompt_personalizado")
    system_prompt = montar_prompt_sdr(nome_agente, nome_org, prompt_personalizado)

    # 8. Montar contexto extra
    # pushName cru pode ser qualquer coisa ("Deus", emoji, empresa). Sanitiza:
    # se nao for nome de pessoa plausivel, NAO entra no contexto e o agente
    # pergunta o nome em vez de chamar o cliente de "Deus".
    nome_cliente = extrair_primeiro_nome_valido(conversa.get("nome_cliente"))
    ja_respondeu = any(m.get("direcao") == "enviada" for m in mensagens_recentes)
    nome_verificado = f"\n- Nome do cliente: {nome_cliente}" if nome_cliente else ""

    # Detectar reativacao
    agora = datetime.now(timezone.utc)
    ultima_msg_em = conversa.get("ultima_mensagem_em")
    horas_decorridas = 0
    if ultima_msg_em:
        try:
            dt = datetime.fromisoformat(ultima_msg_em.replace("Z", "+00:00"))
            horas_decorridas = (agora - dt).total_seconds() / 3600
        except Exception:
            pass

    eh_reativacao = ja_respondeu and horas_decorridas > 24

    if not ja_respondeu:
        status_conversa = "PRIMEIRA_RESPOSTA"
    elif eh_reativacao:
        status_conversa = "REATIVACAO"
    else:
        status_conversa = "EM_ANDAMENTO"

    contexto_extra = f"\n\nCONTEXTO DA CONVERSA:{nome_verificado}"
    contexto_extra += f"\n- Numero WhatsApp: {numero_cliente}"
    contexto_extra += f"\n- Status da conversa: {status_conversa}"

    # Qualificacao existente
    qualificacao = conversa.get("qualificacao")
    if qualificacao and isinstance(qualificacao, dict):
        partes = []
        if qualificacao.get("tipo_imovel"):
            partes.append(f"Tipo: {qualificacao['tipo_imovel']}")
        if qualificacao.get("finalidade"):
            partes.append(f"Finalidade: {qualificacao['finalidade']}")
        if isinstance(qualificacao.get("bairros"), list):
            partes.append(f"Bairros: {', '.join(qualificacao['bairros'])}")
        fp = qualificacao.get("faixa_preco")
        if isinstance(fp, dict):
            min_v = f"R$ {fp['min']:,.0f}".replace(",", ".") if fp.get("min") else "sem minimo"
            max_v = f"R$ {fp['max']:,.0f}".replace(",", ".") if fp.get("max") else "sem maximo"
            partes.append(f"Faixa de preco: {min_v} a {max_v}")
        if qualificacao.get("urgencia"):
            partes.append(f"Urgencia: {qualificacao['urgencia']}")
        if partes:
            contexto_extra += f"\n\nDADOS DE QUALIFICACAO JA COLETADOS:\n" + "\n".join(partes)

    if conversa.get("cliente_id"):
        contexto_extra += "\n\nOBS: Cliente ja foi criado na plataforma."
    if negocio_id:
        contexto_extra += "\nOBS: Negocio ja foi criado no pipeline."

    origem_lead = conversa.get("origem_lead") or "whatsapp"
    contexto_extra += f"\n- Canal de origem: {str(origem_lead).upper()}"

    # Imovel de interesse
    imovel_id_interesse = conversa.get("imovel_interesse_id")
    if imovel_id_interesse:
        imovel = await db.select(
            "imoveis",
            columns="titulo,tipo,bairro,valor,valor_aluguel",
            filters={"id": f"eq.{imovel_id_interesse}"},
            single=True,
        )
        if imovel:
            valor = imovel.get("valor")
            valor_aluguel = imovel.get("valor_aluguel")
            if valor:
                preco = f"R$ {float(valor):,.0f}".replace(",", ".")
            elif valor_aluguel:
                preco = f"R$ {float(valor_aluguel):,.0f}/mes".replace(",", ".")
            else:
                preco = "preco sob consulta"
            contexto_extra += (
                f"\n- Imovel de interesse: {imovel.get('titulo','')} | "
                f"{imovel.get('tipo','')} | {imovel.get('bairro','')} | {preco}"
            )

    # 9. Montar messages array (formato Anthropic: SEM system aqui, vai separado)
    messages: list[dict] = []

    # Adicionar memoria (historico anterior)
    for msg in memoria:
        papel = msg.get("papel", "usuario")
        conteudo = msg.get("conteudo", "")
        if conteudo:
            role = "user" if papel == "usuario" else "assistant"
            messages.append({"role": role, "content": conteudo})

    # Identificar mensagens novas
    mensagens_novas = _identificar_mensagens_novas(mensagens_recentes, len(memoria))

    ultima_tem_imagem = False
    textos_recentes_user: list[str] = []
    for msg in mensagens_novas:
        if msg.get("direcao") == "recebida":
            tipo = msg.get("tipo_conteudo", "texto")
            conteudo = msg.get("conteudo", "")
            if tipo == "imagem":
                ultima_tem_imagem = True
            if tipo == "audio":
                conteudo_formatado = f"[mensagem de voz do cliente]: {conteudo}" if conteudo else "[cliente enviou audio que nao foi possivel transcrever]"
            elif tipo == "imagem":
                conteudo_formatado = conteudo if conteudo else "[cliente enviou uma imagem]"
            elif tipo in ("video", "documento", "sticker"):
                conteudo_formatado = conteudo if conteudo else f"[cliente enviou um {tipo}]"
            else:
                conteudo_formatado = conteudo or "[mensagem sem conteudo]"
            messages.append({"role": "user", "content": conteudo_formatado})
            textos_recentes_user.append(conteudo or "")

    # Anthropic exige que a primeira mensagem seja "user"
    while messages and messages[0]["role"] != "user":
        messages.pop(0)

    if not messages:
        logger.info(f"[AGENT] Conversa {conversa_id}: nenhuma mensagem nova do usuario")
        return None

    # 10. Escolher modelo (Haiku/Sonnet)
    modelo = _escolher_modelo(
        num_turnos=len(messages),
        ultima_mensagem_tem_imagem=ultima_tem_imagem,
        textos_recentes=textos_recentes_user[-3:],
    )
    logger.info(f"[AGENT] Conversa {conversa_id}: usando modelo {modelo}")

    # 11. Loop agentic Anthropic com tools
    client = _get_anthropic()
    tool_context = ToolContext(
        conversa_id=conversa_id,
        org_id=org_id,
        numero_cliente=numero_cliente,
        cliente_id=conversa.get("cliente_id"),
        negocio_id=negocio_id,
        api_url=api_url,
        token=token,
    )

    tool_summary: list[str] = []
    resposta_final: str | None = None

    for iteration in range(MAX_TOOL_ITERATIONS + 1):
        try:
            response = await client.messages.create(
                model=modelo,
                max_tokens=1024,
                # Temperatura moderada-baixa: respostas factuais (preco, area, imovel)
                # ficam mais consistentes e o agente improvisa menos "resposta aleatoria".
                temperature=0.5,
                system=system_prompt + contexto_extra,
                tools=TOOLS_DEFINITION,
                messages=messages,
            )
        except Exception as e:
            logger.error(f"Erro Anthropic (iteracao {iteration}): {e}")
            return "Estou com uma instabilidade no momento. Pode tentar novamente em alguns segundos?"

        # Coletar blocos de texto e tool_use
        blocos_texto: list[str] = []
        blocos_tool_use: list[dict] = []

        for block in response.content:
            if block.type == "text":
                blocos_texto.append(block.text)
            elif block.type == "tool_use":
                blocos_tool_use.append({
                    "id": block.id,
                    "name": block.name,
                    "input": block.input,
                })

        # Sem tool_use ou no limite → resposta final
        if not blocos_tool_use or iteration >= MAX_TOOL_ITERATIONS:
            resposta_final = "\n".join(blocos_texto).strip() or None
            if iteration >= MAX_TOOL_ITERATIONS and blocos_tool_use:
                logger.warning(
                    f"[AGENT] MAX_TOOL_ITERATIONS atingido para conversa {conversa_id}"
                )
            break

        # Anexar resposta do assistente (formato Anthropic preserva content blocks)
        messages.append({
            "role": "assistant",
            "content": [
                {"type": "text", "text": b.text} if b.type == "text"
                else {"type": "tool_use", "id": b.id, "name": b.name, "input": b.input}
                for b in response.content
            ],
        })

        # Executar tools e montar bloco user com tool_result
        tool_results = []
        for tu in blocos_tool_use:
            tool_name = tu["name"]
            tool_args = tu["input"] if isinstance(tu["input"], dict) else {}
            logger.info(f"[AGENT] Tool call: {tool_name}({json.dumps(tool_args, ensure_ascii=False)[:200]})")

            try:
                result = await execute_tool(tool_name, tool_args, tool_context)
                tool_summary.append(tool_name)
                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": tu["id"],
                    "content": str(result),
                })
            except Exception as e:
                logger.error(f"[AGENT] Erro na tool {tool_name}: {e}", exc_info=True)
                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": tu["id"],
                    "content": f"Erro ao executar {tool_name}. Tente outra abordagem.",
                    "is_error": True,
                })

        messages.append({"role": "user", "content": tool_results})

    if not resposta_final:
        # Se a Claude ja enviou conteudo via tools de side-effect (audio/card),
        # nao tem nada pra enviar como texto — silencio eh correto.
        tools_de_envio = {"enviar_audio", "enviar_card_imovel"}
        if any(t in tools_de_envio for t in tool_summary):
            logger.info(
                f"[AGENT] Resposta texto vazia mas tools de envio ja despacharam: {tool_summary}"
            )
            resposta_final = ""
        else:
            logger.warning(f"[AGENT] Resposta final vazia para conversa {conversa_id}")
            resposta_final = "Me da so um segundinho, ja te respondo."

    # 12. Salvar memoria
    user_msgs = [
        m.get("conteudo", "")
        for m in mensagens_novas
        if m.get("direcao") == "recebida" and m.get("conteudo")
    ]
    for msg_text in user_msgs:
        await redis_client.memory_add(conversa_id, "usuario", msg_text)
    if tool_summary:
        await redis_client.memory_add(
            conversa_id, "assistente",
            f"[Acoes executadas: {'; '.join(tool_summary)}]"
        )
    await redis_client.memory_add(conversa_id, "assistente", resposta_final)

    return resposta_final


# ============================================================
# Helpers
# ============================================================


def _verificar_fora_horario(horario: dict) -> bool:
    """Verifica se horario atual esta fora do atendimento."""
    tz = timezone(timedelta(hours=-3))  # America/Sao_Paulo
    agora = datetime.now(tz)
    dia_map = {0: "segunda", 1: "terca", 2: "quarta", 3: "quinta", 4: "sexta", 5: "sabado", 6: "domingo"}
    dia_atual = dia_map[agora.weekday()]

    config_dia = horario.get(dia_atual)
    if not config_dia:
        return True

    hora_atual = f"{agora.hour:02d}:{agora.minute:02d}"
    inicio = config_dia.get("inicio", "00:00")
    fim = config_dia.get("fim", "23:59")

    return hora_atual < inicio or hora_atual > fim


def _identificar_mensagens_novas(
    mensagens: list[dict],
    tamanho_memoria: int,
) -> list[dict]:
    """Identifica mensagens que sao novas (nao estao na memoria)."""
    if tamanho_memoria == 0:
        return [m for m in mensagens if m.get("direcao") == "recebida"]

    indice_ultima_enviada = -1
    for i in range(len(mensagens) - 1, -1, -1):
        if mensagens[i].get("direcao") == "enviada":
            indice_ultima_enviada = i
            break

    if indice_ultima_enviada == -1:
        return [m for m in mensagens if m.get("direcao") == "recebida"]

    return [
        m for m in mensagens[indice_ultima_enviada + 1:]
        if m.get("direcao") == "recebida"
    ]
