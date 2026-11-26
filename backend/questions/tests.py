import io
import shutil
import tempfile
from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from PIL import Image

from questions.models import AnswerOption, Question, QuestionImage
from questions.validators import validate_question_image
from traffic_rules.models import RuleDocument, RulePoint, RuleSection

MEDIA_ROOT = tempfile.mkdtemp()


@override_settings(MEDIA_ROOT=MEDIA_ROOT)
class QuestionsModelTests(TestCase):
    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        shutil.rmtree(MEDIA_ROOT, ignore_errors=True)

    def setUp(self):
        self.doc = RuleDocument.objects.create(
            title="ПДР України",
            document_number="1306",
        )
        self.section = RuleSection.objects.create(
            document=self.doc,
            number=8,
            title="Регулювання дорожнього руху",
        )
        self.point = RulePoint.objects.create(
            section=self.section,
            number="8.1",
            text="Регулювання дорожнього руху здійснюється за допомогою світлофорів...",
        )

    def _create_test_image(self, format="PNG", size=(100, 100), color="blue"):
        file_obj = io.BytesIO()
        image = Image.new("RGB", size, color=color)
        image.save(file_obj, format=format)
        file_obj.seek(0)
        return SimpleUploadedFile(
            f"test_image.{format.lower()}",
            file_obj.read(),
            content_type=f"image/{format.lower()}",
        )

    def test_create_official_question_without_image(self):
        question = Question.objects.create(
            text="Яким засобом здійснюється регулювання дорожнього руху?",
            explanation="Відповідно до пункту 8.1 ПДР...",
            section=self.section,
            question_type=Question.QuestionType.OFFICIAL,
            ai_status=Question.AIStatus.APPROVED,
        )
        question.rule_points.add(self.point)

        AnswerOption.objects.create(
            question=question,
            text="Дорожніми знаками, розміткою та світлофорами",
            is_correct=True,
            order=1,
        )
        AnswerOption.objects.create(
            question=question,
            text="Лише жестами інших водіїв",
            is_correct=False,
            order=2,
        )

        self.assertEqual(question.answers.count(), 2)
        self.assertEqual(question.answers.filter(is_correct=True).count(), 1)
        self.assertEqual(question.images.count(), 0)
        self.assertEqual(question.rule_points.first().number, "8.1")
        self.assertEqual(question.question_type, "official")

    def test_create_ai_generated_question_lifecycle(self):
        ai_question = Question.objects.create(
            text="Тренувальне питання, згенероване Gemini AI?",
            section=self.section,
            question_type=Question.QuestionType.AI_GENERATED,
            ai_status=Question.AIStatus.PENDING,
        )
        self.assertEqual(ai_question.ai_status, Question.AIStatus.PENDING)

        ai_question.ai_status = Question.AIStatus.APPROVED
        ai_question.save()
        self.assertEqual(
            Question.objects.get(id=ai_question.id).ai_status,
            Question.AIStatus.APPROVED,
        )

    def test_question_with_single_and_multiple_images(self):
        question = Question.objects.create(
            text="Хто має перевагу руху на даному перехресті?",
            section=self.section,
        )

        img1 = self._create_test_image("PNG", color="red")
        img2 = self._create_test_image("JPEG", color="green")

        q_img1 = QuestionImage.objects.create(
            question=question,
            image=img1,
            caption="Схема перехрестя",
            is_main=True,
            order=1,
        )
        q_img2 = QuestionImage.objects.create(
            question=question,
            image=img2,
            caption="Вид з кабіни",
            is_main=False,
            order=2,
        )

        self.assertEqual(question.images.count(), 2)
        images = list(question.images.all())
        self.assertEqual(images[0], q_img1)
        self.assertTrue(images[0].is_main)
        self.assertFalse(images[1].is_main)

    def test_image_validator_rejects_corrupted_or_bad_format(self):
        fake_file = SimpleUploadedFile(
            "bad_file.txt",
            b"this is plain text, not an image",
            content_type="text/plain",
        )
        with self.assertRaises(ValidationError):
            validate_question_image(fake_file)


class QuestionsAPITests(APITestCase):
    def setUp(self):
        self.doc = RuleDocument.objects.create(
            title="ПДР", document_number="1306", is_active=True
        )
        self.sec1 = RuleSection.objects.create(
            document=self.doc, number=1, title="Загальні положення"
        )
        self.sec2 = RuleSection.objects.create(
            document=self.doc, number=2, title="Обов'язки водіїв"
        )

        self.q1 = Question.objects.create(
            text="Офіційне питання розділу 1?",
            explanation="Офіційне нормативне пояснення до питання 1",
            section=self.sec1,
            question_type=Question.QuestionType.OFFICIAL,
            ai_status=Question.AIStatus.APPROVED,
            difficulty=1,
        )
        self.opt1 = AnswerOption.objects.create(
            question=self.q1, text="Правильний варіант", is_correct=True, order=1
        )
        self.opt2 = AnswerOption.objects.create(
            question=self.q1, text="Неправильний варіант", is_correct=False, order=2
        )

        # Несхвалене ШІ питання (не повинно потрапляти до публічного API)
        self.q_pending = Question.objects.create(
            text="ШІ питання, яке ще не схвалене",
            section=self.sec1,
            question_type=Question.QuestionType.AI_GENERATED,
            ai_status=Question.AIStatus.PENDING,
        )

    def test_question_list_api_filters_and_security(self):
        url = reverse("questions:question-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Повертає тільки схвалені питання
        ids = [item["id"] for item in response.data["results"]]
        self.assertIn(self.q1.id, ids)
        self.assertNotIn(self.q_pending.id, ids)

        # Фільтр за розділом
        filter_resp = self.client.get(url + "?section_number=2")
        self.assertEqual(len(filter_resp.data["results"]), 0)

    def test_question_detail_client_api_hides_is_correct(self):
        url = reverse("questions:question-detail", kwargs={"pk": self.q1.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["text"], self.q1.text)

        # Перевірка: прапорець is_correct НЕ повинен повертатися клієнту під час тесту
        for answer in response.data["answers"]:
            self.assertNotIn("is_correct", answer)

    def test_question_result_api_shows_is_correct_and_explanation(self):
        url = reverse("questions:question-result", kwargs={"pk": self.q1.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["explanation"], self.q1.explanation)

        # У результатах прапорець is_correct присутній
        correct_found = False
        for answer in response.data["answers"]:
            self.assertIn("is_correct", answer)
            if answer["is_correct"]:
                correct_found = True
        self.assertTrue(correct_found)


class SeedOfficialQuestionsCommandTests(TestCase):
    def setUp(self):
        self.doc = RuleDocument.objects.create(
            title="ПДР України",
            document_number="1306",
            is_active=True,
        )
        # Create all needed sections so seed command can attach
        for num in [1, 2, 8, 10, 12, 14, 15, 16, 18, 19, 20, 31, 33, 34]:
            RuleSection.objects.get_or_create(
                document=self.doc,
                number=num,
                defaults={"title": f"Розділ {num}"},
            )

    def test_seed_command_creates_questions_and_is_idempotent(self):
        from io import StringIO
        from django.core.management import call_command

        out1 = StringIO()
        call_command("seed_official_questions", stdout=out1)
        initial_count = Question.objects.filter(question_type=Question.QuestionType.OFFICIAL).count()
        self.assertGreaterEqual(initial_count, 20)

        # Idempotence check
        out2 = StringIO()
        call_command("seed_official_questions", stdout=out2)
        second_count = Question.objects.filter(question_type=Question.QuestionType.OFFICIAL).count()
        self.assertEqual(initial_count, second_count)
        self.assertIn("0 створено", out2.getvalue())

