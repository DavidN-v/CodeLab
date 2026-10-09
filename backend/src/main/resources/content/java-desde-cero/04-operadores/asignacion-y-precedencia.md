## Asignación compuesta

Actualizar una variable a partir de su propio valor es tan común que hay atajos:

> [!analogia]
> `saldo += 50` es como meter 50 € en tu hucha: no cambias la hucha, solo añades a lo que ya había dentro.

| Atajo | Equivale a |
| --- | --- |
| `x += 5` | `x = x + 5` |
| `x -= 2` | `x = x - 2` |
| `x *= 3` | `x = x * 3` |
| `x /= 4` | `x = x / 4` |
| `x %= 10` | `x = x % 10` |

```java
public class Main {
    public static void main(String[] args) {
        int saldo = 100;
        saldo += 50;     // ingreso
        saldo -= 30;     // pago
        saldo *= 2;
        System.out.println(saldo);

        String mensaje = "Hola";
        mensaje += ", mundo";   // también funciona con textos
        System.out.println(mensaje);
    }
}
```

> [!prueba]
> Cambia `saldo -= 30;` por `saldo -= 120;` y vuelve a ejecutar: ¿qué saldo queda? ¿Y si es negativo?

```memoria
stack main
saldo: 240
mensaje: @1
heap
@1 String: "Hola, mundo"
```

## El operador ternario

`condición ? valorSiVerdadero : valorSiFalso` elige entre dos valores en una sola expresión:

> [!analogia]
> El ternario es una pregunta con dos respuestas preparadas: «¿llueve? paraguas : gafas de sol». Según la respuesta, te llevas una cosa u otra.

```java
public class Main {
    public static void main(String[] args) {
        int edad = 15;
        String tipo = edad >= 18 ? "adulto" : "menor";
        System.out.println(tipo);

        int a = 7, b = 12;
        int mayor = a > b ? a : b;
        System.out.println("Mayor: " + mayor);
    }
}
```

> [!prueba]
> Cambia `int edad = 15;` por `int edad = 18;` y vuelve a ejecutar: ¿qué imprime ahora la primera línea?

Es ideal para elegir un valor simple. Si cada rama tiene que *hacer* varias cosas, usa un `if` (siguiente módulo).

## Precedencia: quién va primero

Como en matemáticas, no todo se evalúa de izquierda a derecha. De mayor a menor prioridad:

> [!analogia]
> Es como la regla del colegio: primero multiplicaciones y divisiones, luego sumas y restas. Los paréntesis son el «esto va primero, sí o sí».

| Nivel | Operadores |
| --- | --- |
| 1 | `++ --` (postfijos), `!`, casting |
| 2 | `* / %` |
| 3 | `+ -` |
| 4 | `< > <= >=` |
| 5 | `== !=` |
| 6 | `&&` |
| 7 | `\|\|` |
| 8 | `? :` |
| 9 | `= += -= …` |

```java
public class Main {
    public static void main(String[] args) {
        System.out.println(2 + 3 * 4);       // 14, no 20
        System.out.println((2 + 3) * 4);     // 20
        System.out.println(10 - 4 - 3);      // 3: misma prioridad, de izquierda a derecha
        boolean r = 5 > 3 || 2 > 4 && false; // && va antes que ||
        System.out.println(r);
    }
}
```

> [!cuidado]
> Para la media de tres números, `a + b + c / 3` está mal: solo se divide `c`. Escribe `(a + b + c) / 3`.

> [!idea]
> No memorices la tabla entera. Ante la duda, pon paréntesis: no cuestan nada y hacen la intención evidente para quien lea el código.

> [!resumen]
> - `+=`, `-=`, `*=`, `/=` y `%=` actualizan una variable con su propio valor.
> - `cond ? a : b` elige entre dos valores.
> - `*` y `/` van antes que `+` y `-`; `&&` antes que `||`. Usa paréntesis para dejarlo claro.
