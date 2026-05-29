"""Tools do agente SDR — definicoes Anthropic + executores."""

from __future__ import annotations

import json
import logging
import os
from typing import Any

from agente.services import supabase_client as db

logger = logging.getLogger(__name__)

# ============================================================
# Definicao dos tools (Anthropic Claude tool use)
# ============================================================

CAMPOS_IMOVEL_COMPLETO = "id,titulo,codigo_interno,tipo,finalidade,status,descricao,logradouro,numero,bairro,cidade,estado,cep,valor,valor_aluguel,valor_condominio,valor_iptu,quartos,suites,banheiros,vagas,area_total,area_construida"

TOOLS_DEFINITION: list[dict] = [
    {
        "name": "buscar_imovel_por_identificacao",
        "description": "Buscar um imovel especifico pelo nome, codigo interno ou ID. Retorna TODOS os detalhes do imovel + URL publica do site. Use quando o cliente mencionar um imovel especifico pelo nome ou codigo.",
        "input_schema": {
            "type": "object",
            "properties": {
                "nome": {"type": "string", "description": "Nome ou parte do titulo do imovel"},
                "codigo": {"type": "string", "description": "Codigo interno do imovel (ex: IMO-001)"},
                "id": {"type": "string", "description": "ID UUID do imovel no sistema"},
            },
            "required": [],
        },
    },
    {
        "name": "buscar_imoveis",
        "description": "Buscar imoveis disponiveis no sistema que correspondam aos criterios do cliente. Retorna lista com IDs e dados resumidos + URL publica de cada imovel.",
        "input_schema": {
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
    {
        "name": "enviar_card_imovel",
        "description": "USE SEMPRE QUE RECOMENDAR UM IMOVEL ESPECIFICO. Manda DIRETO via WhatsApp um carrossel: foto principal + ate 3 fotos extras + caption com endereco, preco, quartos/suites/banheiros/vagas, area + botao 'Ver no site'. Muito mais bonito que descrever em texto. Pode chamar varias vezes pra mostrar varias opcoes. Use intro_text APENAS NA PRIMEIRA chamada da sequencia (a saudacao/contexto que vem ACIMA do carrossel). Nas chamadas seguintes da mesma sequencia, deixe intro_text vazio. Depois NAO repita os dados em texto — o cliente ja ve no card.",
        "input_schema": {
            "type": "object",
            "properties": {
                "imovel_id": {
                    "type": "string",
                    "description": "ID UUID do imovel (obtido por buscar_imoveis ou buscar_imovel_por_identificacao)",
                },
                "intro_text": {
                    "type": "string",
                    "description": "Texto que aparece ACIMA do carrossel. Use SO na primeira chamada da sequencia pra dar contexto cearense feminino. Max 200 chars. Ex: 'Bom dia, Gabriel! Taiba e uma joia, viu. Separei essas duas opcoes pra ti.' Nas chamadas seguintes da mesma sequencia, deixe vazio.",
                },
            },
            "required": ["imovel_id"],
        },
    },
    {
        "name": "enviar_audio",
        "description": "Envia uma resposta em AUDIO (mensagem de voz) ao inves de texto. Use quando: (1) o cliente mandou audio pra voce (responde no mesmo formato), (2) for uma explicacao mais pessoal/calorosa (ex: contar do imovel, conversar sobre a Taiba), (3) saudacao inicial calorosa. NAO use pra confirmacoes curtas tipo 'ok' ou pra pergunta de qualificacao seca. Maximo ~500 caracteres pra audio nao ficar muito longo (cliente cansa). NUNCA chame essa tool junto com enviar_card_imovel na mesma resposta — escolha um ou outro.",
        "input_schema": {
            "type": "object",
            "properties": {
                "texto": {
                    "type": "string",
                    "description": "Texto a ser convertido em audio. Maximo 500 chars. Escreva exatamente como deve ser falado (sem markdown, sem emoji, sem `---`). Use 'voce' (NUNCA tu).",
                },
            },
            "required": ["texto"],
        },
    },
    {
        "name": "atualizar_cliente",
        "description": "Atualizar os dados do cliente na plataforma. O cliente ja existe — esta ferramenta preenche o nome e informacoes coletadas.",
        "input_schema": {
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
    {
        "name": "atualizar_negocio",
        "description": "Atualizar o negocio no pipeline com titulo, tipo e valor.",
        "input_schema": {
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
    {
        "name": "criar_atividade",
        "description": "Agendar uma atividade para o corretor (visita, ligacao, follow-up).",
        "input_schema": {
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
    {
        "name": "salvar_qualificacao",
        "description": "Salvar dados de qualificacao extraidos da conversa. Pode chamar varias vezes — os dados sao mesclados.",
        "input_schema": {
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
    {
        "name": "encaminhar_corretor",
        "description": "Encaminhar a conversa para um corretor humano.",
        "input_schema": {
            "type": "object",
            "properties": {
                "motivo": {"type": "string", "description": "Motivo do encaminhamento"},
                "resumo": {"type": "string", "description": "Resumo da conversa para o corretor (2-3 frases)"},
            },
            "required": ["motivo", "resumo"],
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
        api_url: str | None = None,
        token: str | None = None,
    ):
        self.conversa_id = conversa_id
        self.org_id = org_id
        self.numero_cliente = numero_cliente
        self.cliente_id = cliente_id
        self.negocio_id = negocio_id
        # Credenciais Uazapi pra enviar mensagens proativas (card de imovel)
        self.api_url = api_url
        self.token = token


# ============================================================
# Helper: monta URL publica do imovel no site
# ============================================================


async def _montar_url_imovel(org_id: str, imovel_id: str) -> str:
    """Monta URL publica do imovel — usa dominio customizado verificado se houver."""
    # Tenta dominio customizado verificado
    dominio = await db.select(
        "dominios_customizados",
        columns="dominio,status",
        filters={"organizacao_id": f"eq.{org_id}", "status": "eq.verificado"},
        single=True,
    )
    if dominio and dominio.get("dominio"):
        return f"https://{dominio['dominio']}/imoveis/{imovel_id}"

    # Fallback: dominio principal + slug
    org = await db.select(
        "organizacoes",
        columns="slug",
        filters={"id": f"eq.{org_id}"},
        single=True,
    )
    base = os.environ.get("NEXTJS_APP_URL", "https://lyneimob.vercel.app").rstrip("/")
    slug = (org or {}).get("slug") or "imobiliaria"
    return f"{base}/{slug}/imoveis/{imovel_id}"


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
        url = await _montar_url_imovel(ctx.org_id, imovel_id)
        return (
            f"Imovel encontrado:\n{_formatar_imovel_completo(result)}\n"
            f"Link do site: {url}\n\n"
            "IMPORTANTE: para mandar o card visual (foto + link) ao cliente, "
            "chame a tool enviar_card_imovel com este ID."
        )

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
            url = await _montar_url_imovel(ctx.org_id, result["id"])
            return (
                f"Imovel encontrado:\n{_formatar_imovel_completo(result)}\n"
                f"Link do site: {url}\n\n"
                "IMPORTANTE: para mandar o card visual (foto + link) ao cliente, "
                "chame a tool enviar_card_imovel com este ID."
            )

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
                url = await _montar_url_imovel(ctx.org_id, i["id"])
                return (
                    f"Imovel encontrado:\n{_formatar_imovel_completo(i)}\n"
                    f"Link do site: {url}\n\n"
                    "IMPORTANTE: para mandar o card visual (foto + link), "
                    "chame a tool enviar_card_imovel com este ID."
                )

        return f'Nenhum imovel encontrado com o codigo "{codigo}".'

    # Busca por nome/titulo: traz todos da org e filtra local (tolerante a acento/plural)
    if nome:
        result = await db.select(
            "imoveis",
            columns=CAMPOS_IMOVEL_COMPLETO,
            filters={"organizacao_id": f"eq.{ctx.org_id}"},
            limit=100,
        )
        if not result:
            return f'Nenhum imovel encontrado com o nome "{nome}".'

        nome_norm = _normalize(nome)
        matches = [
            i for i in result
            if nome_norm in _normalize(i.get("titulo")) or
               nome_norm in _normalize(i.get("descricao")) or
               nome_norm in _normalize(i.get("bairro")) or
               nome_norm in _normalize(i.get("cidade"))
        ]
        if not matches:
            return f'Nenhum imovel encontrado com o nome "{nome}".'
        if len(matches) == 1:
            url = await _montar_url_imovel(ctx.org_id, matches[0]["id"])
            return (
                f"Imovel encontrado:\n{_formatar_imovel_completo(matches[0])}\n"
                f"Link do site: {url}\n\n"
                "IMPORTANTE: para mandar o card visual (foto + link), "
                "chame a tool enviar_card_imovel com este ID."
            )
        linhas = [f"- {i.get('titulo','')} (Cod: {i.get('codigo_interno','?')}) — ID: {i.get('id','')}" for i in matches[:5]]
        return f"Encontrei {len(matches)} imoveis:\n" + "\n".join(linhas) + "\n\nUse o ID para buscar os detalhes completos."

    return "Informe o nome, codigo ou ID do imovel para buscar."


def _normalize(s: str | None) -> str:
    """Lowercase + remove acentos + remove S no fim (plural simples)."""
    import unicodedata
    if not s:
        return ""
    txt = unicodedata.normalize("NFD", str(s))
    txt = "".join(c for c in txt if unicodedata.category(c) != "Mn").lower().strip()
    # Remove S/ES final (plural simples: "taibas" -> "taiba", "praias" -> "praia")
    if txt.endswith("s") and len(txt) > 3:
        txt = txt[:-1]
    return txt


async def executar_buscar_imoveis(args: dict, ctx: ToolContext) -> str:
    """Busca imoveis no Supabase. Match local tolerante a acento/plural/case."""
    # Filtros server-side: so o que e exato (org, status, tipo, quartos).
    # Bairro/cidade filtramos local pra ser tolerante a acentos e plural.
    filters: dict[str, str] = {
        "organizacao_id": f"eq.{ctx.org_id}",
        "status": "eq.disponivel",
    }
    if args.get("tipo"):
        filters["tipo"] = f"eq.{args['tipo']}"
    if args.get("quartos_min"):
        filters["quartos"] = f"gte.{args['quartos_min']}"

    result = await db.select(
        "imoveis",
        columns=CAMPOS_IMOVEL_COMPLETO,
        filters=filters,
        order="created_at.desc",
        limit=50,
    )

    if not result:
        return "Nenhum imovel encontrado com esses criterios."

    imoveis = result

    # Match local de bairro/cidade (tolerante a acento/plural/case).
    # Tambem aceita match no titulo e logradouro pra cobrir "praia de taiba" no titulo.
    bairro_q = _normalize(args.get("bairro"))
    cidade_q = _normalize(args.get("cidade"))

    def casa_localidade(im: dict) -> bool:
        if not bairro_q and not cidade_q:
            return True
        campos = [
            _normalize(im.get("bairro")),
            _normalize(im.get("cidade")),
            _normalize(im.get("logradouro")),
            _normalize(im.get("titulo")),
            _normalize(im.get("descricao")),
        ]
        if bairro_q and not any(bairro_q in c for c in campos):
            return False
        if cidade_q and not any(cidade_q in c for c in campos):
            return False
        return True

    imoveis = [i for i in imoveis if casa_localidade(i)]

    # Filtros de preco/finalidade client-side
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
        url = await _montar_url_imovel(ctx.org_id, i["id"])
        linhas.append(
            f"- [{i['id']}] {i.get('titulo','')} (Cod: {cod}) | {i.get('tipo','')} | "
            f"{i.get('bairro','')}, {i.get('cidade','')}-{i.get('estado','')} | "
            f"{preco} | {quartos}q/{suites}s/{banheiros}b/{vagas}v | "
            f"{area_t}m2 total, {area_c}m2 constr.{cond} | {url}"
        )

    return (
        f"Encontrei {len(imoveis)} imovel(is):\n"
        + "\n".join(linhas)
        + "\n\nIMPORTANTE: pra mandar um card visual rico (foto + link) de QUALQUER um, "
        "chame a tool enviar_card_imovel com o ID. Muito mais bonito que descrever em texto."
    )


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
# Tool: enviar card visual rico do imovel via WhatsApp (foto + link)
# ============================================================


async def executar_enviar_card_imovel(args: dict, ctx: ToolContext) -> str:
    """Envia card visual (foto + caption rica + link site) direto pro cliente."""
    imovel_id = args.get("imovel_id")
    if not imovel_id:
        return "Erro: imovel_id eh obrigatorio."

    if not ctx.api_url or not ctx.token:
        return "Erro: credenciais Uazapi nao disponiveis no contexto."

    # Buscar imovel + fotos
    imovel = await db.select(
        "imoveis",
        columns=f"{CAMPOS_IMOVEL_COMPLETO},imovel_fotos(url,ordem,eh_capa)",
        filters={"organizacao_id": f"eq.{ctx.org_id}", "id": f"eq.{imovel_id}"},
        single=True,
    )
    if not imovel:
        return f"Erro: imovel {imovel_id} nao encontrado."

    fotos = imovel.get("imovel_fotos") or []
    fotos_ordenadas = sorted(fotos, key=lambda f: (not f.get("eh_capa"), f.get("ordem", 0)))
    foto_capa = next((f for f in fotos if f.get("eh_capa")), None)
    if not foto_capa and fotos_ordenadas:
        foto_capa = fotos_ordenadas[0]
    # Fotos extras (excluindo a capa) - ate 3 mais
    extras = [f for f in fotos_ordenadas if foto_capa is None or f.get("url") != foto_capa.get("url")]
    fotos_extras_urls = [f["url"] for f in extras[:3] if f.get("url")]

    url = await _montar_url_imovel(ctx.org_id, imovel_id)

    # Montar caption rica
    valor = imovel.get("valor")
    valor_aluguel = imovel.get("valor_aluguel")
    if valor:
        preco = f"💰 R$ {float(valor):,.0f}".replace(",", ".")
    elif valor_aluguel:
        preco = f"💰 R$ {float(valor_aluguel):,.0f}/mes".replace(",", ".")
    else:
        preco = "💰 Sob consulta"

    endereco = ", ".join(filter(None, [
        imovel.get("bairro"), imovel.get("cidade"), imovel.get("estado")
    ]))

    quartos = imovel.get("quartos") or 0
    suites = imovel.get("suites") or 0
    suites_txt = f" ({suites} suite)" if suites else ""
    area_txt = (
        f"{imovel['area_total']}m² totais"
        if imovel.get("area_total")
        else "area sob consulta"
    )

    # Caption do card (sem o link — o link vira botao CTA)
    caption_sem_link = (
        f"🏡 *{imovel.get('titulo','')}*\n"
        f"📍 {endereco}\n"
        f"{preco}\n\n"
        f"🛏 {quartos} quarto(s){suites_txt}\n"
        f"🚿 {imovel.get('banheiros',0)} banheiro(s)\n"
        f"🚗 {imovel.get('vagas',0)} vaga(s)\n"
        f"📐 {area_txt}"
    )
    # Caption com link no texto (fallback se botao falhar)
    caption = f"{caption_sem_link}\n\n🔗 Veja mais fotos e detalhes:\n{url}"

    # Buscar message_id da ultima mensagem do cliente pra responder (efeito reply)
    ultima_msg = await db.select(
        "mensagens_whatsapp",
        columns="message_id_whatsapp",
        filters={
            "conversa_id": f"eq.{ctx.conversa_id}",
            "direcao": "eq.recebida",
        },
        order="criado_em.desc",
        limit=1,
        single=True,
    )
    reply_id = (ultima_msg or {}).get("message_id_whatsapp")

    # Enviar via Uazapi
    from agente.services import whatsapp

    try:
        enviado_como_botao = False
        if foto_capa and foto_capa.get("url"):
            # Carrossel: capa com info completa + ate 3 fotos extras + 2 botoes
            intro = (args.get("intro_text") or "").strip()[:300]
            codigo = imovel.get("codigo_interno") or imovel_id[:8]
            titulo_curto = (imovel.get("titulo") or "").split(",")[0][:50]
            interest_reply = f"Tenho interesse no imovel {codigo}"
            if titulo_curto:
                interest_reply = f"Tenho interesse: {titulo_curto} ({codigo})"

            enviado_como_botao = await whatsapp.send_property_carousel(
                ctx.api_url, ctx.token, ctx.numero_cliente,
                cover_image=foto_capa["url"],
                extra_images=fotos_extras_urls,
                caption=caption_sem_link,
                button_text="Ver no site",
                button_url=url,
                interest_reply=interest_reply,
                intro_text=intro,
            )
            if not enviado_como_botao:
                # Fallback: media simples com URL no texto
                await whatsapp.send_media(
                    ctx.api_url, ctx.token, ctx.numero_cliente,
                    foto_capa["url"], media_type="image", caption=caption,
                    reply_id=reply_id,
                )
        else:
            await whatsapp.send_text(
                ctx.api_url, ctx.token, ctx.numero_cliente, caption,
                reply_id=reply_id,
            )

        # Salvar mensagem no banco (registro)
        await db.salvar_mensagem(
            ctx.conversa_id, ctx.org_id, "enviada",
            caption_sem_link if enviado_como_botao else caption,
            tipo_conteudo="imagem" if foto_capa else "texto",
        )

        return (
            f"Card do imovel '{imovel.get('titulo','')}' enviado com foto e link "
            "pro cliente. NAO repita esses dados em texto — pergunte apenas "
            "se ele tem interesse ou quer ver mais opcoes."
        )
    except Exception as e:
        logger.error(f"[enviar_card_imovel] Erro: {e}", exc_info=True)
        return f"Erro ao enviar card: {e}. Tente passar os detalhes por texto."


# ============================================================
# Dispatcher
# ============================================================

async def executar_enviar_audio(args: dict, ctx: ToolContext) -> str:
    """Gera audio TTS do texto e envia como mensagem de voz (PTT)."""
    texto = (args.get("texto") or "").strip()
    if not texto:
        return "Erro: texto vazio. Nao enviei audio."
    # Limitar pra audio nao ficar absurdo
    texto = texto[:500]

    from agente.services import tts as tts_service
    from agente.services import whatsapp

    audio_b64 = await tts_service.gerar_audio_base64(texto)
    if not audio_b64:
        return "Erro: nao consegui gerar o audio agora. Responda por texto."

    # Buscar reply_id da ultima msg do cliente (efeito reply)
    ultima = await db.select(
        "mensagens_whatsapp",
        columns="message_id_whatsapp",
        filters={"conversa_id": f"eq.{ctx.conversa_id}", "direcao": "eq.recebida"},
        order="criado_em.desc",
        limit=1,
        single=True,
    )
    reply_id = (ultima or {}).get("message_id_whatsapp")

    ok = await whatsapp.send_voice_note(
        ctx.api_url, ctx.token, ctx.numero_cliente,
        audio_data=audio_b64,
        reply_id=reply_id,
    )
    if not ok:
        return "Erro: o WhatsApp recusou o audio. Responda por texto."

    # Registra no banco como mensagem de audio enviada
    await db.salvar_mensagem(
        ctx.conversa_id, ctx.org_id, "enviada",
        f"[audio: {texto[:120]}]",
        tipo_conteudo="audio",
    )

    return (
        "Audio enviado pro cliente com sucesso. NAO repita esse mesmo conteudo "
        "em texto agora — o cliente acabou de ouvir. Continue a conversa "
        "normalmente esperando a resposta dele."
    )


_EXECUTORES = {
    "buscar_imovel_por_identificacao": executar_buscar_imovel_por_identificacao,
    "buscar_imoveis": executar_buscar_imoveis,
    "enviar_card_imovel": executar_enviar_card_imovel,
    "enviar_audio": executar_enviar_audio,
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
