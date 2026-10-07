Hasta ahora, para pasar "un comportamiento" a otro código (cómo comparar, qué hacer con cada elemento), tenías que escribir una clase. Las **lambdas** (Java 8) permiten pasar ese comportamiento directamente, como un valor.

## Antes y después

Ordenar palabras por longitud con una clase anónima:

```java
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

public class Main {
    public static void main(String[] args) {
        List<String> palabras = new ArrayList<>(List.of("sol", "estrella", "luna"));
        palabras.sort(new Comparator<String>() {
            @Override
            public int compare(String a, String b) {
                return Integer.compare(a.length(), b.length());
            }
        });
        System.out.println(palabras);
    }
}
```

Lo mismo con una lambda:

```java
import java.util.ArrayList;
import java.util.List;

public class Main {
    public static void main(String[] args) {
        List<String> palabras = new ArrayList<>(List.of("sol", "estrella", "luna"));
        palabras.sort((a, b) -> Integer.compare(a.length(), b.length()));
        System.out.println(palabras);
    }
}
```

## Sintaxis

`(parámetros) -> cuerpo`

```java fragment
() -> 42                                  // sin parámetros
x -> x * 2                                // uno: los paréntesis son opcionales
(a, b) -> a + b                           // varios
(String s) -> s.length()                  // con tipo explícito (casi nunca hace falta)
(a, b) -> {                               // cuerpo con varias instrucciones
    int suma = a + b;
    return suma * 2;
}
```

- Si el cuerpo es una sola expresión, su valor se devuelve solo, sin `return` ni llaves.
- Con llaves, es un bloque normal y necesitas `return` si devuelve algo.
- Los tipos de los parámetros se deducen del contexto.

## ¿Dónde se puede usar una lambda?

Una lambda implementa una **interfaz funcional**: una interfaz con un único método abstracto (como `Comparator`, con su `compare`). Allí donde se espera ese tipo, puedes escribir la lambda:

```java
import java.util.ArrayList;
import java.util.List;

public class Main {
    public static void main(String[] args) {
        List<Integer> numeros = new ArrayList<>(List.of(5, 12, 7, 20, 3));
        numeros.removeIf(n -> n < 10);                 // Predicate<Integer>
        numeros.forEach(n -> System.out.println(n));   // Consumer<Integer>
        numeros.replaceAll(n -> n * 10);               // UnaryOperator<Integer>
        System.out.println(numeros);
    }
}
```

## Capturar variables

Una lambda puede usar variables del método donde se escribe, siempre que sean **efectivamente finales** (no se modifican después):

```java
import java.util.List;

public class Main {
    public static void main(String[] args) {
        int minimo = 10;
        List<Integer> numeros = List.of(4, 15, 9, 30);
        numeros.stream().filter(n -> n >= minimo).forEach(System.out::println);
        // minimo = 20;   ← si lo cambiaras, la lambda dejaría de compilar
    }
}
```

## Resumen

- Una lambda es un comportamiento escrito como valor: `(a, b) -> a + b`.
- Implementa una interfaz funcional (un solo método abstracto).
- Sin llaves devuelve la expresión; con llaves, usa `return`.
- Solo captura variables locales que no cambian.
