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
