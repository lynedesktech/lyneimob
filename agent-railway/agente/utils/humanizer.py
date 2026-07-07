"""Calculos de delays humanizados para simular comportamento natural no WhatsApp."""

from __future__ import annotations

import random
from datetime import datetime, timedelta, timezone

from agente.config import settings

# Fuso do cliente (America/Sao_Paulo). datetime.now() sem fuso usaria a hora
# do SERVIDOR (UTC no Railway) — e ai o "modo madrugada" ligava as 19h locais.
FUSO_BRASIL = timezone(timedelta(hours=-3))


def calculate_typing_duration(text: str) -> float:
    """Calcula tempo de 'digitando...' proporcional ao texto."""
    char_count = len(text)
    base_time = char_count / 50.0

    min_s = settings.typing_indicator_min_ms / 1000.0
    max_s = settings.typing_indicator_max_ms / 1000.0
    base_time = max(min_s, min(base_time, max_s))

    jitter = random.uniform(0.75, 1.25)
    return base_time * jitter


def calculate_inter_segment_delay(text: str, segment_index: int) -> float:
    """Delay entre segmentos de uma mesma resposta."""
    base = random.uniform(
        settings.min_delay_between_segments,
        settings.max_delay_between_segments,
    )

    length_factor = min(len(text) / 400.0, 1.0) * 0.5
    base += length_factor

    if segment_index == 0:
        base *= 0.7

    hour = datetime.now(FUSO_BRASIL).hour
    if hour >= 22 or hour < 7:
        base *= random.uniform(1.2, 1.6)

    return base


def calculate_burst_cooldown(segment_count: int) -> float:
    """Cool-down extra apos enviar muitos segmentos (rajada)."""
    if segment_count < settings.burst_threshold:
        return 0.0

    base = settings.cooldown_after_burst_seconds
    multiplier = min(segment_count / settings.burst_threshold, 3.0)
    return base * multiplier * random.uniform(0.8, 1.2)


def should_add_read_delay() -> float:
    """Simula tempo de 'leitura' antes de comecar a digitar."""
    return random.uniform(0.5, 2.0)
