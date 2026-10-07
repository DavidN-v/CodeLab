Ha llegado el momento: vas a ver el gestor de tareas que diseñamos, construido pieza a pieza. No hace falta que lo entiendas todo de golpe. Vamos por pasos, y en cada uno reconocerás algo que ya sabes hacer.

> [!analogia]
> Construir una aplicación es como montar un mueble: primero las piezas sueltas (el modelo), después la estructura que las une (el gestor) y al final los tiradores, lo que tocas tú (el `Main`). Si montas en orden, cada paso es sencillo.

## Paso 1. El modelo: `Prioridad` y `Tarea`

Empezamos por los datos. `Prioridad` es un enum y `Tarea` un record que se valida a sí mismo en su constructor compacto. Ejecuta este trozo para comprobar que el modelo funciona antes de seguir:

```java
import java.time.LocalDate;

enum Prioridad { ALTA, MEDIA, BAJA }

record Tarea(int id, String titulo, Prioridad prioridad, LocalDate limite, boolean completada) {
    Tarea {
        if (titulo == null || titulo.isBlank()) {
            throw new IllegalArgumentException("El título no puede estar vacío");
        }
    }

    Tarea completar() {
        return new Tarea(id, titulo, prioridad, limite, true);
    }
}

public class Main {
    public static void main(String[] args) {
        Tarea tarea = new Tarea(1, "Estudiar streams", Prioridad.ALTA, LocalDate.of(2026, 10, 10), false);
        Tarea hecha = tarea.completar();
        System.out.println(tarea.completada() + " " + hecha.completada());
        try {
            new Tarea(2, "  ", Prioridad.BAJA, null, false);
        } catch (IllegalArgumentException e) {
            System.out.println("Error: " + e.getMessage());
        }
    }
}
```

- `completar()` no modifica la tarea: devuelve **otra** tarea con `completada = true`. Por eso imprime `false true`.
- Un título en blanco no llega a crear la tarea: el constructor lanza la excepción.

> [!prueba]
> Cambia el título `"  "` por `"Comprar café"` y vuelve a ejecutar: ¿desaparece la línea de error?

## Paso 2. El gestor: las reglas en un solo sitio

`GestorDeTareas` guarda las tareas en un `LinkedHashMap` (por id, en orden de creación) y protege las reglas. Fíjate en cómo `completar` comprueba los dos errores posibles antes de hacer nada:

```java fragment
Tarea completar(int id) {
    Tarea tarea = tareas.get(id);
    if (tarea == null) {
        throw new NoSuchElementException("No existe la tarea #" + id);
    }
    if (tarea.completada()) {
        throw new IllegalStateException("La tarea #" + id + " ya estaba completada");
    }
    Tarea hecha = tarea.completar();
    tareas.put(id, hecha);
    return hecha;
}
```

Las consultas (`pendientes`, `vencidas`, `pendientesPorPrioridad`) son streams: filtran, ordenan con un `Comparator` y cuentan. El gestor nunca escribe en pantalla: devuelve datos o lanza excepciones.

> [!idea]
> Comprobar primero los errores y hacer el trabajo después mantiene el estado siempre válido: si algo falla, no se ha cambiado nada.

## Paso 3. `Main`: leer órdenes y responder

`Main` lee cada línea, la reparte con un `switch` y, si el gestor lanza una excepción, escribe `Error:` y sigue con la siguiente orden. Aquí tienes el programa completo. Ábrelo en el playground, escribe órdenes en el panel de entrada y ejecútalo:

```java
import java.time.LocalDate;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Scanner;
import java.util.stream.Collectors;

enum Prioridad { ALTA, MEDIA, BAJA }

record Tarea(int id, String titulo, Prioridad prioridad, LocalDate limite, boolean completada) {
    Tarea {
        if (titulo == null || titulo.isBlank()) {
            throw new IllegalArgumentException("El título no puede estar vacío");
        }
    }

    Tarea completar() {
        return new Tarea(id, titulo, prioridad, limite, true);
    }

    boolean vencidaEn(LocalDate fecha) {
        return !completada && limite != null && limite.isBefore(fecha);
    }

    @Override
    public String toString() {
        return "#" + id + " [" + prioridad + "] " + titulo + (limite == null ? "" : " (vence " + limite + ")")
                + (completada ? " ✓" : "");
    }
}

class GestorDeTareas {
    private static final Comparator<Tarea> POR_URGENCIA = Comparator.comparing(Tarea::prioridad)
        .thenComparing(Tarea::limite, Comparator.nullsLast(Comparator.naturalOrder()))
        .thenComparing(Tarea::id);

    private final Map<Integer, Tarea> tareas = new LinkedHashMap<>();
    private int siguienteId = 1;

    Tarea anadir(String titulo, Prioridad prioridad, LocalDate limite) {
        Tarea tarea = new Tarea(siguienteId, titulo, prioridad, limite, false);
        tareas.put(tarea.id(), tarea);
        siguienteId++;
        return tarea;
    }

    Tarea completar(int id) {
        Tarea tarea = tareas.get(id);
        if (tarea == null) {
            throw new NoSuchElementException("No existe la tarea #" + id);
        }
        if (tarea.completada()) {
            throw new IllegalStateException("La tarea #" + id + " ya estaba completada");
        }
        Tarea hecha = tarea.completar();
        tareas.put(id, hecha);
        return hecha;
    }

    List<Tarea> pendientes() {
        return tareas.values().stream().filter(t -> !t.completada()).sorted(POR_URGENCIA).toList();
    }

    List<Tarea> vencidas(LocalDate fecha) {
        return tareas.values().stream().filter(t -> t.vencidaEn(fecha)).sorted(POR_URGENCIA).toList();
    }

    Map<Prioridad, Long> pendientesPorPrioridad() {
        return tareas.values().stream()
            .filter(t -> !t.completada())
            .collect(Collectors.groupingBy(Tarea::prioridad, () -> new java.util.EnumMap<>(Prioridad.class),
                    Collectors.counting()));
    }

    long completadas() {
        return tareas.values().stream().filter(Tarea::completada).count();
    }
}

public class Main {
    public static void main(String[] args) {
        GestorDeTareas gestor = new GestorDeTareas();
        Scanner entrada = new Scanner(System.in);
        while (entrada.hasNextLine()) {
            String linea = entrada.nextLine().strip();
            if (linea.isEmpty()) {
                continue;
            }
            try {
                ejecutar(gestor, linea);
            } catch (IllegalArgumentException | IllegalStateException | NoSuchElementException e) {
                System.out.println("Error: " + e.getMessage());
            }
        }
    }

    private static void ejecutar(GestorDeTareas gestor, String linea) {
        String[] partes = linea.split(";");
        switch (partes[0]) {
            case "añadir" -> {
                Prioridad prioridad = Prioridad.valueOf(partes[2].strip().toUpperCase());
                LocalDate limite = partes.length > 3 ? LocalDate.parse(partes[3].strip()) : null;
                System.out.println("Añadida " + gestor.anadir(partes[1].strip(), prioridad, limite));
            }
            case "completar" -> System.out.println("Completada " + gestor.completar(Integer.parseInt(partes[1].strip())));
            case "pendientes" -> gestor.pendientes().forEach(System.out::println);
            case "vencidas" -> gestor.vencidas(LocalDate.parse(partes[1].strip())).forEach(System.out::println);
            case "resumen" -> System.out.println(gestor.pendientesPorPrioridad() + ", completadas: " + gestor.completadas());
            default -> throw new IllegalArgumentException("Orden desconocida: " + partes[0]);
        }
    }
}
```

Prueba con esta entrada:

```
añadir;Estudiar streams;alta;2026-10-10
añadir;Comprar café;baja
añadir;Entregar proyecto;alta;2026-10-05
completar;2
completar;9
pendientes
vencidas;2026-10-07
resumen
```

> [!prueba]
> Añade al final de la entrada la línea `completar;1` y otra vez `completar;1`. La segunda debe responder con un error, sin que el programa se detenga.

> [!cuidado]
> Si una línea tiene menos campos de los esperados (por ejemplo, `añadir;Algo` sin prioridad), `partes[2]` lanza `ArrayIndexOutOfBoundsException`, que no se captura. Intenta arreglarlo tú: es una buena primera mejora.

## Paso 4. Mira todo lo que has usado

Cada parte del programa sale de un módulo del curso. Todo esto ya lo sabes hacer:

| Parte del código | Módulo |
| --- | --- |
| `enum Prioridad` y su orden natural | Clases (enumeraciones) |
| `record Tarea` con validación en el constructor compacto | Objetos |
| `completar()` devuelve una tarea nueva en lugar de modificarla | Objetos (inmutabilidad) |
| `GestorDeTareas` con estado privado y reglas | POO, Clases |
| `Map` con `LinkedHashMap` | Collections |
| `Comparator.comparing(...).thenComparing(...)` y `nullsLast` | Lambdas |
| `filter`, `sorted`, `groupingBy`, `counting` | Streams |
| Excepciones distintas según el error, capturadas en `Main` | Excepciones |
| `LocalDate.parse`, `isBefore` | Fechas |
| `switch` con flechas sobre texto | Condicionales |

## Paso 5. Hazlo tuyo

Ampliar el programa es la mejor forma de afianzar lo aprendido. Elige una mejora y atrévete:

1. **Guardar en un archivo** al terminar y cargarlo al empezar (módulo de Archivos).
2. **Etiquetas:** cada tarea con un `Set<String>` y una orden para filtrar por etiqueta.
3. **Pruebas con JUnit** para `GestorDeTareas`: añadir, completar dos veces, vencidas…
4. **Base de datos:** sustituir el `Map` por un DAO sobre H2 (módulo de JDBC).

Los ejercicios de este módulo te proponen variantes de este tipo de aplicación. Si te atascas, vuelve a este programa: es tu mapa.

> [!resumen]
> - Construye por capas: primero el modelo, después el gestor con las reglas y al final `Main`.
> - Prueba cada pieza en cuanto la tengas, antes de añadir la siguiente.
> - El gestor no escribe en pantalla: devuelve datos o lanza excepciones, y `Main` decide qué mostrar.
> - Todo el programa está hecho con piezas que ya conoces.
