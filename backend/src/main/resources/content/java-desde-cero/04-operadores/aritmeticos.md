Los operadores aritméticos hacen cuentas. Los conoces de las matemáticas, con un par de matices importantes.

## Los cinco básicos

| Operador | Operación | `17 ? 5` |
| --- | --- | --- |
| `+` | Suma | `22` |
| `-` | Resta | `12` |
| `*` | Multiplicación | `85` |
| `/` | División | `3` (entera) |
| `%` | Resto (módulo) | `2` |

```java
public class Main {
    public static void main(String[] args) {
        int a = 17;
        int b = 5;
        System.out.println(a + b);
        System.out.println(a - b);
        System.out.println(a * b);
        System.out.println(a / b);
        System.out.println(a % b);
        System.out.println(17.0 / 5);
    }
}
```

Recuerda la lección de conversiones: entre enteros, `/` descarta los decimales.

## El resto: más útil de lo que parece

`a % b` es lo que sobra al dividir `a` entre `b`. Sirve para un montón de cosas:

- **¿Es par?** `n % 2 == 0`.
- **¿Es múltiplo de 3?** `n % 3 == 0`.
- **Última cifra de un número:** `n % 10`.
- **Dar la vuelta** (relojes, días de la semana): `(hora + 5) % 24`.

```java
public class Main {
    public static void main(String[] args) {
        int segundosTotales = 3725;
        int minutos = segundosTotales / 60;
        int segundos = segundosTotales % 60;
        System.out.println(minutos + " min " + segundos + " s");
    }
}
```

Imprime `62 min 5 s`. División entera y resto juntos descomponen cantidades: es una técnica que usarás mucho.

> **Ojo con los negativos:** en Java el resto conserva el signo del dividendo: `-7 % 3` es `-1`, no `2`.

## Incremento y decremento

`++` suma 1 y `--` resta 1. Se usan sobre todo en bucles:

```java
public class Main {
    public static void main(String[] args) {
        int contador = 0;
        contador++;
        contador++;
        contador--;
        System.out.println(contador);
    }
}
```

Existen dos formas, prefija (`++x`) y postfija (`x++`). Solo se diferencian cuando se usan **dentro** de otra expresión:

```java
public class Main {
    public static void main(String[] args) {
        int x = 5;
        int a = x++;   // a recibe 5 y luego x pasa a 6
        int y = 5;
        int b = ++y;   // y pasa a 6 y luego b recibe 6
        System.out.println(a + " " + x + " " + b + " " + y);
    }
}
```

> **Consejo:** úsalos solos en su propia línea (`contador++;`). Mezclados en expresiones complicadas son una fuente clásica de errores.

## La clase Math

Para lo que no tiene operador, está `Math`:

```java
public class Main {
    public static void main(String[] args) {
        System.out.println(Math.pow(2, 10));    // potencia: 1024.0
        System.out.println(Math.sqrt(81));      // raíz cuadrada: 9.0
        System.out.println(Math.abs(-7));       // valor absoluto: 7
        System.out.println(Math.max(3, 9));     // mayor: 9
        System.out.println(Math.min(3, 9));     // menor: 3
    }
}
```

Fíjate en que `Math.pow` y `Math.sqrt` devuelven `double`.

## Resumen

- `+ - * / %`; entre enteros, `/` es división entera.
- `%` da el resto: pares, múltiplos, últimas cifras, descomponer cantidades.
- `++` y `--` suman o restan 1; mejor usarlos solos.
- `Math.pow`, `Math.sqrt`, `Math.abs`, `Math.max` y `Math.min` para lo demás.
