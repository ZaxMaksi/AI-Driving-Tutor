from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)


def health_check(request):
    """Базовый диагностический эндпоинт проверки работоспособности API."""
    return JsonResponse(
        {
            "status": "healthy",
            "service": "AI Driving Tutor API",
            "version": "1.0.0",
        }
    )


urlpatterns = [
    path("admin/", admin.site.urls),
    # OpenAPI 3 Schema & Interactive Documentation
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "api/docs/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
    path(
        "api/redoc/",
        SpectacularRedocView.as_view(url_name="schema"),
        name="redoc",
    ),
    # Health checks
    path("api/health/", health_check, name="health-check"),
    path("api/v1/health/", health_check, name="api-v1-health-check"),
    # Auth endpoints
    path("api/v1/auth/", include("users.urls")),
    # Traffic Rules endpoints
    path("api/v1/traffic-rules/", include("traffic_rules.urls")),
    # Questions endpoints
    path("api/v1/questions/", include("questions.urls")),
    # Testing endpoints
    path("api/v1/testing/", include("testing.urls")),
    # Progress endpoints
    path("api/v1/progress/", include("progress.urls")),
    # AI Tutor endpoints
    path("api/v1/ai-tutor/", include("ai_tutor.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
