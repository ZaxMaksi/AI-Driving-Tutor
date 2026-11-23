from rest_framework import serializers
from .models import RuleDocument, RulePoint, RuleSection


class RuleDocumentSerializer(serializers.ModelSerializer):
    """Серіалізатор нормативного документа."""

    class Meta:
        model = RuleDocument
        fields = (
            "id",
            "title",
            "document_number",
            "document_type",
            "edition_date",
            "source_url",
            "is_active",
            "version",
        )


class RulePointSerializer(serializers.ModelSerializer):
    """Серіалізатор пункту ПДР."""

    section_number = serializers.IntegerField(source="section.number", read_only=True)
    section_title = serializers.CharField(source="section.title", read_only=True)

    class Meta:
        model = RulePoint
        fields = (
            "id",
            "number",
            "text",
            "order",
            "is_active",
            "section_number",
            "section_title",
        )


class RuleSectionListSerializer(serializers.ModelSerializer):
    """Серіалізатор для списку розділів ПДР."""

    points_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = RuleSection
        fields = (
            "id",
            "number",
            "title",
            "order",
            "points_count",
        )


class RuleSectionDetailSerializer(serializers.ModelSerializer):
    """Детальний серіалізатор розділу ПДР із вкладеними пунктами."""

    points = RulePointSerializer(many=True, read_only=True)
    document = RuleDocumentSerializer(read_only=True)

    class Meta:
        model = RuleSection
        fields = (
            "id",
            "number",
            "title",
            "description",
            "order",
            "document",
            "points",
        )
