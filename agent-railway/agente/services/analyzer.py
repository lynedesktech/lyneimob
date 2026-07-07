"""Analisador de qualidade das respostas da agente IA.

Roda apos a agente responder e detecta violacoes das regras do Angelo (Duna):
- Uso de "tu/ti/teu" (so "voce" e permitido)
- Mencao a cidades fora do portfolio (Jericoacoara, Cumbuco, etc)
- Frases banidas ("to aqui se precisar", "lembrei de voce", etc)
- Aberturas de bot ("Claro!", "Otimo!", "Perfeito!")
- Pediu codigo do imovel quando lead veio de anuncio Meta
- Texto longo demais
- Emojis em excesso
"""

from __future__ import annotations

import logging
import re

logger = logging.getLogger("lyneimob-agent")


CIDADES_FORA_PORTFOLIO = [
    "jericoacoara",
    "jeri",
    "cumbuco",
    "canoa quebrada",
    "beberibe",
    "praia do futuro",
    "aquiraz",
    "porto das dunas",
    "morro branco",
    "fleixeiras",
    "guajiru",
    "paracuru",
    "lagoinha",
]

FRASES_BANIDAS = [
    "to aqui se precisar",
    "tô aqui se precisar",
    "estou aqui se precisar",
    "estou disponivel",
    "estou disponível",
    "lembrei de voce",
    "lembrei de você",
    "como esta o seu dia",
    "como está o seu dia",
    "tudo certo por ai",
    "tudo certo por aí",
    "fica a vontade pra retomar",
    "fica à vontade pra retomar",
    "estava pensando em voce",
    "estava pensando em você",
    "passei pra saber",
    "recebi seu audio",
    "recebi seu áudio",
    "vou verificar com a equipe",
    "vou te retornar em breve",
]

ABERTURAS_PROIBIDAS = [
    "claro!",
    "ótimo!",
    "otimo!",
    "perfeito!",
    "excelente!",
    "perfeito,",
    "claro,",
    "otimo,",
    "ótimo,",
]

# Pronomes proibidos: precisa ser palavra inteira pra nao pegar
# "atuar", "atual", "atu...", "tubarao", etc.
PADROES_TU = [
    (r"\btu\b", "tu"),
    (r"\bti\b", "ti"),
    (r"\bteu\b", "teu"),
    (r"\bteus\b", "teus"),
    (r"\btua\b", "tua"),
    (r"\btuas\b", "tuas"),
    (r"\bcontigo\b", "contigo"),
]


def _conta_emojis(texto: str) -> int:
    """Conta emojis no texto (faixa Unicode comum)."""
    padrao = re.compile(
        "["
        "\U0001F300-\U0001F9FF"
        "\U0001FA00-\U0001FAFF"
        "☀-➿"
        "]"
    )
    return len(padrao.findall(texto))


def analisar_resposta(mensagem: str, contexto: dict | None = None) -> list[dict]:
    """Retorna lista de violacoes encontradas. Vazia se tudo OK.

    contexto pode conter:
    - origem_lead: 'whatsapp', 'anuncio_meta', 'portal', 'site'
    - imovel_interesse_id: id do imovel mencionado no contexto
    """
    if not mensagem or not mensagem.strip():
        return []
    contexto = contexto or {}
    msg_lower = mensagem.lower()
    violacoes: list[dict] = []

    # 1. Pronomes "tu/ti/teu" — ALTA severidade (regra inegociavel Angelo)
    for padrao, label in PADROES_TU:
        if re.search(padrao, msg_lower):
            violacoes.append({
                "tipo": "pronome_tu",
                "severidade": "alta",
                "detalhe": f"Usou '{label}' (regra Angelo: SEMPRE 'voce')",
            })
            break

    # 2. Cidades fora do portfolio — ALTA
    # Excecao: no modo campanha Guaruja, "Cumbuco" e mencao legitima —
    # a landing page oficial vende "a 12 km da Praia do Cumbuco".
    modo_guaruja = bool(contexto.get("modo_guaruja"))
    for cidade in CIDADES_FORA_PORTFOLIO:
        if cidade == "cumbuco" and modo_guaruja:
            continue
        if re.search(rf"\b{re.escape(cidade)}\b", msg_lower):
            violacoes.append({
                "tipo": "cidade_fora",
                "severidade": "alta",
                "detalhe": f"Mencionou '{cidade}' (fora do portfolio Duna — so Taiba e Caucaia)",
            })
            break

    # 3. Frases banidas pelo Angelo — MEDIA
    for frase in FRASES_BANIDAS:
        if frase in msg_lower:
            violacoes.append({
                "tipo": "frase_banida",
                "severidade": "media",
                "detalhe": f"Frase banida: '{frase}'",
            })
            break

    # 4. Aberturas tipo bot — MEDIA
    msg_inicio = msg_lower.lstrip()[:20]
    for ab in ABERTURAS_PROIBIDAS:
        if msg_inicio.startswith(ab):
            violacoes.append({
                "tipo": "abertura_bot",
                "severidade": "media",
                "detalhe": f"Comecou com '{ab}' (soa bot generico)",
            })
            break

    # 5. Pediu codigo / perguntou o que procura quando lead veio de anuncio — ALTA
    origem = (contexto.get("origem_lead") or "").lower()
    if origem == "anuncio_meta":
        if re.search(r"(codigo|código|nome).{0,30}(imovel|imóvel|empreendimento)", msg_lower):
            violacoes.append({
                "tipo": "pediu_codigo_em_anuncio",
                "severidade": "alta",
                "detalhe": "Pediu codigo/nome do imovel apesar do lead ter vindo de anuncio Meta",
            })
        if "o que voce procura" in msg_lower or "o que você procura" in msg_lower:
            violacoes.append({
                "tipo": "pergunta_redundante_anuncio",
                "severidade": "alta",
                "detalhe": "Perguntou 'o que voce procura' — lead JA veio de anuncio especifico",
            })

    # 6. Texto longo — BAIXA (verifica por segmento separado por ---)
    for segmento in mensagem.split("---"):
        seg_clean = segmento.strip()
        if len(seg_clean) > 600:
            violacoes.append({
                "tipo": "texto_longo",
                "severidade": "baixa",
                "detalhe": f"Segmento com {len(seg_clean)} chars (max recomendado ~400)",
            })
            break

    # 7. Emojis em excesso — BAIXA
    n_emojis = _conta_emojis(mensagem)
    if n_emojis > 2:
        violacoes.append({
            "tipo": "emoji_excesso",
            "severidade": "baixa",
            "detalhe": f"{n_emojis} emojis (cliente alto padrao estranha emoji em excesso)",
        })

    # 8. Travessao em frases — BAIXA (proibido no prompt)
    if "—" in mensagem:
        violacoes.append({
            "tipo": "travessao",
            "severidade": "baixa",
            "detalhe": "Usou travessao (—) — proibido pelo prompt (pessoas reais nao usam no WhatsApp)",
        })

    if violacoes:
        logger.info(
            f"[ANALYZER] {len(violacoes)} violacao(oes) detectada(s): "
            f"{[v['tipo'] for v in violacoes]}"
        )

    return violacoes
