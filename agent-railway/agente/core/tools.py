"""Tools (function calling) do agente SDR — definicoes + executores."""

from __future__ import annotations

import json
import logging
from typing import Any

from agente.services import supabase_client as db

logger = logging.getLogger(__name__)

# ============================================================
# Definicao dos tools (OpenAI function calling)
# ============================================================

CAMPOS_IMOVEL_COMPLETO = "id,titulo,codigo_interno,tipo,finalidade,status,descricao,logradouro,numero,bairro,cidade,estado,cep,valor,valor_aluguel,valor_condominio,valor_iptu,quartos,suites,banheiros,vagas,area_total,area_construida"

TOOLS_DEFINITION: list[dict] = [
    {
        "type": "function",
        "function": {
            "name": "buscar_imovel_por_identificacao",
            "description": "Buscar um imovel especifico pelo nome, codigo interno ou ID. Retorna TODOS os detalhes do imovel. Use quando o cliente mencionar um imovel especifico pelo nome ou codigo, ou quando precisar dos detalhes completos.",
            "parameters": {
                "type": "object",
                "properties": {
                    "nome": {"type": "string", "description": "Nome ou parte do titulo do imovel"},
                    "codigo": {"type": "string", "description": "Codigo interno do imovel (ex: IMO-001)"},
                    "id": {"type": "string", "description": "ID UUID do imovel no sistema"},
                },
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "buscar_imoveis",
            "description": "Buscar imoveis disponiveis no sistema que correspondam aos criterios do cliente. Use para recomendar opcoes ou encontrar similares.",
            "parameters": {
                "type": "object",
                "properties": {
                    "tipo": {
                        "type": "string",
                        "enum": [
                            "apartamento", "casa", "terreno", "sala_comercial",
                            "galpao", "cobertura", "kitnet", "fazenda", "sitio", "loja",
                        ],
                        "description": "Tipo do imovel",
                    },
                    "finalidade": {
                        "type": "string",
                        "enum": ["venda", "aluguel"],
                        "description": "Se o cliente quer comprar ou alugar",
                    },
                    "cidade": {"type": "string", "description": "Cidade do imovel"},
                    "bairro": {"type": "string", "description": "Bairro do imovel"},
                    "preco_min": {"type": "number", "description": "Preco minimo em reais"},
                    "preco_max": {"type": "number", "description": "Preco maximo em reais"},
                    "quartos_min": {"type": "integer", "description": "Quantidade minima de quartos"},
                },
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "atualizar_cliente",
            "description": "Atualizar os dados do cliente na plataforma. O cliente ja existe — esta ferramenta preenche o nome e informacoes coletadas.",
            "parameters": {
                "type": "object",
                "properties": {
                    "nome": {"type": "string", "description": "Nome completo do cliente"},
                    "email": {"type": "string", "description": "Email do cliente (se informado)"},
                    "tipo": {
                        "type": "string",
                        "enum": ["comprador", "vendedor", "locatario", "proprietario"],
                        "description": "Tipo de interesse do cliente",
                    },
                    "observacoes": {"type": "string", "description": "Observacoes relevantes"},
                },
                "required": ["nome", "tipo"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "atualizar_negocio",
            "description": "Atualizar o negocio no pipeline com titulo, tipo e valor.",
            "parameters": {
                "type": "object",
                "properties": {
                    "titulo": {"type": "string", "description": "Titulo do negocio"},
                    "cliente_id": {"type": "string", "description": "ID do cliente"},
                    "imovel_id": {"type": "string", "description": "ID do imovel de interesse"},
                    "tipo": {"type": "string", "enum": ["venda", "aluguel"], "description": "Tipo do negocio"},
                    "valor": {"type": "number", "description": "Valor estimado em reais"},
                },
                "required": ["titulo", "cliente_id", "tipo"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "criar_atividade",
            "description": "Agendar uma atividade para o corretor (visita, ligacao, follow-up).",
            "parameters": {
                "type": "object",
                "properties": {
                    "titulo": {"type": "string", "description": "Titulo da atividade"},
                    "tipo": {
                        "type": "string",
                        "enum": ["ligacao", "email", "visita", "reuniao", "follow_up", "proposta", "outro"],
                        "description": "Tipo da atividade",
                    },
                    "data_vencimento": {"type": "string", "description": "Data e hora ISO (ex: 2026-03-16T10:00:00)"},
                    "cliente_id": {"type": "string", "description": "ID do cliente vinculado"},
                    "negocio_id": {"type": "string", "description": "ID do negocio vinculado"},
                    "descricao": {"type": "string", "description": "Descricao para o corretor"},
                },
                "required": ["titulo", "tipo", "data_vencimento"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "salvar_qualificacao",
            "description": "Salvar dados de qualificacao extraidos da conversa. Pode chamar varias vezes — os dados sao mesclados.",
            "parameters": {
                "type": "object",
                "properties": {
                    "tipo_imovel": {"type": "string", "description": "Tipo de imovel desejado"},
                    "finalidade": {"type": "string", "description": "Finalidade (comprar, alugar, vender)"},
                    "bairros": {"type": "array", "items": {"type": "string"}, "description": "Bairros de interesse"},
                    "faixa_preco": {
                        "type": "object",
                        "properties": {"min": {"type": "number"}, "max": {"type": "number"}},
                        "description": "Faixa de preco em reais",
                    },
                    "urgencia": {"type": "string", "enum": ["alta", "media", "baixa"], "description": "Urgencia"},
                    "observacoes": {"type": "string", "description": "Observacoes adicionais"},
                },
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "encaminhar_corretor",
            "description": "Encaminhar a conversa para um corretor humano.",
            "parameters": {
                "type": "object",
                "properties": {
                    "motivo": {"type": "string", "description": "Motivo do encaminhamento"},
                    "resumo": {"type": "string", "description": "Resumo da conversa para o corretor (2-3 frases)"},
                },
                "required": ["motivo", "resumo"],
            },
        },
    },
]


# ============================================================
# Contexto passado para os executores
# ============================================================

class ToolContext:
    def __init__(
        self,
        conversa_id: str,
        org_id: str,
        numero_cliente: str,
        cliente_id: str | None = None,
        negocio_id: str | None = None,
    ):
        self.conversa_id = conversa_id
        self.org_id = org_id
        self.numero_cliente = numero_cliente
        self.cliente_id = cliente_id
        self.negocio_id = negocio_id


# ============================================================
# Executores
# ============================================================


def _formatar_imovel_completo(i: dict) -> str:
    """Formata um imovel completo em texto legivel para a IA."""
    valor = i.get("valor")
    valor_aluguel = i.get("valor_aluguel")
    if valor:
        preco = f"Venda: R$ {float(valor):,.0f}".replace(",", ".")
    elif valor_aluguel:
        preco = f"Aluguel: R$ {float(valor_aluguel):,.0f}/mes".replace(",", ".")
    else:
        preco = "Preco sob consulta"
    partes = [
        f"ID: {i.get('id','')}",
        f"Titulo: {i.get('titulo','')}",
        f"Codigo interno: {i.get('codigo_interno') or 'sem codigo'}",
        f"Tipo: {i.get('tipo','')}",
        f"Finalidade: {i.get('finalidade','')}",
        f"Status: {i.get('status','')}",
        f"Endereco: {', '.join(filter(None, [str(i.get(c,'')) for c in ('logradouro','numero','bairro','cidade','estado')]))}",
        f"CEP: {i.get('cep') or 'nao informado'}",
        f"Preco: {preco}",
    ]
    if i.get("valor_condominio"):
        partes.append(f"Condominio: R$ {float(i['valor_condominio']):,.0f}/mes".replace(",", "."))
    if i.get("valor_iptu"):
        partes.append(f"IPTU: R$ {float(i['valor_iptu']):,.0f}/ano".replace(",", "."))
    partes.extend([
        f"Quartos: {i.get('quartos',0)}",
        f"Suites: {i.get('suites',0)}",
        f"Banheiros: {i.get('banheiros',0)}",
        f"Vagas: {i.get('vagas',0)}",
        f"Area total: {str(i['area_total']) + 'm2' if i.get('area_total') else 'nao informada'}",
        f"Area construida: {str(i['area_construida']) + 'm2' if i.get('area_construida') else 'nao informada'}",
    ])
    if i.get("descricao"):
        partes.append(f"Descricao: {i['descricao']}")
    return "\n".join(partes)


async def _buscar_corretor(org_id: str) -> str | None:
    """Busca corretor padrao da config WhatsApp ou admin da org."""
    config = await db.select(
        "config_whatsapp",
        columns="corretor_padrao_id",
        filters={"organizacao_id": f"eq.{org_id}"},
        single=True,
    )
    if config and config.get("corretor_padrao_id"):
        return config["corretor_padrao_id"]

    admin = await db.select(
        "usuarios",
        columns="id",
        filters={"organizacao_id": f"eq.{org_id}", "cargo": "eq.admin"},
        limit=1,
        single=True,
    )
    return admin["id"] if admin else None


async def executar_buscar_imovel_por_identificacao(args: dict, ctx: ToolContext) -> str:
    """Busca imovel especifico por ID, codigo ou nome."""
    imovel_id = args.get("id")
    codigo = args.get("codigo")
    nome = args.get("nome")

    # Busca por ID exato
    if imovel_id:
        result = await db.select(
            "imoveis",
            columns=CAMPOS_IMOVEL_COMPLETO,
            filters={"organizacao_id": f"eq.{ctx.org_id}", "id": f"eq.{imovel_id}"},
            single=True,
        )
        if not result:
            return "Imovel nao encontrado com esse ID."
        return f"Imovel encontrado:\n{_formatar_imovel_completo(result)}"

    # Busca por codigo interno
    if codigo:
        codigo_limpo = codigo.replace(" ", "").upper()
        result = await db.select(
            "imoveis",
            columns=CAMPOS_IMOVEL_COMPLETO,
            filters={"organizacao_id": f"eq.{ctx.org_id}", "codigo_interno": f"ilike.*{codigo_limpo}*"},
            limit=1,
            single=True,
        )
        if result:
            return f"Imovel encontrado:\n{_formatar_imovel_completo(result)}"

        # Fallback: busca flexivel sem hifens
        todos = await db.select(
            "imoveis",
            columns=CAMPOS_IMOVEL_COMPLETO,
            filters={"organizacao_id": f"eq.{ctx.org_id}"},
        )
        codigo_sem_hifen = codigo_limpo.replace("-", "")
        for i in (todos or []):
            cod = str(i.get("codigo_interno", "")).replace("-", "").replace(" ", "").upper()
            if cod == codigo_sem_hifen or codigo_sem_hifen in cod:
                return f"Imovel encontrado:\n{_formatar_imovel_completo(i)}"

        return f'Nenhum imovel encontrado com o codigo "{codigo}".'

    # Busca por nome/titulo
    if nome:
        result = await db.select(
            "imoveis",
            columns=CAMPOS_IMOVEL_COMPLETO,
            filters={"organizacao_id": f"eq.{ctx.org_id}", "titulo": f"ilike.*{nome}*"},
            limit=3,
        )
        if not result:
            return f'Nenhum imovel encontrado com o nome "{nome}".'
        if len(result) == 1:
            return f"Imovel encontrado:\n{_formatar_imovel_completo(result[0])}"
        linhas = [f"- {i.get('titulo','')} (Cod: {i.get('codigo_interno','?')}) — ID: {i.get('id','')}" for i in result]
        return f"Encontrei {len(result)} imoveis:\n" + "\n".join(linhas) + "\n\nUse o ID para buscar os detalhes completos."

    return "Informe o nome, codigo ou ID do imovel para buscar."


async def executar_buscar_imoveis(args: dict, ctx: ToolContext) -> str:
    """Busca imoveis no Supabase com filtros."""
    filters: dict[str, str] = {
        "organizacao_id": f"eq.{ctx.org_id}",
        "status": "eq.disponivel",
    }
    if args.get("tipo"):
        filters["tipo"] = f"eq.{args['tipo']}"
    if args.get("cidade"):
        filters["cidade"] = f"ilike.*{args['cidade']}*"
    if args.get("bairro"):
        filters["bairro"] = f"ilike.*{args['bairro']}*"
    if args.get("quartos_min"):
        filters["quartos"] = f"gte.{args['quartos_min']}"

    result = await db.select(
        "imoveis",
        columns=CAMPOS_IMOVEL_COMPLETO,
        filters=filters,
        order="created_at.desc",
        limit=10,
    )

    if not result:
        return "Nenhum imovel encontrado com esses criterios."

    # Filtros de preco client-side (PostgREST nao suporta OR facilmente)
    imoveis = result
    if args.get("finalidade"):
        fin = args["finalidade"]
        imoveis = [i for i in imoveis if i.get("finalidade") in (fin, "venda_e_aluguel")]
    if args.get("preco_max"):
        max_p = float(args["preco_max"])
        imoveis = [i for i in imoveis if (i.get("valor") or i.get("valor_aluguel") or 0) <= max_p]
    if args.get("preco_min"):
        min_p = float(args["preco_min"])
        imoveis = [i for i in imoveis if (i.get("valor") or i.get("valor_aluguel") or 0) >= min_p]

    if not imoveis:
        return "Nenhum imovel encontrado com esses criterios."

    linhas = []
    for i in imoveis[:5]:
        valor = i.get("valor")
        valor_aluguel = i.get("valor_aluguel")
        if valor:
            preco = f"Venda: R$ {float(valor):,.0f}".replace(",", ".")
        elif valor_aluguel:
            preco = f"Aluguel: R$ {float(valor_aluguel):,.0f}/mes".replace(",", ".")
        else:
            preco = "Preco sob consulta"
        cod = i.get("codigo_interno") or "?"
        quartos = i.get("quartos", 0)
        suites = i.get("suites", 0)
        banheiros = i.get("banheiros", 0)
        vagas = i.get("vagas", 0)
        area_t = i.get("area_total") or "?"
        area_c = i.get("area_construida") or "?"
        cond = ""
        if i.get("valor_condominio"):
            cond = f" | Cond: R$ {float(i['valor_condominio']):,.0f}".replace(",", ".")
        linhas.append(
            f"- [{i['id']}] {i.get('titulo','')} (Cod: {cod}) | {i.get('tipo','')} | "
            f"{i.get('bairro','')}, {i.get('cidade','')}-{i.get('estado','')} | "
            f"{preco} | {quartos}q/{suites}s/{banheiros}b/{vagas}v | "
            f"{area_t}m2 total, {area_c}m2 constr.{cond}"
        )

    return f"Encontrei {len(imoveis)} imovel(is):\n" + "\n".join(linhas)


async def executar_atualizar_cliente(args: dict, ctx: ToolContext) -> str:
    """Atualiza dados do cliente."""
    if ctx.cliente_id:
        data: dict[str, Any] = {"nome": args["nome"]}
        if args.get("email"):
            data["email"] = args["email"]
        if args.get("tipo"):
            data["tipo"] = args["tipo"]
        if args.get("observacoes"):
            data["observacoes"] = args["observacoes"]

        result = await db.update(
            "clientes",
            filters={"id": f"eq.{ctx.cliente_id}"},
            data=data,
        )
        if not result:
            return "Erro ao atualizar cliente."
        return f"Cliente atualizado com sucesso. ID: {ctx.cliente_id}"

    # Caso raro: criar cliente
    corretor_id = await _buscar_corretor(ctx.org_id)
    if not corretor_id:
        return "Erro: nenhum corretor encontrado na organizacao."

    result = await db.insert("clientes", {
        "organizacao_id": ctx.org_id,
        "corretor_id": corretor_id,
        "nome": args["nome"],
        "telefone": ctx.numero_cliente,
        "whatsapp": ctx.numero_cliente,
        "email": args.get("email"),
        "tipo": args.get("tipo", "comprador"),
        "origem": "whatsapp",
        "observacoes": args.get("observacoes"),
    })
    if not result:
        return "Erro ao criar cliente."

    # Vincular à conversa
    await db.update(
        "conversas_whatsapp",
        filters={"id": f"eq.{ctx.conversa_id}"},
        data={"cliente_id": result["id"]},
    )
    ctx.cliente_id = result["id"]
    return f"Cliente criado com sucesso. ID: {result['id']}"


async def executar_atualizar_negocio(args: dict, ctx: ToolContext) -> str:
    """Atualiza negocio no pipeline."""
    if ctx.negocio_id:
        data: dict[str, Any] = {}
        if args.get("titulo"):
            data["titulo"] = args["titulo"]
        if args.get("tipo"):
            data["tipo"] = args["tipo"]
        if args.get("valor"):
            data["valor"] = args["valor"]
        if args.get("imovel_id"):
            data["imovel_id"] = args["imovel_id"]

        if data:
            result = await db.update(
                "negocios",
                filters={"id": f"eq.{ctx.negocio_id}"},
                data=data,
            )
            if not result:
                return "Erro ao atualizar negocio."
        return f"Negocio atualizado com sucesso. ID: {ctx.negocio_id}"

    return "Negocio nao encontrado para atualizar."


async def executar_criar_atividade(args: dict, ctx: ToolContext) -> str:
    """Cria atividade para o corretor."""
    corretor_id = await _buscar_corretor(ctx.org_id)
    if not corretor_id:
        return "Erro: nenhum usuario encontrado na organizacao."

    result = await db.insert("atividades", {
        "organizacao_id": ctx.org_id,
        "usuario_id": corretor_id,
        "titulo": args["titulo"],
        "tipo": args.get("tipo", "follow_up"),
        "data_vencimento": args["data_vencimento"],
        "cliente_id": args.get("cliente_id") or ctx.cliente_id,
        "negocio_id": args.get("negocio_id") or ctx.negocio_id,
        "descricao": args.get("descricao"),
    })
    if not result:
        return "Erro ao criar atividade."
    return "Atividade agendada com sucesso."


async def executar_salvar_qualificacao(args: dict, ctx: ToolContext) -> str:
    """Salva qualificacao na conversa (merge com existente)."""
    conversa = await db.select(
        "conversas_whatsapp",
        columns="qualificacao",
        filters={"id": f"eq.{ctx.conversa_id}"},
        single=True,
    )
    qualificacao_existente = (conversa or {}).get("qualificacao") or {}
    if isinstance(qualificacao_existente, str):
        try:
            qualificacao_existente = json.loads(qualificacao_existente)
        except Exception:
            qualificacao_existente = {}

    nova = {**qualificacao_existente}
    for campo in ("tipo_imovel", "finalidade", "bairros", "faixa_preco", "urgencia", "observacoes"):
        if args.get(campo) is not None:
            nova[campo] = args[campo]

    result = await db.update(
        "conversas_whatsapp",
        filters={"id": f"eq.{ctx.conversa_id}"},
        data={"qualificacao": nova},
    )
    if not result:
        return "Erro ao salvar qualificacao."
    return "Qualificacao salva com sucesso."


async def executar_encaminhar_corretor(args: dict, ctx: ToolContext) -> str:
    """Encaminha conversa para corretor humano."""
    corretor_id = await _buscar_corretor(ctx.org_id)

    result = await db.update(
        "conversas_whatsapp",
        filters={"id": f"eq.{ctx.conversa_id}"},
        data={
            "status": "encaminhado",
            "resumo_ia": args.get("resumo", ""),
            "corretor_id": corretor_id,
        },
    )
    if not result:
        return "Erro ao encaminhar."
    return f"Conversa encaminhada para o corretor. Motivo: {args.get('motivo', '')}"


# ============================================================
# Dispatcher
# ============================================================

_EXECUTORES = {
    "buscar_imovel_por_identificacao": executar_buscar_imovel_por_identificacao,
    "buscar_imoveis": executar_buscar_imoveis,
    "atualizar_cliente": executar_atualizar_cliente,
    "atualizar_negocio": executar_atualizar_negocio,
    "criar_atividade": executar_criar_atividade,
    "salvar_qualificacao": executar_salvar_qualificacao,
    "encaminhar_corretor": executar_encaminhar_corretor,
}


async def execute_tool(
    tool_name: str,
    arguments: dict,
    context: ToolContext,
) -> str:
    """Executa um tool chamado pela IA."""
    executor = _EXECUTORES.get(tool_name)
    if not executor:
        return f'Ferramenta "{tool_name}" nao reconhecida.'
    try:
        return await executor(arguments, context)
    except Exception as e:
        logger.error(f"[TOOL] Erro ao executar {tool_name}: {e}", exc_info=True)
        return f"Erro ao executar {tool_name}: {str(e)}"
