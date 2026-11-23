from drf_spectacular.utils import extend_schema, OpenApiResponse
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from ai_tutor.models import AIGenerationLog
from ai_tutor.serializers import (
    AIGenerationLogSerializer,
    ConsultationRequestSerializer,
    ExplainMistakeRequestSerializer,
    GenerateQuestionRequestSerializer,
)
from ai_tutor.services import GeminiTutorService
from questions.serializers import QuestionDetailSerializer


class GenerateQuestionAPIView(APIView):
    """Генерація нового навчального питання через Gemini на основі нормативного розділу ПДР."""

    permission_classes = (permissions.IsAuthenticated,)

    @extend_schema(
        summary="Згенерувати питання через ШІ",
        request=GenerateQuestionRequestSerializer,
        responses={status.HTTP_201_CREATED: QuestionDetailSerializer},
    )
    def post(self, request, *args, **kwargs):
        serializer = GenerateQuestionRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        section_id = serializer.validated_data["section_id"]
        question = GeminiTutorService.generate_question(
            section_id=section_id,
            user=request.user,
        )

        return Response(
            QuestionDetailSerializer(question).data,
            status=status.HTTP_201_CREATED,
        )


class ExplainMistakeAPIView(APIView):
    """Отримання персоналізованого пояснення допущеної помилки від Gemini автоінструктора."""

    permission_classes = (permissions.IsAuthenticated,)

    @extend_schema(
        summary="Пояснити помилку учня",
        request=ExplainMistakeRequestSerializer,
        responses={
            status.HTTP_200_OK: OpenApiResponse(description="Текстове розгорнуте пояснення помилки.")
        },
    )
    def post(self, request, *args, **kwargs):
        serializer = ExplainMistakeRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        question_id = serializer.validated_data["question_id"]
        selected_option_id = serializer.validated_data["selected_option_id"]

        explanation = GeminiTutorService.explain_mistake(
            question_id=question_id,
            selected_option_id=selected_option_id,
            user=request.user,
        )

        return Response({"explanation": explanation}, status=status.HTTP_200_OK)


class ConsultationAPIView(APIView):
    """Задати вільне питання віртуальному інструктору з ПДР України."""

    permission_classes = (permissions.IsAuthenticated,)

    @extend_schema(
        summary="Консультація з автоінструктором",
        request=ConsultationRequestSerializer,
        responses={
            status.HTTP_200_OK: OpenApiResponse(description="Юридично точна відповідь інструктора.")
        },
    )
    def post(self, request, *args, **kwargs):
        serializer = ConsultationRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        query = serializer.validated_data["query"]
        section_id = serializer.validated_data.get("section_id")

        answer = GeminiTutorService.consult(
            user_query=query,
            section_id=section_id,
            user=request.user,
        )

        return Response({"answer": answer}, status=status.HTTP_200_OK)


class AILogsListView(generics.ListAPIView):
    """Журнал попередніх звернень поточного користувача до Gemini."""

    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = AIGenerationLogSerializer

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False) or not self.request.user.is_authenticated:
            return AIGenerationLog.objects.none()
        return AIGenerationLog.objects.filter(user=self.request.user).order_by(
            "-created_at"
        )
