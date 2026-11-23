from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from .models import AnswerOption, Question, QuestionImage


class QuestionImageSerializer(serializers.ModelSerializer):
    """Серіалізатор зображення до питання."""

    class Meta:
        model = QuestionImage
        fields = ("id", "image", "caption", "is_main", "order")


class AnswerOptionClientSerializer(serializers.ModelSerializer):
    """Серіалізатор варіанта відповіді для клієнта (БЕЗ показу is_correct під час тесту)."""

    class Meta:
        model = AnswerOption
        fields = ("id", "text", "order")


class AnswerOptionDetailSerializer(serializers.ModelSerializer):
    """Повний серіалізатор варіанта відповіді з прапорцем is_correct (для результатів тесту/адмінки)."""

    class Meta:
        model = AnswerOption
        fields = ("id", "text", "is_correct", "order")


class QuestionListSerializer(serializers.ModelSerializer):
    """Серіалізатор для списку питань."""

    section_number = serializers.IntegerField(source="section.number", read_only=True)
    section_title = serializers.CharField(source="section.title", read_only=True)
    images_count = serializers.IntegerField(source="images.count", read_only=True)

    class Meta:
        model = Question
        fields = (
            "id",
            "text",
            "section_number",
            "section_title",
            "question_type",
            "ai_status",
            "difficulty",
            "images_count",
        )


class QuestionDetailSerializer(serializers.ModelSerializer):
    """Детальний серіалізатор питання для проходження тесту (варіанти без підказки правильної відповіді)."""

    answers = AnswerOptionClientSerializer(many=True, read_only=True)
    images = QuestionImageSerializer(many=True, read_only=True)
    section_number = serializers.IntegerField(source="section.number", read_only=True)
    section_title = serializers.CharField(source="section.title", read_only=True)
    rule_points_numbers = serializers.SerializerMethodField()

    class Meta:
        model = Question
        fields = (
            "id",
            "text",
            "section_number",
            "section_title",
            "question_type",
            "difficulty",
            "answers",
            "images",
            "rule_points_numbers",
        )

    @extend_schema_field(serializers.ListField(child=serializers.CharField()))
    def get_rule_points_numbers(self, obj):
        return list(obj.rule_points.values_list("number", flat=True))


class QuestionResultSerializer(serializers.ModelSerializer):
    """Детальний серіалізатор питання для відображення результатів (з поясненням та правильним варіантом)."""

    answers = AnswerOptionDetailSerializer(many=True, read_only=True)
    images = QuestionImageSerializer(many=True, read_only=True)
    section_number = serializers.IntegerField(source="section.number", read_only=True)
    section_title = serializers.CharField(source="section.title", read_only=True)
    rule_points_numbers = serializers.SerializerMethodField()

    class Meta:
        model = Question
        fields = (
            "id",
            "text",
            "explanation",
            "section_number",
            "section_title",
            "question_type",
            "answers",
            "images",
            "rule_points_numbers",
        )

    @extend_schema_field(serializers.ListField(child=serializers.CharField()))
    def get_rule_points_numbers(self, obj):
        return list(obj.rule_points.values_list("number", flat=True))
