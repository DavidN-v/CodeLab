# Arquitectura de Forja

Este documento describe la arquitectura de la plataforma: estructura del
proyecto, modelo de datos, organización de Angular, rutas, API REST, contenido
del curso y ejecución segura de código. Cada sección indica qué existe ya y qué
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
        ┌────────────────────────┐        ┌──────────────┐
        │ code-runner            ├───────►│ docker-proxy │──► socket de Docker
        │ Spring Boot            │        └──────────────┘
        └────────────────────────┘                │
                                                  ▼
                         un contenedor sandbox-java por ejecución
                         (sin red, solo lectura, sin capabilities)
```

Decisiones que condicionan todo lo demás:

| Decisión | Motivo |
| --- | --- |
| El navegador solo habla con un origen; nginx reenvía `/api` | Sin URLs de API en el frontend ni CORS en producción |
| Ni el backend ni el code-runner ejecutan código de usuario en su proceso | Un fallo del sandbox no compromete la API, la base de datos ni el runner |
| Un contenedor nuevo por ejecución, creado a través de un proxy del socket | Aislamiento fuerte y ningún servicio con acceso directo a Docker |
| `code-runner` y `docker-proxy` viven en una red interna | No ven PostgreSQL, no tienen puertos publicados ni salida a internet |
| El lenguaje es un dato (`languages.slug`), no código | Añadir Python es insertar filas y configurar un runtime, no tocar tablas ni rutas |
| El esquema lo gobierna Flyway; Hibernate solo valida | Los cambios de base de datos son explícitos, versionados y revisables |
| El contenido del curso son archivos del repositorio | Se revisa como código, se versiona y se verifica contra el sandbox |
| Configuración solo por variables de entorno | Ninguna credencial ni URL en el código |

## 2. Estructura del proyecto

```
forja/
├── docker-compose.yml        servicios y 3 redes
├── docker-compose.dev.yml    publica el code-runner para desarrollo local
├── .env.example              plantilla de configuración
├── docs/ARCHITECTURE.md
├── backend/                  API REST (Spring Boot 4, Java 21, Maven)
├── code-runner/              ejecución aislada (Spring Boot 4) e imagen del sandbox
└── frontend/                 SPA (Angular 22) + nginx
```

### 2.1 Backend

```
backend/src/main/java/com/forja/api/
├── config/        Seguridad, JWT, CORS, OpenAPI, límites de peticiones, clientes HTTP, reloj
├── content/       Importa las lecciones y ejercicios de resources/content al arrancar
├── controller/    Solo HTTP: rutas, validación de entrada, documentación OpenAPI
├── dto/           Contratos de la API (records). Las entidades nunca salen de aquí
├── entity/        Entidades JPA
├── exception/     Excepciones de dominio, ErrorCode y GlobalExceptionHandler
├── learning/      Reglas puras: corrección, comparación de salidas, XP, niveles, rachas
├── mapper/        Entidad → DTO
├── repository/    Spring Data JPA, con proyecciones ligeras (LessonOutline, ExerciseOutline)
├── security/      Emisión de tokens, respuestas 401/403 en JSON, usuario actual
├── service/       Interfaces de la lógica de negocio
│   └── impl/      Implementaciones, transaccionales
├── client/        Cliente del code-runner
└── util/          Constantes y reglas compartidas (p. ej. formato de slug)

backend/src/main/resources/
├── application.yml
├── content/       El curso: un directorio por módulo (ver sección 6)
└── db/migration/  Migraciones Flyway (V1__..., V2__..., V3__...)
```

### 2.2 Code-runner

```
code-runner/
├── sandbox/java/Dockerfile          imagen de los contenedores de ejecución (JDK 21, H2, JUnit)
└── src/main/
    ├── java/com/forja/runner/
    │   ├── api/                     POST /internal/executions y errores
    │   ├── config/                  runtimes y límites, cliente HTTP de Docker
    │   ├── docker/                  cliente mínimo de la API de Docker
    │   ├── execution/               cola, sandbox, layout de fuentes, lectura del protocolo
    │   └── health/                  limpieza al arrancar y estado del sandbox
    └── resources/sandbox/harness.sh guion que corre dentro de cada contenedor
```

### 2.3 Frontend

```
frontend/src/
├── environments/             apiBaseUrl por entorno
├── styles/                   tokens, base, botones, formularios, páginas, prosa, sintaxis, workbench
└── app/
    ├── core/                 singletons de toda la aplicación
    │   ├── config/           API_BASE_URL, marca
    │   ├── guards/           authGuard
    │   ├── interceptors/     token en cada petición; errores HTTP → AppError + aviso
    │   ├── models/           contratos de la API y tipos compartidos
    │   └── services/         auth, cursos, ejercicios, ejecución, progreso, panel, avisos
    ├── shared/               piezas reutilizables sin estado de negocio
    │   ├── components/       markdown, progress-bar, toast-outlet, language-list-item
    │   └── utils/            etiquetas y plurales
    ├── layout/               navbar (con la sesión), footer
    ├── features/
    │   ├── home/             portada
    │   ├── auth/             login y registro
    │   ├── courses/          catálogo de lenguajes, curso y módulo
    │   ├── learning/         lección en tres columnas
    │   ├── practice/         catálogo de ejercicios, playground y ejercicio (editor, consola, resultados)
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
- Componentes standalone, `OnPush`, estado con signals; los datos de las
  páginas se cargan con `rxResource`. No hay NgModules.
- Los estilos de página compartidos viven en `styles/`, para que cada
  componente se mantenga dentro del presupuesto de tamaño.

## 3. Modelo de datos

### 3.1 Entidades

```
Language 1──* Course 1──* Module 1──* Lesson
                              └──* Exercise 1──* TestCase
                                       │   1──* Hint
                                       └──* Submission *──1 User

User 1──* LessonProgress    lecciones completadas
User 1──* ExerciseProgress  intentos, pistas vistas, solución vista, resuelto y XP
```

| Tabla | Propósito | Campos principales | Estado |
| --- | --- | --- | --- |
| `languages` | Lenguaje o tecnología | slug, name, version, tagline, active, display_order | Hecha (V1) |
| `courses` | Curso de un lenguaje | language_id, slug, title, summary, published | Hecha (V1) |
| `modules` | Unidad de un curso | course_id, slug, title, summary, published, display_order | Hecha (V1) |
| `lessons` | Lección de un módulo | module_id, slug, title, summary, content_markdown, estimated_minutes, published | Hecha (V3) |
| `exercises` | Ejercicio de un módulo | module_id, slug (único global), title, difficulty, statement_markdown, starter_code, solution_code | Hecha (V3) |
| `exercise_test_cases` | Pruebas; las de ejemplo se muestran, las demás no salen de la API | exercise_id, position, stdin, expected_stdout, sample | Hecha (V3) |
| `exercise_hints` | Pistas progresivas | exercise_id, position, content | Hecha (V3) |
| `users` | Cuenta | email (en minúsculas, único), display_name, password_hash (BCrypt), role | Hecha (V3) |
| `lesson_progress` | Lección completada | user_id, lesson_id, completed_at | Hecha (V3) |
| `exercise_progress` | Estado por ejercicio | user_id, exercise_id, attempts, hints_revealed, solution_viewed, solved_at, xp_awarded | Hecha (V3) |
| `submissions` | Intento de solución | user_id, exercise_id, source_code, status, passed_tests, total_tests, execution_time_ms | Hecha (V3) |
| `concepts`, `achievements`, `projects` | Conceptos, logros persistidos, proyectos guiados | — | Futuras |

La experiencia, el nivel, la racha, la actividad y los logros **se calculan** a
partir del progreso y los envíos (`learning/` en el backend), en lugar de
guardarse: así nunca se desincronizan.

### 3.2 Convenciones

- Clave primaria `BIGINT` autogenerada; hacia fuera se usan **slugs** en las
  URLs siempre que el recurso los tenga.
- `created_at` / `updated_at` (`TIMESTAMPTZ`) en todas las tablas.
- El orden es un dato (`display_order`), no el id.
- `published` / `active` separan «existe» de «visible para el alumno». El
  contenido retirado de los archivos se despublica, no se borra, para que el
  progreso que apunta a él sobreviva.
- Ninguna tabla ni columna menciona un lenguaje concreto.

## 4. Frontend: features y rutas

| Ruta | Feature | Página |
| --- | --- | --- |
| `/` | home | Portada: hero, flujo de aprendizaje, catálogo |
| `/languages` | courses | Catálogo de lenguajes |
| `/languages/:languageSlug` | courses | Curso: descripción, progreso, continuar y temario |
| `/languages/:languageSlug/modules/:moduleSlug` | courses | Módulo: lecciones y ejercicios con su estado |
| `/learn/:languageSlug/:moduleSlug/:lessonSlug` | learning | Lección en tres columnas |
| `/practice` | practice | Catálogo de ejercicios con filtros |
| `/practice/playground` | practice | Playground libre |
| `/practice/:exerciseSlug` | practice | Ejercicio: enunciado, editor, entrada, consola y corrección |
| `/dashboard` | dashboard | Panel del estudiante (requiere sesión) |
| `/login`, `/register` | auth | Entrar y crear cuenta |
| `**` | not-found | 404 |

Todas las features salvo `home` se cargan con `loadChildren`. Las URLs solo
llevan el lenguaje; `CourseService.getPrimaryCourse` resuelve su curso una vez
y lo cachea.

Piezas transversales:

- **`API_BASE_URL`**: los servicios construyen sus URLs a partir de este token.
- **`authInterceptor`**: añade el token a las peticiones a la API y cierra la
  sesión si la API lo rechaza.
- **`httpErrorInterceptor`**: convierte cualquier fallo HTTP en un `AppError`
  con un mensaje apto para el usuario y lo muestra como aviso. Quien pinta el
  error por su cuenta lo desactiva con `withoutErrorNotification()`.
- **`AuthService`**: sesión en signals, guardada en `localStorage` hasta que
  caduca el token.
- **`MarkdownComponent`**: renderiza lecciones (marked + highlight.js), escapa
  el HTML crudo, genera el índice de la página y ofrece los ejemplos al
  playground.
- **`CodeEditorComponent`**: **CodeMirror 6**, cargado de forma diferida dentro
  de la feature `practice`. Se eligió en lugar de Monaco porque es ESM, encaja
  con el builder de Angular sin cargadores AMD ni workers, y pesa mucho menos.

## 5. API REST

Prefijo `/api`. JSON. Documentación viva en `/swagger-ui.html`.

| Método y ruta | Descripción | Acceso |
| --- | --- | --- |
| `GET /api/languages`, `GET /api/languages/{slug}` | Lenguajes | Público |
| `GET /api/courses?language={slug}` | Cursos publicados | Público |
| `GET /api/courses/{id}` | Curso con sus módulos y recuentos | Público |
| `GET /api/courses/{id}/modules/{moduleSlug}` | Módulo con lecciones y ejercicios | Público |
| `GET /api/courses/{id}/modules/{moduleSlug}/lessons/{lessonSlug}` | Lección, con anterior y siguiente | Público |
| `GET /api/courses/{id}/exercises` | Ejercicios del curso | Público |
| `GET /api/exercises/{slug}` | Enunciado, código inicial y pruebas de ejemplo | Público |
| `POST /api/auth/register`, `POST /api/auth/login` | Alta e inicio de sesión; devuelven un JWT | Público |
| `GET /api/auth/me` | Usuario actual | Sesión |
| `POST /api/executions` | Ejecutar código en el playground | Sesión |
| `POST /api/exercises/{slug}/submissions` | Corregir una solución contra todas las pruebas | Sesión |
| `GET /api/exercises/{slug}/progress` | Intentos, pistas vistas, últimos envíos | Sesión |
| `POST /api/exercises/{slug}/hints` | Revelar la siguiente pista | Sesión |
| `POST /api/exercises/{slug}/solution` | Ver la solución | Sesión |
| `POST /api/progress/lessons/{id}` | Completar una lección (idempotente) | Sesión |
| `GET /api/progress/courses/{id}` | Progreso en un curso | Sesión |
| `GET /api/dashboard?timezone=` | XP, nivel, racha, actividad, cursos, logros | Sesión |
| `POST /api/ai/hint`, `POST /api/ai/explain-error` | Tutor | Futuro |

Las ejecuciones y los envíos tienen un límite por alumno (30 y 20 por minuto).

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
`CONFLICT`, `TOO_MANY_REQUESTS`, `EXECUTION_UNAVAILABLE`, `INTERNAL_ERROR`).
`fieldErrors` solo aparece en errores de validación. Los 5xx nunca incluyen
detalles internos, salvo `EXECUTION_UNAVAILABLE`, cuyo mensaje está escrito para
el alumno.

### Seguridad

API sin estado. La autenticación usa JWT firmados con HS256 y una clave de
`JWT_SECRET`; las contraseñas se guardan con BCrypt. Leer el catálogo, las
lecciones y los enunciados es público; ejecutar código, enviar soluciones y el
progreso requieren un token.

### Corrección

El backend envía al runner el código y las **entradas** de todas las pruebas;
las salidas esperadas nunca salen de la API. Compara cada salida ignorando
finales de línea, espacios al final y líneas vacías finales. El primer caso que
falla decide el veredicto (`WRONG_ANSWER`, `RUNTIME_ERROR`,
`TIME_LIMIT_EXCEEDED`). De las pruebas ocultas solo se devuelve si pasaron.

La experiencia: 10 XP por lección; por ejercicio 20, 35 o 50 según la
dificultad, 5 menos por pista vista (mínimo 5) y ninguna si se vio la solución
antes de resolverlo.

## 6. El contenido del curso

Las lecciones y ejercicios se escriben como archivos y `ContentImporter` los
sincroniza con la base de datos al arrancar. El catálogo (lenguajes, cursos y
módulos) sigue viniendo de las migraciones.

```
content/<curso>/<NN>-<módulo>/
├── module.yml        lecciones (slug, title, summary, minutes) y slugs de ejercicios, en orden
├── <lección>.md      cuerpo de la lección en Markdown
└── <ejercicio>.yml   title, summary, difficulty, statement, starter, solution, hints, tests
```

- Lecciones y ejercicios se casan por slug y se actualizan en el sitio; lo que
  desaparece de los archivos se despublica.
- Un módulo con contenido se publica automáticamente.
- En Markdown, ` ```java ` con un `main` es un ejemplo ejecutable; ` ```java
  fragment ` y ` ```java error ` son fragmentos y errores intencionados.
- `ContentVerificationTest` ejecuta contra un code-runner real todas las
  soluciones (deben pasar sus pruebas), los códigos iniciales y los ejemplos
  (deben compilar).

## 7. Ejecución segura de código

### 7.1 Flujo

```
1. Angular            POST /api/executions { languageSlug, sourceCode, stdin }
                      POST /api/exercises/{slug}/submissions { sourceCode }
2. Backend            valida, aplica el límite por alumno
3. Backend            POST http://code-runner:8090/internal/executions { language, sourceCode, inputs[] }
4. code-runner        espera un hueco (cola con concurrencia máxima)
5. code-runner        crea un contenedor sandbox-java a través de docker-proxy;
                      el código y las entradas viajan como variables de entorno
6. sandbox            harness.sh compila una vez y ejecuta el programa por cada entrada,
                      cada vez en un directorio vacío propio
7. code-runner        lee la salida del harness, borra el contenedor
8. Backend → Angular  resultado de la ejecución, o veredicto prueba a prueba
```

### 7.2 Aislamiento de cada ejecución

| Riesgo | Control |
| --- | --- |
| Bucle infinito | `timeout -s KILL` por ejecución (5 s) y por compilación (20 s); tras un tiempo agotado se saltan las entradas restantes |
| Consumo de memoria | `Memory` y `MemorySwap` iguales (512 MB), más `-Xmx` en la JVM |
| Consumo de CPU | `NanoCpus` (1 CPU) |
| Bomba de procesos o hilos | `PidsLimit` (128) |
| Salida gigantesca | Se guardan 64 KB por flujo y se marca `truncated`; logs del contenedor limitados |
| Acceso a la red | `NetworkMode: none` |
| Escritura en disco | Raíz de solo lectura; `/sandbox` y `/tmp` en tmpfs pequeños, `noexec` |
| Escalada de privilegios | Usuario `nobody`, `CapDrop: ALL`, `no-new-privileges` |
| Rastro entre ejecuciones | Un contenedor nuevo por ejecución, siempre eliminado; los que queden tras una caída se limpian al arrancar |
| Avalancha de peticiones | Cola con concurrencia máxima en el runner y límite por alumno en el backend |

El code-runner no monta el socket de Docker: habla con `docker-proxy`, que solo
deja pasar las rutas de contenedores e imágenes y rechaza el resto de la API
(`exec`, `build`, redes, volúmenes, swarm…). El proxy no inspecciona el cuerpo
de las peticiones, así que un code-runner comprometido podría pedir un
contenedor menos restringido: por eso el runner no ejecuta código de usuario en
su proceso y solo acepta peticiones del backend por la red interna. Para
producción, el mismo contrato admite un aislamiento más fuerte sin tocar el
backend: gVisor (`runsc`) como runtime de los contenedores, o microVMs
Firecracker.

### 7.3 Preparado para más lenguajes

El runner no sabe nada de Java salvo cómo nombrar el archivo
(`JavaSourceLayout`). Cada lenguaje es una entrada de configuración:

```yaml
forja:
  runner:
    runtimes:
      java:
        image: forja-sandbox-java:21
        layout: java
        compile-command: javac ... -d classes "$FORJA_SOURCE_FILE"
        run-command: java ... "$FORJA_MAIN"
        limits: { compile-timeout: 20s, run-timeout: 5s, memory: 512MB, cpus: 1.0, pids: 128, output: 64KB }
```

Añadir Python sería una imagen `sandbox-python`, una entrada `python` sin
`compile-command` y un `SourceLayout` que siempre use `main.py`.

## 8. Identidad visual

Herramienta para desarrolladores, no panel genérico. Los valores viven en
`frontend/src/styles/_tokens.scss`.

- **Superficies**: tinta cálida casi negra (`#131210`), sin grises azulados.
- **Texto**: blanco roto (`#ece8de`) en tres niveles, todos con contraste AA.
- **Acento**: ámbar de forja (`#e8a23a`), reservado a la acción principal y al énfasis.
- **Tipografía**: IBM Plex Sans para el contenido y JetBrains Mono para código,
  etiquetas y metadatos. Ambas autoalojadas.
- **Código y consola**: el código va sobre una superficie más oscura que el
  contenido, y la consola sobre una aún más oscura, para que nunca se confundan.
  El editor y el resaltado de las lecciones usan los mismos tokens de sintaxis.
- **Forma**: bordes de 1 px, radios de 3–6 px, sin sombras ni degradados;
  botones compactos.
- **Motivo**: el cursor de bloque ámbar tras el nombre.

## 9. Fases

| Fase | Contenido | Estado |
| --- | --- | --- |
| 1 | Arquitectura base: Angular, Spring Boot, PostgreSQL, Docker | **Hecha** |
| 2 | Layout y navegación; catálogo, curso, módulos y lecciones | **Hecha** |
| 3 | Sistema educativo: contenido, usuarios (JWT), progreso | **Hecha** |
| 4 | Playground: editor, consola, ejecución segura | **Hecha** |
| 5 | Ejercicios: pruebas, corrección, pistas, solución | **Hecha** |
| 6 | Gamificación: XP, niveles, logros, rachas | **Hecha** (calculada; los logros no se persisten) |
| 7 | Tutor IA: pistas, explicación de errores | Pendiente |
| 8 | Proyectos guiados y proyecto final | Proyecto final como módulo 25; proyectos guiados pendientes |
| 9 | Nuevos lenguajes | Pendiente |
