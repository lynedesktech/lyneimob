"""Prompts do agente de campanha Carol — Guaruja Condominium (Duna)."""

from .agent_config import AGENT_CONFIG
from .faq import FAQ
from .knowledge import CONHECIMENTO_GUARUJA, EMPREENDIMENTO, FORA_DO_CONHECIMENTO
from .objections import OBJECTIONS
from .system_prompt import montar_prompt_campanha
from .variations import VARIATIONS, get_variation

__all__ = [
    "AGENT_CONFIG",
    "FAQ",
    "CONHECIMENTO_GUARUJA",
    "EMPREENDIMENTO",
    "FORA_DO_CONHECIMENTO",
    "OBJECTIONS",
    "montar_prompt_campanha",
    "VARIATIONS",
    "get_variation",
]
