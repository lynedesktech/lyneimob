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


def _make_card(
    text: str,
    image_url: str,
    button_text: str,
    button_url: str,
    interest_reply: str | None = None,
) -> dict:
    """Monta 1 card do carrossel.

    botoes:
    - 'Ver no site': URL clicavel (link do imovel no site publico)
    - 'Tenho interesse': REPLY (quando clicado, envia o `interest_reply`
      como mensagem do cliente pro chat — agente responde focada nele).
    """
    buttons: list[dict] = [
        {"id": button_url, "text": button_text, "type": "URL"},
    ]
    if interest_reply:
        buttons.append(
            {"id": interest_reply, "text": "Tenho interesse", "type": "REPLY"},
        )
    return {
        "text": text,
        "image": image_url,
        "buttons": buttons,
    }


async def send_property_carousel(
    api_url: str,
    token: str,
    chat_id: str,
    cover_image: str,
    extra_images: list[str],
    caption: str,
    button_text: str,
    button_url: str,
    interest_reply: str | None = None,
    intro_text: str = "",
) -> bool:
    """Envia carrossel de imovel: capa com info completa + ate 3 fotos extras.

    Cada card no carrossel tem 2 botoes:
    - 'Ver no site' (URL)
    - 'Tenho interesse' (REPLY — envia interest_reply pro chat)

    A capa tem a descricao completa (preco, quartos, etc); as fotos extras
    tem caption minima pra nao poluir. Carrossel NAO usa reply_id pra nao
    poluir o chat com varias citacoes; o reply fica so na resposta final."""
    try:
        cards: list[dict] = [
            _make_card(caption, cover_image, button_text, button_url, interest_reply)
        ]
        for idx, img in enumerate(extra_images[:3], start=2):
            if not img:
                continue
            mini_caption = f"📸 Foto {idx} do imovel"
            cards.append(
                _make_card(mini_caption, img, button_text, button_url, interest_reply)
            )

        body: dict = {
            "number": chat_id,
            "text": intro_text or "",
            "carousel": cards,
        }

        async with httpx.AsyncClient(timeout=30) as client:
            r = await client.post(
                f"{api_url}/send/carousel",
                headers={"token": token, "Content-Type": "application/json"},
                json=body,
            )
            logger.info(
                f"[SEND_PROPERTY_CAROUSEL] HTTP {r.status_code} cards={len(cards)} intro={bool(intro_text)} resposta={r.text[:300]}"
            )
            if r.status_code >= 400:
                return False
            return True
    except Exception as e:
        logger.warning(f"send_property_carousel falhou: {e}", exc_info=True)
        return False


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
    """Envia imagem com caption + botao CTA URL clicavel via /send/carousel.

    Pela doc oficial Uazapi, o /send/carousel suporta um array de cards com
    imagem, texto e botoes estruturados (id=URL, text=label, type=URL).
    Retorna True se sucesso, False se falhou (caller faz fallback pra
    send_media com URL no texto)."""
    try:
        # `text` Ã© o cabecalho ANTES do card (separado do texto do card).
        # Deixar minimo pra nao duplicar info com o caption do card.
        body: dict = {
            "number": chat_id,
            "text": "",
            "carousel": [
                _make_card(caption, image_url, button_text, button_url),
            ],
        }
        if reply_id:
            body["replyid"] = reply_id

        async with httpx.AsyncClient(timeout=25) as client:
            r = await client.post(
                f"{api_url}/send/carousel",
                headers={"token": token, "Content-Type": "application/json"},
                json=body,
            )
            logger.info(
                f"[SEND_CAROUSEL_BUTTON] HTTP {r.status_code} resposta={r.text[:300]}"
            )
            if r.status_code >= 400:
                return False
            return True
    except Exception as e:
        logger.warning(f"send_image_with_cta_button falhou: {e}", exc_info=True)
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
