from django.contrib import admin
from .models import Question, AnswerOption, QuestionImage


class AnswerOptionInline(admin.TabularInline):
    model = AnswerOption
    extra = 4
    fields = ("order", "text", "is_correct")


class QuestionImageInline(admin.TabularInline):
    model = QuestionImage
    extra = 1
    fields = ("order", "image", "caption", "is_main")


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "short_text",
        "section",
        "question_type",
        "ai_status",
        "difficulty",
        "is_active",
        "created_at",
    )
    list_filter = (
        "question_type",
        "ai_status",
        "is_active",
        "difficulty",
        "section",
    )
    search_fields = ("text", "explanation")
    filter_horizontal = ("rule_points",)
    inlines = [AnswerOptionInline, QuestionImageInline]

    def short_text(self, obj):
        return obj.text[:60] + "..." if len(obj.text) > 60 else obj.text

    short_text.short_description = "Текст питання"


@admin.register(AnswerOption)
class AnswerOptionAdmin(admin.ModelAdmin):
    list_display = ("id", "question", "text", "is_correct", "order")
    list_filter = ("is_correct",)
    search_fields = ("text",)


@admin.register(QuestionImage)
class QuestionImageAdmin(admin.ModelAdmin):
    list_display = ("id", "question", "caption", "is_main", "order", "uploaded_at")
    list_filter = ("is_main",)
    search_fields = ("caption",)
