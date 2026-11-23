import logging
from django.conf import settings
from google import genai

logger = logging.getLogger(__name__)


def get_gemini_client():
    """Ініціалізація та повернення клієнта Google GenAI SDK."""
    api_key = getattr(settings, "GEMINI_API_KEY", "")
    if not api_key:
        logger.warning("GEMINI_API_KEY не налаштовано в settings або .env файлі.")
    return genai.Client(api_key=api_key)
