Has recorrido el lenguaje de punta a punta: desde `System.out.println` hasta streams, concurrencia, bases de datos y pruebas. Esto es lo que suele venir después.

## 1. Programar en tu ordenador

En esta plataforma cada programa es un único archivo. Los proyectos reales tienen cientos, organizados en **paquetes**, y se trabaja con:

- **Un JDK instalado:** descarga Java 21 (por ejemplo, de Eclipse Temurin) y comprueba con `java -version`.
- **Un IDE:** IntelliJ IDEA Community o VS Code con la extensión de Java. Autocompletado, depurador, refactorizaciones y ejecución de pruebas con un clic.

## 2. Maven o Gradle

Un proyecto real depende de bibliotecas (JUnit, un driver de base de datos, Spring…). **Maven** y **Gradle** las descargan, compilan el proyecto, ejecutan las pruebas y empaquetan el resultado. La estructura estándar de Maven:

```
mi-proyecto/
├── pom.xml                  dependencias y configuración
└── src/
    ├── main/java/           el código
    └── test/java/           las pruebas
```

Con `mvn test` se ejecutan todas las pruebas; con `mvn package`, se genera el `.jar`.

## 3. Git

**Git** guarda el historial de tu código: puedes volver atrás, probar ideas en ramas y colaborar con otras personas a través de GitHub o GitLab. Es imprescindible en cualquier trabajo de programación. Aprende al menos `init`, `add`, `commit`, `branch`, `merge`, `push` y `pull`.

## 4. Spring Boot

El framework más usado para construir aplicaciones Java en empresas: APIs web, acceso a bases de datos, seguridad… El backend de esta misma plataforma está hecho con Spring Boot. Con lo que sabes ya puedes entender su código: controladores (clases con métodos que responden a peticiones HTTP), servicios (lógica de negocio), repositorios (los DAO del módulo de JDBC) y pruebas con JUnit.

## 5. Temas para profundizar

- **Estructuras de datos y algoritmos:** complejidad, árboles, grafos, ordenación. Son la base de las entrevistas técnicas.
- **Diseño:** principios SOLID, patrones de diseño, arquitectura en capas.
- **Bases de datos:** SQL a fondo, índices, JPA/Hibernate.
- **Java moderno:** cada versión añade novedades; los registros, el pattern matching y los hilos virtuales son solo el principio.

## 6. Construye cosas

La forma más eficaz de seguir aprendiendo es construir proyectos que te interesen: un gestor de gastos, un bot, un juego por turnos, una API para tus recetas. Cada proyecto te obligará a buscar, leer documentación y resolver problemas nuevos, que es exactamente el trabajo de un programador.

Y mientras tanto, sigue resolviendo ejercicios aquí: repetir y variar es lo que convierte el conocimiento en soltura.

¡Enhorabuena por llegar hasta aquí!
