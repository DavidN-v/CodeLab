## Asignación compuesta

Actualizar una variable a partir de su propio valor es tan común que hay atajos:

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

## El operador ternario

`condición ? valorSiVerdadero : valorSiFalso` elige entre dos valores en una sola expresión:

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

Es ideal para elegir un valor simple. Si cada rama tiene que *hacer* varias cosas, usa un `if` (siguiente módulo).

## Precedencia: quién va primero

Como en matemáticas, no todo se evalúa de izquierda a derecha. De mayor a menor prioridad:

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

> **Consejo:** no memorices la tabla entera. Ante la duda, pon paréntesis: no cuestan nada y hacen la intención evidente para quien lea el código.

## Resumen

- `+=`, `-=`, `*=`, `/=` y `%=` actualizan una variable con su propio valor.
- `cond ? a : b` elige entre dos valores.
- `*` y `/` van antes que `+` y `-`; `&&` antes que `||`. Usa paréntesis para dejarlo claro.
