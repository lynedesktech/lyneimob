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
    modelo: str = "gpt-4o-mini-tts",
) -> str | None:
    """Gera audio TTS e retorna em base64 (data URI) pronto pra mandar via Uazapi.

    Modelo padrao: gpt-4o-mini-tts (modelo mais novo, MUITO melhor em PT-BR
    que o tts-1/tts-1-hd, e aceita instrucoes de tom via parametro `instructions`).

    Vozes femininas OpenAI:
    - shimmer: suave, calorosa (escolhida)
    - nova: mais energica, jovem
    - alloy: neutra
    - coral: nova voz expressiva (gpt-4o-mini-tts)

    Formato de saida: opus (compativel com PTT do WhatsApp).
    """
    if not texto or not texto.strip():
        return None
    if not settings.openai_api_key:
        logger.warning("[TTS] OPENAI_API_KEY nao configurada")
        return None

    try:
        client = _get_openai()
        instrucoes_tom = (
            "Voz feminina jovem brasileira, sotaque cearense suave de Fortaleza, "
            "tom caloroso, acolhedor e proximo, como conversa de WhatsApp. "
            "Fale natural, com pequenas pausas onde faria sentido na fala. "
            "NAO seja roboticamente animada. Soe como uma atendente real, "
            "humana, simpatica e profissional."
        )
        response = await client.audio.speech.create(
            model=modelo,
            voice=voz,
            input=texto[:4000],
            response_format="opus",
            speed=1.0,
            instructions=instrucoes_tom,
        )
        # response.content eh bytes
        audio_bytes = response.content
        b64 = base64.b64encode(audio_bytes).decode("ascii")
        # Uazapi aceita base64 puro ou data URI; vou usar data URI pra seguranca
        return f"data:audio/ogg;base64,{b64}"
    except Exception as e:
        logger.error(f"[TTS] Erro gerando audio: {e}", exc_info=True)
        return None
