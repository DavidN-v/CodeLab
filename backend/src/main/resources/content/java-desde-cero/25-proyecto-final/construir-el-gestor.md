Aquí tienes el gestor de tareas completo. Ábrelo en el playground, escribe órdenes en el panel de entrada y ejecútalo. Después, léelo con calma: cada parte usa algo que aprendiste en un módulo del curso.

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

## El recorrido por el curso

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

## Mejoras para practicar

Ampliar el programa es la mejor forma de afianzar lo aprendido:

1. **Guardar en un archivo** al terminar y cargarlo al empezar (módulo de Archivos).
2. **Etiquetas:** cada tarea con un `Set<String>` y una orden para filtrar por etiqueta.
3. **Pruebas con JUnit** para `GestorDeTareas`: añadir, completar dos veces, vencidas…
4. **Base de datos:** sustituir el `Map` por un DAO sobre H2 (módulo de JDBC).

Los ejercicios de este módulo te proponen variantes de este tipo de aplicación.
