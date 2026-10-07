Para tomar decisiones necesitas preguntas cuya respuesta sea sí o no. En Java esas respuestas son valores `boolean`: `true` o `false`.

## Operadores relacionales

Comparan dos valores y devuelven un `boolean`:

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

> **Error clásico:** `=` asigna y `==` compara. Y recuerda: los textos se comparan con `equals`, no con `==`.

## Operadores lógicos

Combinan valores `boolean`:

| Operador | Nombre | Es `true` cuando… |
| --- | --- | --- |
| `&&` | Y (AND) | Las dos condiciones son verdaderas |
| `\|\|` | O (OR) | Al menos una es verdadera |
| `!` | NO (NOT) | La condición es falsa |

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

Para comprobar si un número está en un rango hay que repetir la variable: `nota >= 0 && nota <= 10`. La forma matemática `0 <= nota <= 10` no compila en Java.

## Cortocircuito

`&&` y `||` dejan de evaluar en cuanto conocen el resultado:

- En `a && b`, si `a` es `false`, `b` ni se mira.
- En `a || b`, si `a` es `true`, `b` ni se mira.

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

## Resumen

- `== != < > <= >=` comparan y devuelven `boolean`.
- `&&` exige las dos, `||` al menos una, `!` invierte.
- `&&` y `||` hacen cortocircuito: pon primero la comprobación que protege a la segunda.
