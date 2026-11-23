from django.contrib import admin
from .models import UserStatistics, TopicProgress


@admin.register(UserStatistics)
class UserStatisticsAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "total_tests_passed",
        "total_exams_passed",
        "total_questions_answered",
        "success_rate_percent",
        "updated_at",
    )
    search_fields = ("user__email",)


@admin.register(TopicProgress)
class TopicProgressAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "section",
        "questions_attempted",
        "correct_answers",
        "incorrect_answers",
        "is_mastered",
        "last_practiced_at",
    )
    list_filter = ("is_mastered", "section")
    search_fields = ("user__email", "section__title")
