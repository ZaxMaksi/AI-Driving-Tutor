from django.conf import settings
from django.db import models


class AIGenerationLog(models.Model):
    """Журнал запитів та генерацій Gemini API."""

    class RequestType(models.TextChoices):
        QUESTION_GENERATION = "question_generation", "Генерація навчальних питань"
        EXPLANATION = "explanation", "Пояснення помилки користувача"
        CONSULTATION = "consultation", "Відповідь на запитання користувача"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="ai_logs",
        verbose_name="Користувач",
    )
    request_type = models.CharField(
        max_length=30,
        choices=RequestType.choices,
        db_index=True,
        verbose_name="Тип запиту",
    )
    model_name = models.CharField(
        max_length=50,
        default="gemini-2.5-flash",
        verbose_name="Модель Gemini",
    )
    prompt_tokens = models.PositiveIntegerField(
        default=0,
        verbose_name="Вхідні токени",
    )
    completion_tokens = models.PositiveIntegerField(
        default=0,
        verbose_name="Вихідні токени",
    )
    input_context = models.TextField(
        blank=True,
        verbose_name="Контекст нормативних матеріалів ПДР",
    )
    response_text = models.TextField(
        blank=True,
        verbose_name="Відповідь моделі",
    )
    is_successful = models.BooleanField(
        default=True,
        verbose_name="Успішно виконано",
    )
    error_message = models.TextField(
        blank=True,
        verbose_name="Повідомлення про помилку",
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Час запиту",
    )

    class Meta:
        verbose_name = "Лог взаємодії з ШІ"
        verbose_name_plural = "Логи взаємодії з ШІ"
        ordering = ["-created_at"]

    def __str__(self):
        status = "✓" if self.is_successful else "✗"
        return f"[{status}] {self.get_request_type_display()} ({self.model_name}) - {self.created_at:%Y-%m-%d %H:%M}"
