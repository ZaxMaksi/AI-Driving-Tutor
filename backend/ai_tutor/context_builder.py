from traffic_rules.models import RulePoint, RuleSection


class ContextBuilder:
    """Формування структурованого нормативного контексту для Gemini з бази PostgreSQL."""

    @staticmethod
    def get_section_context(section_id, limit_points=15):
        """Отримання контексту цілого розділу або його перших пунктів."""
        section = (
            RuleSection.objects.filter(id=section_id)
            .prefetch_related("points")
            .first()
        )
        if not section:
            return ""

        lines = [f"Розділ {section.number}. {section.title}"]
        if section.description:
            lines.append(section.description[:1000])

        points = section.points.filter(is_active=True).order_by("order")[:limit_points]
        for p in points:
            lines.append(f"Пункт {p.number}: {p.text}")

        return "\n".join(lines)

    @staticmethod
    def get_points_context(point_numbers):
        """Отримання контексту за списком номерів конкретних пунктів (наприклад, ['12.4', '12.9'])."""
        points = RulePoint.objects.filter(
            number__in=point_numbers,
            is_active=True,
        ).select_related("section")

        lines = []
        for p in points:
            lines.append(
                f"[Розділ {p.section.number} «{p.section.title}»] Пункт {p.number}: {p.text}"
            )

        return "\n".join(lines)

    @staticmethod
    def get_question_context(question):
        """Отримання нормативного контексту, зв'язаного з конкретним питанням."""
        points = question.rule_points.all()
        if points.exists():
            return "\n".join(
                [
                    f"Пункт {p.number} (Розділ {p.section.number} «{p.section.title}»): {p.text}"
                    for p in points
                ]
            )
        elif question.section:
            return ContextBuilder.get_section_context(question.section.id)
        return ""
