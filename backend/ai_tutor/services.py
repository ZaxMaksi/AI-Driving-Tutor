import json
import logging
from django.conf import settings
from django.db import transaction
from pydantic import BaseModel, Field
from rest_framework.exceptions import ValidationError

from ai_tutor.client import get_gemini_client
from ai_tutor.context_builder import ContextBuilder
from ai_tutor.models import AIGenerationLog
from ai_tutor.prompts import (
    CONSULTATION_PROMPT,
    EXPLAIN_MISTAKE_PROMPT,
    GENERATE_QUESTION_PROMPT,
    SYSTEM_INSTRUCTION,
)
from questions.models import AnswerOption, Question
from traffic_rules.models import RulePoint, RuleSection

logger = logging.getLogger(__name__)


class GeneratedAnswerOption(BaseModel):
    text: str = Field(description="Текст варіанта відповіді")
    is_correct: bool = Field(description="Чи є цей варіант відповіді правильним")


class GeneratedQuestionSchema(BaseModel):
    text: str = Field(description="Текст навчального питання")
    explanation: str = Field(
        description="Вичерпне офіційне пояснення правильної відповіді з посиланням на ПДР"
    )
    rule_point_number: str = Field(
        description="Номер пункту ПДР, на якому базується питання (наприклад, '1.10' або '12.4')"
    )
    answers: list[GeneratedAnswerOption] = Field(
        description="Список від 3 до 4 варіантів відповідей, з яких РІВНО один правильний"
    )


class GeminiTutorService:
    """Сервісний шар взаємодії з моделлю Gemini."""

    @classmethod
    def generate_question(cls, section_id, user=None):
        """Генерація навчального питання зі збереженням у статусі pending."""
        section = RuleSection.objects.filter(id=section_id).first()
        if not section:
            raise ValidationError({"section_id": "Розділ ПДР не знайдено."})

        context = ContextBuilder.get_section_context(section_id)
        if not context:
            raise ValidationError("Недостатньо нормативного контексту для генерації.")

        prompt = GENERATE_QUESTION_PROMPT.format(context=context)
        model_name = getattr(settings, "GEMINI_MODEL", "gemini-2.5-flash")
        client = get_gemini_client()

        log = AIGenerationLog(
            user=user,
            request_type=AIGenerationLog.RequestType.QUESTION_GENERATION,
            model_name=model_name,
            input_context=context[:2000],
        )

        try:
            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
                config={
                    "system_instruction": SYSTEM_INSTRUCTION,
                    "response_mime_type": "application/json",
                    "response_schema": GeneratedQuestionSchema,
                    "temperature": 0.2,
                },
            )

            response_json = json.loads(response.text)
            parsed_data = GeneratedQuestionSchema(**response_json)

            # Валідація отриманих даних
            correct_answers = [a for a in parsed_data.answers if a.is_correct]
            if len(correct_answers) != 1:
                raise ValueError("Модель повернула некоректну кількість правильних відповідей.")

            if len(parsed_data.answers) < 3:
                raise ValueError("Недостатня кількість варіантів відповідей (потрібно мінімум 3).")

            with transaction.atomic():
                question = Question.objects.create(
                    text=parsed_data.text,
                    explanation=parsed_data.explanation,
                    section=section,
                    question_type=Question.QuestionType.AI_GENERATED,
                    ai_status=Question.AIStatus.PENDING,
                )

                # Прив'язка знайденого пункту правил
                p_number = parsed_data.rule_point_number.strip().rstrip(".")
                rule_point = RulePoint.objects.filter(
                    section=section, number=p_number
                ).first()
                if rule_point:
                    question.rule_points.add(rule_point)

                for idx, ans in enumerate(parsed_data.answers, start=1):
                    AnswerOption.objects.create(
                        question=question,
                        text=ans.text,
                        is_correct=ans.is_correct,
                        order=idx,
                    )

            log.response_text = response.text
            log.is_successful = True
            log.save()

            return question

        except Exception as e:
            log.is_successful = False
            log.error_message = str(e)
            log.save()
            logger.error(f"Помилка генерації питання в Gemini: {e}")
            raise ValidationError(f"Не вдалося згенерувати питання через ШІ: {e}")

    @classmethod
    def explain_mistake(cls, question_id, selected_option_id, user=None):
        """Формування детального пояснення допущеної помилки."""
        question = Question.objects.filter(id=question_id).first()
        if not question:
            raise ValidationError({"question_id": "Питання не знайдено."})

        selected_option = AnswerOption.objects.filter(id=selected_option_id).first()
        if not selected_option:
            raise ValidationError({"selected_option_id": "Варіант не знайдено."})

        correct_option = question.answers.filter(is_correct=True).first()
        options_text = "\n".join([f"- {opt.text}" for opt in question.answers.all()])
        context = ContextBuilder.get_question_context(question)

        prompt = EXPLAIN_MISTAKE_PROMPT.format(
            question_text=question.text,
            options_text=options_text,
            user_selected_text=selected_option.text,
            correct_option_text=correct_option.text if correct_option else "Не вказано",
            context=context,
        )

        model_name = getattr(settings, "GEMINI_MODEL", "gemini-2.5-flash")
        client = get_gemini_client()

        log = AIGenerationLog(
            user=user,
            request_type=AIGenerationLog.RequestType.EXPLANATION,
            model_name=model_name,
            input_context=context[:2000],
        )

        try:
            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
                config={
                    "system_instruction": SYSTEM_INSTRUCTION,
                    "temperature": 0.3,
                },
            )
            explanation_text = response.text

            log.response_text = explanation_text
            log.is_successful = True
            log.save()

            return explanation_text

        except Exception as e:
            log.is_successful = False
            log.error_message = str(e)
            log.save()
            logger.error(f"Помилка генерації пояснення помилки в Gemini: {e}")
            raise ValidationError(f"Не вдалося згенерувати пояснення: {e}")

    @classmethod
    def consult(cls, user_query, section_id=None, user=None):
        """Консультація студента з автоінструктором Gemini."""
        if section_id:
            context = ContextBuilder.get_section_context(section_id)
        else:
            context = "Загальні правила дорожнього руху України."

        prompt = CONSULTATION_PROMPT.format(
            user_query=user_query,
            context=context,
        )

        model_name = getattr(settings, "GEMINI_MODEL", "gemini-2.5-flash")
        client = get_gemini_client()

        log = AIGenerationLog(
            user=user,
            request_type=AIGenerationLog.RequestType.CONSULTATION,
            model_name=model_name,
            input_context=context[:2000],
        )

        try:
            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
                config={
                    "system_instruction": SYSTEM_INSTRUCTION,
                    "temperature": 0.4,
                },
            )
            answer_text = response.text

            log.response_text = answer_text
            log.is_successful = True
            log.save()

            return answer_text

        except Exception as e:
            log.is_successful = False
            log.error_message = str(e)
            log.save()
            logger.error(f"Помилка консультації в Gemini: {e}")
            raise ValidationError(f"Не вдалося отримати відповідь автоінструктора: {e}")
