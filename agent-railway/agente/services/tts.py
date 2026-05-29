"""Text-to-Speech via OpenAI. Gera audio em formato OGG/opus pra mandar como PTT."""

from __future__ import annotations

import base64
import logging

from openai import AsyncOpenAI

from agente.config import settings

logger = logging.getLogger("lyneimob-agent")

_openai: AsyncOpenAI | None = None


def _get_openai() -> AsyncOpenAI:
    global _openai
    if _openai is None:
        _openai = AsyncOpenAI(api_key=settings.openai_api_key)
    return _openai


async def gerar_audio_base64(
    texto: str,
    voz: str = "shimmer",
    modelo: str = "tts-1-hd",
) -> str | None:
    """Gera audio TTS e retorna em base64 (data URI) pronto pra mandar via Uazapi.

    Vozes femininas OpenAI:
    - shimmer: suave, calorosa, mais natural pra atendimento (escolhida)
    - nova: mais energica, jovem
    - alloy: neutra (poderia passar por feminina ou masculina)

    Modelo: tts-1 (rapido) ou tts-1-hd (qualidade). HD eh mais natural mas
    tem custo um pouco maior. Vamos com HD pra impressao premium.

    Formato de saida: opus (compativel com PTT do WhatsApp).
    """
    if not texto or not texto.strip():
        return None
    if not settings.openai_api_key:
        logger.warning("[TTS] OPENAI_API_KEY nao configurada")
        return None

    try:
        client = _get_openai()
        # response_format=opus eh o melhor pra PTT do WhatsApp
        response = await client.audio.speech.create(
            model=modelo,
            voice=voz,
            input=texto[:4000],  # OpenAI limita a 4096 chars
            response_format="opus",
            speed=1.0,
        )
        # response.content eh bytes
        audio_bytes = response.content
        b64 = base64.b64encode(audio_bytes).decode("ascii")
        # Uazapi aceita base64 puro ou data URI; vou usar data URI pra seguranca
        return f"data:audio/ogg;base64,{b64}"
    except Exception as e:
        logger.error(f"[TTS] Erro gerando audio: {e}", exc_info=True)
        return None
