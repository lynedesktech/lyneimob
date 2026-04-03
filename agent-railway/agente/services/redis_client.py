"""Cliente Redis assincrono — buffer, bloqueio, memoria e rate limiting."""

from __future__ import annotations

import json
import logging
import time
from typing import Any

import redis.asyncio as aioredis

from agente.config import settings

logger = logging.getLogger(__name__)

_pool: aioredis.Redis | None = None


async def get_redis() -> aioredis.Redis:
    global _pool
    if _pool is None:
        _pool = aioredis.from_url(
            settings.redis_url,
            decode_responses=True,
            max_connections=20,
        )
    return _pool


async def close_redis() -> None:
    global _pool
    if _pool is not None:
        await _pool.aclose()
        _pool = None


# ─────────────────── Buffer (agrupamento de mensagens) ───────────────────


async def buffer_push(
    chat_id: str,
    org_id: str,
    content: str,
    timestamp: int,
    message_id: str,
) -> None:
    r = await get_redis()
    key = f"{chat_id}_buf_{org_id}"
    entry = json.dumps({
        "messageContent": content,
        "messageTime": timestamp,
        "messageID": message_id,
    })
    await r.rpush(key, entry)
    await r.expire(key, settings.buffer_ttl_seconds)


async def buffer_get(chat_id: str, org_id: str) -> list[dict]:
    r = await get_redis()
    key = f"{chat_id}_buf_{org_id}"
    raw = await r.lrange(key, 0, -1)
    if not raw:
        return []
    return [json.loads(item) for item in raw]


async def buffer_delete(chat_id: str, org_id: str) -> None:
    r = await get_redis()
    await r.delete(f"{chat_id}_buf_{org_id}")


async def buffer_last_id(chat_id: str, org_id: str) -> str | None:
    msgs = await buffer_get(chat_id, org_id)
    if not msgs:
        return None
    return msgs[-1].get("messageID", "")


# ─────────────────── Bloqueio (humano respondeu) ───────────────────


async def set_block(chat_id: str, org_id: str) -> None:
    r = await get_redis()
    key = f"{chat_id}_timeout_{org_id}"
    await r.set(key, "true", ex=settings.block_ttl_seconds)


async def is_blocked(chat_id: str, org_id: str) -> bool:
    r = await get_redis()
    key = f"{chat_id}_timeout_{org_id}"
    val = await r.get(key)
    return val is not None and val != ""


async def remove_block(chat_id: str, org_id: str) -> None:
    r = await get_redis()
    await r.delete(f"{chat_id}_timeout_{org_id}")


# ─────────────────── Memoria de conversa ───────────────────


async def memory_get(conversa_id: str) -> list[dict]:
    r = await get_redis()
    key = f"memoria:whatsapp:{conversa_id}"
    raw = await r.lrange(key, 0, -1)
    if not raw:
        return []
    messages = [json.loads(item) for item in raw]
    return messages[-settings.memory_context_window:]


async def memory_add(conversa_id: str, role: str, content: str) -> None:
    r = await get_redis()
    key = f"memoria:whatsapp:{conversa_id}"
    entry = json.dumps({
        "papel": role,
        "conteudo": content,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S"),
    })
    await r.rpush(key, entry)
    await r.ltrim(key, -(settings.memory_context_window * 2), -1)
    await r.expire(key, settings.memory_ttl_seconds)


async def memory_clear(conversa_id: str) -> None:
    r = await get_redis()
    await r.delete(f"memoria:whatsapp:{conversa_id}")


# ─────────────────── Rate Limiting (anti-bloqueio) ───────────────────


async def rate_record(chat_id: str) -> None:
    r = await get_redis()
    now = time.time()
    pipe = r.pipeline()
    pipe.zadd(f"rate:contact:{chat_id}", {str(now): now})
    pipe.expire(f"rate:contact:{chat_id}", 120)
    pipe.zadd("rate:global", {f"{chat_id}:{now}": now})
    pipe.expire("rate:global", 120)
    await pipe.execute()


async def rate_count_contact(chat_id: str) -> int:
    r = await get_redis()
    now = time.time()
    cutoff = now - 60
    await r.zremrangebyscore(f"rate:contact:{chat_id}", "-inf", cutoff)
    return await r.zcard(f"rate:contact:{chat_id}")


async def rate_count_global() -> int:
    r = await get_redis()
    now = time.time()
    cutoff = now - 60
    await r.zremrangebyscore("rate:global", "-inf", cutoff)
    return await r.zcard("rate:global")


# ─────────────────── Toggle global da IA ───────────────────

_AI_GLOBAL_KEY = "ai:global:enabled"


async def set_ai_global(enabled: bool) -> None:
    r = await get_redis()
    await r.set(_AI_GLOBAL_KEY, "1" if enabled else "0")


async def is_ai_global_enabled() -> bool:
    r = await get_redis()
    val = await r.get(_AI_GLOBAL_KEY)
    if val is None:
        return True
    return val == "1"


# ─────────────────── Horario de funcionamento ───────────────────

_BUSINESS_HOURS_KEY = "agent:business_hours"
_ABSENCE_MSG_KEY = "agent:absence_message"

_DEFAULT_ABSENCE_MESSAGE = (
    "Ola! No momento estamos fora do horario de atendimento.\n\n"
    "Sua mensagem foi recebida e sera respondida em breve!"
)


async def get_absence_message() -> str:
    r = await get_redis()
    msg = await r.get(_ABSENCE_MSG_KEY)
    return msg or _DEFAULT_ABSENCE_MESSAGE


async def set_absence_message(message: str) -> None:
    r = await get_redis()
    await r.set(_ABSENCE_MSG_KEY, message)


async def get_business_hours() -> dict:
    r = await get_redis()
    data = await r.hgetall(_BUSINESS_HOURS_KEY)
    return {
        "enabled": data.get("enabled", str(settings.business_hours_enabled)).lower() == "true",
        "start": int(data.get("start", settings.business_hours_start)),
        "end": int(data.get("end", settings.business_hours_end)),
    }


async def set_business_hours(enabled: bool, start: int, end: int) -> None:
    r = await get_redis()
    await r.hset(_BUSINESS_HOURS_KEY, mapping={
        "enabled": str(enabled).lower(),
        "start": str(start),
        "end": str(end),
    })


# ─────────────────── Lock de processamento ───────────────────


async def acquire_lock(key: str, ttl: int = 60) -> bool:
    """Tenta adquirir lock. Retorna True se conseguiu."""
    r = await get_redis()
    result = await r.set(key, "1", nx=True, ex=ttl)
    return result is not None


async def release_lock(key: str) -> None:
    r = await get_redis()
    await r.delete(key)
