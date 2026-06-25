"""Formatador de imovel — FONTE UNICA de formatacao de comodos (anti dado-lixo).

Regra central: quarto/suite/banheiro/vaga so aparecem quando o valor e > 0.
Terreno, lote e loteamento NUNCA exibem comodos — nao existe
"0 quarto / 0 banheiro / 0 vaga" num terreno.

Espelha src/lib/whatsapp/formatador-imovel.ts (versao TypeScript do mesmo agente).
"""

from __future__ import annotations

# Tipos de imovel que nao possuem comodos (sao area pura)
TIPOS_SEM_COMODOS = {"terreno", "lote", "loteamento"}


def _num_positivo(v) -> int | float | None:
    """Converte valor desconhecido em numero positivo, ou None se 0/vazio/invalido."""
    try:
        n = float(v)
    except (TypeError, ValueError):
        return None
    if n > 0:
        return int(n) if n == int(n) else n
    return None


def eh_imovel_sem_comodos(tipo) -> bool:
    """True se o imovel e terreno/lote/loteamento (nunca mostra comodos)."""
    return str(tipo or "").strip().lower() in TIPOS_SEM_COMODOS


def linhas_comodos_card(i: dict) -> list[str]:
    """Linhas de comodos para o CARD do WhatsApp (com emoji).

    Retorna [] para terreno/lote ou quando todos os campos sao 0/vazios.
    """
    if eh_imovel_sem_comodos(i.get("tipo")):
        return []
    q = _num_positivo(i.get("quartos"))
    s = _num_positivo(i.get("suites"))
    b = _num_positivo(i.get("banheiros"))
    v = _num_positivo(i.get("vagas"))
    linhas: list[str] = []
    if q:
        suite_txt = f" ({s} suite{'s' if s > 1 else ''})" if s else ""
        linhas.append(f"🛏 {q} quarto{'s' if q > 1 else ''}{suite_txt}")
    elif s:
        # Imovel cadastrado so com suite (sem quartos) ainda mostra os dormitorios
        linhas.append(f"🛏 {s} suite{'s' if s > 1 else ''}")
    if b:
        linhas.append(f"🚿 {b} banheiro{'s' if b > 1 else ''}")
    if v:
        linhas.append(f"🚗 {v} vaga{'s' if v > 1 else ''}")
    return linhas


def linhas_comodos_ficha(i: dict) -> list[str]:
    """Linhas de comodos para a FICHA TEXTO que vai pro modelo (rotuladas).

    Retorna [] para terreno/lote ou quando todos os campos sao 0/vazios.
    """
    if eh_imovel_sem_comodos(i.get("tipo")):
        return []
    q = _num_positivo(i.get("quartos"))
    s = _num_positivo(i.get("suites"))
    b = _num_positivo(i.get("banheiros"))
    v = _num_positivo(i.get("vagas"))
    linhas: list[str] = []
    if q:
        linhas.append(f"Quartos: {q}")
    if s:
        linhas.append(f"Suites: {s}")
    if b:
        linhas.append(f"Banheiros: {b}")
    if v:
        linhas.append(f"Vagas: {v}")
    return linhas


def comodos_compacto(i: dict) -> str:
    """Resumo compacto de comodos para listagem: "3q/1s/2b/2v".

    Retorna "" para terreno/lote ou quando nao ha comodos.
    """
    if eh_imovel_sem_comodos(i.get("tipo")):
        return ""
    q = _num_positivo(i.get("quartos"))
    s = _num_positivo(i.get("suites"))
    b = _num_positivo(i.get("banheiros"))
    v = _num_positivo(i.get("vagas"))
    partes: list[str] = []
    if q:
        partes.append(f"{q}q")
    if s:
        partes.append(f"{s}s")
    if b:
        partes.append(f"{b}b")
    if v:
        partes.append(f"{v}v")
    return "/".join(partes)
