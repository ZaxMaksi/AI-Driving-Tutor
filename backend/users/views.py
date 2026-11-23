from django.contrib.auth import get_user_model
from drf_spectacular.utils import extend_schema, inline_serializer, OpenApiResponse
from rest_framework import generics, permissions, serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from .serializers import (
    ChangePasswordSerializer,
    RegisterSerializer,
    UserProfileUpdateSerializer,
    UserSerializer,
)

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """Ендпоінт реєстрації нового користувача."""

    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = (permissions.AllowAny,)

    @extend_schema(
        summary="Реєстрація користувача",
        description="Створює нового користувача за email та паролем і повертає JWT-токени.",
        responses={
            status.HTTP_201_CREATED: OpenApiResponse(
                description="Користувач успішно зареєстрований."
            )
        },
    )
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Генерація JWT-токенів одразу після успішної реєстрації
        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "user": UserSerializer(user).data,
                "tokens": {
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                },
                "message": "Користувача успішно зареєстровано.",
            },
            status=status.HTTP_201_CREATED,
        )


class CustomTokenObtainPairView(TokenObtainPairView):
    """Ендпоінт авторизації (входу) за email та паролем з поверненням даних користувача."""

    @extend_schema(
        summary="Авторизація користувача (Login)",
        description="Перевіряє email та пароль і видає пару JWT-токенів (access та refresh).",
    )
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == status.HTTP_200_OK:
            email = request.data.get("email", "").strip().lower()
            try:
                user = User.objects.get(email__iexact=email)
                response.data["user"] = UserSerializer(user).data
            except User.DoesNotExist:
                pass
        return response


class UserProfileView(generics.RetrieveUpdateAPIView):
    """Ендпоінт перегляду та редагування особистого профілю користувача."""

    permission_classes = (permissions.IsAuthenticated,)

    def get_serializer_class(self):
        if self.request.method in ["PUT", "PATCH"]:
            return UserProfileUpdateSerializer
        return UserSerializer

    def get_object(self):
        # Повертає виключно авторизованого користувача
        return self.request.user

    @extend_schema(
        summary="Отримати профіль",
        description="Повертає персональні дані поточного авторизованого користувача.",
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @extend_schema(
        summary="Оновити профіль",
        description="Оновлює ім'я та прізвище поточного авторизованого користувача.",
    )
    def patch(self, request, *args, **kwargs):
        return super().patch(request, *args, **kwargs)


class ChangePasswordView(APIView):
    """Ендпоінт зміни пароля для авторизованого користувача."""

    permission_classes = (permissions.IsAuthenticated,)

    @extend_schema(
        summary="Зміна пароля",
        request=ChangePasswordSerializer,
        responses={status.HTTP_200_OK: OpenApiResponse(description="Пароль змінено.")},
    )
    def post(self, request, *args, **kwargs):
        serializer = ChangePasswordSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)

        user = request.user
        user.set_password(serializer.validated_data["new_password"])
        user.save()

        return Response(
            {"message": "Пароль успішно змінено."},
            status=status.HTTP_200_OK,
        )


class LogoutView(APIView):
    """Ендпоінт виходу з облікового запису (відкликання refresh токена)."""

    permission_classes = (permissions.IsAuthenticated,)

    @extend_schema(
        summary="Вихід з акаунта (Logout)",
        description="Завершує активну сесію користувача.",
        request=inline_serializer(
            name="LogoutRequest",
            fields={"refresh": serializers.CharField(required=True)},
        ),
        responses={status.HTTP_200_OK: OpenApiResponse(description="Успішний вихід.")},
    )
    def post(self, request, *args, **kwargs):
        refresh_token = request.data.get("refresh")
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except Exception:
                pass
        return Response(
            {"message": "Успішний вихід з акаунта."},
            status=status.HTTP_200_OK,
        )
