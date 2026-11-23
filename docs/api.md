# Справочник REST API (v1)

Все эндпоинты имеют базовый префикс `/api/v1/`.
Формат обмена данными: `application/json`.
Аутентификация для защищённых маршрутов: заголовок `Authorization: Bearer <access_token>`.

---

## 1. Служебные эндпоинты

- `GET /api/v1/health/` — проверка доступности API сервиса.
- `GET /api/schema/` — OpenAPI 3.0 схема (JSON/YAML).
- `GET /api/docs/` — интерактивный Swagger UI.
- `GET /api/redoc/` — интерактивная документация Redoc.

---

## 2. Аутентификация и профиль (`/api/v1/auth/`)

- `POST /api/v1/auth/register/` — регистрация нового пользователя (email, password, password_confirm, first_name, last_name). Возвращает токены и данные пользователя.
- `POST /api/v1/auth/login/` — авторизация по email и паролю. Возвращает `access` (60 мин), `refresh` (7 дней) и профиль.
- `POST /api/v1/auth/token/refresh/` — получение нового access токена по refresh токену.
- `POST /api/v1/auth/logout/` — отзыв сессии (принимает `refresh`).
- `GET /api/v1/auth/profile/` — получение персонального профиля текущего пользователя (защищено).
- `PATCH /api/v1/auth/profile/` — редактирование имени и фамилии (защищено).
- `POST /api/v1/auth/change-password/` — смена пароля авторизованным пользователем.

---

## 3. Нормативная база ПДД Украины (`/api/v1/traffic-rules/`)

- `GET /api/v1/traffic-rules/sections/` — перечень всех 34 разделов ПДД с числом пунктов.
- `GET /api/v1/traffic-rules/sections/{number}/` — полный текст раздела со всеми вложенными пунктами (1–34).
- `GET /api/v1/traffic-rules/points/{number}/` — получение конкретного пункта правил по номеру (например `1.10`, `12.4`).
- `GET /api/v1/traffic-rules/points/search/?search=...` — полнотекстовый поиск по тексту и номерам норм ПДД.

---

## 4. Банк вопросов и изображений (`/api/v1/questions/`)

- `GET /api/v1/questions/` — фильтрация вопросов (`section_number`, `difficulty`, `question_type`).
- `GET /api/v1/questions/{id}/` — просмотр вопроса для прохождения теста (**скрывает** флаг правильности `is_correct`).
- `GET /api/v1/questions/{id}/result/` — разбор вопроса после ответа (с раскрытием `is_correct` и нормативного объяснения).

---

## 5. Система тестирования (`/api/v1/testing/`)

- `POST /api/v1/testing/start/` — создание новой сессии (режимы: `exam`, `by_topic`, `mixed`, `ai_training`).
- `GET /api/v1/testing/sessions/` — история прохождения тестов текущего пользователя.
- `GET /api/v1/testing/sessions/{id}/` — детальный просмотр сессии со всеми ответами и ошибками.
- `POST /api/v1/testing/sessions/{id}/answer/` — отправка ответа (`question_id`, `selected_option_id`, `time_spent_seconds`). Правильность проверяется строго сервером.
- `POST /api/v1/testing/sessions/{id}/finish/` — завершение теста, расчёт сдачи ($\le 2$ ошибок для экзамена), авто-обновление статистики.

---

## 6. Прогресс и рекомендации (`/api/v1/progress/`)

- `GET /api/v1/progress/summary/` — общая статистика: число тестов, экзаменов, ответов, средний процент успеха.
- `GET /api/v1/progress/topics/` — детальный прогресс по каждому из 34 разделов ПДД (освоена ли тема при $\ge 90\%$).
- `GET /api/v1/progress/recommendations/` — топ-5 разделов с наибольшим числом ошибок и персонализированные рекомендации.

---

## 7. AI Tutor (Gemini API) (`/api/v1/ai-tutor/`)

- `POST /api/v1/ai-tutor/generate-question/` — генерация учебного вопроса через Gemini со структурированным ответом и сохранением в статусе `pending`.
- `POST /api/v1/ai-tutor/explain-mistake/` — генерация развёрнутого педагогического объяснения ошибки ученика с опорой на нормы ПДД из PostgreSQL.
- `POST /api/v1/ai-tutor/consult/` — консультация студента с автоинструктором на естественном украинском языке.
- `GET /api/v1/ai-tutor/logs/` — журнал аудита вызовов к LLM текущего пользователя.
