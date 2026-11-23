from django.urls import path
from .views import (
    RecommendationsView,
    TopicProgressListView,
    UserStatisticsView,
)

app_name = "progress"

urlpatterns = [
    path("summary/", UserStatisticsView.as_view(), name="summary"),
    path("topics/", TopicProgressListView.as_view(), name="topics"),
    path(
        "recommendations/",
        RecommendationsView.as_view(),
        name="recommendations",
    ),
]
