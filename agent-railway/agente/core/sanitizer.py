"""Sanitizacao de texto — remove metadata tecnico preservando conteudo do usuario.

Inclui tambem a sanitizacao do NOME do contato (pushName do WhatsApp): o nome
do perfil pode ser qualquer coisa ("Deus", emoji, empresa, papel "Vendedor"),
e o agente nao pode chamar o cliente por isso. Espelha
src/lib/whatsapp/nome-contato.ts (versao TypeScript do mesmo agente).
"""

from __future__ import annotations

import re
import unicodedata


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


# ============================================================
# Sanitizacao do nome do contato (pushName do WhatsApp)
# ============================================================

# Palavras que nao sao nome de pessoa (comparadas sem acento, minusculas, token exato)
_NOMES_INVALIDOS = {
    # religioso / afetivo / placeholder
    "deus", "jesus", "cristo", "nossa", "senhora",
    "amor", "vida", "nenem", "bb", "bebe",
    "cliente", "comprador", "contato", "lead", "interessado",
    "teste", "test", "testando",
    "eu", "eumesmo", "fulano", "ciclano", "beltrano",
    "anonimo", "desconhecido", "ninguem",
    "none", "null", "undefined", "na", "sem", "nome",
    "whatsapp", "zap", "wpp",
    # papel / funcao (pushName comercial)
    "vendedor", "vendedora", "atendimento", "atendente", "suporte", "sac",
    "recepcao", "financeiro", "comercial", "gerente", "diretor", "diretora",
    "secretaria", "plantao", "loja", "patrao", "chefe", "adm", "admin",
    # parentesco / apelido afetivo
    "crush", "pai", "mae", "filho", "filha", "vovo", "tia", "tio",
    "sogra", "sogro", "marido", "esposa", "namorado", "namorada",
}

# Marcadores de empresa (comparados por TOKEN EXATO contra o primeiro nome)
_PALAVRAS_EMPRESA = {
    "imoveis", "imovel", "imobiliaria", "imobiliario", "imob",
    "ltda", "eireli", "mei", "construtora", "incorporadora",
    "corretor", "corretora", "consultoria", "negocios", "negocio",
    "realty", "broker", "urbanismo", "empreendimento",
}

# Particulas de sobrenome que as vezes vem como primeiro token
_PARTICULAS = {"de", "da", "do", "dos", "das", "del", "della", "mc", "mac", "van", "von"}


def _sem_acento(s: str) -> str:
    """Remove acentos/marcas para comparacao."""
    return "".join(
        c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn"
    )


def _capitalizar(s: str) -> str:
    """Capitaliza cada segmento (espaco, hifen, apostrofo): 'ana-maria' -> 'Ana-Maria'."""
    out: list[str] = []
    cap_next = True
    for ch in s.lower():
        if cap_next and ch.isalpha():
            out.append(ch.upper())
            cap_next = False
        else:
            out.append(ch)
        cap_next = ch in " -'"
    return "".join(out)


def extrair_primeiro_nome_valido(nome_bruto) -> str | None:
    """Extrai um primeiro nome plausivel do pushName/nome bruto do contato.

    Devolve o nome capitalizado, ou None quando nao e nome de pessoa
    ("Deus", emoji, numero, empresa, papel "Vendedor", particula).
    Avalia SEMPRE o primeiro token, por igualdade exata (nunca substring,
    pra nao queimar nomes reais como "Meire"/"Meirelles").
    """
    if not nome_bruto or not isinstance(nome_bruto, str):
        return None

    # Mantem so letras (com acento), espaco, hifen e apostrofo
    limpo = "".join(
        ch if (unicodedata.category(ch).startswith("L") or ch in " -'") else " "
        for ch in nome_bruto
    )
    limpo = re.sub(r"\s+", " ", limpo).strip()
    if not limpo:
        return None

    primeiro = limpo.split(" ")[0]
    if len(primeiro) < 2:
        return None

    chave = _sem_acento(primeiro).lower()
    if chave in _NOMES_INVALIDOS or chave in _PALAVRAS_EMPRESA or chave in _PARTICULAS:
        return None

    return _capitalizar(primeiro)
