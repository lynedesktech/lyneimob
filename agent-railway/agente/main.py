"""LyneMob Agent — Servico de agente WhatsApp para Railway.

Servidor FastAPI que recebe webhooks do WhatsApp (UAZAPI),
processa mensagens e responde via IA com humanizacao profissional.

Padrao: Laura (RE/MAX Imovi) adaptado para LyneMob.
"""

from __future__ import annotations

import asyncio
import logging
import time
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import BackgroundTasks, FastAPI, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from agente.config import settings
from agente.core.agent import run_agent
from agente.models.webhook import WebhookMessage
from agente.services import redis_client
from agente.services import supabase_client as db
from agente.services.media import process_media
from agente.services.rate_limiter import rate_limiter
from agente.services.whatsapp import mark_as_read
from agente.utils.message_formatter import parse_output

# ─────────────────── Logging ───────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("lyneimob-agent")

# ─────────────────── Lifespan ───────────────────


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("LyneMob Agent iniciando")
    logger.info(f"   Modelo: {settings.openai_model}")
    logger.info(f"   Redis: {settings.redis_url}")
    logger.info(f"   Buffer: {settings.buffer_wait_seconds}s")
    logger.info(f"   Rate limit: {settings.rate_limit_per_contact_per_minute}/min por contato")
    r = await redis_client.get_redis()
    await r.ping()
    logger.info("   Redis: conectado")
    yield
    await redis_client.close_redis()
    logger.info("LyneMob Agent encerrado")


app = FastAPI(title="LyneMob Agent", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─────────────────── Parser do webhook ───────────────────


def parse_webhook(body: dict) -> WebhookMessage | None:
    """Extrai dados estruturados do payload UAZAPI."""
    try:
        message = body.get("message", {})
        if not message:
            return None

        # DEBUG TEMPORARIO: log payload completo de TODA mensagem recebida.
        # Removo depois de descobrir o nome do campo de reply no Uazapi.
        import json as _json
        logger.info(f"[WEBHOOK-FULL-DEBUG] body.message keys: {list(message.keys())}")
        logger.info(f"[WEBHOOK-FULL-DEBUG] payload (4KB): {_json.dumps(message)[:4000]}")

        chat_id_raw = message.get("chatid", message.get("chatId", ""))
        chat_id = (
            chat_id_raw.replace("@s.whatsapp.net", "")
            .replace("@c.us", "")
            .strip()
        )
        if not chat_id:
            return None

        # Ignorar grupos
        if "@g.us" in chat_id_raw:
            return None

        msg_type = message.get("type", "text")
        if msg_type == "media":
            content_type = message.get("mediaType", "image")
        else:
            content_type = msg_type

        content = ""
        raw_content = message.get("content", "")
        if isinstance(raw_content, dict):
            content = raw_content.get("text", "") or raw_content.get("caption", "")
        elif isinstance(raw_content, str):
            content = raw_content
        else:
            content = str(raw_content) if raw_content else ""

        media_content = message.get("content", {})
        document_url = ""
        if isinstance(media_content, dict):
            document_url = media_content.get("URL", "")

        # Extrair info de mensagem citada (quando user faz reply).
        # Uazapi expoe em varios formatos possiveis — tentamos todos defensivamente.
        quoted_id = ""
        quoted_text = ""
        ctx = message.get("contextInfo") or message.get("context_info") or {}
        if isinstance(ctx, dict):
            quoted_id = ctx.get("stanzaId") or ctx.get("quotedMessageId") or ctx.get("quoted_message_id") or ""
            qm = ctx.get("quotedMessage") or ctx.get("quoted_message") or {}
            if isinstance(qm, dict):
                quoted_text = (
                    qm.get("text")
                    or qm.get("caption")
                    or qm.get("conversation")
                    or ""
                )
                qm_content = qm.get("content")
                if not quoted_text and isinstance(qm_content, dict):
                    quoted_text = qm_content.get("text") or qm_content.get("caption") or ""
                elif not quoted_text and isinstance(qm_content, str):
                    quoted_text = qm_content
        # Alguns gateways expoem direto no nivel da message
        if not quoted_id:
            quoted_id = message.get("quotedMessageId") or message.get("replyId") or ""
        if not quoted_text:
            q = message.get("quotedMessage") or message.get("quoted") or message.get("reply") or {}
            if isinstance(q, dict):
                quoted_text = (
                    q.get("text") or q.get("content") or q.get("caption") or q.get("conversation") or ""
                )
                if isinstance(q.get("content"), dict):
                    quoted_text = q["content"].get("text") or q["content"].get("caption") or ""

        return WebhookMessage(
            message_id=message.get("messageid", message.get("messageId", "")),
            message_id_full=message.get("id", ""),
            chat_id=chat_id,
            content_type=content_type,
            content=content,
            timestamp=int(message.get("timestamp", time.time())),
            nome=message.get("senderName", message.get("pushName", "")),
            document_url=document_url,
            api_url=body.get("BaseUrl", body.get("baseUrl", "")),
            token=body.get("token", ""),
            instancia=body.get("instancia", body.get("instance", "")),
            from_me=message.get("fromMe", False),
            was_sent_by_api=message.get("wasSentByApi", False),
            message_type=message.get("messageType", ""),
            quoted_message_id=quoted_id or "",
            quoted_content=(quoted_text or "").strip()[:500],
        )
    except Exception as e:
        logger.error(f"Erro ao parsear webhook: {e}")
        return None


# ─────────────────── Identificar organizacao ───────────────────


async def identificar_org(msg: WebhookMessage) -> dict | None:
    """Identifica a organizacao pelo token ou instance_id do webhook."""
    # Tentar pelo token
    if msg.token:
        config = await db.buscar_config_por_token(msg.token)
        if config:
            return config

    # Tentar pelo instance_id (nome da instancia)
    if msg.instancia:
        config = await db.buscar_config_por_instance_id(msg.instancia)
        if config:
            return config

    # Fallback: tentar pelo prefixo do nome da instancia (lyneimob-{orgId[:8]})
    if msg.instancia and msg.instancia.startswith("lyneimob-"):
        org_prefix = msg.instancia.replace("lyneimob-", "").split("-")[0]
        if org_prefix:
            result = await db.select(
                "config_whatsapp",
                columns="*",
                filters={"ativo": "eq.true"},
            )
            if result:
                for cfg in result:
                    org_id = cfg.get("organizacao_id", "")
                    if org_id.startswith(org_prefix):
                        return cfg

    logger.warning(f"[WEBHOOK] Org nao encontrada para token={msg.token[:8]}... instancia={msg.instancia}")
    return None


# ─────────────────── Processamento ───────────────────


async def process_buffered_messages(
    msg: WebhookMessage,
    config: dict,
    conversa_id: str,
) -> None:
    """Processa mensagens agrupadas do buffer e envia resposta via IA."""
    org_id = config["organizacao_id"]
    chat_id = msg.chat_id

    try:
        await asyncio.sleep(settings.buffer_wait_seconds)

        last_id = await redis_client.buffer_last_id(chat_id, org_id)
        if last_id and last_id != msg.message_id:
            return

        buffer = await redis_client.buffer_get(chat_id, org_id)
        if not buffer:
            return

        await redis_client.buffer_delete(chat_id, org_id)

        # Lock de processamento
        lock_key = f"lock:agente:{conversa_id}"
        if not await redis_client.acquire_lock(lock_key, ttl=90):
            logger.info(f"[AGENT] Conversa {conversa_id} ja em processamento")
            return

        try:
            # Garantir api_url e token validos
            api_url = msg.api_url or settings.uazapi_default_url
            token = msg.token or settings.uazapi_default_token

            if not api_url or not token:
                # Usar credenciais da config
                api_url = api_url or config.get("uazapi_url", "")
                token = token or config.get("uazapi_token", "")

            logger.info(
                f"[AGENT] Processando {len(buffer)} msg(s) de {chat_id} (conversa: {conversa_id})"
            )

            response = await run_agent(
                conversa_id=conversa_id,
                org_id=org_id,
                numero_cliente=chat_id,
                api_url=api_url,
                token=token,
            )

            if not response:
                return

            segments = parse_output(response)
            if not segments:
                return

            logger.info(f"[SEND] Enviando {len(segments)} segmento(s) para {chat_id}")

            # Enviar via rate limiter (anti-bloqueio + humanizacao)
            await rate_limiter.enqueue_segments(
                chat_id=chat_id,
                api_url=api_url,
                token=token,
                segments=segments,
                message_id_full=msg.message_id_full,
            )

            # Salvar resposta no banco
            full_response = "\n\n".join(s.output for s in segments)
            await db.salvar_mensagem(conversa_id, org_id, "enviada", full_response)
            await db.atualizar_conversa(conversa_id, {
                "ultima_mensagem_em": datetime.now(timezone.utc).isoformat(),
            })

        finally:
            await redis_client.release_lock(lock_key)

    except asyncio.CancelledError:
        pass
    except Exception as e:
        logger.error(f"[PROCESS] Erro para {chat_id}: {e}", exc_info=True)


# ─────────────────── Callback Next.js ───────────────────


async def criar_cliente_negocio_via_nextjs(
    conversa_id: str, org_id: str, numero_cliente: str, nome_cliente: str
) -> None:
    """Chama o Next.js (Vercel) pra criar cliente + negócio no CRM.
    Fire-and-forget com 1 retry — se falhar, a conversa continua normal."""
    nextjs_url = settings.nextjs_app_url
    if not nextjs_url:
        logger.warning("[CRM] NEXTJS_APP_URL não configurada — cliente/negócio não criado")
        return

    url = f"{nextjs_url.rstrip('/')}/api/interno/criar-cliente-negocio"
    payload = {
        "conversaId": conversa_id,
        "organizacaoId": org_id,
        "numeroCliente": numero_cliente,
        "nomeCliente": nome_cliente or "Contato WhatsApp",
    }
    # LYNEDES-148: usar INTERNAL_API_SECRET dedicado (com fallback pra service-role
    # enquanto a env nao foi adicionada no Railway)
    internal_secret = settings.internal_api_secret or settings.supabase_service_key
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {internal_secret}",
    }

    for tentativa in range(2):  # 1 tentativa + 1 retry
        try:
            import httpx
            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.post(url, json=payload, headers=headers)
            if resp.status_code < 400:
                data = resp.json()
                logger.info(f"[CRM] Cliente/negócio criado: {data.get('status')} (conversa {conversa_id})")
                return
            logger.warning(f"[CRM] Erro {resp.status_code} ao criar cliente/negócio (tentativa {tentativa + 1}): {resp.text[:200]}")
        except Exception as e:
            logger.warning(f"[CRM] Falha ao chamar Next.js (tentativa {tentativa + 1}): {e}")

        if tentativa == 0:
            await asyncio.sleep(2)  # espera 2s antes do retry

    logger.error(f"[CRM] Não foi possível criar cliente/negócio para conversa {conversa_id} após 2 tentativas")


# ══════════════════════════════════════════════════════════
#  ENDPOINTS — WEBHOOK UAZAPI
# ══════════════════════════════════════════════════════════


@app.post("/webhook/lyneimob")
async def webhook_handler(request: Request, background_tasks: BackgroundTasks) -> JSONResponse:
    """Endpoint principal — recebe mensagens do WhatsApp via UAZAPI."""
    try:
        body = await request.json()
    except Exception:
        return JSONResponse({"status": "invalid_json"}, status_code=400)

    msg = parse_webhook(body)
    if not msg:
        return JSONResponse({"status": "ignored"})

    chat_id = msg.chat_id

    # Identificar organizacao
    config = await identificar_org(msg)
    if not config:
        return JSONResponse({"status": "org_not_found"})

    org_id = config["organizacao_id"]
    api_url = msg.api_url or settings.uazapi_default_url or config.get("uazapi_url", "")
    token = msg.token or settings.uazapi_default_token or config.get("uazapi_token", "")

    # 1. Mensagem saindo (fromMe)
    if msg.from_me:
        if not msg.was_sent_by_api:
            is_real_message = (
                msg.content_type in ("text", "image", "audio", "document", "video")
                and msg.content.strip()
                and not msg.message_type.startswith("protocol")
                and msg.message_type != "reactionMessage"
                and msg.message_type != "receiptMessage"
            )
            if is_real_message:
                await redis_client.set_block(chat_id, org_id)
                logger.info(f"[BLOCK] Humano respondeu para {chat_id}")
        return JSONResponse({"status": "own_message"})

    # 2. Verificar se IA pode responder
    if not await redis_client.is_ai_global_enabled():
        return JSONResponse({"status": "ai_globally_disabled"})
    if await redis_client.is_blocked(chat_id, org_id):
        return JSONResponse({"status": "blocked"})

    # 3. Verificar horario de funcionamento (via Redis)
    bh = await redis_client.get_business_hours()
    if bh["enabled"]:
        from datetime import timedelta, timezone as tz
        hora_atual = datetime.now(tz=tz(timedelta(hours=-3))).hour
        if hora_atual < bh["start"] or hora_atual >= bh["end"]:
            # Envia mensagem de ausencia so uma vez por contato no dia (evita spam)
            ja_enviou = await redis_client.ja_enviou_ausencia_hoje(chat_id, org_id)
            if not ja_enviou and api_url and token:
                absence_msg = await redis_client.get_absence_message()
                from agente.services.whatsapp import send_text
                await send_text(api_url, token, chat_id, absence_msg)
                await redis_client.marcar_ausencia_enviada(chat_id, org_id)
                logger.info(f"[AUSENCIA] Msg enviada pra {chat_id} (fora do horario {bh['start']}h-{bh['end']}h)")
            return JSONResponse({"status": "outside_business_hours"})

    # 4. Deduplicacao
    if msg.message_id:
        if await db.verificar_mensagem_duplicada(msg.message_id):
            return JSONResponse({"status": "duplicate"})

    # 5. Buscar ou criar conversa
    conversa = await db.buscar_conversa_ativa(org_id, chat_id)
    is_nova = False
    if not conversa:
        conversa = await db.criar_conversa(org_id, chat_id, msg.nome)
        is_nova = True
        if not conversa:
            logger.error(f"[WEBHOOK] Falha ao criar conversa para {chat_id}")
            return JSONResponse({"status": "error"}, status_code=500)

    conversa_id = conversa["id"]

    # 5.1 Conversa nova → chamar Next.js pra criar cliente + negócio no CRM
    if is_nova:
        background_tasks.add_task(
            criar_cliente_negocio_via_nextjs,
            conversa_id, org_id, chat_id, msg.nome or ""
        )

    # 6. Marcar como lida
    if api_url and token and msg.message_id_full:
        await mark_as_read(api_url, token, msg.message_id_full)

    # 7. Processar midia
    processed_content = await process_media(
        content_type=msg.content_type,
        content=msg.content,
        api_url=api_url,
        token=token,
        message_id_full=msg.message_id_full,
    )

    # 7b. Se for um reply citando mensagem anterior, prefixar o conteudo
    # com a citacao pra que o agente entenda do que o cliente esta falando.
    # Tenta resolver o conteudo da mensagem citada via DB (se quoted_text vazio).
    if msg.quoted_message_id or msg.quoted_content:
        citacao = msg.quoted_content.strip()
        if not citacao and msg.quoted_message_id:
            try:
                ref = await db.buscar_mensagem_por_id_whatsapp(msg.quoted_message_id)
                if ref:
                    citacao = (ref.get("conteudo") or "").strip()[:400]
            except Exception:
                pass
        if citacao:
            processed_content = (
                f"[Cliente respondeu citando uma mensagem sua anterior: \"{citacao[:300]}\"]\n"
                f"{processed_content}"
            )

    # 8. Salvar mensagem no banco
    await db.salvar_mensagem(
        conversa_id=conversa_id,
        org_id=org_id,
        direcao="recebida",
        conteudo=processed_content,
        tipo_conteudo=msg.content_type,
        message_id_whatsapp=msg.message_id or None,
    )

    # Atualizar timestamp da conversa
    await db.atualizar_conversa(conversa_id, {
        "ultima_mensagem_em": datetime.now(timezone.utc).isoformat(),
    })

    # 9. Buffer + agendar processamento
    await redis_client.buffer_push(
        chat_id=chat_id,
        org_id=org_id,
        content=processed_content,
        timestamp=msg.timestamp or int(time.time()),
        message_id=msg.message_id,
    )

    background_tasks.add_task(process_buffered_messages, msg, config, conversa_id)

    return JSONResponse({"status": "buffered"})


@app.post("/webhook/lyneimob/messages")
async def webhook_handler_messages(request: Request, background_tasks: BackgroundTasks) -> JSONResponse:
    """Rota alternativa — UAZAPI envia para /webhook/lyneimob/{event}."""
    return await webhook_handler(request, background_tasks)


@app.post("/webhook/lyneimob/connection")
async def webhook_handler_connection(request: Request) -> JSONResponse:
    """Rota para eventos de conexao."""
    return JSONResponse({"status": "ok"})


# ══════════════════════════════════════════════════════════
#  ENDPOINTS — CONTROLE DA IA
# ══════════════════════════════════════════════════════════


@app.post("/api/ai/toggle")
async def toggle_ai(request: Request) -> JSONResponse:
    """Ativa ou desativa a IA para um contato.

    Body: {"phone": "5527...", "org_id": "...", "enabled": true/false}
    """
    body = await request.json()
    phone = body.get("phone", "")
    org_id = body.get("org_id", "")
    enabled = body.get("enabled", True)

    if not phone or not org_id:
        return JSONResponse({"error": "phone e org_id obrigatorios"}, status_code=400)

    if enabled:
        await redis_client.remove_block(phone, org_id)
        logger.info(f"[AI] IA ativada para {phone}")
    else:
        await redis_client.set_block(phone, org_id)
        logger.info(f"[AI] IA desativada para {phone}")

    return JSONResponse({"status": "ok", "phone": phone, "ai_enabled": enabled})


@app.post("/api/ai/global-toggle")
async def global_toggle_ai(request: Request) -> JSONResponse:
    """Ativa ou desativa a IA globalmente.

    Body: {"enabled": true/false}
    """
    body = await request.json()
    enabled = body.get("enabled", True)
    await redis_client.set_ai_global(enabled)
    logger.info(f"[AI] IA global {'ativada' if enabled else 'desativada'}")
    return JSONResponse({"status": "ok", "ai_enabled": enabled})


@app.get("/api/ai/global-status")
async def global_ai_status() -> JSONResponse:
    """Retorna se a IA esta ativa globalmente."""
    enabled = await redis_client.is_ai_global_enabled()
    return JSONResponse({"ai_enabled": enabled})


@app.post("/api/ai/clear-memory/{conversa_id}")
async def clear_ai_memory(conversa_id: str) -> JSONResponse:
    """Limpa memoria de conversa da IA."""
    await redis_client.memory_clear(conversa_id)
    return JSONResponse({"status": "cleared", "conversa_id": conversa_id})


# ══════════════════════════════════════════════════════════
#  ENDPOINTS — CONTROLE DE BLOQUEIO
# ══════════════════════════════════════════════════════════


@app.post("/api/ai/unblock")
async def unblock_chat(request: Request) -> JSONResponse:
    """Desbloqueia IA para um contato.

    Body: {"phone": "5527...", "org_id": "..."}
    """
    body = await request.json()
    phone = body.get("phone", "")
    org_id = body.get("org_id", "")
    if not phone or not org_id:
        return JSONResponse({"error": "phone e org_id obrigatorios"}, status_code=400)
    await redis_client.remove_block(phone, org_id)
    return JSONResponse({"status": "unblocked", "phone": phone})


# ══════════════════════════════════════════════════════════
#  HEALTH CHECK
# ══════════════════════════════════════════════════════════


@app.get("/health")
async def health_check() -> JSONResponse:
    try:
        r = await redis_client.get_redis()
        await r.ping()
        redis_ok = True
    except Exception:
        redis_ok = False

    return JSONResponse({
        "status": "healthy" if redis_ok else "degraded",
        "service": "lyneimob-agent",
        "redis": "connected" if redis_ok else "disconnected",
        "llm": "anthropic",
        "model_default": settings.anthropic_model_default,
        "model_complex": settings.anthropic_model_complex,
        "vision": "claude (haiku 4.5)",
        "stt": f"openai whisper ({settings.whisper_model})",
        "buffer_seconds": settings.buffer_wait_seconds,
        "rate_limit": {
            "per_contact": settings.rate_limit_per_contact_per_minute,
            "global": settings.rate_limit_global_per_minute,
        },
    })


# ─────────────────── Admin: limpar memoria de uma conversa ───────────────────


@app.post("/admin/limpar-memoria/{conversa_id}")
async def admin_limpar_memoria(
    conversa_id: str,
    authorization: str | None = Header(default=None),
) -> JSONResponse:
    """Limpa memoria Redis de uma conversa especifica. Protegido por INTERNAL_API_SECRET."""
    secret = settings.internal_api_secret or settings.supabase_service_key
    if not authorization or not authorization.startswith("Bearer ") or authorization[7:] != secret:
        return JSONResponse({"erro": "Nao autorizado"}, status_code=401)

    r = await redis_client.get_redis()
    chaves = [
        f"memoria:whatsapp:{conversa_id}",
        f"buffer:{conversa_id}",
        f"lock:{conversa_id}",
        f"lock:agente:{conversa_id}",
    ]
    apagadas = 0
    for k in chaves:
        try:
            v = await r.delete(k)
            apagadas += int(v or 0)
        except Exception:
            pass

    # Scan extra por chaves contendo o conversa_id
    cursor = 0
    encontradas = []
    try:
        while True:
            cursor, batch = await r.scan(cursor=cursor, match=f"*{conversa_id}*", count=100)
            encontradas.extend([k if isinstance(k, str) else k.decode() for k in batch])
            if cursor == 0:
                break
        for k in encontradas:
            try:
                v = await r.delete(k)
                apagadas += int(v or 0)
            except Exception:
                pass
    except Exception as e:
        return JSONResponse({"erro": f"scan falhou: {e}", "apagadas": apagadas})

    return JSONResponse({"ok": True, "apagadas": apagadas, "chaves_encontradas": encontradas})


# ─────────────────── Runner ───────────────────

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "agente.main:app",
        host=settings.host,
        port=settings.port,
        reload=False,
    )
