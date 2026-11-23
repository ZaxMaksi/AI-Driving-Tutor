from drf_spectacular.utils import extend_schema, OpenApiResponse
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from testing.models import TestSession
from testing.serializers import (
    StartTestSessionSerializer,
    SubmitAnswerSerializer,
    TestSessionDetailSerializer,
    TestSessionListSerializer,
    UserAnswerSerializer,
)
from testing.services import TestSessionService
from traffic_rules.models import RuleSection


class StartTestSessionView(APIView):
    """Створення нової сесії тестування знань ПДР."""

    permission_classes = (permissions.IsAuthenticated,)

    @extend_schema(
        summary="Розпочати тестування",
        request=StartTestSessionSerializer,
        responses={status.HTTP_201_CREATED: TestSessionDetailSerializer},
    )
    def post(self, request, *args, **kwargs):
        serializer = StartTestSessionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        mode = serializer.validated_data["mode"]
        section_id = serializer.validated_data.get("section_id")
        question_count = serializer.validated_data.get("question_count", 20)

        section = (
            RuleSection.objects.filter(id=section_id).first()
            if section_id
            else None
        )

        session = TestSessionService.start_session(
            user=request.user,
            mode=mode,
            section=section,
            question_count=question_count,
        )

        return Response(
            TestSessionDetailSerializer(session).data,
            status=status.HTTP_201_CREATED,
        )


class TestSessionListView(generics.ListAPIView):
    """Отримання історії проходження тестів поточного користувача."""

    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = TestSessionListSerializer

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False) or not self.request.user.is_authenticated:
            return TestSession.objects.none()
        return TestSession.objects.filter(user=self.request.user).order_by(
            "-started_at"
        )

    @extend_schema(
        summary="Історія тестів користувача",
        description="Повертає список усіх тестових сесій авторизованого користувача.",
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class TestSessionDetailView(generics.RetrieveAPIView):
    """Отримання результатів конкретної тестової сесії."""

    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = TestSessionDetailSerializer

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False) or not self.request.user.is_authenticated:
            return TestSession.objects.none()
        return (
            TestSession.objects.filter(user=self.request.user)
            .select_related("section")
            .prefetch_related(
                "user_answers__question",
                "user_answers__selected_option",
                "user_answers__question__answers",
            )
        )

    @extend_schema(
        summary="Деталі тестової сесії",
        description="Повертає результати тесту та детальний перелік відповідей.",
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class SubmitAnswerView(APIView):
    """Надсилання відповіді на конкретне питання в межах тестової сесії."""

    permission_classes = (permissions.IsAuthenticated,)

    @extend_schema(
        summary="Відповісти на питання",
        request=SubmitAnswerSerializer,
        responses={status.HTTP_200_OK: UserAnswerSerializer},
    )
    def post(self, request, pk, *args, **kwargs):
        session = generics.get_object_or_404(
            TestSession.objects.filter(user=request.user), pk=pk
        )

        serializer = SubmitAnswerSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        question_id = serializer.validated_data["question_id"]
        selected_option_id = serializer.validated_data["selected_option_id"]
        time_spent = serializer.validated_data.get("time_spent_seconds", 0)

        answer = TestSessionService.submit_answer(
            session=session,
            question_id=question_id,
            selected_option_id=selected_option_id,
            time_spent=time_spent,
        )

        return Response(UserAnswerSerializer(answer).data, status=status.HTTP_200_OK)


class FinishTestSessionView(APIView):
    """Завершення тестової сесії та фіксація підсумкових результатів."""

    permission_classes = (permissions.IsAuthenticated,)

    @extend_schema(
        summary="Завершити тест",
        request=None,
        responses={status.HTTP_200_OK: TestSessionDetailSerializer},
    )
    def post(self, request, pk, *args, **kwargs):
        session = generics.get_object_or_404(
            TestSession.objects.filter(user=request.user), pk=pk
        )

        completed_session = TestSessionService.finish_session(session)

        return Response(
            TestSessionDetailSerializer(completed_session).data,
            status=status.HTTP_200_OK,
        )
