Cuando comparas **una misma variable** con muchos valores concretos, una cadena de `else if` se vuelve repetitiva. Para eso existe `switch`.

## El switch moderno (con flechas)

Desde Java 14 la forma recomendada usa `->`:

```java
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner entrada = new Scanner(System.in);
        int dia = entrada.nextInt();
        switch (dia) {
            case 1 -> System.out.println("Lunes");
            case 2 -> System.out.println("Martes");
            case 3 -> System.out.println("Miércoles");
            case 4 -> System.out.println("Jueves");
            case 5 -> System.out.println("Viernes");
            case 6, 7 -> System.out.println("Fin de semana");
            default -> System.out.println("Día no válido");
        }
    }
}
```

- Cada `case` compara con un valor **constante**.
- Varios valores pueden compartir rama separándolos con comas.
- `default` cubre todo lo demás (como el `else` final).
- Si una rama necesita varias instrucciones, usa llaves: `case 1 -> { ...; ... }`.

## switch como expresión

`switch` también puede **devolver un valor**, lo que evita repetir la asignación en cada rama:

```java
public class Main {
    public static void main(String[] args) {
        String operacion = "*";
        int a = 6, b = 7;
        int resultado = switch (operacion) {
            case "+" -> a + b;
            case "-" -> a - b;
            case "*" -> a * b;
            default -> 0;
        };
        System.out.println(resultado);
    }
}
```

Cuando una rama de un switch-expresión necesita varias instrucciones, el valor se devuelve con `yield`:

```java fragment
int dias = switch (mes) {
    case 2 -> {
        boolean bisiesto = anio % 4 == 0;
        yield bisiesto ? 29 : 28;
    }
    case 4, 6, 9, 11 -> 30;
    default -> 31;
};
```

## Qué tipos admite

`switch` funciona con `int`, `char`, `String`, los envoltorios y los `enum` (los verás más adelante). **No** funciona con `double` ni con `boolean`, ni con rangos: para "entre 5 y 7" sigue usando `if`.

## El switch clásico y el fall-through

Verás mucho código antiguo con dos puntos y `break`:

```java
public class Main {
    public static void main(String[] args) {
        int opcion = 2;
        switch (opcion) {
            case 1:
                System.out.println("Uno");
                break;
            case 2:
                System.out.println("Dos");
                // sin break: "cae" al siguiente caso
            case 3:
                System.out.println("Tres");
                break;
            default:
                System.out.println("Otro");
        }
    }
}
```

Imprime `Dos` **y** `Tres`: sin `break`, la ejecución continúa por los casos siguientes (*fall-through*). Es una fuente clásica de errores, y la razón por la que la forma con flechas (que nunca cae) es preferible en código nuevo.

## Resumen

- `switch` elige según el valor de una variable entre casos constantes.
- La forma `case x ->` no necesita `break` y puede devolver un valor.
- `yield` devuelve el valor desde una rama con bloque.
- El switch clásico con `:` necesita `break` en cada caso para no caer al siguiente.
