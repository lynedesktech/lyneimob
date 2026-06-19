"""Modelo de dados da mensagem recebida via webhook UAZAPI."""

from pydantic import BaseModel


class WebhookMessage(BaseModel):
    message_id: str
    message_id_full: str = ""
    chat_id: str
    content_type: str  # text, audio, image, document
    content: str
    timestamp: int = 0
    nome: str = ""
    image_url: str = ""
    audio_url: str = ""
    document_url: str = ""
    video_url: str = ""
    api_url: str = ""
    token: str = ""
    instancia: str = ""
    from_me: bool = False
    was_sent_by_api: bool = False
    message_type: str = ""
    # Reply / citacao: quando user responde citando outra mensagem
    quoted_message_id: str = ""
    quoted_content: str = ""
    # Click-to-WhatsApp Ad (Meta/Instagram/Facebook)
    # Quando a primeira mensagem vem de um anuncio, esses campos sao preenchidos
    ad_title: str = ""           # Ex: "Condominio Guaruja em Caucaia/CE"
    ad_body: str = ""            # Corpo do anuncio
    ad_source_id: str = ""       # ID do anuncio na Meta
    ad_source_url: str = ""      # URL do anuncio
    ad_source_type: str = ""     # "ad", "post"
    ad_media_type: str = ""      # image/video
