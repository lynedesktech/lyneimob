"""Cliente Supabase via REST (PostgREST) — operacoes diretas no banco."""

from __future__ import annotations

import logging
from typing import Any

import httpx

from agente.config import settings

logger = logging.getLogger(__name__)


def _headers() -> dict[str, str]:
    return {
        "Authorization": f"Bearer {settings.supabase_service_key}",
        "Content-Type": "application/json",
        "apikey": settings.supabase_service_key,
        "Prefer": "return=representation",
    }


def _url(table: str) -> str:
    return f"{settings.supabase_url.rstrip('/')}/rest/v1/{table}"


# ─────────────────── Queries genéricas ───────────────────


async def select(
    table: str,
    columns: str = "*",
    filters: dict[str, str] | None = None,
    order: str | None = None,
    limit: int | None = None,
    single: bool = False,
) -> list[dict] | dict | None:
    """SELECT genérico via PostgREST."""
    params: dict[str, str] = {"select": columns}
    if filters:
        for key, val in filters.items():
            params[key] = val
    if order:
        params["order"] = order
    if limit:
        params["limit"] = str(limit)

    headers = _headers()
    if single:
        headers["Accept"] = "application/vnd.pgrst.object+json"

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(_url(table), headers=headers, params=params)
            if resp.status_code == 406 and single:
                return None
            if resp.status_code >= 400:
                logger.error(f"[SUPABASE] SELECT {table} erro: {resp.status_code} {resp.text[:300]}")
                return None if single else []
            return resp.json()
    except Exception as e:
        logger.error(f"[SUPABASE] SELECT {table} excecao: {e}")
        return None if single else []


async def insert(table: str, data: dict) -> dict | None:
    """INSERT e retorna o registro criado."""
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                _url(table),
                headers={**_headers(), "Accept": "application/vnd.pgrst.object+json"},
                json=data,
            )
            if resp.status_code >= 400:
                logger.error(f"[SUPABASE] INSERT {table} erro: {resp.status_code} {resp.text[:300]}")
                return None
            return resp.json()
    except Exception as e:
        logger.error(f"[SUPABASE] INSERT {table} excecao: {e}")
        return None


async def update(table: str, filters: dict[str, str], data: dict) -> dict | None:
    """UPDATE com filtros e retorna o registro atualizado."""
    params = {**filters}
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.patch(
                _url(table),
                headers={**_headers(), "Accept": "application/vnd.pgrst.object+json"},
                params=params,
                json=data,
            )
            if resp.status_code >= 400:
                logger.error(f"[SUPABASE] UPDATE {table} erro: {resp.status_code} {resp.text[:300]}")
                return None
            return resp.json()
    except Exception as e:
        logger.error(f"[SUPABASE] UPDATE {table} excecao: {e}")
        return None


async def rpc(function_name: str, params: dict | None = None) -> Any:
    """Chama uma function RPC do Supabase."""
    url = f"{settings.supabase_url.rstrip('/')}/rest/v1/rpc/{function_name}"
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(url, headers=_headers(), json=params or {})
            if resp.status_code >= 400:
                logger.error(f"[SUPABASE] RPC {function_name} erro: {resp.status_code} {resp.text[:300]}")
                return None
            return resp.json()
    except Exception as e:
        logger.error(f"[SUPABASE] RPC {function_name} excecao: {e}")
        return None


# ─────────────────── Operacoes especificas do LyneMob ───────────────────


async def buscar_config_por_token(token: str) -> dict | None:
    """Busca config_whatsapp pelo token da instancia."""
    return await select(
        "config_whatsapp",
        columns="*",
        filters={"uazapi_token": f"eq.{token}", "ativo": "eq.true"},
        single=True,
    )


async def buscar_config_por_instance_id(instance_id: str) -> dict | None:
    """Busca config_whatsapp pelo instance_id."""
    return await select(
        "config_whatsapp",
        columns="*",
        filters={"instance_id": f"eq.{instance_id}", "ativo": "eq.true"},
        single=True,
    )


async def buscar_conversa_ativa(org_id: str, numero_cliente: str) -> dict | None:
    """Busca conversa ativa (em_andamento, qualificado ou encaminhado)."""
    result = await select(
        "conversas_whatsapp",
        columns="*,origem_lead,imovel_interesse_id",
        filters={
            "organizacao_id": f"eq.{org_id}",
            "numero_cliente": f"eq.{numero_cliente}",
            "status": "in.(em_andamento,qualificado,encaminhado)",
        },
        order="criado_em.desc",
        limit=1,
        single=True,
    )
    return result


async def criar_conversa(org_id: str, numero_cliente: str, nome_cliente: str = "") -> dict | None:
    """Cria nova conversa."""
    return await insert("conversas_whatsapp", {
        "organizacao_id": org_id,
        "numero_cliente": numero_cliente,
        "nome_cliente": nome_cliente or numero_cliente,
        "status": "em_andamento",
    })


async def salvar_mensagem(
    conversa_id: str,
    org_id: str,
    direcao: str,
    conteudo: str,
    tipo_conteudo: str = "texto",
    message_id_whatsapp: str | None = None,
) -> dict | None:
    """Salva mensagem no banco."""
    data: dict[str, Any] = {
        "conversa_id": conversa_id,
        "organizacao_id": org_id,
        "direcao": direcao,
        "tipo_conteudo": tipo_conteudo,
        "conteudo": conteudo,
        "conteudo_original": conteudo,
    }
    if message_id_whatsapp:
        data["message_id_whatsapp"] = message_id_whatsapp

    return await insert("mensagens_whatsapp", data)


async def atualizar_conversa(conversa_id: str, data: dict) -> dict | None:
    """Atualiza campos da conversa."""
    return await update(
        "conversas_whatsapp",
        filters={"id": f"eq.{conversa_id}"},
        data=data,
    )


async def buscar_mensagens_recentes(conversa_id: str, limit: int = 30) -> list[dict]:
    """Busca mensagens recentes da conversa."""
    result = await select(
        "mensagens_whatsapp",
        columns="direcao,conteudo,tipo_conteudo,criado_em",
        filters={"conversa_id": f"eq.{conversa_id}"},
        order="criado_em.desc",
        limit=limit,
    )
    if not result:
        return []
    # Reverter para ordem cronológica
    return list(reversed(result))


async def buscar_nome_organizacao(org_id: str) -> str:
    """Busca nome da organizacao."""
    result = await select(
        "organizacoes",
        columns="nome",
        filters={"id": f"eq.{org_id}"},
        single=True,
    )
    return result.get("nome", "Imobiliaria") if result else "Imobiliaria"


async def buscar_etapa_negocio(negocio_id: str) -> str | None:
    """Busca tipo da etapa atual do negocio."""
    result = await select(
        "negocios",
        columns="pipeline_etapas(tipo)",
        filters={"id": f"eq.{negocio_id}"},
        single=True,
    )
    if not result:
        return None
    etapas = result.get("pipeline_etapas")
    if isinstance(etapas, dict):
        return etapas.get("tipo")
    return None


async def verificar_mensagem_duplicada(message_id_whatsapp: str) -> bool:
    """Verifica se mensagem já existe no banco (deduplicacao)."""
    result = await select(
        "mensagens_whatsapp",
        columns="id",
        filters={"message_id_whatsapp": f"eq.{message_id_whatsapp}"},
        limit=1,
    )
    return bool(result)


async def buscar_mensagem_por_id_whatsapp(message_id_whatsapp: str) -> dict | None:
    """Busca uma mensagem pelo message_id_whatsapp (usado pra resolver replies/citacoes)."""
    if not message_id_whatsapp:
        return None
    result = await select(
        "mensagens_whatsapp",
        columns="id,direcao,conteudo,tipo_conteudo,message_id_whatsapp,criado_em",
        filters={"message_id_whatsapp": f"eq.{message_id_whatsapp}"},
        limit=1,
    )
    if isinstance(result, list) and result:
        return result[0]
    return None
