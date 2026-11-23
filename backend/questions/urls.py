from django.urls import path
from .views import (
    QuestionDetailView,
    QuestionListView,
    QuestionResultView,
)

app_name = "questions"

urlpatterns = [
    path("", QuestionListView.as_view(), name="question-list"),
    path("<int:pk>/", QuestionDetailView.as_view(), name="question-detail"),
    path(
        "<int:pk>/result/",
        QuestionResultView.as_view(),
        name="question-result",
    ),
]
