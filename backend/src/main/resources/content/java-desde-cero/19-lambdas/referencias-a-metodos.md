Cuando una lambda solo llama a un método que ya existe, puedes sustituirla por una **referencia a método** con `::`.

> [!analogia]
> En vez de explicarle a alguien la receta paso a paso ("coge harina, añade agua..."), le dices "haz la receta de la página 12". Una referencia a método es eso: señalar algo que ya está escrito en lugar de repetirlo.

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

> [!prueba]
> Cambia `String::toUpperCase` por `String::length` y ejecuta: ¿qué se imprime ahora en lugar de los nombres?

> [!cuidado]
> Una referencia a método no lleva paréntesis: es `String::toUpperCase`, no `String::toUpperCase()`. Con paréntesis estarías llamando al método, no señalándolo, y no compila.

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

> [!idea]
> `Clase::metodo` es una lambda abreviada: solo sirve cuando la lambda se limita a llamar a ese método.

> [!resumen]
> - `Clase::metodo` sustituye a una lambda que solo llama a ese método.
> - Cuatro formas: estático, de un objeto concreto, de instancia del parámetro y constructor (`::new`).
> - `Comparator.comparing(Tipo::campo)` con `thenComparing` y `reversed` construye órdenes legibles.
