import json
from unittest.mock import MagicMock, patch

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from ai_tutor.models import AIGenerationLog
from ai_tutor.services import GeminiTutorService
from questions.models import AnswerOption, Question
from traffic_rules.models import RuleDocument, RulePoint, RuleSection

User = get_user_model()


class AITutorTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="ai_student@example.com",
            password="StrongPassword123!",
        )

        self.doc = RuleDocument.objects.create(
            title="ПДР", document_number="1306", is_active=True
        )
        self.section = RuleSection.objects.create(
            document=self.doc, number=12, title="Швидкість руху"
        )
        self.point = RulePoint.objects.create(
            section=self.section,
            number="12.4",
            text="У населених пунктах рух транспортних засобів дозволяється із швидкістю не більше 50 км/год.",
        )

        self.question = Question.objects.create(
            text="Яка максимальна швидкість руху дозволена у населених пунктах?",
            section=self.section,
            question_type=Question.QuestionType.OFFICIAL,
            ai_status=Question.AIStatus.APPROVED,
        )
        self.correct_opt = AnswerOption.objects.create(
            question=self.question,
            text="50 км/год",
            is_correct=True,
            order=1,
        )
        self.wrong_opt = AnswerOption.objects.create(
            question=self.question,
            text="60 км/год",
            is_correct=False,
            order=2,
        )

    @patch("ai_tutor.services.get_gemini_client")
    def test_generate_question_service_with_mock(self, mock_client_func):
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.text = json.dumps(
            {
                "text": "З якою максимальною швидкістю дозволено рух у житлових зонах?",
                "explanation": "Згідно з пунктом 12.5 ПДР, у житлових і пішохідних зонах швидкість не більше 20 км/год.",
                "rule_point_number": "12.4",
                "answers": [
                    {"text": "20 км/год", "is_correct": True},
                    {"text": "30 км/год", "is_correct": False},
                    {"text": "50 км/год", "is_correct": False},
                ],
            }
        )
        mock_client.models.generate_content.return_value = mock_response
        mock_client_func.return_value = mock_client

        generated_q = GeminiTutorService.generate_question(
            section_id=self.section.id, user=self.user
        )

        self.assertIsNotNone(generated_q)
        self.assertEqual(generated_q.question_type, Question.QuestionType.AI_GENERATED)
        self.assertEqual(generated_q.ai_status, Question.AIStatus.PENDING)
        self.assertEqual(generated_q.answers.count(), 3)
        self.assertEqual(generated_q.answers.filter(is_correct=True).count(), 1)

        # Перевірка запису в лог
        log = AIGenerationLog.objects.filter(
            request_type=AIGenerationLog.RequestType.QUESTION_GENERATION
        ).first()
        self.assertIsNotNone(log)
        self.assertTrue(log.is_successful)

    @patch("ai_tutor.services.get_gemini_client")
    def test_explain_mistake_service_with_mock(self, mock_client_func):
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.text = (
            "Помилка полягає в тому, що норма 60 км/год була змінена ще у 2018 році. "
            "Відповідно до пункту 12.4 ПДР, дозволена швидкість становить 50 км/год."
        )
        mock_client.models.generate_content.return_value = mock_response
        mock_client_func.return_value = mock_client

        explanation = GeminiTutorService.explain_mistake(
            question_id=self.question.id,
            selected_option_id=self.wrong_opt.id,
            user=self.user,
        )

        self.assertIn("12.4", explanation)
        self.assertTrue(
            AIGenerationLog.objects.filter(
                request_type=AIGenerationLog.RequestType.EXPLANATION
            ).exists()
        )

    @patch("ai_tutor.services.get_gemini_client")
    def test_api_consultation_endpoint(self, mock_client_func):
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.text = "Так, подавати сигнал покажчиком повороту необхідно обов'язково перед кожним маневром."
        mock_client.models.generate_content.return_value = mock_response
        mock_client_func.return_value = mock_client

        self.client.force_authenticate(user=self.user)
        url = reverse("ai_tutor:consult")
        payload = {
            "query": "Чи потрібно вмикати поворотник при виїзді з прибудинкової території?",
            "section_id": self.section.id,
        }
        response = self.client.post(url, payload)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("покажчиком повороту", response.data["answer"])

    @patch("ai_tutor.services.get_gemini_client")
    def test_gemini_api_failure_handled_gracefully(self, mock_client_func):
        mock_client = MagicMock()
        mock_client.models.generate_content.side_effect = Exception("Gemini API connection error")
        mock_client_func.return_value = mock_client

        with self.assertRaises(Exception):
            GeminiTutorService.consult(
                user_query="Чи можна розвертатися?",
                section_id=self.section.id,
                user=self.user,
            )

        # Перевірка запису невдалого звернення до журналу аудиту
        failed_log = AIGenerationLog.objects.filter(
            request_type=AIGenerationLog.RequestType.CONSULTATION,
            is_successful=False,
        ).first()
        self.assertIsNotNone(failed_log)
        self.assertIn("Gemini API connection error", failed_log.error_message)

