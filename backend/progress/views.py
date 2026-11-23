from drf_spectacular.utils import extend_schema
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from progress.models import TopicProgress, UserStatistics
from progress.serializers import (
    TopicProgressSerializer,
    UserStatisticsSerializer,
    WeakTopicRecommendationSerializer,
)


class UserStatisticsView(generics.RetrieveAPIView):
    """Отримання зведеної персональної статистики успішності користувача."""

    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = UserStatisticsSerializer

    def get_object(self):
        stats, _ = UserStatistics.objects.get_or_create(user=self.request.user)
        return stats

    @extend_schema(
        summary="Загальна статистика успішності",
        description="Повертає загальну кількість тестів, іспитів, відповідей та середній відсоток успішності.",
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class TopicProgressListView(generics.ListAPIView):
    """Список прогресу за кожним розділом ПДР для поточного користувача."""

    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = TopicProgressSerializer

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False) or not self.request.user.is_authenticated:
            return TopicProgress.objects.none()
        return (
            TopicProgress.objects.filter(user=self.request.user)
            .select_related("section")
            .order_by("section__number")
        )

    @extend_schema(
        summary="Прогрес за темами ПДР",
        description="Повертає статистику відповідей та статус засвоєння по кожному розділу ПДР.",
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class RecommendationsView(APIView):
    """Формування рекомендацій щодо повторення найслабших тем користувача."""

    permission_classes = (permissions.IsAuthenticated,)

    @extend_schema(
        summary="Рекомендації для навчання",
        description="Аналізує помилки користувача та повертає список тем, які потребують першочергового повторення.",
        responses={status.HTTP_200_OK: WeakTopicRecommendationSerializer(many=True)},
    )
    def get(self, request, *args, **kwargs):
        weak_topics = (
            TopicProgress.objects.filter(
                user=request.user,
                incorrect_answers__gt=0,
                is_mastered=False,
            )
            .select_related("section")
            .order_by("-incorrect_answers")[:5]
        )

        recommendations = []
        for topic in weak_topics:
            accuracy = (
                round((topic.correct_answers / topic.questions_attempted) * 100, 1)
                if topic.questions_attempted > 0
                else 0.0
            )
            recommendations.append(
                {
                    "section_number": topic.section.number,
                    "section_title": topic.section.title,
                    "incorrect_answers": topic.incorrect_answers,
                    "accuracy_percent": accuracy,
                    "recommendation": f"Рекомендується повторити Розділ {topic.section.number} «{topic.section.title}», де допущено {topic.incorrect_answers} помилок (точність {accuracy}%).",
                }
            )

        return Response(recommendations, status=status.HTTP_200_OK)
