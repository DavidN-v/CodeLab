-- Learning content (lessons and exercises), accounts and progress.
--
-- Lessons and exercises are written as files under resources/content and
-- synchronised into these tables at start-up (ContentImporter). The schema is
-- still owned by Flyway; only the rows come from the content files.

CREATE TABLE lessons (
    id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    module_id         BIGINT       NOT NULL,
    slug              VARCHAR(80)  NOT NULL,
    title             VARCHAR(160) NOT NULL,
    summary           VARCHAR(300) NOT NULL,
    content_markdown  TEXT         NOT NULL,
    estimated_minutes INTEGER      NOT NULL,
    published         BOOLEAN      NOT NULL DEFAULT TRUE,
    display_order     INTEGER      NOT NULL,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT fk_lessons_module FOREIGN KEY (module_id) REFERENCES modules (id) ON DELETE CASCADE,
    CONSTRAINT uq_lessons_module_slug UNIQUE (module_id, slug),
    CONSTRAINT ck_lessons_slug CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
    CONSTRAINT ck_lessons_minutes CHECK (estimated_minutes > 0)
);

CREATE INDEX ix_lessons_module ON lessons (module_id, display_order);

-- Exercise slugs are unique platform-wide: they are the URL of the exercise.
CREATE TABLE exercises (
    id                 BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    module_id          BIGINT       NOT NULL,
    slug               VARCHAR(80)  NOT NULL,
    title              VARCHAR(160) NOT NULL,
    summary            VARCHAR(300) NOT NULL,
    difficulty         VARCHAR(10)  NOT NULL,
    statement_markdown TEXT         NOT NULL,
    starter_code       TEXT         NOT NULL,
    solution_code      TEXT         NOT NULL,
    published          BOOLEAN      NOT NULL DEFAULT TRUE,
    display_order      INTEGER      NOT NULL,
    created_at         TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT fk_exercises_module FOREIGN KEY (module_id) REFERENCES modules (id) ON DELETE CASCADE,
    CONSTRAINT uq_exercises_slug UNIQUE (slug),
    CONSTRAINT ck_exercises_slug CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
    CONSTRAINT ck_exercises_difficulty CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD'))
);

CREATE INDEX ix_exercises_module ON exercises (module_id, display_order);

-- Sample cases are shown to the learner; the rest stay on the server.
CREATE TABLE exercise_test_cases (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    exercise_id     BIGINT      NOT NULL,
    position        INTEGER     NOT NULL,
    stdin           TEXT        NOT NULL DEFAULT '',
    expected_stdout TEXT        NOT NULL,
    sample          BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_test_cases_exercise FOREIGN KEY (exercise_id) REFERENCES exercises (id) ON DELETE CASCADE,
    CONSTRAINT uq_test_cases_position UNIQUE (exercise_id, position)
);

CREATE TABLE exercise_hints (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    exercise_id BIGINT      NOT NULL,
    position    INTEGER     NOT NULL,
    content     TEXT        NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_hints_exercise FOREIGN KEY (exercise_id) REFERENCES exercises (id) ON DELETE CASCADE,
    CONSTRAINT uq_hints_position UNIQUE (exercise_id, position)
);

-- Emails are stored lower-cased, so the unique constraint is case-insensitive.
CREATE TABLE users (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email         VARCHAR(254) NOT NULL,
    display_name  VARCHAR(60)  NOT NULL,
    password_hash VARCHAR(100) NOT NULL,
    role          VARCHAR(20)  NOT NULL DEFAULT 'STUDENT',
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_users_email UNIQUE (email),
    CONSTRAINT ck_users_email_lowercase CHECK (email = lower(email)),
    CONSTRAINT ck_users_role CHECK (role IN ('STUDENT', 'ADMIN'))
);

CREATE TABLE lesson_progress (
    id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id      BIGINT      NOT NULL,
    lesson_id    BIGINT      NOT NULL,
    completed_at TIMESTAMPTZ NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_lesson_progress_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_lesson_progress_lesson FOREIGN KEY (lesson_id) REFERENCES lessons (id) ON DELETE CASCADE,
    CONSTRAINT uq_lesson_progress UNIQUE (user_id, lesson_id)
);

-- One row per learner and exercise they have opened a hint for or submitted to.
CREATE TABLE exercise_progress (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id         BIGINT      NOT NULL,
    exercise_id     BIGINT      NOT NULL,
    attempts        INTEGER     NOT NULL DEFAULT 0,
    hints_revealed  INTEGER     NOT NULL DEFAULT 0,
    solution_viewed BOOLEAN     NOT NULL DEFAULT FALSE,
    solved_at       TIMESTAMPTZ,
    xp_awarded      INTEGER     NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_exercise_progress_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_exercise_progress_exercise FOREIGN KEY (exercise_id) REFERENCES exercises (id) ON DELETE CASCADE,
    CONSTRAINT uq_exercise_progress UNIQUE (user_id, exercise_id)
);

CREATE TABLE submissions (
    id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id           BIGINT      NOT NULL,
    exercise_id       BIGINT      NOT NULL,
    source_code       TEXT        NOT NULL,
    status            VARCHAR(30) NOT NULL,
    passed_tests      INTEGER     NOT NULL,
    total_tests       INTEGER     NOT NULL,
    execution_time_ms INTEGER,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_submissions_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_submissions_exercise FOREIGN KEY (exercise_id) REFERENCES exercises (id) ON DELETE CASCADE,
    CONSTRAINT ck_submissions_status CHECK (status IN ('ACCEPTED', 'WRONG_ANSWER', 'COMPILATION_ERROR',
                                                       'RUNTIME_ERROR', 'TIME_LIMIT_EXCEEDED'))
);

CREATE INDEX ix_submissions_user_created ON submissions (user_id, created_at DESC);
CREATE INDEX ix_submissions_user_exercise ON submissions (user_id, exercise_id, created_at DESC);
