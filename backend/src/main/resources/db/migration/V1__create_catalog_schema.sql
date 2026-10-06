-- Content catalog: language -> course -> module.
-- Nothing here is specific to Java; a new language is a new row, not a new table.

CREATE TABLE languages (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    slug          VARCHAR(40)  NOT NULL,
    name          VARCHAR(80)  NOT NULL,
    version       VARCHAR(20),
    icon          VARCHAR(40),
    tagline       VARCHAR(200) NOT NULL,
    description   TEXT,
    active        BOOLEAN      NOT NULL DEFAULT FALSE,
    display_order INTEGER      NOT NULL,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_languages_slug UNIQUE (slug),
    CONSTRAINT ck_languages_slug CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

CREATE TABLE courses (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    language_id   BIGINT       NOT NULL,
    slug          VARCHAR(80)  NOT NULL,
    title         VARCHAR(120) NOT NULL,
    summary       VARCHAR(300) NOT NULL,
    description   TEXT,
    published     BOOLEAN      NOT NULL DEFAULT FALSE,
    display_order INTEGER      NOT NULL,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT fk_courses_language FOREIGN KEY (language_id) REFERENCES languages (id),
    CONSTRAINT uq_courses_slug UNIQUE (slug),
    CONSTRAINT ck_courses_slug CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

CREATE INDEX ix_courses_language ON courses (language_id);

CREATE TABLE modules (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    course_id     BIGINT       NOT NULL,
    slug          VARCHAR(80)  NOT NULL,
    title         VARCHAR(120) NOT NULL,
    summary       VARCHAR(300) NOT NULL,
    published     BOOLEAN      NOT NULL DEFAULT FALSE,
    display_order INTEGER      NOT NULL,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT fk_modules_course FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE,
    CONSTRAINT uq_modules_course_slug UNIQUE (course_id, slug),
    CONSTRAINT uq_modules_course_order UNIQUE (course_id, display_order),
    CONSTRAINT ck_modules_slug CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);
