Cuando una lambda solo llama a un método que ya existe, puedes sustituirla por una **referencia a método** con `::`.

## Las cuatro formas

| Forma | Ejemplo | Equivale a |
| --- | --- | --- |
| Método estático | `Integer::parseInt` | `s -> Integer.parseInt(s)` |
| Método de un objeto concreto | `System.out::println` | `x -> System.out.println(x)` |
| Método de instancia del parámetro | `String::toUpperCase` | `s -> s.toUpperCase()` |
| Constructor | `ArrayList::new` | `() -> new ArrayList<>()` |

```java
import java.util.ArrayList;
import java.util.List;
import java.util.function.Function;
import java.util.function.Supplier;

public class Main {
    public static void main(String[] args) {
        List<String> textos = List.of("10", "20", "30");
        List<Integer> numeros = new ArrayList<>();
        textos.stream().map(Integer::parseInt).forEach(numeros::add);
        System.out.println(numeros);

        List.of("ada", "grace").stream().map(String::toUpperCase).forEach(System.out::println);

        Function<String, StringBuilder> crear = StringBuilder::new;
        System.out.println(crear.apply("Java").reverse());

        Supplier<List<String>> nuevaLista = ArrayList::new;
        List<String> vacia = nuevaLista.get();
        System.out.println(vacia.isEmpty());
    }
}
```

## Con comparadores

Donde más brillan es al construir comparadores:

```java
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

record Persona(String nombre, int edad) {}

public class Main {
    public static void main(String[] args) {
        List<Persona> personas = new ArrayList<>(List.of(
                new Persona("Grace", 40), new Persona("Ada", 36), new Persona("Alan", 40)));
        personas.sort(Comparator.comparing(Persona::edad).thenComparing(Persona::nombre));
        System.out.println(personas);
        personas.sort(Comparator.comparing(Persona::nombre).reversed());
        System.out.println(personas);
    }
}
```

`Comparator.comparing(Persona::edad)` se lee casi como una frase: "compara por edad". `thenComparing` desempata y `reversed` invierte.

## ¿Lambda o referencia?

Usa la referencia cuando sea igual de clara o más (`String::length` frente a `s -> s.length()`). Si necesitas hacer algo más que llamar al método (`s -> s.length() * 2`), escribe la lambda.

## Resumen

- `Clase::metodo` sustituye a una lambda que solo llama a ese método.
- Cuatro formas: estático, de un objeto concreto, de instancia del parámetro y constructor (`::new`).
- `Comparator.comparing(Tipo::campo)` con `thenComparing` y `reversed` construye órdenes legibles.
