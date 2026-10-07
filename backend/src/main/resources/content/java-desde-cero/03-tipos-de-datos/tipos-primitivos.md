Java tiene **ocho tipos primitivos**: los ladrillos con los que se construye todo lo demás. Guardan un valor simple directamente en la variable, sin objetos de por medio.

> [!analogia]
> Los tipos son como recipientes de cocina de distintos tamaños y formas: una huevera (`boolean`, solo sí o no), un vaso pequeño (`byte`), una jarra (`int`), un barreño (`long`)… Cada uno guarda un tipo de cosa y hasta cierta cantidad.

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

> [!idea]
> En la práctica usarás casi siempre **`int`** para enteros, **`double`** para decimales, **`boolean`** para sí/no y **`char`** para caracteres sueltos. `long`, cuando los números pueden superar los 2 100 millones.

## Literales: cómo se escribe cada valor

Un **literal** es un valor escrito directamente en el código, como `42` o `'J'`.

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

Cada primitivo vive dentro de su propia caja en la pila (*stack*), la zona de memoria de las variables del método:

```memoria
stack main
entero: 42
grande: 9000000000
decimal: 3.14
corto: 3.14
letra: 'J'
activo: true
conGuiones: 1000000
```

- Un número sin punto es `int`; con punto, `double`.
- Para `long` añade `L`; para `float`, `f`.
- `char` va entre **comillas simples** y contiene exactamente un carácter.

> [!cuidado]
> `'J'` (comillas simples) es un `char`; `"J"` (comillas dobles) es un `String`. `char letra = "J";` no compila: `incompatible types`.

> [!prueba]
> Quita la `L` de `9_000_000_000L` y ejecuta. El compilador dice `integer number too large`: sin la `L`, Java intenta meterlo en un `int`, donde no cabe. Vuelve a ponerla.

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

> [!analogia]
> Es como el cuentakilómetros de un coche antiguo: al pasar de 99999 vuelve a 00000. El número sigue "funcionando", pero ya no es el de verdad.

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

## char como número

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

> [!resumen]
> - Ocho primitivos; los habituales son `int`, `double`, `boolean` y `char`.
> - `long` lleva `L`, `float` lleva `f`, `char` va entre comillas simples.
> - Los enteros se desbordan en silencio; los `double` no son exactos.
