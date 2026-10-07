Al final de la cinta hay que meter los elementos en algún sitio o resumirlos en un número. Esta lección muestra las operaciones terminales que **resumen**: sumar, contar, agrupar y combinar.

## Streams numéricos

`mapToInt`, `mapToDouble` y `mapToLong` convierten a streams de primitivos, que traen estadísticas listas:

> [!analogia]
> Es como pasar los tickets de la compra por una calculadora: en cuanto solo quedan números, te da la suma, la media, el máximo y el mínimo sin que tengas que hacer las cuentas.

```java
import java.util.List;

record Venta(String producto, int unidades, double precio) {}

public class Main {
    public static void main(String[] args) {
        List<Venta> ventas = List.of(
                new Venta("café", 3, 1.5), new Venta("té", 1, 1.2), new Venta("zumo", 2, 2.8));
        int unidades = ventas.stream().mapToInt(Venta::unidades).sum();
        double ingresos = ventas.stream().mapToDouble(v -> v.unidades() * v.precio()).sum();
        double precioMedio = ventas.stream().mapToDouble(Venta::precio).average().orElse(0);
        System.out.printf("%d unidades, %.2f €, precio medio %.2f €%n", unidades, ingresos, precioMedio);

        var estadisticas = ventas.stream().mapToInt(Venta::unidades).summaryStatistics();
        System.out.println(estadisticas.getMin() + " " + estadisticas.getMax() + " " + estadisticas.getAverage());
    }
}
```

> [!cuidado]
> `average()` devuelve un `OptionalDouble`, no un número: si la lista está vacía no hay media. Ábrelo con `orElse(0)` (o el valor que tenga sentido) antes de usarlo.

## collect y Collectors

`collect` reúne los elementos en una estructura, según el `Collector` que le pases:

```java
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

public class Main {
    public static void main(String[] args) {
        List<String> palabras = List.of("sol", "luna", "estrella", "sol", "mar");
        Set<String> unicas = palabras.stream().collect(Collectors.toSet());
        String unidas = palabras.stream().collect(Collectors.joining(", ", "[", "]"));
        Map<String, Integer> longitudes = palabras.stream()
            .distinct()
            .collect(Collectors.toMap(p -> p, String::length));
        System.out.println(unicas.size());
        System.out.println(unidas);
        System.out.println(longitudes.get("estrella"));
    }
}
```

> [!prueba]
> Cambia `Collectors.joining(", ", "[", "]")` por `Collectors.joining(" - ")` y ejecuta: ¿cómo cambia la segunda línea?

## groupingBy: agrupar

El collector más potente: agrupa los elementos en un `Map` según una clave.

> [!analogia]
> `groupingBy` es repartir la ropa limpia en montones: uno por cada dueño. La clave (`Alumno::curso`) dice a qué montón va cada prenda.

```java
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

record Alumno(String nombre, String curso, double nota) {}

public class Main {
    public static void main(String[] args) {
        List<Alumno> alumnos = List.of(
                new Alumno("Ada", "1A", 9), new Alumno("Alan", "1B", 7),
                new Alumno("Grace", "1A", 8), new Alumno("Linus", "1B", 5));

        Map<String, List<String>> porCurso = alumnos.stream()
            .collect(Collectors.groupingBy(Alumno::curso, TreeMap::new,
                    Collectors.mapping(Alumno::nombre, Collectors.toList())));
        Map<String, Double> mediaPorCurso = alumnos.stream()
            .collect(Collectors.groupingBy(Alumno::curso, TreeMap::new, Collectors.averagingDouble(Alumno::nota)));
        Map<Boolean, Long> aprobados = alumnos.stream()
            .collect(Collectors.partitioningBy(a -> a.nota() >= 6, Collectors.counting()));

        System.out.println(porCurso);        // {1A=[Ada, Grace], 1B=[Alan, Linus]}
        System.out.println(mediaPorCurso);   // {1A=8.5, 1B=6.0}
        System.out.println(aprobados);       // {false=1, true=3}
    }
}
```

- `groupingBy(clave)` agrupa en listas; el segundo argumento opcional (`TreeMap::new`) elige el tipo de mapa, y el tercero, qué hacer con cada grupo: `counting()`, `averagingDouble(...)`, `mapping(...)`, `summingInt(...)`.
- `partitioningBy(condición)` divide en dos grupos, `true` y `false`.

## reduce

`reduce` combina todos los elementos en uno con una operación:

> [!analogia]
> `reduce` es una bola de nieve que rueda: empieza con un valor inicial y va absorbiendo cada elemento hasta quedar una sola bola.

```java
import java.util.List;

public class Main {
    public static void main(String[] args) {
        List<Integer> numeros = List.of(2, 3, 4);
        int producto = numeros.stream().reduce(1, (a, b) -> a * b);
        String concatenado = List.of("a", "b", "c").stream().reduce("", String::concat);
        System.out.println(producto + " " + concatenado);
    }
}
```

El primer argumento es el valor inicial (el neutro de la operación). Para sumas usa mejor `mapToInt(...).sum()`.

> [!resumen]
> - `mapToInt` y compañía dan `sum`, `average`, `max` y `summaryStatistics`.
> - `collect(Collectors.toSet() / joining / toMap)` reúne en otras estructuras.
> - `groupingBy` agrupa en un mapa; `partitioningBy` separa en verdadero/falso.
> - `reduce` combina todo en un único valor.
