from django.db import models


class RuleDocument(models.Model):
    """Нормативно-правовий акт ПДР (наприклад, Постанова КМУ № 1306)."""

    title = models.CharField(
        max_length=255,
        verbose_name="Назва документа",
        default="Правила дорожнього руху",
    )
    document_number = models.CharField(
        max_length=50,
        verbose_name="Номер документа",
        default="1306",
    )
    document_type = models.CharField(
        max_length=150,
        verbose_name="Тип документа",
        default="Постанова Кабінету Міністрів України",
    )
    source_url = models.URLField(
        max_length=500,
        verbose_name="Офіційне джерело",
        default="https://zakon.rada.gov.ua/laws/show/1306-2001-%D0%BF#Text",
    )
    adoption_date = models.DateField(
        null=True,
        blank=True,
        verbose_name="Дата прийняття",
    )
    edition_date = models.DateField(
        null=True,
        blank=True,
        verbose_name="Дата редакції",
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name="Чинна редакція",
    )
    version = models.CharField(
        max_length=50,
        default="1.0",
        verbose_name="Версія запису",
    )
    sha256 = models.CharField(
        max_length=64,
        blank=True,
        verbose_name="Хеш вихідного файлу",
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
        verbose_name = "Нормативний документ"
        verbose_name_plural = "Нормативні документи"
        ordering = ["-is_active", "-edition_date"]

    def __str__(self):
        return f"{self.title} (№ {self.document_number})"


class RuleSection(models.Model):
    """Розділ Правил дорожнього руху (наприклад, Розділ 1. Загальні положення)."""

    document = models.ForeignKey(
        RuleDocument,
        on_delete=models.CASCADE,
        related_name="sections",
        verbose_name="Нормативний документ",
    )
    number = models.PositiveSmallIntegerField(
        verbose_name="Номер розділу",
    )
    title = models.CharField(
        max_length=255,
        verbose_name="Назва розділу",
    )
    description = models.TextField(
        blank=True,
        verbose_name="Опис / текст розділу",
    )
    order = models.PositiveSmallIntegerField(
        default=0,
        verbose_name="Порядок сортування",
    )

    class Meta:
        verbose_name = "Розділ ПДР"
        verbose_name_plural = "Розділи ПДР"
        ordering = ["number"]
        unique_together = [("document", "number")]

    def __str__(self):
        return f"Розділ {self.number}. {self.title}"


class RulePoint(models.Model):
    """Конкретний пункт розділу ПДР (наприклад, Пункт 1.10 або 16.3)."""

    section = models.ForeignKey(
        RuleSection,
        on_delete=models.CASCADE,
        related_name="points",
        verbose_name="Розділ",
    )
    number = models.CharField(
        max_length=20,
        db_index=True,
        verbose_name="Номер пункту",
    )
    text = models.TextField(
        verbose_name="Текст пункту",
    )
    order = models.PositiveIntegerField(
        default=0,
        verbose_name="Порядок сортування",
    )
    source_anchor = models.CharField(
        max_length=100,
        blank=True,
        verbose_name="Якір у джерелі",
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name="Актуальний",
    )

    class Meta:
        verbose_name = "Пункт ПДР"
        verbose_name_plural = "Пункти ПДР"
        ordering = ["order", "number"]
        unique_together = [("section", "number")]

    def __str__(self):
        return f"Пункт {self.number}"
