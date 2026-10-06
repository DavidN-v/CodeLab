Casi todos los programas de este curso se comunican contigo a través de la consola. Vale la pena dominar las tres formas de escribir en ella.

## print y println

`println` escribe y salta de línea; `print` escribe y se queda en la misma línea:

```java
public class Main {
    public static void main(String[] args) {
        System.out.print("Hola, ");
        System.out.print("mundo");
        System.out.println("!");
        System.out.println("Esta línea va debajo.");
    }
}
```

Salida:

```
Hola, mundo!
Esta línea va debajo.
```

`System.out.println()` sin nada dentro imprime una línea en blanco.

## Unir textos con +

El operador `+` une (concatena) textos. Si uno de los lados es un número, también lo convierte en texto:

```java
public class Main {
    public static void main(String[] args) {
        System.out.println("Java " + "21");
        System.out.println("Tengo " + 3 + " gatos");
        System.out.println("1 + 2 = " + (1 + 2));
        System.out.println("1 + 2 = " + 1 + 2);
    }
}
```

La última línea imprime `1 + 2 = 12`: se evalúa de izquierda a derecha, así que primero une `"1 + 2 = "` con `1`, y luego el resultado (ya un texto) con `2`. Los paréntesis de la línea anterior obligan a sumar primero.

## Secuencias de escape

Algunos caracteres no se pueden escribir tal cual dentro de unas comillas. Se escriben con una barra invertida delante:

| Secuencia | Resultado |
| --- | --- |
| `\n` | Salto de línea |
| `\t` | Tabulador |
| `\"` | Comilla doble |
| `\\` | Barra invertida |

```java
public class Main {
    public static void main(String[] args) {
        System.out.println("Ella dijo: \"Hola\"");
        System.out.println("Línea 1\nLínea 2");
        System.out.println("Nombre\tEdad");
        System.out.println("C:\\Usuarios\\ada");
    }
}
```

## printf: salida con formato

`printf` usa una plantilla con **marcadores** que se sustituyen por valores, en orden:

```java
public class Main {
    public static void main(String[] args) {
        System.out.printf("%s tiene %d años%n", "Ada", 36);
        System.out.printf("Precio: %.2f euros%n", 3.14159);
        System.out.printf("|%5d|%-5d|%n", 42, 42);
    }
}
```

| Marcador | Para |
| --- | --- |
| `%s` | Texto |
| `%d` | Números enteros |
| `%f` | Decimales; `%.2f` con dos decimales |
| `%n` | Salto de línea |
| `%5d` / `%-5d` | Ancho mínimo de 5, alineado a la derecha / izquierda |

A diferencia de `println`, `printf` **no** añade el salto de línea: tienes que poner `%n` tú.

> **Ojo con los ejercicios:** el corrector compara tu salida carácter a carácter (ignorando solo los espacios al final de cada línea). Un espacio de más dentro de la línea, una mayúscula distinta o un punto que falta hacen que la respuesta no coincida.

## Comentarios

Los comentarios son notas para personas; el compilador los ignora.

```java
public class Main {
    // Comentario de una línea
    public static void main(String[] args) {
        /*
         * Comentario de varias líneas.
         * Útil para explicar un bloque entero.
         */
        System.out.println("Los comentarios no se imprimen"); // también al final de una línea
    }
}
```

Comenta el **porqué**, no el qué: `// sumamos 1 a i` no aporta nada; `// el primer día del mes es el 1, no el 0` sí.

## Resumen

- `print` no salta de línea; `println` sí.
- `+` concatena textos y convierte números en texto.
- `\n`, `\t`, `\"` y `\\` escriben caracteres especiales.
- `printf` formatea con `%s`, `%d`, `%.2f` y `%n`.
