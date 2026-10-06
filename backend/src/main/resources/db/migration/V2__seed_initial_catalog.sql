-- Initial catalog. Java is the only active language; the others exist so the
-- product can announce them and to keep the multi-language path exercised.

INSERT INTO languages (slug, name, version, icon, tagline, description, active, display_order)
VALUES
    ('java', 'Java', '21', 'java',
     'Aprende Java desde cero hasta construir aplicaciones reales.',
     'Lenguaje orientado a objetos, fuertemente tipado y multiplataforma. Es la base de buena parte del software empresarial y del ecosistema Spring.',
     TRUE, 1),
    ('python', 'Python', '3.13', 'python',
     'Sintaxis clara para automatizar, analizar datos y construir servicios.',
     NULL, FALSE, 2),
    ('javascript', 'JavaScript', 'ES2025', 'javascript',
     'El lenguaje de la web, del navegador al servidor.',
     NULL, FALSE, 3),
    ('typescript', 'TypeScript', '5.9', 'typescript',
     'JavaScript con tipos para proyectos que tienen que escalar.',
     NULL, FALSE, 4);

INSERT INTO courses (language_id, slug, title, summary, description, published, display_order)
SELECT id,
       'java-desde-cero',
       'Java desde cero',
       'De tu primer programa a aplicaciones completas con colecciones, streams, JDBC y pruebas.',
       'Un recorrido de 25 módulos. Cada uno explica un concepto, lo muestra en ejemplos ejecutables y te obliga a usarlo en ejercicios antes de desbloquear el siguiente.',
       TRUE,
       1
FROM languages
WHERE slug = 'java';

-- The first five modules make up the MVP; the rest are listed as the roadmap
-- and get published as their content is written.
INSERT INTO modules (course_id, slug, title, summary, published, display_order)
SELECT course.id, seed.slug, seed.title, seed.summary, seed.display_order <= 5, seed.display_order
FROM courses course
CROSS JOIN (VALUES
    (1,  'fundamentos',     'Fundamentos de Java',              'Qué es Java, cómo se compila y ejecuta un programa, y tu primer Hola mundo.'),
    (2,  'variables',       'Variables',                        'Declarar, inicializar y nombrar variables; ámbito y constantes.'),
    (3,  'tipos-de-datos',  'Tipos de datos',                   'Tipos primitivos, conversiones, envoltorios y el tipo String.'),
    (4,  'operadores',      'Operadores',                       'Aritméticos, relacionales, lógicos y de asignación, con su precedencia.'),
    (5,  'condicionales',   'Condicionales',                    'Tomar decisiones con if, else, else if y switch.'),
    (6,  'bucles',          'Bucles',                           'Repetir trabajo con for, while y do-while; break y continue.'),
    (7,  'metodos',         'Métodos',                          'Dividir un programa en piezas reutilizables con parámetros y retorno.'),
    (8,  'arrays',          'Arrays',                           'Almacenar y recorrer colecciones de tamaño fijo, en una y varias dimensiones.'),
    (9,  'strings',         'Strings',                          'Inmutabilidad, métodos habituales, StringBuilder y formateo de texto.'),
    (10, 'poo',             'Programación orientada a objetos', 'El modelo mental: estado, comportamiento, encapsulación y responsabilidades.'),
    (11, 'clases',          'Clases',                           'Campos, constructores, métodos y modificadores de acceso.'),
    (12, 'objetos',         'Objetos',                          'Instancias, referencias, igualdad, equals y hashCode.'),
    (13, 'herencia',        'Herencia',                         'Reutilizar y especializar comportamiento con extends y super.'),
    (14, 'polimorfismo',    'Polimorfismo',                     'Un mismo mensaje, distintos comportamientos: sobrescritura y enlace dinámico.'),
    (15, 'interfaces',      'Interfaces',                       'Contratos, métodos default y diseño desacoplado.'),
    (16, 'excepciones',     'Excepciones',                      'Detectar, lanzar y manejar errores con try, catch y finally.'),
    (17, 'collections',     'Collections',                      'List, Set y Map: cuál elegir y cómo recorrerlas.'),
    (18, 'generics',        'Generics',                         'Tipos parametrizados, límites y comodines.'),
    (19, 'lambdas',         'Lambdas',                          'Funciones como valores e interfaces funcionales.'),
    (20, 'streams',         'Streams',                          'Procesar colecciones de forma declarativa: filter, map y collect.'),
    (21, 'archivos',        'Archivos',                         'Leer y escribir ficheros con java.nio y gestionar recursos.'),
    (22, 'concurrencia',    'Concurrencia',                     'Hilos, ejecutores y los problemas de compartir estado.'),
    (23, 'jdbc',            'JDBC',                             'Conectar con una base de datos relacional y ejecutar consultas seguras.'),
    (24, 'testing',         'Testing',                          'Pruebas unitarias con JUnit: qué probar y cómo estructurarlas.'),
    (25, 'proyecto-final',  'Proyecto final',                   'Una aplicación completa que integra todo lo aprendido.')
) AS seed (display_order, slug, title, summary)
WHERE course.slug = 'java-desde-cero';
