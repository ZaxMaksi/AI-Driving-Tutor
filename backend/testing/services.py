import random
from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from questions.models import Question
from testing.models import TestSession, UserAnswer


class TestSessionService:
    """Сервісний шар управління життєвим циклом тестових сесій."""

    @staticmethod
    def start_session(user, mode=TestSession.Mode.EXAM, section=None, question_count=20):
        """Створення нової тестової сесії та формування випадкового набору питань."""
        queryset = Question.objects.filter(
            is_active=True,
            ai_status=Question.AIStatus.APPROVED,
        )

        if mode == TestSession.Mode.BY_TOPIC:
            if not section:
                raise ValidationError({"section": "Для тесту за розділом необхідно вказати розділ ПДР."})
            queryset = queryset.filter(section=section)

        available_count = queryset.count()
        if available_count == 0:
            raise ValidationError("Не знайдено доступних питань для вибраних критеріїв тесту.")

        actual_count = min(question_count, available_count)

        with transaction.atomic():
            session = TestSession.objects.create(
                user=user,
                mode=mode,
                section=section,
                total_questions=actual_count,
                status=TestSession.Status.IN_PROGRESS,
            )

        return session

    @staticmethod
    def submit_answer(session, question_id, selected_option_id, time_spent=0):
        """Прийом та бекенд-перевірка відповіді користувача на питання."""
        if session.status != TestSession.Status.IN_PROGRESS:
            raise ValidationError("Тестова сесія вже завершена або перервана.")

        question = Question.objects.filter(id=question_id, is_active=True).first()
        if not question:
            raise ValidationError({"question_id": "Питання не знайдено."})

        # Перевірка: чи належить варіант відповіді цьому питанню
        selected_option = question.answers.filter(id=selected_option_id).first()
        if not selected_option:
            raise ValidationError({"selected_option_id": "Вказаний варіант відповіді не належить даному питанню."})

        # Критичний архітектурний принцип: правильність перевіряється виключно бекендом
        is_correct = selected_option.is_correct

        with transaction.atomic():
            answer, created = UserAnswer.objects.update_or_create(
                session=session,
                question=question,
                defaults={
                    "selected_option": selected_option,
                    "is_correct": is_correct,
                    "time_spent_seconds": time_spent,
                },
            )

            # Оновлюємо лічильники сесії
            correct_count = session.user_answers.filter(is_correct=True).count()
            incorrect_count = session.user_answers.filter(is_correct=False).count()

            session.correct_answers_count = correct_count
            session.incorrect_answers_count = incorrect_count
            session.save(update_fields=["correct_answers_count", "incorrect_answers_count"])

        return answer

    @staticmethod
    def finish_session(session):
        """Завершення тестової сесії та підбиття остаточних результатів."""
        if session.status == TestSession.Status.COMPLETED:
            return session

        with transaction.atomic():
            now = timezone.now()
            session.completed_at = now
            session.status = TestSession.Status.COMPLETED

            if session.started_at:
                session.duration_seconds = int((now - session.started_at).total_seconds())

            # Критерій складання офіційного іспиту ПДР України: не більше 2 помилок
            if session.mode == TestSession.Mode.EXAM:
                session.is_passed = session.incorrect_answers_count <= 2 and session.user_answers.count() >= session.total_questions
            else:
                total_answered = session.user_answers.count()
                success_ratio = (session.correct_answers_count / total_answered) if total_answered > 0 else 0
                session.is_passed = success_ratio >= 0.85

            session.save()

            # Оновлення прогресу та статистики користувача
            from progress.models import UserStatistics, TopicProgress
            stats, _ = UserStatistics.objects.get_or_create(user=session.user)
            stats.total_questions_answered += session.user_answers.count()
            stats.total_correct_answers += session.correct_answers_count

            if session.is_passed:
                if session.mode == TestSession.Mode.EXAM:
                    stats.total_exams_passed += 1
                else:
                    stats.total_tests_passed += 1

            if stats.total_questions_answered > 0:
                stats.success_rate_percent = round(
                    (stats.total_correct_answers / stats.total_questions_answered) * 100, 2
                )
            stats.save()

            # Якщо тест був тематичним, оновлюємо TopicProgress
            if session.section:
                topic, _ = TopicProgress.objects.get_or_create(
                    user=session.user, section=session.section
                )
                topic.questions_attempted += session.user_answers.count()
                topic.correct_answers += session.correct_answers_count
                topic.incorrect_answers += session.incorrect_answers_count
                if topic.questions_attempted > 0:
                    topic.is_mastered = (topic.correct_answers / topic.questions_attempted) >= 0.90
                topic.save()

        return session
