from django.conf import settings
from django.db import models


class TestSession(models.Model):
    """Сесія тестування знань ПДР користувачем."""

    class Mode(models.TextChoices):
        BY_TOPIC = "by_topic", "За розділом ПДР"
        MIXED = "mixed", "Змішаний тренувальний тест"
        EXAM = "exam", "Офіційний іспит"
        AI_TRAINING = "ai_training", "ШІ-тренування (адаптивне)"

    class Status(models.TextChoices):
        IN_PROGRESS = "in_progress", "В процесі"
        COMPLETED = "completed", "Завершено"
        ABANDONED = "abandoned", "Перервано"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="test_sessions",
        verbose_name="Користувач",
    )
    mode = models.CharField(
        max_length=20,
        choices=Mode.choices,
        default=Mode.EXAM,
        verbose_name="Режим тестування",
    )
    section = models.ForeignKey(
        "traffic_rules.RuleSection",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="test_sessions",
        verbose_name="Розділ (для тематичного тесту)",
    )
    total_questions = models.PositiveSmallIntegerField(
        default=20,
        verbose_name="Кількість питань",
    )
    correct_answers_count = models.PositiveSmallIntegerField(
        default=0,
        verbose_name="Кількість правильних відповідей",
    )
    incorrect_answers_count = models.PositiveSmallIntegerField(
        default=0,
        verbose_name="Кількість помилок",
    )
    is_passed = models.BooleanField(
        default=False,
        verbose_name="Іспит складено (<=2 помилок)",
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.IN_PROGRESS,
        verbose_name="Статус сесії",
    )
    started_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Час початку",
    )
    completed_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Час завершення",
    )
    duration_seconds = models.PositiveIntegerField(
        default=0,
        verbose_name="Тривалість (сек)",
    )

    class Meta:
        verbose_name = "Тестова сесія"
        verbose_name_plural = "Тестові сесії"
        ordering = ["-started_at"]

    def __str__(self):
        return f"Сесія #{self.id} ({self.user.email}, {self.get_mode_display()})"


class UserAnswer(models.Model):
    """Фіксація вибору відповіді користувача на конкретне питання."""

    session = models.ForeignKey(
        TestSession,
        on_delete=models.CASCADE,
        related_name="user_answers",
        verbose_name="Сесія тестування",
    )
    question = models.ForeignKey(
        "questions.Question",
        on_delete=models.CASCADE,
        related_name="user_answers",
        verbose_name="Питання",
    )
    selected_option = models.ForeignKey(
        "questions.AnswerOption",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Обраний варіант відповіді",
    )
    is_correct = models.BooleanField(
        default=False,
        verbose_name="Відповідь правильна",
    )
    time_spent_seconds = models.PositiveSmallIntegerField(
        default=0,
        verbose_name="Час на відповідь (сек)",
    )
    answered_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Час відповіді",
    )

    class Meta:
        verbose_name = "Відповідь користувача"
        verbose_name_plural = "Відповіді користувачів"
        ordering = ["session", "answered_at"]
        unique_together = [("session", "question")]

    def __str__(self):
        status = "✓" if self.is_correct else "✗"
        return f"Відповідь #{self.id} [{status}] на Питання #{self.question_id}"
