-- Práctica general: the learner's own projects in the lab.
--
-- `content` is a JSON document owned by the frontend (idea, files, tests, plan).
-- The API only checks that it is valid JSON and within the size limit; code in
-- it is never executed on the server.

CREATE TABLE lab_projects (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id     BIGINT       NOT NULL,
    name        VARCHAR(120) NOT NULL,
    description VARCHAR(500) NOT NULL DEFAULT '',
    mode        VARCHAR(20)  NOT NULL,
    content     TEXT         NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT fk_lab_projects_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT ck_lab_projects_mode CHECK (mode IN ('FREE', 'TUTOR', 'CHALLENGE', 'DEBUG'))
);

CREATE INDEX ix_lab_projects_user ON lab_projects (user_id, updated_at DESC);

-- Save points the learner can go back to.
CREATE TABLE lab_project_versions (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    project_id BIGINT       NOT NULL,
    label      VARCHAR(120) NOT NULL,
    content    TEXT         NOT NULL,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT fk_lab_versions_project FOREIGN KEY (project_id) REFERENCES lab_projects (id) ON DELETE CASCADE
);

CREATE INDEX ix_lab_versions_project ON lab_project_versions (project_id, created_at DESC);
