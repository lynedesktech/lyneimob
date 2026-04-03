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


async def send_text(api_url: str, token: str, chat_id: str, text: str) -> None:
    """Envia mensagem de texto."""
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            await client.post(
                f"{api_url}/send/text",
                headers={"token": token, "Content-Type": "application/json"},
                json={"number": chat_id, "text": text},
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
) -> None:
    """Envia midia (image, document, video)."""
    try:
        body: dict = {
            "number": chat_id,
            "file": media_url,
            "type": media_type,
        }
        if caption:
            body["text"] = caption

        async with httpx.AsyncClient(timeout=30) as client:
            await client.post(
                f"{api_url}/send/media",
                headers={"token": token, "Content-Type": "application/json"},
                json=body,
            )
    except Exception as e:
        logger.error(f"Erro ao enviar midia ({media_type}): {e}")


async def send_segment(
    api_url: str, token: str, chat_id: str, segment_type: str, content: str
) -> None:
    """Envia um segmento conforme seu tipo."""
    if segment_type == "imagem":
        await send_media(api_url, token, chat_id, content, "image")
    elif segment_type == "pdf":
        await send_media(api_url, token, chat_id, content, "document")
    elif segment_type == "video":
        await send_media(api_url, token, chat_id, content, "video")
    else:
        await send_text(api_url, token, chat_id, content)
