# Forja

Plataforma web para aprender y practicar programación: teoría, ejemplos
ejecutables, ejercicios con comprobación automática y progreso. Java es el
primer lenguaje; la arquitectura trata el lenguaje como un dato para poder
añadir más sin reescribir nada.

Estado: **Fase 1** (arquitectura base). El detalle del diseño y de las fases
está en [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Servicios

| Servicio | Tecnología | Función | Puerto local |
| --- | --- | --- | --- |
| `frontend` | Angular 22 + nginx | Interfaz; nginx reenvía `/api` al backend | 4200 |
| `backend` | Spring Boot 4.1, Java 21 | API REST | 8080 |
| `postgres` | PostgreSQL 17 | Persistencia | 5432 |
| `code-runner` | Spring Boot 4.1, Java 21 | Ejecución aislada de código | ninguno (red interna) |

## Requisitos

- **Docker** con Docker Compose v2. Es lo único necesario para levantar todo.
- Para desarrollar fuera de Docker: **JDK 21** y **Node.js 22 o superior**.
  Maven no hace falta: el proyecto incluye Maven Wrapper (`mvnw`).

## Puesta en marcha con Docker

```bash
cp .env.example .env
```

Edita `.env` y define `POSTGRES_PASSWORD`. Después:

```bash
docker compose up -d --build
```

| Qué | Dónde |
| --- | --- |
| Aplicación | http://localhost:4200 |
| API | http://localhost:8080/api/languages |
| Swagger UI | http://localhost:8080/swagger-ui.html |
| Estado de salud | http://localhost:8080/actuator/health |

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
| `DB_PORT` | `5432` | Puerto de PostgreSQL en tu máquina |
| `BACKEND_PORT` | `8080` | Puerto de la API en tu máquina |
| `FRONTEND_PORT` | `4200` | Puerto de la aplicación en tu máquina |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:4200` | Orígenes autorizados a llamar a la API, separados por comas |
| `API_DOCS_ENABLED` | `true` | Publica Swagger UI y `/v3/api-docs` |
| `LOG_LEVEL` | `INFO` | Nivel de log del código de la aplicación |

Solo para ejecutar servicios fuera de Docker:

| Variable | Por defecto | Descripción |
| --- | --- | --- |
| `DB_HOST` | `localhost` | Host de PostgreSQL |
| `CODE_RUNNER_URL` | `http://localhost:8090` | URL del code-runner |
| `SERVER_PORT` | `8080` / `8090` | Puerto del backend / code-runner |
| `API_PROXY_TARGET` | `http://localhost:8080` | Destino de `/api` para `ng serve` |

## Desarrollo local

Lo habitual es dejar la base de datos y el code-runner en Docker y ejecutar a
mano lo que se está tocando.

### Base de datos

```bash
docker compose up -d postgres
```

El esquema lo crea y actualiza **Flyway** al arrancar el backend, a partir de
`backend/src/main/resources/db/migration`. Hibernate solo valida que las
entidades coincidan con el esquema (`ddl-auto: validate`), así que todo cambio
de base de datos es una migración nueva (`V3__descripcion.sql`); las ya
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

Estructura por capas: `controller` (solo HTTP) → `service` (lógica) →
`repository` (datos), con `dto` y `mapper` para no exponer entidades.

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
npx ng generate component features/courses/components/module-card
```

### Code-runner

```bash
cd code-runner
./mvnw spring-boot:run
```

Escucha en el puerto 8090. En esta fase solo expone su estado de salud; la
ejecución de código llega en la Fase 4 (diseño en
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md#6-ejecución-segura-de-código)).

## Docker en detalle

`docker-compose.yml` define tres redes para que cada servicio vea solo lo que
necesita:

| Red | Servicios | Notas |
| --- | --- | --- |
| `edge` | frontend, backend | Tráfico de la aplicación |
| `data` | backend, postgres | Solo el backend llega a la base de datos |
| `runner` | backend, code-runner | Interna: sin salida a internet |

El `code-runner` no publica puertos, no ve PostgreSQL, tiene el sistema de
archivos en solo lectura, ninguna capability de Linux y límites de memoria,
CPU y procesos. PostgreSQL y la API se publican solo en `127.0.0.1`.

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
├── .env.example
├── docs/ARCHITECTURE.md
├── backend/        API REST
├── code-runner/    Ejecución aislada de código
└── frontend/       Angular + nginx
```
