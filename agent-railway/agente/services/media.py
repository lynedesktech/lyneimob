"""Processamento de midia: audio (Whisper), imagem (Claude vision), documentos (PDF/Word)."""

from __future__ import annotations

import base64
import io
import logging
import tempfile
from pathlib import Path

import httpx
from anthropic import AsyncAnthropic
from openai import AsyncOpenAI

from agente.config import settings

logger = logging.getLogger(__name__)

_openai: AsyncOpenAI | None = None
_anthropic: AsyncAnthropic | None = None


def _get_openai() -> AsyncOpenAI:
    global _openai
    if _openai is None:
        _openai = AsyncOpenAI(api_key=settings.openai_api_key)
    return _openai


def _get_anthropic() -> AsyncAnthropic:
    global _anthropic
    if _anthropic is None:
        _anthropic = AsyncAnthropic(api_key=settings.anthropic_api_key)
    return _anthropic


async def download_file(url: str, timeout: int = 30) -> bytes:
    async with httpx.AsyncClient(timeout=timeout) as client:
        resp = await client.get(url)
        resp.raise_for_status()
        return resp.content


async def download_media_from_uazapi(
    api_url: str, token: str, message_id_full: str
) -> dict:
    """Obtem link da midia via UAZAPI /message/download."""
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            f"{api_url}/message/download",
            headers={"token": token, "Content-Type": "application/json"},
            json={"id": message_id_full, "return_link": True},
        )
        resp.raise_for_status()
        return resp.json()


async def transcribe_audio(api_url: str, token: str, message_id_full: str) -> str:
    """Baixa audio do UAZAPI e transcreve com Whisper."""
    tmp_path = None
    try:
        data = await download_media_from_uazapi(api_url, token, message_id_full)
        file_url = data.get("fileURL", "")
        if not file_url:
            return "[audio nao disponivel]"

        audio_bytes = await download_file(file_url)

        suffix = ".ogg"
        if ".mp3" in file_url.lower():
            suffix = ".mp3"
        elif ".m4a" in file_url.lower():
            suffix = ".m4a"

        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name

        client = _get_openai()
        with open(tmp_path, "rb") as audio_file:
            transcript = await client.audio.transcriptions.create(
                model=settings.whisper_model,
                file=audio_file,
            )

        return transcript.text or "[audio vazio]"

    except Exception as e:
        logger.error(f"Erro ao transcrever audio: {e}")
        return "[nao consegui ouvir o audio, pode enviar por texto?]"
    finally:
        if tmp_path:
            Path(tmp_path).unlink(missing_ok=True)


async def analyze_image(api_url: str, token: str, message_id_full: str) -> str:
    """Baixa imagem do UAZAPI e analisa com Claude Haiku 4.5 vision."""
    try:
        data = await download_media_from_uazapi(api_url, token, message_id_full)
        file_url = data.get("fileURL", "")
        if not file_url:
            return "[imagem nao disponivel]"

        img_bytes = await download_file(file_url)
        b64 = base64.b64encode(img_bytes).decode("utf-8")

        mime = "image/jpeg"
        lower_url = file_url.lower()
        if ".png" in lower_url:
            mime = "image/png"
        elif ".webp" in lower_url:
            mime = "image/webp"
        elif ".gif" in lower_url:
            mime = "image/gif"

        client = _get_anthropic()
        response = await client.messages.create(
            model=settings.anthropic_model_default,  # Haiku 4.5 — vision bom + barato
            max_tokens=500,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": mime,
                                "data": b64,
                            },
                        },
                        {
                            "type": "text",
                            "text": (
                                "Voce e uma assistente imobiliaria cearense. Analise esta "
                                "imagem em portugues brasileiro de forma objetiva e concisa. "
                                "Se for foto de imovel, destaque o tipo, comodo, acabamento "
                                "e estado de conservacao. Se for documento, extraia o texto "
                                "relevante. Se nao for nenhum dos dois, descreva brevemente."
                            ),
                        },
                    ],
                }
            ],
        )

        # Anthropic retorna content como lista de blocos
        for block in response.content:
            if block.type == "text":
                return block.text or "[nao consegui analisar a imagem]"
        return "[nao consegui analisar a imagem]"

    except Exception as e:
        logger.error(f"Erro ao analisar imagem: {e}")
        return "[nao consegui analisar a imagem]"


def _extract_pdf_text(pdf_bytes: bytes, max_chars: int = 5000) -> str:
    try:
        from PyPDF2 import PdfReader

        reader = PdfReader(io.BytesIO(pdf_bytes))
        pages = []
        for page in reader.pages:
            text = page.extract_text()
            if text:
                pages.append(text)
        text = "\n".join(pages).strip()
        return text[:max_chars] if text else "[PDF sem texto extraivel]"
    except Exception as e:
        logger.error(f"Erro ao extrair PDF: {e}")
        return "[erro ao processar PDF]"


def _extract_docx_text(docx_bytes: bytes, max_chars: int = 5000) -> str:
    try:
        from docx import Document

        doc = Document(io.BytesIO(docx_bytes))
        text = "\n".join(p.text for p in doc.paragraphs if p.text.strip())
        return text[:max_chars] if text else "[documento Word vazio]"
    except Exception as e:
        logger.error(f"Erro ao extrair DOCX: {e}")
        return "[erro ao processar documento Word]"


async def extract_document_text(
    api_url: str, token: str, message_id_full: str
) -> str:
    """Baixa documento do UAZAPI e extrai texto."""
    try:
        data = await download_media_from_uazapi(api_url, token, message_id_full)
        file_url = data.get("fileURL", "")
        if not file_url:
            return "[documento nao disponivel]"

        doc_bytes = await download_file(file_url)
        lower_url = file_url.lower()

        if lower_url.endswith(".pdf"):
            return _extract_pdf_text(doc_bytes)
        elif lower_url.endswith(".docx"):
            return _extract_docx_text(doc_bytes)
        else:
            text = _extract_pdf_text(doc_bytes)
            if "[erro" not in text and "[PDF sem" not in text:
                return text
            try:
                return doc_bytes.decode("utf-8", errors="ignore")[:5000]
            except Exception:
                return "[formato de documento nao suportado]"

    except Exception as e:
        logger.error(f"Erro ao processar documento: {e}")
        return "[erro ao processar documento]"


async def process_media(
    content_type: str,
    content: str,
    api_url: str,
    token: str,
    message_id_full: str,
) -> str:
    """Processa midia conforme o tipo e retorna texto unificado."""
    if content_type == "audio":
        return await transcribe_audio(api_url, token, message_id_full)

    elif content_type == "image":
        analysis = await analyze_image(api_url, token, message_id_full)
        if content and content.strip():
            return f"{content}\n\n[Analise da imagem: {analysis}]"
        return analysis

    elif content_type == "document":
        doc_text = await extract_document_text(api_url, token, message_id_full)
        if content and content.strip():
            return f"{content}\n\n[Conteudo do documento:\n{doc_text}]"
        return f"[Conteudo do documento:\n{doc_text}]"

    elif content_type == "text":
        return content

    else:
        logger.warning(f"Tipo de conteudo nao suportado: {content_type}")
        return content or "[tipo de mensagem nao suportado]"
