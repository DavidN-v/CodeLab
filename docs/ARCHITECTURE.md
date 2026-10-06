# Arquitectura de Forja

Este documento es la propuesta de arquitectura de la plataforma: estructura del
proyecto, modelo de datos, organización de Angular, rutas, API REST y flujo de
ejecución segura de código. Cada sección indica qué existe ya (Fase 1) y qué
llega en fases posteriores.

> **Forja** es un nombre de trabajo. En el frontend vive solo en
> `core/config/brand.config.ts`; en el backend, en el paquete `com.forja` y en
> los nombres de artefacto.

## 1. Visión general

```
                 navegador
                     │  HTTP (mismo origen)
                     ▼
        ┌────────────────────────┐
        │ frontend               │  nginx: sirve Angular y hace de
        │ Angular + nginx        │  proxy inverso de /api
        └───────────┬────────────┘
                    │ red edge
                    ▼
        ┌────────────────────────┐        red data        ┌────────────┐
        │ backend                ├───────────────────────►│ postgres   │
        │ Spring Boot (API REST) │                        └────────────┘
        └───────────┬────────────┘
                    │ red runner (interna, sin salida a internet)
                    ▼
        ┌────────────────────────┐
        │ code-runner            │  único servicio que toca código de usuario
        │ Spring Boot            │
        └───────────┬────────────┘
                    │ Fase 4
                    ▼
        sandbox efímero por ejecución (contenedor con JDK)
```

Decisiones que condicionan todo lo demás:

| Decisión | Motivo |
| --- | --- |
| El navegador solo habla con un origen; nginx reenvía `/api` | Sin URLs de API en el frontend ni CORS en producción |
| El backend nunca compila ni ejecuta código de usuario | Un fallo del sandbox no compromete la API ni la base de datos |
| `code-runner` es un servicio aparte, en una red interna | No ve PostgreSQL, no tiene puertos publicados ni salida a internet |
| El lenguaje es un dato (`languages.slug`), no código | Añadir Python es insertar filas y registrar un runtime, no tocar tablas ni rutas |
| El esquema lo gobierna Flyway; Hibernate solo valida | Los cambios de base de datos son explícitos, versionados y revisables |
| Configuración solo por variables de entorno | Ninguna credencial ni URL en el código |

## 2. Estructura del proyecto

```
forja/
├── docker-compose.yml        4 servicios y 3 redes
├── .env.example              plantilla de configuración
├── docs/ARCHITECTURE.md
├── backend/                  API REST (Spring Boot 4, Java 21, Maven)
├── code-runner/              servicio de ejecución aislada (Spring Boot 4)
└── frontend/                 SPA (Angular 22) + nginx
```

### 2.1 Backend

```
backend/src/main/java/com/forja/api/
├── config/        Seguridad, CORS, OpenAPI, propiedades tipadas, clientes HTTP
├── controller/    Solo HTTP: rutas, validación de entrada, documentación OpenAPI
├── dto/           Contratos de la API (records). Las entidades nunca salen de aquí
├── entity/        Entidades JPA
├── exception/     Excepciones de dominio, ErrorCode y GlobalExceptionHandler
├── mapper/        Entidad → DTO
├── repository/    Spring Data JPA
├── security/      Respuestas 401/403 en JSON (y, en Fase 3, el filtro JWT)
├── service/       Interfaces de la lógica de negocio
│   └── impl/      Implementaciones, transaccionales
├── client/        Clientes de otros servicios (code-runner)
└── util/          Constantes y reglas compartidas (p. ej. formato de slug)

backend/src/main/resources/
├── application.yml
└── db/migration/  Migraciones Flyway (V1__..., V2__...)
```

`client/` es la única carpeta añadida a la estructura pedida: separa las
llamadas salientes a otros servicios de la lógica de negocio.

### 2.2 Frontend

```
frontend/src/
├── environments/             apiBaseUrl por entorno
├── styles/                   tokens de diseño, base, botones, mixins
└── app/
    ├── core/                 singletons de toda la aplicación
    │   ├── config/           API_BASE_URL, marca
    │   ├── interceptors/     errores HTTP → AppError + aviso al usuario
    │   ├── models/           contratos de la API y tipos compartidos
    │   ├── services/         LanguageService, NotificationService, títulos
    │   └── guards/           (Fase 3: autenticación)
    ├── shared/               piezas reutilizables sin estado de negocio
    │   ├── components/       toast-outlet, page-placeholder, language-list-item
    │   ├── directives/       (según se necesiten)
    │   └── pipes/            (según se necesiten)
    ├── layout/               navbar, footer (sidebar en Fase 2)
    ├── features/
    │   ├── home/             components/ + pages/
    │   ├── courses/          catálogo, portada de lenguaje, módulos
    │   ├── learning/         vista de lección en tres columnas
    │   ├── practice/         playground y ejercicios (editor + consola)
    │   ├── dashboard/        panel del estudiante
    │   └── not-found/
    ├── app.component.*       shell: navbar + router-outlet + footer + toasts
    ├── app.config.ts         providers (router, HttpClient, interceptores)
    └── app.routes.ts         rutas raíz con lazy loading por feature
```

Reglas:

- Un componente = una carpeta con `.ts`, `.html`, `.scss` y `.spec.ts`.
- `pages/` son componentes enrutados que obtienen datos; `components/` son
  presentacionales (reciben `input()`, emiten `output()`).
- Una feature no importa de otra feature. Lo común sube a `shared/` o `core/`.
- Los servicios usados por una sola feature viven en `features/<x>/services/`;
  los transversales, en `core/services/`.
- Componentes standalone, `OnPush`, estado con signals. No hay NgModules.

## 3. Modelo de datos

### 3.1 Entidades

```
Language 1──* Course 1──* Module 1──* Lesson *──* Concept
                              │           │
                              │           └──* Exercise 1──* TestCase
                              │                    │    1──* Hint
                              │                    └──* Submission *──1 User
                              └──* Project (se desbloquea con módulos)

User 1──1 UserStats            XP, racha, tiempo de aprendizaje
User *──* Achievement          vía UserAchievement
User 1──* LessonProgress / ExerciseProgress / ModuleProgress
User 1──* CourseEnrollment     curso activo y punto de reanudación
Level                          umbrales de XP → nivel y título
```

| Tabla | Propósito | Campos principales | Fase |
| --- | --- | --- | --- |
| `languages` | Lenguaje o tecnología | slug, name, version, icon, tagline, active, display_order | **1** |
| `courses` | Curso de un lenguaje | language_id, slug, title, summary, published | **1** |
| `modules` | Unidad de un curso | course_id, slug, title, summary, published, display_order | **1** |
| `lessons` | Lección de un módulo | module_id, slug, title, kind (THEORY, PRACTICE, CHALLENGE, ASSESSMENT), content_markdown, estimated_minutes | 2 |
| `concepts`, `lesson_concepts` | Conceptos y qué lección los trata | language_id, slug, name | 3 |
| `users` | Cuenta | email, display_name, password_hash, role | 3 |
| `course_enrollments` | Curso en marcha | user_id, course_id, current_lesson_id, last_accessed_at | 3 |
| `lesson_progress`, `module_progress` | Avance | user_id, lesson_id/module_id, status, completed_at | 3 |
| `exercises` | Ejercicio | lesson_id, concept_id, slug, title, description, instructions, difficulty, starter_code, solution_code, requires_stdin | 5 |
| `exercise_test_cases` | Tests automáticos y ejemplos | exercise_id, stdin, expected_stdout, hidden, sample | 5 |
| `exercise_hints` | Pistas progresivas | exercise_id, position, content, unlock_after_attempts | 5 |
| `submissions` | Intento de solución | user_id, exercise_id, source_code, status, passed_tests, total_tests, execution_time_ms | 5 |
| `exercise_progress` | Estado por ejercicio | user_id, exercise_id, attempts, hints_revealed, solution_viewed, completed_at | 5 |
| `user_stats`, `levels` | XP, nivel, racha | total_xp, current_streak_days, learning_seconds; level_number, title, min_xp | 6 |
| `achievements`, `user_achievements` | Logros | code, title, criteria; earned_at | 6 |
| `projects`, `project_required_modules` | Proyectos guiados | language_id, slug, title; módulos que lo desbloquean | 8 |

El esquema crece con cada fase mediante una migración nueva, en lugar de crear
de entrada tablas que todavía no usa ningún código. Lo ya migrado en la Fase 1:

- `V1__create_catalog_schema.sql`: `languages`, `courses`, `modules`.
- `V2__seed_initial_catalog.sql`: Java (activo), Python/JavaScript/TypeScript
  (anunciados), el curso «Java desde cero» y sus 25 módulos, con los 5 primeros
  publicados.

### 3.2 Convenciones

- Clave primaria `BIGINT` autogenerada; hacia fuera se usan **slugs** en las
  URLs siempre que el recurso los tenga.
- `created_at` / `updated_at` (`TIMESTAMPTZ`) en todas las tablas.
- El orden es un dato (`display_order`), no el id: los módulos se reordenan,
  añaden o retiran desde la base de datos.
- `published` / `active` separan «existe» de «visible para el alumno».
- Ninguna tabla ni columna menciona un lenguaje concreto.

## 4. Frontend: features y rutas

| Ruta | Feature | Página | Fase |
| --- | --- | --- | --- |
| `/` | home | Hero, flujo de aprendizaje, catálogo | **1** |
| `/languages` | courses | Catálogo de lenguajes | 2 |
| `/languages/:languageSlug` | courses | Portada del lenguaje: progreso, módulo actual, índice | 2 |
| `/languages/:languageSlug/modules/:moduleSlug` | courses | Portada del módulo: lecciones, práctica, desafío, evaluación | 2 |
| `/learn/:languageSlug/:moduleSlug/:lessonSlug` | learning | Lección en tres columnas | 3 |
| `/practice` | practice | Playground libre | 4 |
| `/practice/:exerciseSlug` | practice | Ejercicio: enunciado, editor, consola | 5 |
| `/dashboard` | dashboard | Panel del estudiante | 2 |
| `/projects`, `/projects/:projectSlug` | projects | Proyectos guiados | 8 |
| `**` | not-found | 404 | **1** |

Todas las features salvo `home` se cargan con `loadChildren` desde su propio
`<feature>.routes.ts`. Las páginas aún no construidas están enrutadas hacia un
marcador (`placeholderRoute`) para que la navegación y la carga diferida
funcionen desde el primer día; al construir la página real solo se sustituye
esa entrada.

Piezas transversales ya en su sitio:

- **`API_BASE_URL`**: los servicios construyen sus URLs a partir de este token.
- **`httpErrorInterceptor`**: convierte cualquier fallo HTTP en un `AppError`
  con un mensaje apto para el usuario (0, 400, 401, 403, 404, 409, 5xx) y lo
  muestra como aviso. Quien pinta el error por su cuenta lo desactiva con
  `withoutErrorNotification()`.
- **`NotificationService` + `ToastOutletComponent`**: cola de avisos.
- **`PageTitleStrategy`**: título de pestaña por ruta.

El editor será **Monaco** (Fase 4), cargado de forma diferida dentro de la
feature `practice` para que no pese en el resto de la aplicación.

## 5. API REST

Prefijo `/api`. JSON. Documentación viva en `/swagger-ui.html`.

| Método y ruta | Descripción | Fase |
| --- | --- | --- |
| `GET /api/languages` | Lenguajes en orden de catálogo | **1** |
| `GET /api/languages/{slug}` | Un lenguaje | **1** |
| `GET /api/courses?language={slug}` | Cursos publicados | **1** |
| `GET /api/courses/{id}` | Curso con su índice de módulos | **1** |
| `GET /api/modules/{id}` | Módulo con sus lecciones | 2 |
| `GET /api/lessons/{id}` | Contenido de una lección | 2 |
| `POST /api/auth/register`, `POST /api/auth/login` | Alta e inicio de sesión (JWT) | 3 |
| `GET /api/progress?course={id}` | Progreso del usuario | 3 |
| `POST /api/progress` | Marcar lección como completada | 3 |
| `POST /api/executions` | Ejecutar código (playground) | 4 |
| `GET /api/exercises/{id}` | Enunciado, código inicial, ejemplos | 5 |
| `POST /api/submissions` | Comprobar solución contra los tests | 5 |
| `POST /api/exercises/{id}/hints` | Revelar la siguiente pista | 5 |
| `GET /api/me/stats`, `GET /api/me/achievements` | XP, nivel, racha, logros | 6 |
| `POST /api/ai/hint`, `POST /api/ai/explain-error` | Tutor | 7 |
| `GET /api/projects`, `GET /api/projects/{id}` | Proyectos | 8 |

### Errores

Todas las respuestas de error, incluidas las que genera Spring Security antes
de llegar a un controlador, comparten este cuerpo:

```json
{
  "timestamp": "2026-10-06T22:17:23.397Z",
  "status": 400,
  "error": "VALIDATION_ERROR",
  "message": "La solicitud contiene datos no válidos.",
  "path": "/api/courses",
  "fieldErrors": [{ "field": "language", "message": "debe contener solo minúsculas, números y guiones" }]
}
```

`error` es un código estable (`VALIDATION_ERROR`, `BAD_REQUEST`,
`UNAUTHORIZED`, `FORBIDDEN`, `RESOURCE_NOT_FOUND`, `METHOD_NOT_ALLOWED`,
`CONFLICT`, `INTERNAL_ERROR`). `fieldErrors` solo aparece en errores de
validación. Los 5xx nunca incluyen detalles internos; quedan en el log.

### Seguridad

API sin estado. Hoy son públicas las lecturas del catálogo, la documentación y
el estado de salud; cualquier otra ruta responde 401. La autenticación JWT se
añade en la Fase 3 como un filtro dentro de la misma cadena, sin cambiar los
controladores existentes.

## 6. Ejecución segura de código

> Fase 1 entrega el servicio `code-runner` desplegado, aislado en su red y
> vigilado por el backend (`/actuator/health` → `codeRunner`). La ejecución en
> sí es la Fase 4; este es su diseño.

### 6.1 Flujo

```
1. Angular            POST /api/executions { languageSlug, sourceCode, stdin }
2. Backend            valida tamaño y lenguaje, aplica límite de peticiones por usuario
3. Backend            POST http://code-runner:8090/internal/executions
4. code-runner        busca el runtime del lenguaje (imagen, fichero, comandos, límites)
5. code-runner        crea un contenedor efímero y copia el código en él
6. sandbox            compila y ejecuta, con stdin si lo hay
7. code-runner        recoge stdout, stderr, código de salida y tiempos; destruye el contenedor
8. Backend → Angular  { status, stdout, stderr, exitCode, durationMs, truncated }
```

`POST /api/submissions` reutiliza el mismo camino: el backend lanza una
ejecución por caso de prueba y compara la salida con la esperada. Los tests
ocultos nunca viajan al navegador.

### 6.2 Aislamiento de cada ejecución

| Riesgo | Control |
| --- | --- |
| Bucle infinito | Límite de tiempo de reloj; al vencer se mata el contenedor |
| Consumo de memoria | `--memory` y `--memory-swap` iguales, más `-Xmx` en la JVM |
| Consumo de CPU | `--cpus` |
| Bomba de procesos | `--pids-limit` |
| Salida gigantesca | Se corta la lectura de stdout/stderr a un máximo y se marca `truncated` |
| Acceso a la red | `--network none` |
| Escritura en disco | `--read-only`, con un `tmpfs` pequeño y `noexec` como único directorio de trabajo |
| Escalada de privilegios | Usuario sin privilegios, `--cap-drop ALL`, `no-new-privileges`, perfil seccomp |
| Rastro entre ejecuciones | Un contenedor nuevo por ejecución, eliminado siempre (`--rm` y limpieza en `finally`) |
| Avalancha de peticiones | Cola con concurrencia máxima en el runner y límite por usuario en el backend |

El `code-runner` no monta el socket de Docker directamente: habla con un
**proxy del socket** que solo permite crear, arrancar, esperar y borrar
contenedores. Así, comprometer el runner no equivale a controlar el host.

Para producción el mismo contrato admite un aislamiento más fuerte sin tocar
el backend: gVisor (`runsc`) como runtime de los contenedores, o microVMs
Firecracker.

### 6.3 Preparado para más lenguajes

El runner no sabe nada de Java. Cada lenguaje es una entrada de configuración:

```yaml
forja:
  runner:
    runtimes:
      java:
        image: eclipse-temurin:21-jdk-alpine
        source-file: Main.java
        compile: [javac, Main.java]
        run: [java, -Xmx128m, Main]
        limits: { timeout: 10s, memory: 256m, cpus: 0.5, pids: 64, output: 64KB }
      python:
        image: python:3.13-alpine
        source-file: main.py
        run: [python, main.py]
```

## 7. Identidad visual

Herramienta para desarrolladores, no panel genérico. Los valores viven en
`frontend/src/styles/_tokens.scss`.

- **Superficies**: tinta cálida casi negra (`#131210`), sin grises azulados.
- **Texto**: blanco roto (`#ece8de`) en tres niveles, todos con contraste AA.
- **Acento**: ámbar de forja (`#e8a23a`), reservado a la acción principal y al énfasis.
- **Tipografía**: IBM Plex Sans para el contenido y JetBrains Mono para código,
  etiquetas y metadatos. Ambas autoalojadas.
- **Código y consola**: el código va sobre una superficie más oscura que el
  contenido, y la consola sobre una aún más oscura, para que nunca se confundan.
- **Forma**: bordes de 1 px, radios de 3–6 px, sin sombras ni degradados;
  botones compactos.
- **Motivo**: el cursor de bloque ámbar tras el nombre.

## 8. Fases

| Fase | Contenido | Estado |
| --- | --- | --- |
| 1 | Arquitectura base: Angular, Spring Boot, PostgreSQL, Docker | **Hecha** |
| 2 | Layout y navegación; home, dashboard, cursos, módulos, lecciones | |
| 3 | Sistema educativo: contenido, usuarios (JWT), progreso | |
| 4 | Playground: Monaco, consola, ejecución segura | |
| 5 | Ejercicios: tests, evaluación, pistas | |
| 6 | Gamificación: XP, niveles, logros, rachas | |
| 7 | Tutor IA: pistas, explicación de errores | |
| 8 | Proyectos guiados y proyecto final | |
| 9 | Nuevos lenguajes | |

El MVP son las fases 1 a 5 con los 5 primeros módulos de Java.
