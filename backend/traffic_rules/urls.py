from django.urls import path
from .views import (
    RulePointDetailView,
    RulePointSearchView,
    RuleSectionDetailView,
    RuleSectionListView,
)

app_name = "traffic_rules"

urlpatterns = [
    path("sections/", RuleSectionListView.as_view(), name="section-list"),
    path(
        "sections/<int:number>/",
        RuleSectionDetailView.as_view(),
        name="section-detail",
    ),
    path(
        "points/search/",
        RulePointSearchView.as_view(),
        name="point-search",
    ),
    path(
        "points/<str:number>/",
        RulePointDetailView.as_view(),
        name="point-detail",
    ),
]
