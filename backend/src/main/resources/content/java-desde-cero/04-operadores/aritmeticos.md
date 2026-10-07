Los operadores aritméticos hacen cuentas. Los conoces de las matemáticas, con un par de matices importantes.

> [!analogia]
> Un operador es como una tecla de la calculadora: `+`, `-`, `*`… Le das dos números, pulsas la tecla y te devuelve un resultado.

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

> [!prueba]
> Cambia `int b = 5;` por `int b = 4;` y vuelve a ejecutar: ¿cuánto dan ahora `a / b` y `a % b`?

> [!cuidado]
> Entre enteros, `/` descarta los decimales: `17 / 5` es `3`, no `3.4`. Si quieres decimales, al menos uno de los dos números debe ser decimal: `17.0 / 5`.

## El resto: más útil de lo que parece

`a % b` es lo que sobra al dividir `a` entre `b`.

> [!analogia]
> Repartes 17 caramelos entre 5 amigos: a cada uno le tocan 3 (eso es `17 / 5`) y te sobran 2 en la mano (eso es `17 % 5`).

Sirve para un montón de cosas:

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

> [!cuidado]
> Ojo con los negativos: en Java el resto conserva el signo del dividendo: `-7 % 3` es `-1`, no `2`.

## Incremento y decremento

`++` suma 1 y `--` resta 1. Se usan sobre todo en bucles:

> [!analogia]
> `contador++` es como el clic de un contador de personas en la puerta de una tienda: cada clic, uno más.

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

> [!idea]
> Usa `++` y `--` solos en su propia línea (`contador++;`). Mezclados en expresiones complicadas son una fuente clásica de errores.

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

> [!resumen]
> - `+ - * / %`; entre enteros, `/` es división entera.
> - `%` da el resto: pares, múltiplos, últimas cifras, descomponer cantidades.
> - `++` y `--` suman o restan 1; mejor usarlos solos.
> - `Math.pow`, `Math.sqrt`, `Math.abs`, `Math.max` y `Math.min` para lo demás.
