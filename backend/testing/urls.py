from django.urls import path
from .views import (
    FinishTestSessionView,
    StartTestSessionView,
    SubmitAnswerView,
    TestSessionDetailView,
    TestSessionListView,
)

app_name = "testing"

urlpatterns = [
    path("sessions/", TestSessionListView.as_view(), name="session-list"),
    path("start/", StartTestSessionView.as_view(), name="session-start"),
    path(
        "sessions/<int:pk>/",
        TestSessionDetailView.as_view(),
        name="session-detail",
    ),
    path(
        "sessions/<int:pk>/answer/",
        SubmitAnswerView.as_view(),
        name="submit-answer",
    ),
    path(
        "sessions/<int:pk>/finish/",
        FinishTestSessionView.as_view(),
        name="finish-session",
    ),
]
