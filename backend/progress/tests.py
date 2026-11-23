from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from progress.models import TopicProgress, UserStatistics
from traffic_rules.models import RuleDocument, RuleSection

User = get_user_model()


class ProgressAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="progress_user@example.com",
            password="StrongPassword123!",
        )
        self.doc = RuleDocument.objects.create(
            title="ПДР", document_number="1306", is_active=True
        )
        self.sec = RuleSection.objects.create(
            document=self.doc, number=14, title="Обгін"
        )

        self.stats = UserStatistics.objects.create(
            user=self.user,
            total_tests_passed=5,
            total_exams_passed=1,
            total_questions_answered=100,
            total_correct_answers=90,
            success_rate_percent=90.0,
        )

        self.topic_progress = TopicProgress.objects.create(
            user=self.user,
            section=self.sec,
            questions_attempted=10,
            correct_answers=6,
            incorrect_answers=4,
            is_mastered=False,
        )

        self.summary_url = reverse("progress:summary")
        self.topics_url = reverse("progress:topics")
        self.recommendations_url = reverse("progress:recommendations")

    def test_summary_api(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.summary_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["total_tests_passed"], 5)
        self.assertEqual(response.data["success_rate_percent"], 90.0)

    def test_topics_api(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.topics_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", response.data)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["section_number"], 14)
        self.assertEqual(results[0]["accuracy_percent"], 60.0)

    def test_recommendations_api(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.recommendations_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["section_number"], 14)
        self.assertIn("Рекомендується повторити", response.data[0]["recommendation"])
