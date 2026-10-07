Para tomar decisiones necesitas preguntas cuya respuesta sea sí o no. En Java esas respuestas son valores `boolean`: `true` (verdadero) o `false` (falso).

## Operadores relacionales

Comparan dos valores y devuelven un `boolean`:

> [!analogia]
> Un operador relacional es como el portero de una discoteca que mira tu DNI: solo responde «sí» o «no» a una pregunta concreta, como «¿tiene 18 o más?».

| Operador | Significa |
| --- | --- |
| `==` | Igual a |
| `!=` | Distinto de |
| `<` / `>` | Menor / mayor que |
| `<=` / `>=` | Menor o igual / mayor o igual |

```java
public class Main {
    public static void main(String[] args) {
        int edad = 20;
        System.out.println(edad >= 18);   // true
        System.out.println(edad == 30);   // false
        System.out.println(edad != 30);   // true
        boolean esAdulto = edad >= 18;
        System.out.println("¿Adulto? " + esAdulto);
    }
}
```

> [!prueba]
> Cambia `int edad = 20;` por `int edad = 15;` y vuelve a ejecutar: ¿qué líneas cambian de `true` a `false`?

> [!cuidado]
> `=` asigna y `==` compara. Y recuerda: los textos se comparan con `equals`, no con `==`.

## Operadores lógicos

Combinan valores `boolean`:

| Operador | Nombre | Es `true` cuando… |
| --- | --- | --- |
| `&&` | Y (AND) | Las dos condiciones son verdaderas |
| `\|\|` | O (OR) | Al menos una es verdadera |
| `!` | NO (NOT) | La condición es falsa |

> [!analogia]
> «Puedes entrar si tienes entrada **y** eres mayor de edad» exige las dos cosas (`&&`). «Hay descuento si eres estudiante **o** jubilado» se conforma con una (`||`).

```java
public class Main {
    public static void main(String[] args) {
        int edad = 25;
        boolean tieneEntrada = true;
        boolean esVip = false;

        System.out.println(edad >= 18 && tieneEntrada);   // true: puede entrar
        System.out.println(esVip || edad > 65);            // false: sin descuento
        System.out.println(!esVip);                        // true
    }
}
```

> [!cuidado]
> Para comprobar si un número está en un rango hay que repetir la variable: `nota >= 0 && nota <= 10`. La forma matemática `0 <= nota <= 10` no compila en Java.

## Cortocircuito

`&&` y `||` dejan de evaluar en cuanto conocen el resultado:

- En `a && b`, si `a` es `false`, `b` ni se mira.
- En `a || b`, si `a` es `true`, `b` ni se mira.

> [!analogia]
> Si para entrar hacen falta entrada **y** DNI, y ya ves que no traes entrada, el portero ni te pide el DNI.

Esto permite escribir condiciones seguras, comprobando primero lo que podría fallar:

```java
public class Main {
    public static void main(String[] args) {
        int divisor = 0;
        // Sin cortocircuito, 10 / divisor lanzaría ArithmeticException.
        boolean ok = divisor != 0 && 10 / divisor > 1;
        System.out.println(ok);
    }
}
```

## Leyes útiles

- `!(a && b)` es lo mismo que `!a || !b`.
- `!(a || b)` es lo mismo que `!a && !b`.

Te ayudan a simplificar condiciones negadas, que suelen ser difíciles de leer. Por ejemplo, "no es fin de semana" = `!(dia == 6 || dia == 7)` = `dia != 6 && dia != 7`.

> [!resumen]
> - `== != < > <= >=` comparan y devuelven `boolean`.
> - `&&` exige las dos, `||` al menos una, `!` invierte.
> - `&&` y `||` hacen cortocircuito: pon primero la comprobación que protege a la segunda.
