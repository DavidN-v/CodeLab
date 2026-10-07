-- Learning aids: kinds of exercise beyond writing a program, quizzes at the end
-- of lessons, a glossary per course, daily goals and spaced review.

-- CODE: write the program. FIX: repair a broken one. FILL: complete the blanks.
-- PARSONS: put shuffled lines in order. PREDICT: write what a program prints.
-- PROJECT: a larger program that closes a block of modules.
ALTER TABLE exercises
    ADD COLUMN kind VARCHAR(10) NOT NULL DEFAULT 'CODE',
    -- PARSONS only: {"lines": [...], "distractors": [...]}, lines in the right order.
    ADD COLUMN parsons_json TEXT,
    ADD CONSTRAINT ck_exercises_kind CHECK (kind IN ('CODE', 'FIX', 'FILL', 'PARSONS', 'PREDICT', 'PROJECT'));

-- The questions travel with their answers: the quiz is self-assessment.
ALTER TABLE lessons ADD COLUMN quiz_json TEXT;

CREATE TABLE glossary_terms (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    course_id     BIGINT        NOT NULL,
    term          VARCHAR(80)   NOT NULL,
    -- JSON array of other spellings, e.g. plurals.
    aliases_json  TEXT          NOT NULL DEFAULT '[]',
    definition    VARCHAR(600)  NOT NULL,
    display_order INTEGER       NOT NULL,
    created_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT fk_glossary_course FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE,
    CONSTRAINT uq_glossary_term UNIQUE (course_id, term)
);

-- Experience per day the learner aims for.
ALTER TABLE users
    ADD COLUMN daily_goal_xp INTEGER NOT NULL DEFAULT 30,
    ADD CONSTRAINT ck_users_daily_goal CHECK (daily_goal_xp BETWEEN 10 AND 500);

-- Spaced review: a solved exercise comes back after 1, 3, 7, 21 and 60 days.
-- review_stage counts the reviews passed; next_review_at is null until solved.
ALTER TABLE exercise_progress
    ADD COLUMN review_stage   INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN next_review_at TIMESTAMPTZ;

UPDATE exercise_progress
SET next_review_at = solved_at + INTERVAL '1 day'
WHERE solved_at IS NOT NULL;

CREATE INDEX ix_exercise_progress_review ON exercise_progress (user_id, next_review_at)
    WHERE next_review_at IS NOT NULL;
