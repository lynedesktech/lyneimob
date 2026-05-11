# Item 15 — Logs estruturados no rate_limiter.py

## Contexto

Antes da Sprint 3, o rate limiter rodava em silencio — quando a fila enchia ou o limite Meta era atingido, mensagens sumiam sem rastro nos logs Railway. A Sprint 3 adicionou logs estruturados em todos os pontos relevantes pra observabilidade.

## Onde mudou

[`agent-railway/agente/services/rate_limiter.py`](https://github.com/lynedesktech/lyneimob/blob/feature/LYNEDES-103-sprint-2-3/agent-railway/agente/services/rate_limiter.py)

## Logs adicionados (6 pontos)

### 1. Fila cheia (mensagem descartada)

[`rate_limiter.py:51-55`](https://github.com/lynedesktech/lyneimob/blob/feature/LYNEDES-103-sprint-2-3/agent-railway/agente/services/rate_limiter.py#L51-L55)

```python
logger.warning(
    f"[RATE] Fila cheia para {chat_id} ({queue.qsize()} items). "
    "Descartando mensagem."
)
```

### 2. Worker cancelado (shutdown ou erro fatal)

[`rate_limiter.py:101-102`](https://github.com/lynedesktech/lyneimob/blob/feature/LYNEDES-103-sprint-2-3/agent-railway/agente/services/rate_limiter.py#L101-L102)

```python
except asyncio.CancelledError:
    logger.info(f"[RATE] Worker cancelado para {chat_id}")
```

### 3. Erro generico no worker

[`rate_limiter.py:103-104`](https://github.com/lynedesktech/lyneimob/blob/feature/LYNEDES-103-sprint-2-3/agent-railway/agente/services/rate_limiter.py#L103-L104)

```python
except Exception as e:
    logger.error(f"[RATE] Erro no worker {chat_id}: {e}")
```

### 4. Limite por contato atingido (8 msg/min)

[`rate_limiter.py:122-128`](https://github.com/lynedesktech/lyneimob/blob/feature/LYNEDES-103-sprint-2-3/agent-railway/agente/services/rate_limiter.py#L122-L128)

```python
if contact_count >= settings.rate_limit_per_contact_per_minute:
    if attempt == 0:
        logger.info(
            f"[RATE] Limite por contato atingido para {chat_id} "
            f"({contact_count}/{settings.rate_limit_per_contact_per_minute}/min). Aguardando."
        )
    await asyncio.sleep(2.0)
```

### 5. Limite global atingido (60 msg/min)

[`rate_limiter.py:131-138`](https://github.com/lynedesktech/lyneimob/blob/feature/LYNEDES-103-sprint-2-3/agent-railway/agente/services/rate_limiter.py#L131-L138)

```python
if global_count >= settings.rate_limit_global_per_minute:
    if attempt == 0:
        logger.warning(
            f"[RATE] Limite global atingido "
            f"({global_count}/{settings.rate_limit_global_per_minute}/min). Aguardando."
        )
    await asyncio.sleep(3.0)
```

### 6. Timeout esperando clearance (max_retries esgotado)

[`rate_limiter.py:149`](https://github.com/lynedesktech/lyneimob/blob/feature/LYNEDES-103-sprint-2-3/agent-railway/agente/services/rate_limiter.py#L149)

```python
logger.warning(f"[RATE] Timeout esperando clearance para {chat_id}")
```

## Como validar

Em produção: filtrar logs do Railway pelo prefixo `[RATE]`. Apos algum trafego real, deve ter pelo menos `[RATE] Limite por contato atingido` quando o agente respondeu com muitas bubbles em sequencia.
