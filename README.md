# Forja

Plataforma web para aprender y practicar programación: teoría, ejemplos
ejecutables, ejercicios con corrección automática y seguimiento del progreso.
Java es el primer lenguaje; la arquitectura trata el lenguaje como un dato para
poder añadir más sin reescribir nada.

Incluye el curso **Java desde cero**: 25 módulos, 79 lecciones y 82 ejercicios,
desde el primer `println` hasta streams, concurrencia, JDBC, pruebas con JUnit y
un proyecto final. El diseño y las fases están en
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Qué puedes hacer

- **Lenguajes y cursos:** catálogo, temario con progreso por módulo y portada de
  cada módulo con sus lecciones y ejercicios.
- **Lecciones:** vista de estudio en tres columnas. Los ejemplos de código se
  abren en el playground con un clic.
- **Práctica:** catálogo de ejercicios con filtros, editor con resaltado
  (CodeMirror), ejecución con entrada propia, corrección contra pruebas visibles
  y ocultas, pistas progresivas y solución.
- **Playground:** editor libre para ejecutar cualquier programa Java.
- **Panel:** experiencia y nivel, racha diaria, actividad de las últimas 12
  semanas, progreso por curso, envíos recientes y logros.
- **Cuentas:** registro e inicio de sesión. Leer es libre; ejecutar código,
  enviar soluciones y guardar progreso requieren cuenta.

## Servicios

| Servicio | Tecnología | Función | Puerto local |
| --- | --- | --- | --- |
| `frontend` | Angular 22 + nginx | Interfaz; nginx reenvía `/api` al backend | 4200 |
| `backend` | Spring Boot 4.1, Java 21 | API REST, autenticación JWT, contenido y progreso | 8080 |
| `postgres` | PostgreSQL 17 | Persistencia | 5432 |
| `code-runner` | Spring Boot 4.1, Java 21 | Orquesta la ejecución aislada de código | ninguno (red interna) |
| `docker-proxy` | docker-socket-proxy | Único acceso al socket de Docker, filtrado | ninguno (red interna) |
| `sandbox-java` | JDK 21 + H2 + JUnit | Imagen de los contenedores donde corre el código de los alumnos (solo se construye) | — |

## Requisitos

- **Docker** con Docker Compose v2 (Docker Desktop en Windows y macOS). Es lo
  único necesario para levantarlo todo.
- Para desarrollar fuera de Docker: **JDK 21** y **Node.js 22.22.3+ o 24.15+**
  (lo exige Angular CLI 22). Maven no hace falta: el proyecto incluye Maven
  Wrapper (`mvnw`).

## Puesta en marcha con Docker

```bash
cp .env.example .env
```

Edita `.env` y define `POSTGRES_PASSWORD` y `JWT_SECRET` (un texto aleatorio de
al menos 32 caracteres; por ejemplo, la salida de `openssl rand -base64 48`).
Después:

```bash
docker compose up -d --build
```

La primera vez tarda unos minutos: descarga las imágenes base y construye la
imagen del sandbox. El servicio `sandbox-java` aparece como terminado
(`exited (0)`): es normal, solo existe para construir esa imagen.

| Qué | Dónde |
| --- | --- |
| Aplicación | http://localhost:4200 |
| API | http://localhost:8080/api/languages |
| Swagger UI | http://localhost:8080/swagger-ui.html |
| Estado de salud | http://localhost:8080/actuator/health |

Crea una cuenta desde la propia aplicación (**Crear cuenta**) para ejecutar
código y guardar tu progreso.

Para detenerlo:

```bash
docker compose down
```

Añade `-v` para borrar también los datos de PostgreSQL.

## Variables de entorno

Se leen del archivo `.env` de la raíz, que no se versiona.

| Variable | Por defecto | Descripción |
| --- | --- | --- |
| `POSTGRES_DB` | `forja` | Nombre de la base de datos |
| `POSTGRES_USER` | `forja` | Usuario de la base de datos |
| `POSTGRES_PASSWORD` | — (obligatoria) | Contraseña de la base de datos |
| `JWT_SECRET` | — (obligatoria) | Clave que firma los tokens de sesión; al menos 32 caracteres |
| `DB_PORT` | `5432` | Puerto de PostgreSQL en tu máquina |
| `BACKEND_PORT` | `8080` | Puerto de la API en tu máquina |
| `FRONTEND_PORT` | `4200` | Puerto de la aplicación en tu máquina |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:4200` | Orígenes autorizados a llamar a la API, separados por comas |
| `API_DOCS_ENABLED` | `true` | Publica Swagger UI y `/v3/api-docs` |
| `LOG_LEVEL` | `INFO` | Nivel de log del código de la aplicación |
| `MAX_CONCURRENT_EXECUTIONS` | `2` | Programas que se ejecutan a la vez; cada uno usa hasta 512 MB |

Solo para ejecutar servicios fuera de Docker:

| Variable | Por defecto | Descripción |
| --- | --- | --- |
| `DB_HOST` | `localhost` | Host de PostgreSQL |
| `CODE_RUNNER_URL` | `http://localhost:8090` | URL del code-runner |
| `DOCKER_API_URL` | `http://localhost:2375` | API de Docker que usa el code-runner |
| `SERVER_PORT` | `8080` / `8090` | Puerto del backend / code-runner |
| `API_PROXY_TARGET` | `http://localhost:8080` | Destino de `/api` para `ng serve` |

## Desarrollo local

Lo habitual es dejar en Docker la base de datos y la ejecución de código, y
ejecutar a mano lo que se está tocando. El archivo `docker-compose.dev.yml`
publica el code-runner en `127.0.0.1:8090` para que un backend local lo use:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d postgres code-runner
```

### Base de datos

El esquema lo crea y actualiza **Flyway** al arrancar el backend, a partir de
`backend/src/main/resources/db/migration`. Hibernate solo valida que las
entidades coincidan con el esquema (`ddl-auto: validate`), así que todo cambio
de base de datos es una migración nueva (`V4__descripcion.sql`); las ya
aplicadas no se modifican.

Para consultar la base de datos:

```bash
docker compose exec postgres psql -U forja -d forja
```

### Backend

```bash
cd backend
./mvnw spring-boot:run
```

En Windows, `mvnw.cmd spring-boot:run`. El backend lee el `.env` de la raíz,
así que no hay que exportar variables. Tests:

```bash
./mvnw verify
```

`ForjaApiIntegrationTest` levanta un PostgreSQL real con Testcontainers, así que
necesita Docker en marcha.

Estructura por capas: `controller` (solo HTTP) → `service` (lógica) →
`repository` (datos), con `dto` y `mapper` para no exponer entidades. Las reglas
puras (XP, niveles, rachas, corrección) viven en `learning` y se prueban sin
Spring.

### Frontend

```bash
cd frontend
npm install
npm start
```

Queda en http://localhost:4200 con recarga en caliente. Las llamadas a `/api`
se reenvían al backend mediante `proxy.conf.mjs`. Tests y build:

```bash
npm test
npm run build
```

Los componentes nuevos se generan con el CLI, que ya está configurado para
crear los cuatro archivos (`.component.ts`, `.html`, `.scss`, `.spec.ts`):

```bash
npx ng generate component features/practice/components/hint-list
```

### Code-runner

Normalmente se ejecuta en Docker (ver arriba). Para ejecutarlo a mano necesita
una API de Docker en `DOCKER_API_URL` y la imagen del sandbox construida
(`docker compose build sandbox-java`):

```bash
cd code-runner
./mvnw spring-boot:run
```

## El contenido del curso

Las lecciones y los ejercicios son archivos del repositorio, no datos que se
editen en la base de datos. Viven en
`backend/src/main/resources/content/<curso>/<NN>-<módulo>/` y el backend los
sincroniza con la base de datos cada vez que arranca:

```
content/java-desde-cero/02-variables/
├── module.yml              lecciones (slug, título, resumen, minutos) y ejercicios, en orden
├── que-es-una-variable.md  cuerpo de una lección, en Markdown
└── intercambiar-valores.yml enunciado, código inicial, solución, pistas y pruebas
```

En las lecciones, los bloques ` ```java ` con un método `main` muestran el botón
**Abrir en el playground**. Los fragmentos incompletos se marcan como
` ```java fragment ` y los ejemplos que fallan a propósito como
` ```java error `.

Cada cambio de contenido se puede comprobar contra el sandbox real: el test
ejecuta todas las soluciones contra sus pruebas y compila todos los códigos
iniciales y ejemplos.

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d code-runner
cd backend
FORJA_RUNNER_URL=http://localhost:8090 ./mvnw test -Dtest=ContentVerificationTest
```

## Docker en detalle

`docker-compose.yml` define tres redes para que cada servicio vea solo lo que
necesita:

| Red | Servicios | Notas |
| --- | --- | --- |
| `edge` | frontend, backend | Tráfico de la aplicación |
| `data` | backend, postgres | Solo el backend llega a la base de datos |
| `runner` | backend, code-runner, docker-proxy | Interna: sin salida a internet |

El código de los alumnos nunca se ejecuta en el code-runner: cada ejecución
crea un contenedor nuevo a partir de `sandbox-java`, sin red, con el sistema de
archivos en solo lectura, sin capabilities, con límites de memoria, CPU,
procesos y tiempo, y se elimina al terminar. El code-runner crea esos
contenedores a través de `docker-proxy`, que solo deja pasar las peticiones de
contenedores e imágenes. PostgreSQL y la API se publican solo en `127.0.0.1`.

Comandos útiles:

```bash
docker compose ps
docker compose logs -f backend
docker compose up -d --build backend
```

## Estructura

```
forja/
├── docker-compose.yml
├── docker-compose.dev.yml   publica el code-runner para desarrollo
├── .env.example
├── docs/ARCHITECTURE.md
├── backend/                 API REST y contenido del curso
├── code-runner/             ejecución aislada de código e imagen del sandbox
└── frontend/                Angular + nginx
```
