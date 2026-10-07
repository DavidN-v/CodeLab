## filter: quedarse con algunos

```java
import java.util.List;

public class Main {
    public static void main(String[] args) {
        List<Integer> numeros = List.of(5, 12, 8, 3, 20, 15);
        System.out.println(numeros.stream().filter(n -> n > 7).toList());       // [12, 8, 20, 15]
        System.out.println(numeros.stream().filter(n -> n % 5 == 0).toList());  // [5, 20, 15]
    }
}
```

## map: transformar cada elemento

`map` aplica una función a cada elemento; el tipo puede cambiar:

```java
import java.util.List;

record Producto(String nombre, double precio) {}

public class Main {
    public static void main(String[] args) {
        List<Producto> productos = List.of(new Producto("Taza", 6), new Producto("Libro", 18.5));
        List<String> nombres = productos.stream().map(Producto::nombre).toList();
        List<Double> conIva = productos.stream().map(p -> p.precio() * 1.21).toList();
        System.out.println(nombres);
        System.out.println(conIva);
    }
}
```

## sorted, distinct, limit, skip

```java
import java.util.Comparator;
import java.util.List;

public class Main {
    public static void main(String[] args) {
        List<Integer> datos = List.of(4, 9, 4, 1, 9, 7, 3);
        System.out.println(datos.stream().distinct().toList());                          // [4, 9, 1, 7, 3]
        System.out.println(datos.stream().sorted().toList());                            // ascendente
        System.out.println(datos.stream().sorted(Comparator.reverseOrder()).toList());   // descendente
        System.out.println(datos.stream().sorted().limit(3).toList());                   // los 3 menores
        System.out.println(datos.stream().skip(5).toList());                             // a partir del sexto
    }
}
```

## flatMap: aplanar

Cuando cada elemento produce varios, `flatMap` los junta en un único stream:

```java
import java.util.Arrays;
import java.util.List;

public class Main {
    public static void main(String[] args) {
        List<String> frases = List.of("hola mundo", "hola Java");
        List<String> palabras = frases.stream()
            .flatMap(frase -> Arrays.stream(frase.split(" ")))
            .distinct()
            .toList();
        System.out.println(palabras);   // [hola, mundo, Java]
    }
}
```

## Operaciones terminales de búsqueda

```java
import java.util.List;
import java.util.Optional;

public class Main {
    public static void main(String[] args) {
        List<Integer> edades = List.of(15, 22, 17, 40);
        System.out.println(edades.stream().anyMatch(e -> e >= 18));   // ¿alguno es adulto?
        System.out.println(edades.stream().allMatch(e -> e >= 18));   // ¿todos?
        System.out.println(edades.stream().noneMatch(e -> e > 100));  // ¿ninguno?
        System.out.println(edades.stream().filter(e -> e >= 18).count());

        Optional<Integer> primerAdulto = edades.stream().filter(e -> e >= 18).findFirst();
        System.out.println(primerAdulto.orElse(-1));
        Optional<Integer> mayor = edades.stream().max(Integer::compare);
        System.out.println(mayor.get());
    }
}
```

`findFirst`, `max` y `min` devuelven un **Optional**: una caja que puede estar vacía (si no había ningún elemento). Lo abres con `orElse(valorPorDefecto)`, `isPresent()` o, si estás seguro de que hay valor, `get()`. Es la forma moderna de decir "puede que no haya resultado" sin usar `null`.

## Resumen

- `filter` se queda con lo que cumple una condición; `map` transforma cada elemento.
- `sorted`, `distinct`, `limit` y `skip` reordenan y recortan.
- `flatMap` aplana streams de streams.
- `anyMatch`, `allMatch`, `count`, `findFirst`, `max`; los que pueden no encontrar nada devuelven `Optional`.
