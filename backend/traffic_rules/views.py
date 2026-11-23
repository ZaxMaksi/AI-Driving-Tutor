from django.db.models import Count
from drf_spectacular.utils import extend_schema, OpenApiParameter
from rest_framework import filters, generics, permissions

from .models import RulePoint, RuleSection
from .serializers import (
    RulePointSerializer,
    RuleSectionDetailSerializer,
    RuleSectionListSerializer,
)


class RuleSectionListView(generics.ListAPIView):
    """Список усіх розділів ПДР України (з 1 по 34)."""

    permission_classes = (permissions.AllowAny,)
    serializer_class = RuleSectionListSerializer
    filter_backends = (filters.SearchFilter, filters.OrderingFilter)
    search_fields = ("title", "description")
    ordering_fields = ("number", "order")
    ordering = ("number",)
    pagination_class = None  # Всі 34 розділи віддаються одним списком для меню

    def get_queryset(self):
        return (
            RuleSection.objects.filter(document__is_active=True)
            .annotate(points_count=Count("points"))
            .order_by("number")
        )

    @extend_schema(
        summary="Отримати список розділів ПДР",
        description="Повертає список усіх 34 розділів ПДР України з кількістю пунктів у кожному.",
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class RuleSectionDetailView(generics.RetrieveAPIView):
    """Детальна інформація про розділ ПДР разом із усіма його пунктами."""

    permission_classes = (permissions.AllowAny,)
    serializer_class = RuleSectionDetailSerializer
    lookup_field = "number"

    def get_queryset(self):
        return (
            RuleSection.objects.filter(document__is_active=True)
            .select_related("document")
            .prefetch_related("points")
        )

    @extend_schema(
        summary="Отримати деталі розділу ПДР",
        description="Повертає повний зміст розділу ПДР за його номером (наприклад, /api/v1/traffic-rules/sections/1/).",
        parameters=[
            OpenApiParameter(
                name="number",
                description="Номер розділу ПДР (1-34)",
                required=True,
                type=int,
                location=OpenApiParameter.PATH,
            )
        ],
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class RulePointDetailView(generics.RetrieveAPIView):
    """Отримання конкретного пункту ПДР за його номером (наприклад, 1.10 або 16.3)."""

    permission_classes = (permissions.AllowAny,)
    serializer_class = RulePointSerializer
    lookup_field = "number"

    def get_queryset(self):
        return RulePoint.objects.filter(
            section__document__is_active=True
        ).select_related("section")

    @extend_schema(
        summary="Отримати конкретний пункт ПДР",
        description="Повертає текст пункту ПДР за його номером (наприклад, 1.10).",
        parameters=[
            OpenApiParameter(
                name="number",
                description="Номер пункту (наприклад '1.10' або '16.3')",
                required=True,
                type=str,
                location=OpenApiParameter.PATH,
            )
        ],
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class RulePointSearchView(generics.ListAPIView):
    """Пошук за нормативним текстом пунктів ПДР України."""

    permission_classes = (permissions.AllowAny,)
    serializer_class = RulePointSerializer
    filter_backends = (filters.SearchFilter,)
    search_fields = ("number", "text")

    def get_queryset(self):
        return (
            RulePoint.objects.filter(
                section__document__is_active=True,
                is_active=True,
            )
            .select_related("section")
            .order_by("section__number", "order")
        )

    @extend_schema(
        summary="Пошук у тексті ПДР",
        description="Здійснює пошук за ключовими словами або номерами у пунктах ПДР.",
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)
