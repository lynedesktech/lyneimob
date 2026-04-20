"""Formatador de mensagens — divide resposta do agente em segmentos enviaveis."""

from __future__ import annotations

import re

from agente.models.segments import ParsedSegment

MAX_SEGMENT_LENGTH = 500


def parse_output(output: str) -> list[ParsedSegment]:
    """Divide a saida do agente em segmentos para envio pelo WhatsApp.

    Prioriza split por '---' em linha propria (delimitador explicito da IA,
    usado pra fragmentar mensagens em blocos curtos). Se nao encontrar '---',
    cai no split por paragrafo duplo (\\n\\n) como fallback.
    """
    if not output or not output.strip():
        return []

    segments: list[ParsedSegment] = []

    # Prioridade 1: split por --- em linha propria (delimitador explicito da IA)
    if re.search(r"(^|\n)\s*---\s*(\n|$)", output):
        paragraphs = re.split(r"(?:^|\n)\s*---\s*(?:\n|$)", output.strip())
    else:
        # Fallback: split por paragrafo duplo
        paragraphs = re.split(r"\n\n+", output.strip())

    for para in paragraphs:
        para = para.strip()
        if not para:
            continue

        # Detectar URLs de midia
        url_match = re.match(r"^(https?://\S+)$", para)
        if url_match:
            url = url_match.group(1).lower()
            seg_type = _detect_url_type(url)
            segments.append(ParsedSegment(type=seg_type, output=para))
            continue

        # Paragrafo curto: enviar direto
        if len(para) <= MAX_SEGMENT_LENGTH:
            segments.append(ParsedSegment(type="texto", output=para))
            continue

        # Paragrafo longo: dividir por frases
        sentences = re.split(r"(?<=[.!?])\s+", para)
        current = ""

        for sentence in sentences:
            if current and len(current) + len(sentence) + 1 > MAX_SEGMENT_LENGTH:
                segments.append(
                    ParsedSegment(type="texto", output=current.strip())
                )
                current = sentence
            else:
                current = f"{current} {sentence}".strip() if current else sentence

        if current.strip():
            segments.append(ParsedSegment(type="texto", output=current.strip()))

    if not segments and output.strip():
        segments.append(ParsedSegment(type="texto", output=output.strip()))

    return segments


def _detect_url_type(url: str) -> str:
    """Detecta tipo de midia pela extensao da URL."""
    lower = url.lower()
    if re.search(r"\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?$", lower):
        return "imagem"
    if re.search(r"\.(pdf)(\?.*)?$", lower):
        return "pdf"
    if re.search(r"\.(mp4|avi|mov|wmv|flv|mkv|webm|m4v|3gp)(\?.*)?$", lower):
        return "video"
    return "texto"
