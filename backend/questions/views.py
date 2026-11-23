from django_filters import rest_framework as django_filters
from drf_spectacular.utils import extend_schema, OpenApiParameter
from rest_framework import filters, generics, permissions

from .models import Question
from .serializers import (
    QuestionDetailSerializer,
    QuestionListSerializer,
    QuestionResultSerializer,
)


class QuestionFilter(django_filters.FilterSet):
    section_number = django_filters.NumberFilter(field_name="section__number")
    difficulty = django_filters.NumberFilter(field_name="difficulty")
    question_type = django_filters.ChoiceFilter(
        choices=Question.QuestionType.choices
    )
    has_image = django_filters.BooleanFilter(
        field_name="images", method="filter_has_image"
    )

    class Meta:
        model = Question
        fields = ("section_number", "difficulty", "question_type", "has_image")

    def filter_has_image(self, queryset, name, value):
        if value is True:
            return queryset.filter(images__isnull=False).distinct()
        if value is False:
            return queryset.filter(images__isnull=True)
        return queryset


class QuestionListView(generics.ListAPIView):
    """Список доступних питань з фільтрацією за розділом ПДР, складністю та типом."""

    permission_classes = (permissions.AllowAny,)
    serializer_class = QuestionListSerializer
    filter_backends = (
        django_filters.DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    )
    filterset_class = QuestionFilter
    search_fields = ("text", "explanation")
    ordering_fields = ("id", "difficulty", "created_at")
    ordering = ("id",)

    def get_queryset(self):
        # Для користувачів доступні лише активні та схвалені питання
        return (
            Question.objects.filter(
                is_active=True,
                ai_status=Question.AIStatus.APPROVED,
            )
            .select_related("section")
            .prefetch_related("images")
        )

    @extend_schema(
        summary="Отримати список питань",
        description="Повертає банк активних та схвалених питань з підтримкою фільтрації за розділом ПДР та типом.",
        parameters=[
            OpenApiParameter(
                name="section_number",
                description="Фільтр за номером розділу ПДР (1-34)",
                required=False,
                type=int,
            ),
            OpenApiParameter(
                name="difficulty",
                description="Рівень складності (1-3)",
                required=False,
                type=int,
            ),
            OpenApiParameter(
                name="question_type",
                description="Тип питання ('official' або 'ai_generated')",
                required=False,
                type=str,
            ),
        ],
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class QuestionDetailView(generics.RetrieveAPIView):
    """Отримання деталей питання для тестування (без підказки правильної відповіді)."""

    permission_classes = (permissions.AllowAny,)
    serializer_class = QuestionDetailSerializer

    def get_queryset(self):
        return (
            Question.objects.filter(is_active=True)
            .select_related("section")
            .prefetch_related("answers", "images", "rule_points")
        )

    @extend_schema(
        summary="Отримати питання для тесту",
        description="Повертає формулювання питання, варіанти відповідей (без розкриття правильного) та зображення.",
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class QuestionResultView(generics.RetrieveAPIView):
    """Отримання повного розбору питання після тесту (з правильним варіантом та нормативним поясненням)."""

    permission_classes = (permissions.AllowAny,)
    serializer_class = QuestionResultSerializer

    def get_queryset(self):
        return (
            Question.objects.filter(is_active=True)
            .select_related("section")
            .prefetch_related("answers", "images", "rule_points")
        )

    @extend_schema(
        summary="Отримати розбір питання",
        description="Повертає питання із зазначенням правильної відповіді та офіційним юридичним поясненням.",
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)
