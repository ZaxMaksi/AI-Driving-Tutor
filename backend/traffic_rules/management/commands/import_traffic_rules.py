import hashlib
import json
import re
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from traffic_rules.models import RuleDocument, RulePoint, RuleSection


class Command(BaseCommand):
    help = "Імпорт нормативного тексту Правил дорожнього руху з структурованого Markdown у PostgreSQL"

    def add_arguments(self, parser):
        parser.add_argument(
            "--file",
            type=str,
            default=None,
            help="Шлях до файлу traffic_rules.md (за замовчуванням: backend/data/traffic_rules/traffic_rules.md)",
        )
        parser.add_argument(
            "--metadata",
            type=str,
            default=None,
            help="Шлях до файлу metadata.json (за замовчуванням: backend/data/traffic_rules/metadata.json)",
        )
        parser.add_argument(
            "--force",
            action="store_true",
            help="Примусово оновити дані, навіть якщо документ вже імпортовано з цим хешем",
        )

    def handle(self, *args, **options):
        base_dir = settings.BASE_DIR
        md_path = (
            Path(options["file"])
            if options["file"]
            else base_dir / "data" / "traffic_rules" / "traffic_rules.md"
        )
        meta_path = (
            Path(options["metadata"])
            if options["metadata"]
            else base_dir / "data" / "traffic_rules" / "metadata.json"
        )

        if not md_path.exists():
            raise CommandError(f"Файл з правилами не знайдено за шляхом: {md_path}")

        self.stdout.write(f"Зчитування нормативного файлу: {md_path}")
        with open(md_path, "r", encoding="utf-8") as f:
            md_content = f.read()

        current_hash = hashlib.sha256(md_content.encode("utf-8")).hexdigest()

        meta_info = {}
        if meta_path.exists():
            with open(meta_path, "r", encoding="utf-8") as f:
                meta_info = json.load(f)

        doc_title = meta_info.get("title", "Правила дорожнього руху України")
        doc_number = meta_info.get("document_number", "1306")
        doc_type = meta_info.get(
            "document_type", "Постанова Кабінету Міністрів України"
        )
        source_url = meta_info.get(
            "source_url",
            "https://zakon.rada.gov.ua/laws/show/1306-2001-%D0%BF#Text",
        )
        adoption_date = meta_info.get("adoption_date")
        edition_date = meta_info.get("edition_date")

        with transaction.atomic():
            document, doc_created = RuleDocument.objects.get_or_create(
                document_number=doc_number,
                is_active=True,
                defaults={
                    "title": doc_title,
                    "document_type": doc_type,
                    "source_url": source_url,
                    "adoption_date": adoption_date,
                    "edition_date": edition_date,
                    "sha256": current_hash,
                    "version": "1.0",
                },
            )

            if not doc_created:
                if document.sha256 == current_hash and not options["force"]:
                    self.stdout.write(
                        self.style.WARNING(
                            f"Документ № {doc_number} вже імпортований з актуальним хешем ({current_hash[:8]}...). "
                            f"Використовуйте --force для примусового переімпорту."
                        )
                    )
                document.title = doc_title
                document.document_type = doc_type
                document.source_url = source_url
                document.edition_date = edition_date
                document.sha256 = current_hash
                document.save()

            # Парсинг розділів і пунктів
            # Розділи задаються як: ## Розділ N. Назва
            section_regex = re.compile(
                r"^##\s+Розділ\s+(\d+)\.\s+([^\n]+)", re.MULTILINE
            )
            section_matches = list(section_regex.finditer(md_content))

            if not section_matches:
                raise CommandError(
                    "У файлі не знайдено заголовків розділів формату '## Розділ N. Назва'"
                )

            sections_created = 0
            sections_updated = 0
            points_created = 0
            points_updated = 0

            for idx, sec_match in enumerate(section_matches):
                sec_num = int(sec_match.group(1))
                sec_title = sec_match.group(2).strip()

                sec_start = sec_match.end()
                sec_end = (
                    section_matches[idx + 1].start()
                    if idx + 1 < len(section_matches)
                    else len(md_content)
                )
                sec_body = md_content[sec_start:sec_end].strip()

                section, s_created = RuleSection.objects.update_or_create(
                    document=document,
                    number=sec_num,
                    defaults={
                        "title": sec_title,
                        "description": sec_body if sec_num in [33, 34] else "",
                        "order": sec_num,
                    },
                )

                if s_created:
                    sections_created += 1
                else:
                    sections_updated += 1

                # Парсинг пунктів у розділах
                # Пункти задаються як: ### Пункт N.M
                point_regex = re.compile(
                    r"^###\s+Пункт\s+([0-9\.]+)", re.MULTILINE
                )
                point_matches = list(point_regex.finditer(sec_body))

                for p_idx, p_match in enumerate(point_matches):
                    p_num = p_match.group(1).rstrip(".").strip()
                    p_start = p_match.end()
                    p_end = (
                        point_matches[p_idx + 1].start()
                        if p_idx + 1 < len(point_matches)
                        else len(sec_body)
                    )
                    p_text = sec_body[p_start:p_end].strip()

                    point, p_created = RulePoint.objects.update_or_create(
                        section=section,
                        number=p_num,
                        defaults={
                            "text": p_text,
                            "order": p_idx + 1,
                            "is_active": True,
                        },
                    )

                    if p_created:
                        points_created += 1
                    else:
                        points_updated += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"\n--- Звіт імпорту ПДР ---\n"
                f"Документ: {document.title} (№ {document.document_number})\n"
                f"Розділів: створено {sections_created}, оновлено {sections_updated} (всього: {RuleSection.objects.filter(document=document).count()})\n"
                f"Пунктів:  створено {points_created}, оновлено {points_updated} (всього: {RulePoint.objects.filter(section__document=document).count()})\n"
                f"Статус: успішно імпортовано та синхронізовано з PostgreSQL."
            )
        )
