"""Text-to-Speech via ElevenLabs (premium PT-BR) com fallback OpenAI."""

from __future__ import annotations

import base64
import logging

import httpx
from openai import AsyncOpenAI

from agente.config import settings

logger = logging.getLogger("lyneimob-agent")

_openai: AsyncOpenAI | None = None


def _get_openai() -> AsyncOpenAI:
    global _openai
    if _openai is None:
        _openai = AsyncOpenAI(api_key=settings.openai_api_key)
    return _openai


async def _gerar_via_elevenlabs(texto: str) -> str | None:
    """Gera audio via ElevenLabs (voz Raquel, multilingual_v2)."""
    if not settings.elevenlabs_api_key:
        return None
    try:
        voice_id = settings.elevenlabs_voice_id
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
        # output_format=opus_48000_32 — opus pra WhatsApp PTT
        params = {"output_format": "opus_48000_32"}
        headers = {
            "xi-api-key": settings.elevenlabs_api_key,
            "Content-Type": "application/json",
            "Accept": "audio/ogg",
        }
        body = {
            "text": texto,
            "model_id": settings.elevenlabs_model,
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.75,
                "style": 0.3,
                "use_speaker_boost": True,
            },
        }
        async with httpx.AsyncClient(timeout=60) as client:
            r = await client.post(url, headers=headers, params=params, json=body)
            if r.status_code >= 400:
                logger.warning(
                    f"[TTS_11L] HTTP {r.status_code} body={r.text[:300]}"
                )
                return None
            audio_bytes = r.content
            b64 = base64.b64encode(audio_bytes).decode("ascii")
            return f"data:audio/ogg;base64,{b64}"
    except Exception as e:
        logger.error(f"[TTS_11L] falhou: {e}", exc_info=True)
        return None


async def _gerar_via_openai(texto: str) -> str | None:
    """Fallback: OpenAI gpt-4o-mini-tts."""
    if not settings.openai_api_key:
        return None
    try:
        client = _get_openai()
        response = await client.audio.speech.create(
            model="gpt-4o-mini-tts",
            voice="shimmer",
            input=texto[:4000],
            response_format="opus",
            speed=1.0,
            instructions=(
                "Voz feminina jovem brasileira, sotaque cearense suave, "
                "calorosa e proxima. Soe natural, nao roboticamente animada."
            ),
        )
        b64 = base64.b64encode(response.content).decode("ascii")
        return f"data:audio/ogg;base64,{b64}"
    except Exception as e:
        logger.error(f"[TTS_OAI] falhou: {e}", exc_info=True)
        return None


async def gerar_audio_base64(texto: str, **_ignored) -> str | None:
    """Gera audio TTS e retorna data URI base64. Tenta ElevenLabs primeiro,
    cai pra OpenAI se nao tiver chave ou falhar."""
    if not texto or not texto.strip():
        return None
    texto = texto.strip()

    audio = await _gerar_via_elevenlabs(texto)
    if audio:
        logger.info("[TTS] audio gerado via ElevenLabs")
        return audio

    audio = await _gerar_via_openai(texto)
    if audio:
        logger.info("[TTS] audio gerado via OpenAI (fallback)")
        return audio

    logger.warning("[TTS] nenhum provider configurado")
    return None
