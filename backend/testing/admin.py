from django.contrib import admin
from .models import TestSession, UserAnswer


class UserAnswerInline(admin.TabularInline):
    model = UserAnswer
    extra = 0
    fields = ("question", "selected_option", "is_correct", "time_spent_seconds", "answered_at")
    readonly_fields = ("answered_at",)


@admin.register(TestSession)
class TestSessionAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "mode",
        "status",
        "correct_answers_count",
        "incorrect_answers_count",
        "is_passed",
        "started_at",
    )
    list_filter = ("mode", "status", "is_passed", "started_at")
    search_fields = ("user__email",)
    inlines = [UserAnswerInline]


@admin.register(UserAnswer)
class UserAnswerAdmin(admin.ModelAdmin):
    list_display = ("id", "session", "question", "selected_option", "is_correct", "answered_at")
    list_filter = ("is_correct", "answered_at")
    search_fields = ("session__user__email", "question__text")
