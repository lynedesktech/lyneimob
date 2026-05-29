"""Configuracao centralizada via variaveis de ambiente."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):

    # --- OpenAI (Whisper continua aqui — Anthropic nao tem STT) ---
    openai_api_key: str = ""
    openai_model: str = "gpt-4.1-mini"  # fallback, nao mais usado no agente
    whisper_model: str = "whisper-1"
    vision_model: str = "gpt-4o-mini"  # fallback, vision migrou pra Claude

    # --- ElevenLabs (TTS premium PT-BR) ---
    elevenlabs_api_key: str = ""
    elevenlabs_voice_id: str = "GDzHdQOi6jjf8zaXhCYD"  # Raquel - Expressive PT-BR
    elevenlabs_model: str = "eleven_multilingual_v2"

    # --- Anthropic (Claude) — LLM principal do agente ---
    anthropic_api_key: str = ""
    # Modelo padrao: Sonnet 4.6 — necessario pra conversa natural cearense.
    # Haiku eh seco demais pra carregar a persona com calor.
    anthropic_model_default: str = "claude-sonnet-4-6"
    # Modelo complexo: tambem Sonnet (poderia escalar pra Opus se precisar)
    anthropic_model_complex: str = "claude-sonnet-4-6"

    # --- Redis ---
    redis_url: str = "redis://localhost:6379"

    # --- Servidor ---
    host: str = "0.0.0.0"
    port: int = 8000

    # --- UAZAPI ---
    uazapi_default_url: str = ""
    uazapi_default_token: str = ""

    # --- Supabase ---
    supabase_url: str = ""
    supabase_service_key: str = ""  # Service role key (bypassa RLS)

    # --- Next.js (Vercel) — callback pra criar cliente/negócio ---
    nextjs_app_url: str = ""  # URL do app Next.js (ex: https://lyneimob.vercel.app)
    # LYNEDES-148: secret dedicado pra auth dos endpoints internos do Next.js.
    # Quando vazio, fallback pra supabase_service_key (compat temporaria).
    internal_api_secret: str = ""

    # --- Buffer (agrupamento de mensagens) ---
    buffer_wait_seconds: int = 20
    buffer_ttl_seconds: int = 300

    # --- Bloqueio (quando humano responde manualmente) ---
    block_ttl_seconds: int = 2_592_000  # 30 dias

    # --- Memoria de conversa ---
    memory_context_window: int = 30
    memory_ttl_seconds: int = 604_800  # 7 dias

    # --- Anti-bloqueio Meta/WhatsApp ---
    rate_limit_per_contact_per_minute: int = 8
    rate_limit_global_per_minute: int = 60
    min_delay_between_segments: float = 1.0
    max_delay_between_segments: float = 3.0
    typing_indicator_min_ms: int = 1500
    typing_indicator_max_ms: int = 6000
    cooldown_after_burst_seconds: float = 5.0
    burst_threshold: int = 5
    max_queue_size: int = 100
    min_session_gap_seconds: float = 2.0

    # --- Horario de funcionamento ---
    business_hours_start: int = 7
    business_hours_end: int = 19
    business_hours_enabled: bool = False

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
