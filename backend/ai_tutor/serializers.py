from rest_framework import serializers
from ai_tutor.models import AIGenerationLog


class GenerateQuestionRequestSerializer(serializers.Serializer):
    section_id = serializers.IntegerField(
        required=True,
        help_text="ID розділу ПДР, за яким необхідно згенерувати питання.",
    )


class ExplainMistakeRequestSerializer(serializers.Serializer):
    question_id = serializers.IntegerField(
        required=True,
        help_text="ID питання, в якому допущено помилку.",
    )
    selected_option_id = serializers.IntegerField(
        required=True,
        help_text="ID помилково обраного варіанта відповіді.",
    )


class ConsultationRequestSerializer(serializers.Serializer):
    query = serializers.CharField(
        required=True,
        max_length=1000,
        help_text="Питання учня до віртуального автоінструктора.",
    )
    section_id = serializers.IntegerField(
        required=False,
        allow_null=True,
        help_text="Необов'язковий ID розділу ПДР для фокусування контексту.",
    )


class AIGenerationLogSerializer(serializers.ModelSerializer):
    """Серіалізатор історії запитів до ШІ."""

    request_type_display = serializers.CharField(
        source="get_request_type_display", read_only=True
    )

    class Meta:
        model = AIGenerationLog
        fields = (
            "id",
            "request_type",
            "request_type_display",
            "model_name",
            "response_text",
            "is_successful",
            "created_at",
        )
