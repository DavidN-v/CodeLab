Java tiene **ocho tipos primitivos**: los ladrillos con los que se construye todo lo demás. Guardan un valor simple directamente, sin objetos de por medio.

## Los ocho primitivos

| Tipo | Guarda | Tamaño | Rango aproximado |
| --- | --- | --- | --- |
| `byte` | Entero | 8 bits | −128 a 127 |
| `short` | Entero | 16 bits | −32 768 a 32 767 |
| `int` | Entero | 32 bits | ±2 100 millones |
| `long` | Entero | 64 bits | ±9,2 × 10¹⁸ |
| `float` | Decimal | 32 bits | ~7 dígitos de precisión |
| `double` | Decimal | 64 bits | ~15 dígitos de precisión |
| `char` | Un carácter Unicode | 16 bits | `'a'`, `'Ñ'`, `'7'`… |
| `boolean` | Verdadero o falso | — | `true` / `false` |

En la práctica usarás casi siempre **`int`** para enteros, **`double`** para decimales, **`boolean`** para sí/no y **`char`** para caracteres sueltos. `long` cuando los números pueden superar los 2 100 millones (milisegundos, identificadores grandes, poblaciones).

## Literales: cómo se escribe cada valor

```java
public class Main {
    public static void main(String[] args) {
        int entero = 42;
        long grande = 9_000_000_000L;   // la L final indica long
        double decimal = 3.14;
        float corto = 3.14f;            // la f final indica float
        char letra = 'J';               // comillas simples
        boolean activo = true;
        int conGuiones = 1_000_000;     // los _ solo ayudan a leer

        System.out.println(entero + " " + grande + " " + decimal + " " + corto);
        System.out.println(letra + " " + activo + " " + conGuiones);
    }
}
```

- Un número sin punto es `int`; con punto, `double`.
- Para `long` añade `L`; para `float`, `f`.
- `char` va entre **comillas simples** y contiene exactamente un carácter. `"J"` (dobles) es un `String`, no un `char`.

## Desbordamiento: cuando no cabe

Si una operación entera se sale del rango, Java **no avisa**: da la vuelta.

```java
public class Main {
    public static void main(String[] args) {
        int maximo = Integer.MAX_VALUE;
        System.out.println(maximo);
        System.out.println(maximo + 1);
    }
}
```

Imprime `2147483647` y luego `-2147483648`. Si trabajas con cantidades grandes, usa `long`.

## La precisión de los decimales

`double` guarda los decimales en binario, y muchos números (como 0,1) no tienen representación exacta:

```java
public class Main {
    public static void main(String[] args) {
        System.out.println(0.1 + 0.2);
    }
}
```

Imprime `0.30000000000000004`. Para la mayoría de cálculos da igual, pero **nunca uses `double` para dinero real**: para eso existe `BigDecimal`, que verás más adelante.

## Valores por defecto y char como número

Un `char` es en el fondo un número (su código Unicode), por eso se puede operar con él:

```java
public class Main {
    public static void main(String[] args) {
        char letra = 'A';
        System.out.println((int) letra);       // 65
        System.out.println((char) (letra + 2)); // C
    }
}
```

## Resumen

- Ocho primitivos; los habituales son `int`, `double`, `boolean` y `char`.
- `long` lleva `L`, `float` lleva `f`, `char` va entre comillas simples.
- Los enteros se desbordan en silencio; los `double` no son exactos.
