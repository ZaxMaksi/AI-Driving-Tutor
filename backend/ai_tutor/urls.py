from django.urls import path
from .views import (
    AILogsListView,
    ConsultationAPIView,
    ExplainMistakeAPIView,
    GenerateQuestionAPIView,
)

app_name = "ai_tutor"

urlpatterns = [
    path("generate-question/", GenerateQuestionAPIView.as_view(), name="generate-question"),
    path("explain-mistake/", ExplainMistakeAPIView.as_view(), name="explain-mistake"),
    path("consult/", ConsultationAPIView.as_view(), name="consult"),
    path("logs/", AILogsListView.as_view(), name="logs"),
]
