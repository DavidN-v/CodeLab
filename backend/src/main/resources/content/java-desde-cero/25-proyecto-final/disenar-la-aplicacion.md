Has llegado al final del recorrido. Es momento de juntar todo en una aplicación completa: un **gestor de tareas** de línea de comandos. En esta lección la diseñamos; en la siguiente, la construimos.

## 1. Los requisitos

Antes de escribir código, decide qué debe hacer. Nuestra lista:

- Añadir una tarea con título, prioridad (alta, media, baja) y fecha límite opcional.
- Marcar una tarea como completada.
- Listar las tareas pendientes, ordenadas por prioridad y luego por fecha límite.
- Ver las tareas vencidas respecto a una fecha.
- Mostrar estadísticas: pendientes, completadas y por prioridad.
- Rechazar órdenes inválidas con mensajes claros, sin que el programa se detenga.

Fíjate en que cada requisito es **comprobable**: podrías escribir una prueba para cada uno.

## 2. Encontrar el modelo

Subraya los sustantivos de los requisitos: *tarea*, *título*, *prioridad*, *fecha límite*, *estado*. Y los verbos: *añadir*, *completar*, *listar*, *ver vencidas*.

| Concepto | Lo modelamos como | Por qué |
| --- | --- | --- |
| Prioridad | `enum Prioridad { ALTA, MEDIA, BAJA }` | Conjunto cerrado de valores, con orden |
| Tarea | `record Tarea(int id, String titulo, Prioridad prioridad, LocalDate limite, boolean completada)` | Datos inmutables; "completar" crea una tarea nueva |
| La lista de tareas y sus reglas | `class GestorDeTareas` | Tiene estado que cambia y reglas que proteger |
| Leer órdenes y escribir respuestas | `class Main` | Separar la interfaz de la lógica |

## 3. Repartir responsabilidades

```
Main (lee órdenes, escribe resultados)
  └── GestorDeTareas (reglas: ids, validación, consultas)
        └── Map<Integer, Tarea> (almacenamiento)
```

- `Main` no sabe cómo se guardan las tareas; solo llama a métodos del gestor.
- `GestorDeTareas` no sabe nada de `Scanner` ni de `System.out`: recibe datos y devuelve resultados o lanza excepciones. Eso lo hace **fácil de probar**.
- Si mañana la interfaz es web en vez de consola, solo cambia `Main`.

## 4. Decidir los errores

Qué puede fallar y cómo lo comunicamos:

| Situación | Excepción |
| --- | --- |
| Título vacío, prioridad inexistente | `IllegalArgumentException` |
| Completar una tarea que no existe | `NoSuchElementException` |
| Completar una tarea ya completada | `IllegalStateException` |

`Main` captura esas excepciones y muestra el mensaje: el programa nunca se detiene por una orden mal escrita.

## 5. Elegir las estructuras

- Buscar por id muchas veces → `Map<Integer, Tarea>`.
- Mostrar en orden de creación → `LinkedHashMap`, que conserva el orden de inserción.
- Ordenar por prioridad y fecha → un `Comparator` con `comparing` y `thenComparing`; los enums ya se ordenan por su posición en la declaración.
- Filtrar y contar → streams.

## Antes de construir

Un buen diseño no tiene que ser perfecto a la primera: tiene que ser fácil de cambiar. Clases pequeñas con una responsabilidad, datos inmutables donde se pueda y reglas en un único sitio. Es todo lo que has practicado en el curso.
