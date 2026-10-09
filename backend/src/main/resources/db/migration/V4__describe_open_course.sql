-- Modules are not locked: learners can open any of them. The original
-- description promised unlocking, which the platform does not do.
UPDATE courses
SET description = 'Un recorrido de 25 módulos. Cada uno explica un concepto, lo muestra en ejemplos que puedes ejecutar y te lo hace practicar en ejercicios con corrección automática. Síguelos en orden o salta al tema que necesites.'
WHERE slug = 'java-desde-cero';
