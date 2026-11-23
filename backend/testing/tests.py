from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from progress.models import TopicProgress, UserStatistics
from questions.models import AnswerOption, Question
from testing.models import TestSession, UserAnswer
from traffic_rules.models import RuleDocument, RuleSection

User = get_user_model()


class TestingModuleTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="candidate@example.com",
            password="StrongPassword123!",
        )
        self.other_user = User.objects.create_user(
            email="other@example.com",
            password="StrongPassword123!",
        )

        self.doc = RuleDocument.objects.create(
            title="ПДР України", document_number="1306", is_active=True
        )
        self.section = RuleSection.objects.create(
            document=self.doc, number=1, title="Загальні положення"
        )

        # Створюємо 3 тестові питання
        self.questions = []
        for i in range(1, 4):
            q = Question.objects.create(
                text=f"Тестове питання #{i}?",
                section=self.section,
                question_type=Question.QuestionType.OFFICIAL,
                ai_status=Question.AIStatus.APPROVED,
            )
            AnswerOption.objects.create(
                question=q, text="Правильний", is_correct=True, order=1
            )
            AnswerOption.objects.create(
                question=q, text="Помилковий", is_correct=False, order=2
            )
            self.questions.append(q)

        self.start_url = reverse("testing:session-start")
        self.sessions_url = reverse("testing:session-list")

    def test_start_test_session_creates_session(self):
        self.client.force_authenticate(user=self.user)
        payload = {
            "mode": TestSession.Mode.BY_TOPIC,
            "section_id": self.section.id,
            "question_count": 2,
        }
        response = self.client.post(self.start_url, payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["total_questions"], 2)
        self.assertEqual(response.data["status"], "in_progress")

    def test_submit_answer_and_backend_verification(self):
        self.client.force_authenticate(user=self.user)
        session = TestSession.objects.create(
            user=self.user,
            mode=TestSession.Mode.BY_TOPIC,
            section=self.section,
            total_questions=2,
        )

        q1 = self.questions[0]
        correct_opt = q1.answers.get(is_correct=True)
        q2 = self.questions[1]
        incorrect_opt = q2.answers.get(is_correct=False)

        # Відповідаємо правильно на перше
        answer_url = reverse(
            "testing:submit-answer", kwargs={"pk": session.id}
        )
        resp1 = self.client.post(
            answer_url,
            {
                "question_id": q1.id,
                "selected_option_id": correct_opt.id,
                "time_spent_seconds": 15,
            },
        )
        self.assertEqual(resp1.status_code, status.HTTP_200_OK)
        self.assertTrue(resp1.data["is_correct"])

        # Відповідаємо неправильно на друге
        resp2 = self.client.post(
            answer_url,
            {
                "question_id": q2.id,
                "selected_option_id": incorrect_opt.id,
                "time_spent_seconds": 20,
            },
        )
        self.assertEqual(resp2.status_code, status.HTTP_200_OK)
        self.assertFalse(resp2.data["is_correct"])

        session.refresh_from_db()
        self.assertEqual(session.correct_answers_count, 1)
        self.assertEqual(session.incorrect_answers_count, 1)

    def test_finish_test_session_updates_progress_and_statistics(self):
        self.client.force_authenticate(user=self.user)
        session = TestSession.objects.create(
            user=self.user,
            mode=TestSession.Mode.BY_TOPIC,
            section=self.section,
            total_questions=2,
        )

        # Даємо 2 правильні відповіді
        for q in self.questions[:2]:
            correct_opt = q.answers.get(is_correct=True)
            UserAnswer.objects.create(
                session=session,
                question=q,
                selected_option=correct_opt,
                is_correct=True,
            )
        session.correct_answers_count = 2
        session.save()

        finish_url = reverse(
            "testing:finish-session", kwargs={"pk": session.id}
        )
        response = self.client.post(finish_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "completed")
        self.assertTrue(response.data["is_passed"])

        # Перевіряємо агреговану статистику
        stats = UserStatistics.objects.get(user=self.user)
        self.assertEqual(stats.total_questions_answered, 2)
        self.assertEqual(stats.total_correct_answers, 2)
        self.assertEqual(stats.success_rate_percent, 100.0)

        # Перевіряємо прогрес за темою
        topic = TopicProgress.objects.get(user=self.user, section=self.section)
        self.assertEqual(topic.correct_answers, 2)
        self.assertTrue(topic.is_mastered)

    def test_cannot_access_other_user_session(self):
        other_session = TestSession.objects.create(
            user=self.other_user,
            mode=TestSession.Mode.EXAM,
            total_questions=20,
        )
        self.client.force_authenticate(user=self.user)
        detail_url = reverse(
            "testing:session-detail", kwargs={"pk": other_session.id}
        )
        response = self.client.get(detail_url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
