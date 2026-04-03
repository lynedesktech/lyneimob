"""Modelo de segmento de mensagem de saida."""

from pydantic import BaseModel


class ParsedSegment(BaseModel):
    type: str = "texto"  # texto, imagem, pdf, video
    output: str = ""
