from django.db import models
from .validators import validate_question_image


class Question(models.Model):
    """Питання екзаменаційного тесту з ПДР."""

    class QuestionType(models.TextChoices):
        OFFICIAL = "official", "Офіційне питання"
        AI_GENERATED = "ai_generated", "Згенероване ШІ"

    class AIStatus(models.TextChoices):
        PENDING = "pending", "Очікує перевірки"
        APPROVED = "approved", "Схвалено"
        REJECTED = "rejected", "Відхилено"

    text = models.TextField(
        verbose_name="Текст питання",
    )
    explanation = models.TextField(
        blank=True,
        verbose_name="Пояснення правильної відповіді",
    )
    section = models.ForeignKey(
        "traffic_rules.RuleSection",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="questions",
        verbose_name="Розділ ПДР",
    )
    rule_points = models.ManyToManyField(
        "traffic_rules.RulePoint",
        blank=True,
        related_name="questions",
        verbose_name="Пов'язані пункти ПДР",
    )
    question_type = models.CharField(
        max_length=20,
        choices=QuestionType.choices,
        default=QuestionType.OFFICIAL,
        db_index=True,
        verbose_name="Тип питання",
    )
    ai_status = models.CharField(
        max_length=20,
        choices=AIStatus.choices,
        default=AIStatus.APPROVED,
        db_index=True,
        verbose_name="Статус перевірки ШІ",
    )
    difficulty = models.PositiveSmallIntegerField(
        default=1,
        verbose_name="Складність (1-легка, 2-середня, 3-висока)",
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name="Активне питання",
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Дата створення",
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Дата оновлення",
    )

    class Meta:
        verbose_name = "Питання"
        verbose_name_plural = "Питання"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Питання #{self.id} ({self.get_question_type_display()}): {self.text[:50]}"


class AnswerOption(models.Model):
    """Варіант відповіді до питання."""

    question = models.ForeignKey(
        Question,
        on_delete=models.CASCADE,
        related_name="answers",
        verbose_name="Питання",
    )
    text = models.TextField(
        verbose_name="Текст варіанта відповіді",
    )
    is_correct = models.BooleanField(
        default=False,
        verbose_name="Правильна відповідь",
    )
    order = models.PositiveSmallIntegerField(
        default=0,
        verbose_name="Порядок сортування",
    )

    class Meta:
        verbose_name = "Варіант відповіді"
        verbose_name_plural = "Варіанти відповідей"
        ordering = ["order", "id"]

    def __str__(self):
        status = "✓" if self.is_correct else "✗"
        return f"[{status}] {self.text[:50]}"


class QuestionImage(models.Model):
    """Зображення до питання (дорожня ситуація, перехрестя, знак тощо)."""

    question = models.ForeignKey(
        Question,
        on_delete=models.CASCADE,
        related_name="images",
        verbose_name="Питання",
    )
    image = models.ImageField(
        upload_to="questions/%Y/%m/",
        validators=[validate_question_image],
        verbose_name="Файл зображення",
    )
    caption = models.CharField(
        max_length=255,
        blank=True,
        verbose_name="Підпис / опис зображення",
    )
    is_main = models.BooleanField(
        default=False,
        verbose_name="Основне зображення",
    )
    order = models.PositiveSmallIntegerField(
        default=0,
        verbose_name="Порядок відображення",
    )
    uploaded_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Час завантаження",
    )

    class Meta:
        verbose_name = "Зображення питання"
        verbose_name_plural = "Зображення питань"
        ordering = ["-is_main", "order", "id"]

    def __str__(self):
        return f"Зображення до питання #{self.question_id} ({self.caption or 'без підпису'})"
