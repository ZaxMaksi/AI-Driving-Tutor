from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from progress.models import TopicProgress, UserStatistics


class UserStatisticsSerializer(serializers.ModelSerializer):
    """Серіалізатор загальної навчальної статистики користувача."""

    class Meta:
        model = UserStatistics
        fields = (
            "total_tests_passed",
            "total_exams_passed",
            "total_questions_answered",
            "total_correct_answers",
            "success_rate_percent",
            "updated_at",
        )


class TopicProgressSerializer(serializers.ModelSerializer):
    """Серіалізатор прогресу засвоєння конкретного розділу ПДР."""

    section_number = serializers.IntegerField(source="section.number", read_only=True)
    section_title = serializers.CharField(source="section.title", read_only=True)
    accuracy_percent = serializers.SerializerMethodField()

    class Meta:
        model = TopicProgress
        fields = (
            "id",
            "section_number",
            "section_title",
            "questions_attempted",
            "correct_answers",
            "incorrect_answers",
            "accuracy_percent",
            "is_mastered",
            "last_practiced_at",
        )

    @extend_schema_field(serializers.FloatField())
    def get_accuracy_percent(self, obj):
        if obj.questions_attempted == 0:
            return 0.0
        return round((obj.correct_answers / obj.questions_attempted) * 100, 1)


class WeakTopicRecommendationSerializer(serializers.Serializer):
    """Рекомендації щодо тем із найбільшою кількістю помилок."""

    section_number = serializers.IntegerField()
    section_title = serializers.CharField()
    incorrect_answers = serializers.IntegerField()
    accuracy_percent = serializers.FloatField()
    recommendation = serializers.CharField()
