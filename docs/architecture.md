# Архітектура бази даних та системи AI Driving Tutor

## 1. Загальний огляд

У додатку реалізовано модульну монолітну реляційну структуру на базі PostgreSQL 18. Система розділена на 6 незалежних бізнес-додатків Django:
1. `users` — автентифікація, кастомна модель користувача (вхід за email замість username), JWT-сесії (SimpleJWT).
2. `traffic_rules` — офіційна нормативна база ПДР України (Постанова КМУ № 1306, розділи 1–34, 297 пунктів).
3. `questions` — банк офіційних та ШІ-згенерованих питань, варіанти відповідей, прикріплені зображення з валідацією через Pillow.
4. `testing` — сесії тестування знань користувачів (за темами, змішані, офіційний іспит), фіксація відповідей та обліку часу.
5. `progress` — статистика користувача та динамічне відстеження рівня засвоєння тем ПДР.
6. `ai_tutor` — сервісний шар взаємодії з Google Gemini API, журнал аудиту запитів `AIGenerationLog`, захист від галюцинацій та моніторинг використання токенів.

---

## 2. Повна ER-діаграма системи

```mermaid
erDiagram
    User ||--o{ TestSession : "проходить"
    User ||--o| UserStatistics : "має"
    User ||--o{ TopicProgress : "відстежує"
    User ||--o{ AIGenerationLog : "генерує запити"

    RuleDocument ||--|{ RuleSection : "містить"
    RuleSection ||--|{ RulePoint : "складається з"
    RuleSection ||--o{ Question : "групує"
    RuleSection ||--o{ TestSession : "фокусує"
    RuleSection ||--o{ TopicProgress : "прогрес розділу"

    Question ||--o{ RulePoint : "посилається на норми"
    Question ||--|{ AnswerOption : "має варіанти"
    Question ||--o{ QuestionImage : "ілюструється"
    Question ||--o{ UserAnswer : "відповідається у тесті"

    TestSession ||--|{ UserAnswer : "складається з відповідей"
    AnswerOption ||--o{ UserAnswer : "обрано користувачем"

    User {
        bigint id PK
        varchar email UK "USERNAME_FIELD"
        varchar first_name
        varchar last_name
        boolean is_active
        boolean is_staff
        timestamp date_joined
    }

    RuleDocument {
        bigint id PK
        varchar document_number "1306"
        varchar title
        date edition_date
        boolean is_active
        varchar sha256
    }

    RuleSection {
        bigint id PK
        bigint document_id FK
        smallint number "1..34"
        varchar title
        text description
    }

    RulePoint {
        bigint id PK
        bigint section_id FK
        varchar number "1.1, 1.10"
        text text
        boolean is_active
    }

    Question {
        bigint id PK
        text text
        text explanation
        bigint section_id FK
        varchar question_type "official | ai_generated"
        varchar ai_status "pending | approved | rejected"
        smallint difficulty "1..3"
        boolean is_active
    }

    AnswerOption {
        bigint id PK
        bigint question_id FK
        text text
        boolean is_correct "Перевіряється виключно бекендом"
        smallint order
    }

    QuestionImage {
        bigint id PK
        bigint question_id FK
        varchar image "media/questions/..."
        varchar caption
        boolean is_main
        smallint order
    }

    TestSession {
        bigint id PK
        bigint user_id FK
        varchar mode "by_topic | mixed | exam | ai_training"
        bigint section_id FK
        smallint total_questions
        smallint correct_answers_count
        smallint incorrect_answers_count
        boolean is_passed
        varchar status "in_progress | completed | abandoned"
        timestamp started_at
        timestamp completed_at
    }

    UserAnswer {
        bigint id PK
        bigint session_id FK
        bigint question_id FK
        bigint selected_option_id FK
        boolean is_correct
        smallint time_spent_seconds
        timestamp answered_at
    }

    UserStatistics {
        bigint id PK
        bigint user_id FK "1:1"
        int total_tests_passed
        int total_exams_passed
        int total_questions_answered
        int total_correct_answers
        float success_rate_percent
    }

    TopicProgress {
        bigint id PK
        bigint user_id FK
        bigint section_id FK
        int questions_attempted
        int correct_answers
        int incorrect_answers
        boolean is_mastered
    }

    AIGenerationLog {
        bigint id PK
        bigint user_id FK
        varchar request_type "question_generation | explanation | consultation"
        varchar model_name
        text input_context
        text response_text
        boolean is_successful
    }
```

---

## 3. Критичні архітектурні принципи

1. **Ізоляція підрахунку балів від ШІ:** Правильність кожної відповіді (`AnswerOption.is_correct` та `UserAnswer.is_correct`) встановлюється виключно Django-сервером через транзакційні перевірки в PostgreSQL. Модель Gemini не має доступу до зміни балів і результатів сесій.
2. **Захист від галюцинацій у ПДР:** Будь-яка генерація пояснень або адаптивних запитань отримує виключно верифікований контекст конкретних пунктів `RulePoint` із PostgreSQL.
3. **Модерація згенерованих питань:** Питання, створені ШІ (`ai_generated`), отримують початковий статус `pending` і можуть використовуватись лише у режимі спеціального тренування або після перевірки та схвалення адміністратором (`approved`).

---

## 4. Клієнтська архітектура (Frontend)

Клієнтська частина побудована як сучасний Single Page Application (SPA) на базі React 19, TypeScript та Vite:

1. **Шар доступу до даних (`src/api/`):**
   - Централізований екземпляр Axios (`client.ts`) з перехоплювачами (interceptors):
     - Автоматичне додавання заголовка `Authorization: Bearer <access_token>` для захищених маршрутів.
     - Перехоплювач відповідей зі статусом `401`: прозора спроба оновити токен через `/api/v1/auth/token/refresh/` за допомогою збереженого `refresh_token`, повторення черги невдалих запитів та завершення сесії лише у випадку невалідності токена оновлення.
2. **Керування станом користувача (`src/context/AuthContext.tsx`):**
   - Збереження профілю користувача, стану завантаження та глобальних подій авторизації.
   - Компонент `ProtectedRoute.tsx` для захисту особистого кабінету, історії, активних тестів та аналітики.
3. **Модульна структура сторінок (`src/pages/`):**
   - `HomePage` — головна сторінка та швидкий старт режимів навчання.
   - `TrafficRulesPage` / `SectionDetailPage` — структурований каталог та повнотекстовий пошук за нормами ПДР України.
   - `TestingModesPage` / `TestSessionPage` / `TestResultPage` — повний цикл тестування з таймером зворотного відліку, інтерактивним навігатором питань (зелений/червоний/сірий статус) та перевіркою відповідей.
   - `StatisticsPage` / `HistoryPage` / `ProfilePage` — детальна персональна аналітика, слабкі теми та налаштування.
   - `AITutorPage` / `ExplainModal` — інтерактивна взаємодія з віртуальним автоінструктором на базі Google Gemini API.
