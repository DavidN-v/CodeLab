El paquete `java.util.function` trae las interfaces funcionales más comunes, para que no tengas que declarar las tuyas:

| Interfaz | Método | Recibe → devuelve | Ejemplo |
| --- | --- | --- | --- |
| `Function<T, R>` | `apply` | T → R | `s -> s.length()` |
| `Predicate<T>` | `test` | T → boolean | `n -> n > 0` |
| `Consumer<T>` | `accept` | T → nada | `s -> System.out.println(s)` |
| `Supplier<T>` | `get` | nada → T | `() -> new ArrayList<>()` |
| `UnaryOperator<T>` | `apply` | T → T | `s -> s.trim()` |
| `BinaryOperator<T>` | `apply` | (T, T) → T | `(a, b) -> a + b` |
| `BiFunction<T, U, R>` | `apply` | (T, U) → R | `(nombre, edad) -> nombre + edad` |

## Usarlas

```java
import java.util.function.BinaryOperator;
import java.util.function.Consumer;
import java.util.function.Function;
import java.util.function.Predicate;
import java.util.function.Supplier;

public class Main {
    public static void main(String[] args) {
        Function<String, Integer> longitud = s -> s.length();
        Predicate<Integer> esPar = n -> n % 2 == 0;
        Consumer<String> gritar = s -> System.out.println(s.toUpperCase() + "!");
        Supplier<String> saludo = () -> "hola";
        BinaryOperator<Integer> mayor = (a, b) -> a > b ? a : b;

        System.out.println(longitud.apply("Java"));    // 4
        System.out.println(esPar.test(7));             // false
        gritar.accept("cuidado");
        System.out.println(saludo.get());
        System.out.println(mayor.apply(3, 8));
    }
}
```

## Métodos que reciben funciones

Lo interesante es escribir métodos que reciben comportamiento como parámetro:

```java
import java.util.ArrayList;
import java.util.List;
import java.util.function.Function;
import java.util.function.Predicate;

public class Main {
    static <T> List<T> filtrar(List<T> lista, Predicate<T> condicion) {
        List<T> resultado = new ArrayList<>();
        for (T elemento : lista) {
            if (condicion.test(elemento)) {
                resultado.add(elemento);
            }
        }
        return resultado;
    }

    static <T, R> List<R> transformar(List<T> lista, Function<T, R> funcion) {
        List<R> resultado = new ArrayList<>();
        for (T elemento : lista) {
            resultado.add(funcion.apply(elemento));
        }
        return resultado;
    }

    public static void main(String[] args) {
        List<String> nombres = List.of("Ada", "Grace", "Linus", "Al");
        List<String> largos = filtrar(nombres, n -> n.length() > 3);
        List<Integer> longitudes = transformar(nombres, String::length);
        System.out.println(largos + " " + longitudes);
    }
}
```

Un mismo `filtrar` sirve para cualquier condición. Es exactamente lo que hacen los streams del siguiente módulo.

## Combinar funciones

Muchas interfaces traen métodos `default` para componerlas:

```java
import java.util.function.Function;
import java.util.function.Predicate;

public class Main {
    public static void main(String[] args) {
        Predicate<Integer> positivo = n -> n > 0;
        Predicate<Integer> par = n -> n % 2 == 0;
        Predicate<Integer> positivoYPar = positivo.and(par);
        System.out.println(positivoYPar.test(4) + " " + positivoYPar.test(-4));
        System.out.println(positivo.negate().test(5));

        Function<Integer, Integer> doble = n -> n * 2;
        Function<Integer, Integer> masUno = n -> n + 1;
        System.out.println(doble.andThen(masUno).apply(5));   // (5*2)+1 = 11
        System.out.println(doble.compose(masUno).apply(5));   // (5+1)*2 = 12
    }
}
```

## Resumen

- `Function`, `Predicate`, `Consumer`, `Supplier` y los `Operator` cubren casi todos los casos.
- Escribe métodos que reciban comportamiento como parámetro.
- `and`, `or`, `negate`, `andThen` y `compose` combinan funciones.
