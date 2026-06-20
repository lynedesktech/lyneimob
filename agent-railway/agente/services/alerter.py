"""Alerter — envia alertas pra Gabriel quando o analyzer detecta problema.

Rate-limit: mesma violacao na mesma conversa so alerta 1x por 4h.
Numero hardcoded por enquanto (Gabriel — Dev IA).
"""

from __future__ import annotations

import logging

from agente.services import redis_client
from agente.services.whatsapp import send_text

logger = logging.getLogger("lyneimob-agent")

# Numero do Gabriel (Dev IA) — alertas chegam aqui
NUMERO_ALERTA = "5527997178981"
# Rate-limit: mesma (conversa, tipo) so alerta 1x a cada 4h
ALERT_TTL_SECONDS = 4 * 60 * 60

EMOJI_SEVERIDADE = {"alta": "🔴", "media": "🟡", "baixa": "🟢"}


async def enviar_alerta(
    api_url: str,
    token: str,
    conversa_id: str,
    org_nome: str,
    numero_cliente: str,
    mensagem_agente: str,
    violacoes: list[dict],
) -> None:
    """Envia alerta de qualidade pra Gabriel se houver violacoes.

    Rate-limit aplicado por (conversa_id, tipo_de_violacao): se ja foi alertado
    nas ultimas 4h, nao alerta de novo do mesmo tipo na mesma conversa.
    """
    if not violacoes:
        return
    if not api_url or not token:
        logger.warning("[ALERTER] Sem api_url/token — alerta nao enviado")
        return

    # Filtra violacoes ja alertadas recentemente nessa conversa
    r = await redis_client.get_redis()
    novas: list[dict] = []
    for v in violacoes:
        chave = f"alerta:{conversa_id}:{v['tipo']}"
        try:
            ja_alertado = await r.get(chave)
            if ja_alertado:
                continue
            await r.set(chave, "1", ex=ALERT_TTL_SECONDS)
            novas.append(v)
        except Exception as e:
            logger.warning(f"[ALERTER] Redis erro no rate-limit: {e}")
            novas.append(v)

    if not novas:
        return

    # Monta mensagem
    linhas = [
        f"🚨 *Alerta de qualidade — {org_nome}*",
        f"Conversa: `{conversa_id[:8]}`",
        f"Lead: {numero_cliente}",
        "",
        "*Problemas detectados:*",
    ]
    for v in novas:
        emoji = EMOJI_SEVERIDADE.get(v.get("severidade", "baixa"), "•")
        linhas.append(f"{emoji} {v['detalhe']}")
    linhas.append("")
    linhas.append("*Mensagem da agente:*")
    # Limita citacao pra nao estourar tamanho do WhatsApp
    mensagem_curta = mensagem_agente.strip()[:600]
    linhas.append(f'"{mensagem_curta}"')

    texto = "\n".join(linhas)

    try:
        await send_text(api_url, token, NUMERO_ALERTA, texto)
        logger.info(
            f"[ALERTER] Alerta enviado pra {NUMERO_ALERTA}: "
            f"{len(novas)} violacao(oes) em conversa {conversa_id[:8]}"
        )
    except Exception as e:
        logger.warning(f"[ALERTER] Falha enviando alerta: {e}")
