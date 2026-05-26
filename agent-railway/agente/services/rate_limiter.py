"""Sistema anti-bloqueio WhatsApp com rate limiting e fila por contato."""

from __future__ import annotations

import asyncio
import logging
import time

from agente.config import settings
from agente.models.segments import ParsedSegment
from agente.services import redis_client
from agente.services.whatsapp import send_presence, send_segment
from agente.utils.humanizer import (
    calculate_burst_cooldown,
    calculate_inter_segment_delay,
    calculate_typing_duration,
    should_add_read_delay,
)

logger = logging.getLogger(__name__)


class RateLimiter:
    """Gerencia envio de mensagens com controle de taxa anti-bloqueio."""

    def __init__(self) -> None:
        self._contact_queues: dict[str, asyncio.Queue] = {}
        self._worker_tasks: dict[str, asyncio.Task] = {}
        self._last_send_time: dict[str, float] = {}

    async def enqueue_segments(
        self,
        chat_id: str,
        api_url: str,
        token: str,
        segments: list[ParsedSegment],
        message_id_full: str = "",
    ) -> None:
        """Adiciona segmentos na fila do contato. Inicia worker se necessario."""
        if not segments:
            return

        if chat_id not in self._contact_queues:
            self._contact_queues[chat_id] = asyncio.Queue(
                maxsize=settings.max_queue_size
            )

        queue = self._contact_queues[chat_id]

        if queue.qsize() >= settings.max_queue_size:
            logger.warning(
                f"[RATE] Fila cheia para {chat_id} ({queue.qsize()} items). "
                "Descartando mensagem."
            )
            return

        await queue.put((api_url, token, segments, message_id_full))

        if chat_id not in self._worker_tasks or self._worker_tasks[chat_id].done():
            self._worker_tasks[chat_id] = asyncio.create_task(
                self._worker(chat_id)
            )

    async def _worker(self, chat_id: str) -> None:
        """Processa fila de um contato respeitando limites de taxa."""
        queue = self._contact_queues[chat_id]

        try:
            while not queue.empty():
                api_url, token, segments, msg_id_full = await queue.get()

                read_delay = should_add_read_delay()
                await asyncio.sleep(read_delay)

                for i, segment in enumerate(segments):
                    await self._wait_for_clearance(chat_id)

                    typing_duration = calculate_typing_duration(segment.output)
                    await send_presence(api_url, token, chat_id, "composing")
                    await asyncio.sleep(typing_duration)

                    # Citar mensagem do cliente apenas no PRIMEIRO segmento
                    # pra ter efeito "reply" sem poluir com varias citacoes
                    reply_id = msg_id_full if i == 0 else None
                    await send_segment(
                        api_url, token, chat_id, segment.type, segment.output,
                        reply_id=reply_id,
                    )

                    await redis_client.rate_record(chat_id)
                    self._last_send_time[chat_id] = time.time()

                    if i < len(segments) - 1:
                        delay = calculate_inter_segment_delay(
                            segment.output, i
                        )
                        await asyncio.sleep(delay)

                cooldown = calculate_burst_cooldown(len(segments))
                if cooldown > 0:
                    await asyncio.sleep(cooldown)

                await send_presence(api_url, token, chat_id, "paused")

        except asyncio.CancelledError:
            logger.info(f"[RATE] Worker cancelado para {chat_id}")
        except Exception as e:
            logger.error(f"[RATE] Erro no worker {chat_id}: {e}")
        finally:
            if chat_id in self._worker_tasks:
                del self._worker_tasks[chat_id]

    async def _wait_for_clearance(self, chat_id: str) -> None:
        """Bloqueia ate que os limites de taxa permitam envio.

        LYNEDES-103 Sprint 3: limites alinhados com config (anti-bloqueio Meta):
        - Por contato: 8 msgs/min
        - Global: 60 msgs/min
        - Gap minimo entre envios: 2s
        - Burst cooldown: 5s apos 5 segmentos
        """
        max_retries = 30

        for attempt in range(max_retries):
            contact_count = await redis_client.rate_count_contact(chat_id)
            if contact_count >= settings.rate_limit_per_contact_per_minute:
                if attempt == 0:
                    logger.info(
                        f"[RATE] Limite por contato atingido para {chat_id} "
                        f"({contact_count}/{settings.rate_limit_per_contact_per_minute}/min). Aguardando."
                    )
                await asyncio.sleep(2.0)
                continue

            global_count = await redis_client.rate_count_global()
            if global_count >= settings.rate_limit_global_per_minute:
                if attempt == 0:
                    logger.warning(
                        f"[RATE] Limite global atingido "
                        f"({global_count}/{settings.rate_limit_global_per_minute}/min). Aguardando."
                    )
                await asyncio.sleep(3.0)
                continue

            last = self._last_send_time.get(chat_id, 0)
            elapsed = time.time() - last
            min_gap = settings.min_session_gap_seconds
            if elapsed < min_gap:
                await asyncio.sleep(min_gap - elapsed)

            return

        logger.warning(f"[RATE] Timeout esperando clearance para {chat_id}")


rate_limiter = RateLimiter()
