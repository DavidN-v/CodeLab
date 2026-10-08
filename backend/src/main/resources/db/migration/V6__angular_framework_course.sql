-- Frameworks join the catalog next to languages, starting with Angular. Only
-- some technologies can run learners' code in the sandbox; the others are
-- taught with lessons, quizzes and exercises graded without running anything.
ALTER TABLE languages
    ADD COLUMN category VARCHAR(10) NOT NULL DEFAULT 'LANGUAGE',
    ADD COLUMN runnable BOOLEAN     NOT NULL DEFAULT FALSE,
    ADD CONSTRAINT ck_languages_category CHECK (category IN ('LANGUAGE', 'FRAMEWORK'));

UPDATE languages SET runnable = TRUE WHERE slug = 'java';

INSERT INTO languages (slug, name, version, icon, tagline, description, active, display_order, category, runnable)
VALUES ('angular', 'Angular', '22', 'angular',
        'El framework de Google para construir aplicaciones web grandes, de cero a senior.',
        'Componentes, plantillas, signals, inyección de dependencias, rutas, formularios, HTTP, pruebas, SSR y arquitectura. Todo explicado desde lo que ocurre al ejecutar ng new.',
        TRUE, 10, 'FRAMEWORK', FALSE);

INSERT INTO courses (language_id, slug, title, summary, description, published, display_order)
SELECT id,
       'angular-desde-cero',
       'Angular desde cero',
       'De no saber qué es un framework a diseñar aplicaciones Angular como un senior.',
       'Un recorrido de 22 módulos con Angular 22. Empieza por la web y TypeScript, abre por dentro un proyecto recién creado con ng new y avanza por componentes, signals, servicios, rutas, formularios, HTTP, rendimiento, pruebas, SSR, arquitectura y despliegue, hasta un proyecto final.',
       TRUE,
       1
FROM languages
WHERE slug = 'angular';

INSERT INTO modules (course_id, slug, title, summary, published, display_order)
SELECT course.id, seed.slug, seed.title, seed.summary, FALSE, seed.display_order
FROM courses course
CROSS JOIN (VALUES
    (1,  'la-web',          'La web antes de Angular',          'Navegador, HTML, CSS, JavaScript y el DOM; qué es una SPA y para qué sirve un framework.'),
    (2,  'typescript',      'TypeScript esencial',              'Tipos, interfaces, clases, genéricos, decoradores e import/export: el idioma de Angular.'),
    (3,  'herramientas',    'Herramientas: Node, npm y la CLI', 'Node.js, npm, package.json, node_modules, versiones y la Angular CLI.'),
    (4,  'ng-new',          '¿Qué ocurre al ejecutar ng new?',  'Cada archivo y cada librería de un proyecto nuevo, y cómo arranca la aplicación en el navegador.'),
    (5,  'componentes',     'Componentes',                      'La pieza básica: decorador, selector, plantilla, estilos, imports y ciclo de vida.'),
    (6,  'plantillas',      'Plantillas',                       'Interpolación, bindings, eventos y el control de flujo con @if, @for, @switch y @let.'),
    (7,  'signals',         'Signals',                          'Estado reactivo con signal, computed, effect y linkedSignal.'),
    (8,  'comunicacion',    'Comunicación entre componentes',   'input, output, model, proyección de contenido y consultas de vista.'),
    (9,  'directivas-pipes','Directivas y pipes',               'Añadir comportamiento a elementos y transformar datos en la plantilla.'),
    (10, 'servicios-di',    'Servicios e inyección de dependencias', 'Compartir lógica con servicios, inject(), proveedores e inyectores.'),
    (11, 'routing',         'Rutas y navegación',               'Rutas, parámetros, guards, resolvers y carga diferida de páginas.'),
    (12, 'formularios',     'Formularios',                      'Formularios reactivos y de plantilla, validación y formularios con signals.'),
    (13, 'http',            'HTTP y datos remotos',             'HttpClient, interceptores, errores y recursos con resource y httpResource.'),
    (14, 'rxjs',            'RxJS esencial',                    'Observables, operadores clave y su convivencia con signals.'),
    (15, 'estado',          'Estado de la aplicación',          'Dónde vive cada dato: estado local, servicios con signals y stores.'),
    (16, 'estilos-ui',      'Estilos, animaciones y accesibilidad', 'Encapsulación de estilos, :host, CDK y Material, animaciones y accesibilidad.'),
    (17, 'rendimiento',     'Rendimiento',                      'Detección de cambios, zoneless, OnPush, @defer y carga diferida.'),
    (18, 'testing',         'Pruebas',                          'Pruebas unitarias con Vitest y TestBed, servicios, HTTP y pruebas de extremo a extremo.'),
    (19, 'ssr',             'SSR e hidratación',                'Renderizado en el servidor, prerender, hidratación incremental y SEO.'),
    (20, 'arquitectura',    'Arquitectura y buenas prácticas',  'Estructura de carpetas, capas, librerías, seguridad e internacionalización.'),
    (21, 'despliegue',      'Compilar y desplegar',             'ng build, configuraciones, entornos, presupuestos, Docker y CI.'),
    (22, 'proyecto-final',  'Proyecto final',                   'Una aplicación completa, paso a paso, que reúne todo el curso.')
) AS seed (display_order, slug, title, summary)
WHERE course.slug = 'angular-desde-cero';
