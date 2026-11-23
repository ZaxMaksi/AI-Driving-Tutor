from datetime import date
from io import StringIO
from django.core.management import call_command
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from traffic_rules.models import RuleDocument, RulePoint, RuleSection


class TrafficRulesModelTests(TestCase):
    def setUp(self):
        self.doc = RuleDocument.objects.create(
            title="Правила дорожнього руху України",
            document_number="1306",
            edition_date=date(2022, 2, 16),
            is_active=True,
        )
        self.section = RuleSection.objects.create(
            document=self.doc,
            number=1,
            title="Загальні положення",
            order=1,
        )
        self.point = RulePoint.objects.create(
            section=self.section,
            number="1.1",
            text="Ці Правила встановлюють єдиний порядок дорожнього руху.",
            order=1,
        )

    def test_document_creation_and_str(self):
        self.assertEqual(str(self.doc), "Правила дорожнього руху України (№ 1306)")
        self.assertTrue(self.doc.is_active)

    def test_section_and_point_relations(self):
        self.assertEqual(self.section.document, self.doc)
        self.assertEqual(self.point.section, self.section)
        self.assertEqual(self.section.points.count(), 1)
        self.assertEqual(self.section.points.first().number, "1.1")

    def test_unique_constraints(self):
        from django.db import IntegrityError, transaction

        with transaction.atomic():
            with self.assertRaises(IntegrityError):
                RuleSection.objects.create(
                    document=self.doc,
                    number=1,
                    title="Дублікат розділу",
                )

        with transaction.atomic():
            with self.assertRaises(IntegrityError):
                RulePoint.objects.create(
                    section=self.section,
                    number="1.1",
                    text="Дублікат тексту",
                )


class TrafficRulesImportCommandTests(TestCase):
    def test_import_command_and_idempotence(self):
        out = StringIO()
        call_command("import_traffic_rules", stdout=out)
        output = out.getvalue()

        self.assertIn("Звіт імпорту ПДР", output)
        self.assertEqual(RuleSection.objects.count(), 34)
        self.assertGreater(RulePoint.objects.count(), 200)

        # Повторный запуск без дублирования
        out_second = StringIO()
        call_command("import_traffic_rules", stdout=out_second)
        self.assertEqual(RuleSection.objects.count(), 34)
        self.assertIn("вже імпортований", out_second.getvalue())

        # Проверка контекста для Gemini (получение пунктов конкретного раздела)
        sec_1 = RuleSection.objects.get(number=1)
        points_1 = sec_1.points.all()
        self.assertTrue(points_1.filter(number="1.1").exists())
        self.assertTrue(points_1.filter(number="1.10").exists())


class TrafficRulesAPITests(APITestCase):
    def setUp(self):
        self.doc = RuleDocument.objects.create(
            title="Правила дорожнього руху",
            document_number="1306",
            is_active=True,
        )
        self.section = RuleSection.objects.create(
            document=self.doc,
            number=1,
            title="Загальні положення",
            order=1,
        )
        self.point = RulePoint.objects.create(
            section=self.section,
            number="1.1",
            text="Ці Правила встановлюють єдиний порядок дорожнього руху на всій території України.",
            order=1,
        )

    def test_list_sections_api(self):
        url = reverse("traffic_rules:section-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["number"], 1)
        self.assertEqual(response.data[0]["points_count"], 1)

    def test_retrieve_section_detail_api(self):
        url = reverse("traffic_rules:section-detail", kwargs={"number": 1})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["number"], 1)
        self.assertEqual(len(response.data["points"]), 1)
        self.assertEqual(response.data["points"][0]["number"], "1.1")

    def test_retrieve_point_detail_api(self):
        url = reverse("traffic_rules:point-detail", kwargs={"number": "1.1"})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["number"], "1.1")
        self.assertIn("єдиний порядок", response.data["text"])

    def test_search_points_api(self):
        url = reverse("traffic_rules:point-search") + "?search=порядок"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data["results"]), 1)
