-- A learner groups their lab projects in folders ("Java", "HTML"...). A folder
-- is just a label on the project: it exists while some project carries it.
-- The empty string means "no folder".

ALTER TABLE lab_projects ADD COLUMN folder VARCHAR(60) NOT NULL DEFAULT '';
