"""Sanitizacao de texto — remove metadata tecnico preservando conteudo do usuario."""

from __future__ import annotations

import re


def sanitize_text(text: str) -> str:
    """Limpa texto de metadata tecnico sem destruir conteudo legitimo."""
    if not isinstance(text, str) or not text.strip():
        return ""

    result = text

    result = re.sub(r'"response_metadata"\s*:\s*\{[^}]*\}', "", result)
    result = re.sub(r'"additional_kwargs"\s*:\s*\{[^}]*\}', "", result)
    result = re.sub(r'"tool_calls"\s*:\s*\[\s*\]', "", result)
    result = re.sub(r'"invalid_tool_calls"\s*:\s*\[\s*\]', "", result)
    result = re.sub(r'"type"\s*:\s*"(ai|human)"', "", result)

    result = re.sub(r"[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]", "", result)

    result = re.sub(r"\s+", " ", result).strip()

    return result
