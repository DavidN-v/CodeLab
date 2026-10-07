Los arrays tienen tamaño fijo. En la práctica casi siempre usarás **colecciones**: estructuras de datos que crecen y encogen solas y traen operaciones ya hechas. Viven en el paquete `java.util`.

## ArrayList

Una `List` es una secuencia ordenada que admite repetidos y se accede por posición. La implementación habitual es `ArrayList`:

```java
import java.util.ArrayList;
import java.util.List;

public class Main {
    public static void main(String[] args) {
        List<String> tareas = new ArrayList<>();
        tareas.add("Estudiar Java");
        tareas.add("Hacer ejercicios");
        tareas.add(0, "Desayunar");          // insertar en una posición
        System.out.println(tareas);           // [Desayunar, Estudiar Java, Hacer ejercicios]
        System.out.println(tareas.size());    // 3
        System.out.println(tareas.get(1));    // Estudiar Java
        tareas.set(2, "Resolver ejercicios"); // reemplazar
        tareas.remove("Desayunar");           // por valor
        tareas.remove(0);                     // por posición
        System.out.println(tareas);
        System.out.println(tareas.contains("Resolver ejercicios"));
        System.out.println(tareas.isEmpty());
    }
}
```

- `List<String>` indica el tipo de los elementos, entre `< >` (son genéricos, el próximo módulo).
- Declara la variable con la **interfaz** `List` y crea la implementación con `new ArrayList<>()`: así podrías cambiarla sin tocar el resto.
- Las colecciones solo guardan objetos: para números usa `List<Integer>` y Java convierte automáticamente.

## Recorrer

```java
import java.util.ArrayList;
import java.util.List;

public class Main {
    public static void main(String[] args) {
        List<Integer> notas = new ArrayList<>(List.of(7, 4, 9, 5, 3));
        for (int nota : notas) {
            System.out.print(nota + " ");
        }
        System.out.println();
        for (int i = 0; i < notas.size(); i++) {
            System.out.print(i + ":" + notas.get(i) + " ");
        }
        System.out.println();
        notas.removeIf(nota -> nota < 5);   // quita los suspensos
        System.out.println(notas);
    }
}
```

> **Cuidado:** no elimines elementos de una lista mientras la recorres con un for-each: lanza `ConcurrentModificationException`. Usa `removeIf` o un iterador.

## Listas inmutables

`List.of(...)` crea una lista que **no se puede modificar**: útil para datos fijos. Si necesitas modificarla, cópiala: `new ArrayList<>(List.of(...))`.

## Ordenar y otras utilidades

```java
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;

public class Main {
    public static void main(String[] args) {
        List<String> nombres = new ArrayList<>(List.of("Grace", "ada", "Linus", "Alan"));
        Collections.sort(nombres);
        System.out.println(nombres);
        nombres.sort(String.CASE_INSENSITIVE_ORDER);
        System.out.println(nombres);
        nombres.sort(Comparator.comparing(String::length));
        System.out.println(nombres);
        System.out.println(Collections.max(nombres) + " " + nombres.indexOf("Linus"));
        Collections.reverse(nombres);
        System.out.println(nombres);
    }
}
```

## ArrayList o LinkedList

Existe también `LinkedList`. `ArrayList` es la opción por defecto: acceso por posición inmediato y muy buen rendimiento en general. `LinkedList` solo compensa en casos raros de muchas inserciones en medio. Ante la duda, `ArrayList`.

## Resumen

- `List<T> lista = new ArrayList<>();` crece sola; `add`, `get`, `set`, `remove`, `size`, `contains`.
- Declara con la interfaz `List`, crea con `ArrayList`.
- `List.of(...)` es inmutable; `removeIf` borra con una condición.
- `sort` con un `Comparator`, y `Collections` para utilidades.
