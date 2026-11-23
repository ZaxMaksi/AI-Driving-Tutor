from rest_framework import serializers

from questions.serializers import QuestionDetailSerializer, QuestionResultSerializer
from testing.models import TestSession, UserAnswer
from traffic_rules.models import RuleSection


class StartTestSessionSerializer(serializers.Serializer):
    """Параметри для створення нової тестової сесії."""

    mode = serializers.ChoiceField(
        choices=TestSession.Mode.choices,
        default=TestSession.Mode.EXAM,
    )
    section_id = serializers.IntegerField(
        required=False,
        allow_null=True,
    )
    question_count = serializers.IntegerField(
        default=20,
        min_value=1,
        max_value=50,
    )

    def validate(self, attrs):
        mode = attrs.get("mode")
        section_id = attrs.get("section_id")

        if mode == TestSession.Mode.BY_TOPIC and not section_id:
            raise serializers.ValidationError(
                {"section_id": "Для тесту за темою необхідно обов'язково вказати ID розділу ПДР."}
            )

        if section_id:
            if not RuleSection.objects.filter(id=section_id).exists():
                raise serializers.ValidationError({"section_id": "Розділ ПДР з таким ID не існує."})

        return attrs


class SubmitAnswerSerializer(serializers.Serializer):
    """Параметри відповіді користувача на питання тесту."""

    question_id = serializers.IntegerField(required=True)
    selected_option_id = serializers.IntegerField(required=True)
    time_spent_seconds = serializers.IntegerField(default=0, min_value=0)


class UserAnswerSerializer(serializers.ModelSerializer):
    """Серіалізатор наданої відповіді користувача."""

    question = QuestionResultSerializer(read_only=True)
    selected_option_text = serializers.CharField(
        source="selected_option.text", read_only=True
    )

    class Meta:
        model = UserAnswer
        fields = (
            "id",
            "question",
            "selected_option",
            "selected_option_text",
            "is_correct",
            "time_spent_seconds",
            "answered_at",
        )


class TestSessionListSerializer(serializers.ModelSerializer):
    """Серіалізатор для списку тестових сесій користувача."""

    section_title = serializers.CharField(source="section.title", read_only=True)
    mode_display = serializers.CharField(source="get_mode_display", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = TestSession
        fields = (
            "id",
            "mode",
            "mode_display",
            "section_title",
            "total_questions",
            "correct_answers_count",
            "incorrect_answers_count",
            "is_passed",
            "status",
            "status_display",
            "started_at",
            "completed_at",
            "duration_seconds",
        )


class TestSessionDetailSerializer(serializers.ModelSerializer):
    """Детальний серіалізатор сесії з усіма відповідями та розбором помилок."""

    user_answers = UserAnswerSerializer(many=True, read_only=True)
    section_title = serializers.CharField(source="section.title", read_only=True)
    mode_display = serializers.CharField(source="get_mode_display", read_only=True)

    class Meta:
        model = TestSession
        fields = (
            "id",
            "mode",
            "mode_display",
            "section_title",
            "total_questions",
            "correct_answers_count",
            "incorrect_answers_count",
            "is_passed",
            "status",
            "started_at",
            "completed_at",
            "duration_seconds",
            "user_answers",
        )
