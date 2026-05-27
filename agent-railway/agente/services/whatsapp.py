"""Integracao com a API UAZAPI para envio de mensagens WhatsApp."""

from __future__ import annotations

import logging

import httpx

logger = logging.getLogger(__name__)


async def mark_as_read(
    api_url: str, token: str, message_id_full: str
) -> None:
    """Marca mensagem como lida (azul) — comportamento humano."""
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                f"{api_url}/message/markread",
                headers={"token": token, "Content-Type": "application/json"},
                json={"id": [message_id_full]},
            )
            if resp.status_code == 401:
                logger.warning("[MARKREAD] 401 - token sem permissao para markread")
    except Exception as e:
        logger.warning(f"Erro ao marcar como lida: {e}")


async def send_presence(
    api_url: str, token: str, chat_id: str, presence: str = "composing"
) -> None:
    """Envia status de presenca (composing / paused)."""
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            await client.post(
                f"{api_url}/message/presence",
                headers={"token": token, "Content-Type": "application/json"},
                json={"number": chat_id, "presence": presence},
            )
    except Exception as e:
        logger.warning(f"Erro ao enviar presenca: {e}")


async def send_text(
    api_url: str, token: str, chat_id: str, text: str,
    reply_id: str | None = None,
) -> None:
    """Envia mensagem de texto. reply_id opcional pra citar mensagem (efeito reply)."""
    try:
        body: dict = {"number": chat_id, "text": text}
        if reply_id:
            body["replyid"] = reply_id
        async with httpx.AsyncClient(timeout=15) as client:
            await client.post(
                f"{api_url}/send/text",
                headers={"token": token, "Content-Type": "application/json"},
                json=body,
            )
    except Exception as e:
        logger.error(f"Erro ao enviar texto: {e}")


async def send_media(
    api_url: str,
    token: str,
    chat_id: str,
    media_url: str,
    media_type: str = "image",
    caption: str = "",
    reply_id: str | None = None,
) -> None:
    """Envia midia (image, document, video). reply_id opcional pra citar mensagem."""
    try:
        body: dict = {
            "number": chat_id,
            "file": media_url,
            "type": media_type,
        }
        if caption:
            body["text"] = caption
        if reply_id:
            body["replyid"] = reply_id

        async with httpx.AsyncClient(timeout=30) as client:
            await client.post(
                f"{api_url}/send/media",
                headers={"token": token, "Content-Type": "application/json"},
                json=body,
            )
    except Exception as e:
        logger.error(f"Erro ao enviar midia ({media_type}): {e}")


async def send_image_with_cta_button(
    api_url: str,
    token: str,
    chat_id: str,
    image_url: str,
    caption: str,
    button_text: str,
    button_url: str,
    reply_id: str | None = None,
) -> bool:
    """Envia imagem com caption + botao CTA com URL clicavel.
    Usa /send/menu da Uazapi. Retorna True se sucesso, False se falhou
    (caller faz fallback pra send_media com URL no texto)."""
    try:
        body: dict = {
            "number": chat_id,
            "type": "button",
            "text": caption,
            "file": image_url,
            "choices": [
                {"type": "url", "text": button_text, "url": button_url}
            ],
        }
        if reply_id:
            body["replyid"] = reply_id

        async with httpx.AsyncClient(timeout=20) as client:
            r = await client.post(
                f"{api_url}/send/menu",
                headers={"token": token, "Content-Type": "application/json"},
                json=body,
            )
            if r.status_code >= 400:
                logger.warning(f"send_menu (button) HTTP {r.status_code}: {r.text[:200]}")
                return False
            return True
    except Exception as e:
        logger.warning(f"send_image_with_cta_button falhou: {e}")
        return False


async def send_segment(
    api_url: str, token: str, chat_id: str, segment_type: str, content: str,
    reply_id: str | None = None,
) -> None:
    """Envia um segmento conforme seu tipo. reply_id apenas no primeiro segmento."""
    if segment_type == "imagem":
        await send_media(api_url, token, chat_id, content, "image", reply_id=reply_id)
    elif segment_type == "pdf":
        await send_media(api_url, token, chat_id, content, "document", reply_id=reply_id)
    elif segment_type == "video":
        await send_media(api_url, token, chat_id, content, "video", reply_id=reply_id)
    else:
        await send_text(api_url, token, chat_id, content, reply_id=reply_id)
