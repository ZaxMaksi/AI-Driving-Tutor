from django.conf import settings
from django.db import models


class UserStatistics(models.Model):
    """Агрегована статистика успішності користувача."""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="statistics",
        verbose_name="Користувач",
    )
    total_tests_passed = models.PositiveIntegerField(
        default=0,
        verbose_name="Пройдено тренувальних тестів",
    )
    total_exams_passed = models.PositiveIntegerField(
        default=0,
        verbose_name="Складено офіційних іспитів",
    )
    total_questions_answered = models.PositiveIntegerField(
        default=0,
        verbose_name="Всього надано відповідей",
    )
    total_correct_answers = models.PositiveIntegerField(
        default=0,
        verbose_name="Всього правильних відповідей",
    )
    success_rate_percent = models.FloatField(
        default=0.0,
        verbose_name="Загальний відсоток успішності",
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Час оновлення",
    )

    class Meta:
        verbose_name = "Статистика користувача"
        verbose_name_plural = "Статистика користувачів"

    def __str__(self):
        return f"Статистика {self.user.email} ({self.success_rate_percent:.1f}%)"


class TopicProgress(models.Model):
    """Прогрес вивчення конкретного розділу ПДР користувачем."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="topic_progress",
        verbose_name="Користувач",
    )
    section = models.ForeignKey(
        "traffic_rules.RuleSection",
        on_delete=models.CASCADE,
        related_name="user_progress",
        verbose_name="Розділ ПДР",
    )
    questions_attempted = models.PositiveIntegerField(
        default=0,
        verbose_name="Спроб відповідей",
    )
    correct_answers = models.PositiveIntegerField(
        default=0,
        verbose_name="Правильних відповідей",
    )
    incorrect_answers = models.PositiveIntegerField(
        default=0,
        verbose_name="Помилок",
    )
    is_mastered = models.BooleanField(
        default=False,
        verbose_name="Тему засвоєно (>=90% успішності)",
    )
    last_practiced_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Останнє тренування",
    )

    class Meta:
        verbose_name = "Прогрес за темою"
        verbose_name_plural = "Прогрес за темами"
        ordering = ["user", "section__number"]
        unique_together = [("user", "section")]

    def __str__(self):
        return f"{self.user.email} - Розділ {self.section.number} ({self.correct_answers}/{self.questions_attempted})"
